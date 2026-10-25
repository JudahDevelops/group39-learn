/**
 * The fastapi runner in the real app: Pyodide, FastAPI, pydantic, httpx, SQLAlchemy and bcrypt load
 * from jsDelivr in a worker, PyJWT and python-multipart from PyPI (needs the network). The fixtures
 * are content/blocks/fixture-fastapi-workshop (a workshop), fixture-fastapi-lab (a lab in two
 * files) and fixture-fastapi-lesson (a lesson with a Try it box and a typein screen), all in
 * chapter Z5.
 *
 * The runner is about 10.8 MB. The tests share one browser context, so only the first one downloads
 * it and the others start from the browser's cache, as a returning learner does. Every test gets a
 * new page and empty local storage, so each starts as a first visit (progress, and "the runner has
 * loaded here").
 */
import { type BrowserContext, type Locator, type Page } from '@playwright/test';
import { expect, test as base } from './course-helpers';
import { signInAndOnboard } from './helpers';

let shared: BrowserContext;

const test = base.extend({
  page: async ({}, provide) => {
    const page = await shared.newPage();
    await provide(page);
    await page.close();
  },
});

// One worker runs the whole file, in order, so the shared context (and its cache) is used by all.
test.describe.configure({ mode: 'default' });
test.setTimeout(300_000);

test.beforeAll(async ({ browser }, info) => {
  shared = await browser.newContext({ baseURL: String(info.project.use.baseURL) });
});

test.afterAll(async () => {
  await shared.close();
});

// The first test downloads the runner (about 10.8 MB) and starts it. On a slow link, or while other
// e2e runs share it, that can take minutes; later tests reuse the shared context's cache. A restart
// after a stop is shorter but still takes several seconds.
const LOAD_MS = 240_000;

const check = (page: Page) => page.getByRole('button', { name: 'Check your code' });
const run = (page: Page) => page.getByRole('button', { name: 'Run', exact: true });
const send = (page: Page) => page.getByRole('button', { name: 'Send', exact: true });
const slip = (page: Page) => page.locator('.wk-slip-region');
const panel = (page: Page) => page.getByTestId('requests-panel');
const reply = (page: Page) => panel(page).getByRole('region', { name: 'Reply' });
const notice = (page: Page) => page.locator('.wk-output .fa-notice');

/** Replace the editable lines with `text` (select all only touches the editable region). */
async function replaceCode(page: Page, text: string) {
  await page.getByTestId('code-editor').locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(text);
}

/** Pick a method, type a path (and a body) in a Requests panel, and press Send. */
async function sendRequest(
  scope: Locator,
  { method, path, body }: { method: string; path: string; body?: string },
) {
  await scope.getByRole('combobox', { name: 'Method' }).selectOption(method);
  await scope.getByRole('textbox', { name: 'Path' }).fill(path);
  if (body !== undefined) await scope.getByRole('textbox', { name: /^Body/ }).fill(body);
  await scope.getByRole('button', { name: 'Send', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/signin');
  await page.evaluate(() => window.localStorage.clear());
  await signInAndOnboard(page);
});

function stepUrl(course: { itemIds(slug: string): string[] }, n: number) {
  return `/learn/fixture-fastapi-workshop/${course.itemIds('fixture-fastapi-workshop')[n - 1]}`;
}

const STEP_1 = `@app.get("/rooms")
def list_rooms():
    return rooms`;

const STEP_2 = `from fastapi import HTTPException

@app.get("/rooms/{room_id}")
def get_room(room_id: int):
    for room in rooms:
        if room["id"] == room_id:
            return room
    raise HTTPException(status_code=404, detail="Room not found")`;

const STEP_3 = `from pydantic import BaseModel

class RoomIn(BaseModel):
    number: str
    beds: int

@app.post("/rooms", status_code=201)
def create_room(room: RoomIn):
    new_room = {"id": len(rooms) + 1, "number": room.number, "beds": room.beds}
    rooms.append(new_room)
    return new_room`;

test('the Requests tab says the download size first, then step 1 fails and passes', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  await expect(page.getByRole('heading', { level: 1, name: 'Build a Rooms API' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Preview' })).toHaveCount(0);
  await expect(notice(page)).toHaveText(
    'The FastAPI runner needs about 10.8 MB, once. It downloads the first time your app runs.',
  );
  await expect(panel(page)).toContainText('Your app has not started.');
  await expect(send(page)).toBeDisabled();

  // The seed has no route yet, so the first test says what is missing.
  await check(page).click();
  await expect(notice(page)).toContainText(/(Downloading|Starting) the FastAPI runner/);
  await expect(slip(page)).toHaveText(
    /Not passing yet\. Your app should answer GET \/rooms with status 200\./,
    { timeout: LOAD_MS },
  );
  // The app itself started: it just has no routes.
  await expect(panel(page)).toContainText('Your app started with no routes.');

  // A route that returns the wrong thing fails a later test.
  await replaceCode(page, '@app.get("/rooms")\ndef list_rooms():\n    return rooms[:1]');
  await page.keyboard.press('Control+Enter');
  await expect(slip(page)).toHaveText(/GET \/rooms should return all 3 rooms\./);

  await replaceCode(page, STEP_1);
  await page.keyboard.press('Control+Enter');
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.getByText('Step 1 of 3 done')).toBeVisible();
  await expect(panel(page)).toContainText('Your app started with 1 route.');
  await expect(page.locator('header.topbar').getByText('5 of 60 XP today')).toBeVisible();

  // The runner has loaded on this device, so the size note is gone, even after a reload. After a
  // reload it starts again in the background ("Starting the FastAPI runner") and then says nothing.
  await expect(notice(page)).toHaveText('');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();
  await expect(notice(page)).not.toContainText('needs about');
  await expect(notice(page)).toHaveText('', { timeout: 60_000 });
});

test('Send shows the status and the JSON reply, and keeps a history', async ({ page, course }) => {
  await page.goto(stepUrl(course, 3));
  // Step 3 starts from step 2's solution: the app has two routes.
  await replaceCode(page, STEP_3);
  await run(page).click();
  await expect(panel(page)).toContainText('Your app started with 3 routes.', {
    timeout: LOAD_MS,
  });
  // Run does not check: no slip, no XP.
  await expect(slip(page)).toBeEmpty();
  const routes = panel(page).getByRole('list', { name: 'Routes in your app' });
  await expect(routes.getByRole('button')).toHaveText([
    'GET /rooms',
    'GET /rooms/{room_id}',
    'POST /rooms',
  ]);

  // GET /rooms: status 200 and indented JSON.
  await sendRequest(panel(page), { method: 'GET', path: '/rooms' });
  await expect(reply(page).locator('.fa-plate')).toContainText('200');
  await expect(reply(page).locator('.fa-status-text')).toHaveText('OK');
  const body = reply(page).getByLabel('Reply body');
  await expect(body).toContainText('"number": "A-101"');
  await expect(body).toContainText('\n    "beds": 4');

  // A path typed without its first slash is fixed before it is sent.
  await sendRequest(panel(page), { method: 'GET', path: 'rooms' });
  await expect(panel(page).getByRole('textbox', { name: 'Path' })).toHaveValue('/rooms');
  await expect(reply(page).locator('.fa-plate')).toContainText('200');

  // A room that does not exist: a 404 with the app's own words.
  await sendRequest(panel(page), { method: 'GET', path: '/rooms/99' });
  await expect(reply(page).locator('.fa-plate')).toContainText('404');
  await expect(reply(page).getByLabel('Reply body')).toContainText('"detail": "Room not found"');

  // POST with a body creates a room, and the next GET sees it: the app keeps its data between requests.
  await sendRequest(panel(page), {
    method: 'POST',
    path: '/rooms',
    body: '{"number": "C-301", "beds": 2}',
  });
  await expect(reply(page).locator('.fa-plate')).toContainText('201');
  await expect(reply(page).getByLabel('Reply body')).toContainText('"number": "C-301"');
  await sendRequest(panel(page), { method: 'GET', path: '/rooms' });
  await expect(reply(page).getByLabel('Reply body')).toContainText('"C-301"');

  // A body that does not fit the model is a 422 from FastAPI.
  await sendRequest(panel(page), { method: 'POST', path: '/rooms', body: '{"number": "C-302"}' });
  await expect(reply(page).locator('.fa-plate')).toContainText('422');
  await expect(reply(page).getByLabel('Reply body')).toContainText('"beds"');

  // A body that is not JSON is not sent.
  await panel(page).getByRole('textbox', { name: /^Body/ }).fill('{"number": ');
  await expect(panel(page)).toContainText('The body is not valid JSON');
  await expect(send(page)).toBeDisabled();
  await panel(page).getByRole('textbox', { name: /^Body/ }).fill('');
  await expect(send(page)).toBeEnabled();

  // Earlier requests are listed, newest first, and a click fills the form again.
  const history = panel(page).getByRole('list').last();
  await expect(history.getByRole('button').first()).toContainText('POST /rooms');
  await expect(history.getByRole('button').first()).toContainText('422');
  await history.getByRole('button').nth(2).click();
  await expect(panel(page).getByRole('textbox', { name: 'Path' })).toHaveValue('/rooms');
  await expect(panel(page).getByRole('combobox', { name: 'Method' })).toHaveValue('POST');
});

test('a syntax error shows the file and the line', async ({ page, course }) => {
  await page.goto(stepUrl(course, 1));
  // The editable lines start at line 11 of main.py.
  await replaceCode(page, 'def list_rooms(:\n    return rooms');
  await run(page).click();
  const message = panel(page).locator('.fa-error');
  await expect(message).toContainText('Python cannot read your code on line 11 of main.py', {
    timeout: LOAD_MS,
  });
  await expect(message).toContainText('def list_rooms(:');
  await expect(panel(page)).not.toContainText('Your app started');
  await expect(send(page)).toBeDisabled();

  // The same error under Check: the slip carries it, and no test runs.
  await check(page).click();
  await expect(slip(page)).toContainText('Python cannot read your code on line 11 of main.py');

  // An error at run time names the line of the handler's file, not the runner's.
  await replaceCode(page, '@app.get("/rooms")\ndef list_rooms():\n    return totl');
  await run(page).click();
  await expect(panel(page)).toContainText('Your app started with 1 route.');
  await sendRequest(panel(page), { method: 'GET', path: '/rooms' });
  await expect(reply(page).locator('.fa-plate')).toContainText('500');
  await expect(reply(page).locator('.fa-error')).toContainText(
    'Your code stopped on line 13 of main.py, which reads return totl. Python does not know the name "totl".',
  );
});

test('a loop in a handler is stopped at 5 seconds, and the next Run works', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  // Load the runner first, so the 5 seconds below are the code's alone.
  await replaceCode(page, STEP_1);
  await run(page).click();
  await expect(panel(page)).toContainText('Your app started with 1 route.', { timeout: LOAD_MS });

  // The loop is inside the handler, so the app starts fine and the stop comes with the request.
  await replaceCode(page, '@app.get("/rooms")\ndef list_rooms():\n    while True:\n        pass');
  await run(page).click();
  await expect(panel(page)).toContainText('Your app started with 1 route.');
  const started = Date.now();
  await sendRequest(panel(page), { method: 'GET', path: '/rooms' });
  await expect(reply(page)).toContainText(
    'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
    { timeout: 15_000 },
  );
  const took = Date.now() - started;
  expect(took).toBeGreaterThanOrEqual(4800);
  expect(took).toBeLessThan(10_000);
  await expect(panel(page)).toContainText('Your app was stopped. Press Run to start it again.');
  await expect(send(page)).toBeDisabled();

  // The page answers, and the next Run starts a fresh worker.
  await expect(run(page)).toBeEnabled();
  await replaceCode(page, STEP_1);
  await run(page).click();
  await expect(notice(page)).toContainText('Restarting the FastAPI runner', { timeout: 5000 });
  await expect(panel(page)).toContainText('Your app started with 1 route.', { timeout: LOAD_MS });
  await sendRequest(panel(page), { method: 'GET', path: '/rooms' });
  await expect(reply(page).locator('.fa-plate')).toContainText('200');
});

test('a Check that meets a loop is stopped too, and the next Check passes', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  await replaceCode(page, STEP_1);
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible({ timeout: LOAD_MS });

  await replaceCode(page, '@app.get("/rooms")\ndef list_rooms():\n    while True:\n        pass');
  const started = Date.now();
  await check(page).click();
  await expect(slip(page)).toContainText(
    'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
    { timeout: 15_000 },
  );
  expect(Date.now() - started).toBeGreaterThanOrEqual(4800);

  await replaceCode(page, STEP_1);
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible({ timeout: LOAD_MS });
});

test('step 2 and step 3 test a 404 and a 422, and the workshop finishes', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 2));
  await expect(page.getByText('Step 2 of 3', { exact: true })).toBeVisible();
  // Step 2 starts from step 1's solution.
  await expect(page.locator('.cm-content')).toContainText('def list_rooms');

  await check(page).click();
  await expect(slip(page)).toContainText('GET /rooms/2 should return the room A-102.', {
    timeout: LOAD_MS,
  });

  // A route that finds the room but never answers 404 fails the second test.
  await replaceCode(
    page,
    '@app.get("/rooms/{room_id}")\ndef get_room(room_id: int):\n    return rooms[room_id - 1]',
  );
  await check(page).click();
  // rooms[98] raises an IndexError: the hint stays and Python's words follow it, with the line.
  await expect(slip(page)).toContainText('GET /rooms/99 should answer with status 404.');
  await expect(slip(page)).toContainText(
    'Python stopped while checking your code on line 17 of main.py',
  );

  await replaceCode(page, STEP_2);
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Step 3 of 3', { exact: true })).toBeVisible();
  await replaceCode(page, STEP_3.replace('status_code=201', 'status_code=200'));
  await check(page).click();
  await expect(slip(page)).toContainText(
    'POST /rooms with a number and beds should answer with status 201.',
  );

  await replaceCode(page, STEP_3);
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Workshop done' })).toBeVisible();
});

test('the lab runs two files, and its example project can be run and asked', async ({
  page,
  course,
}) => {
  const lab = course.summary('fixture-fastapi-lab');
  await page.goto(`/learn/fixture-fastapi-lab/${lab.id}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Build a Complaints API' }),
  ).toBeVisible();
  const files = page.getByRole('tablist', { name: 'Files' });
  await expect(files.getByRole('tab')).toHaveText(['main.py', 'models.py']);

  // The whole file is editable: this lab has no region. A lab lists every test, so the first one
  // names models.py before the learner has written it.
  await check(page).click();
  const tests = page.getByRole('region', { name: 'Test results' });
  await expect(tests).toContainText('models.py should define a pydantic model called Complaint.', {
    timeout: LOAD_MS,
  });
  await expect(tests.getByText(/\d of 5 tests pass/)).toBeVisible();

  await files.getByRole('tab', { name: 'models.py' }).click();
  await replaceCode(
    page,
    'from pydantic import BaseModel\n\nclass Complaint(BaseModel):\n    room: str\n    description: str',
  );
  await files.getByRole('tab', { name: 'main.py' }).click();
  await replaceCode(
    page,
    [
      'from fastapi import FastAPI',
      'from models import Complaint',
      '',
      'app = FastAPI()',
      'complaints = []',
      '',
      '@app.post("/complaints", status_code=201)',
      'async def create_complaint(complaint: Complaint):',
      '    stored = {"id": len(complaints) + 1, **complaint.model_dump()}',
      '    complaints.append(stored)',
      '    return stored',
      '',
      '@app.get("/complaints")',
      'async def list_complaints():',
      '    return complaints',
    ].join('\n'),
  );
  await check(page).click();
  await expect(tests.getByText('5 of 5 tests pass')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Lab done')).toBeVisible();

  // The example project runs from the solution files, and the dialog has its own Requests panel.
  await page.getByRole('button', { name: 'See the example project' }).click();
  const dialog = page.getByRole('dialog', { name: 'The example project' });
  await dialog.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(dialog).toContainText('Your app started with 2 routes.');
  await sendRequest(dialog, {
    method: 'POST',
    path: '/complaints',
    body: '{"room": "A-101", "description": "Leaking tap"}',
  });
  await expect(dialog.getByRole('region', { name: 'Reply' }).locator('.fa-plate')).toContainText(
    '201',
  );
});

test('a lesson Try it starts an app that can be asked, and the typein screen checks it', async ({
  page,
  course,
}) => {
  const lesson = course.summary('fixture-fastapi-lesson');
  await page.goto(`/learn/fixture-fastapi-lesson/${lesson.id}`);
  const tryit = page.locator('.tryit');
  await expect(tryit.locator('.fa-notice')).toHaveText(
    'The FastAPI runner needs about 10.8 MB, once. It downloads the first time your app runs.',
  );
  await expect(tryit.getByTestId('requests-panel')).toContainText('Your app has not started.');

  await tryit.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(tryit.getByTestId('requests-panel')).toContainText(
    'Your app started with 1 route.',
    { timeout: LOAD_MS },
  );
  await sendRequest(tryit, { method: 'GET', path: '/rooms' });
  await expect(tryit.getByRole('region', { name: 'Reply' })).toContainText('"number": "A-102"');

  // Edit the code and run again: the new app answers.
  await tryit.locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(
    'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/rooms")\nasync def rooms():\n    return {"count": 7}',
  );
  await page.keyboard.press('Control+Enter');
  await expect(tryit.getByTestId('requests-panel')).toContainText('Your app started with 1 route.');
  await sendRequest(tryit, { method: 'GET', path: '/rooms' });
  await expect(tryit.getByRole('region', { name: 'Reply' })).toContainText('"count": 7');

  await page.getByRole('button', { name: 'Continue' }).click();
  // The typein screen: a wrong answer, then the right one.
  const box = page.getByLabel('Your code');
  await box.fill('@app.get("/hi")\ndef hello():\n    return {"message": "Hello, Hall A"}');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
  await expect(page.getByText('Your app should answer GET /hello with status 200.')).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await box.fill('@app.get("/hello")\ndef hello():\n    return {"message": "Hello, Hall A"}');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ })).toBeVisible();
});

test('the typein screen says the download size before the first check', async ({
  page,
  course,
}) => {
  const lesson = course.summary('fixture-fastapi-lesson');
  await page.goto(`/learn/fixture-fastapi-lesson/${lesson.id}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.fa-floating .fa-notice')).toHaveText(
    'The FastAPI runner needs about 10.8 MB, once. It downloads the first time your app runs.',
  );
  await page
    .getByLabel('Your code')
    .fill('@app.get("/hello")\nasync def hello():\n    return {"message": "Hello, Hall A"}');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ })).toBeVisible({
    timeout: LOAD_MS,
  });
  // Once the runner is ready the note goes away.
  await expect(page.locator('.fa-floating .fa-notice')).toHaveText('');
});

test('on a phone the Requests tab and the download note are reachable', async ({
  page,
  course,
}) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(stepUrl(course, 1));
  // The note sits with the Check button while the Code tab is open.
  await page.getByRole('tab', { name: 'Code' }).click();
  await expect(page.locator('.wk-bottom .fa-notice')).toContainText(
    'The FastAPI runner needs about 10.8 MB, once.',
  );
  await page.getByRole('tab', { name: 'Requests' }).click();
  await expect(run(page)).toBeVisible();
  const box = await run(page).boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole('combobox', { name: 'Method' })).toBeVisible();
  const sendBox = await send(page).boundingBox();
  expect(sendBox?.height ?? 0).toBeGreaterThanOrEqual(44);
});
