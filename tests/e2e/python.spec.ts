/**
 * The python runner in the real app: Pyodide loads from jsDelivr in a worker (needs the network).
 * The fixtures are content/blocks/fixture-python (a workshop) and fixture-python-lesson (a lesson
 * with a Try it box and a typein screen), both in chapter Z3.
 *
 * Python is about 6 MB. The tests share one browser context, so only the first one downloads it and
 * the others start from the browser's cache, as a returning learner does. Every test gets a new page
 * and empty local storage, so each starts as a first visit (progress, and "Python has loaded here").
 */
import { type BrowserContext, type Page } from '@playwright/test';
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

// The first test downloads Pyodide (about 6 MB). On a slow link, or while other e2e runs share it,
// that can take minutes; later tests reuse the shared context's cache.
const LOAD_MS = 240_000;

const check = (page: Page) => page.getByRole('button', { name: 'Check your code' });
const run = (page: Page) => page.getByRole('button', { name: 'Run', exact: true });
const slip = (page: Page) => page.locator('.wk-slip-region');
const output = (page: Page) => page.getByRole('log', { name: 'Output' });

/** Replace the editable lines with `text` (select all only touches the editable region). */
async function replaceCode(page: Page, text: string) {
  await page.getByTestId('code-editor').locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(text);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/signin');
  await page.evaluate(() => window.localStorage.clear());
  await signInAndOnboard(page);
});

function stepUrl(course: { itemIds(slug: string): string[] }, n: number) {
  return `/learn/fixture-python/${course.itemIds('fixture-python')[n - 1]}`;
}

test('the Output tab says the download size first, then step 1 fails and passes', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Build a Complaint Deadline' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Output' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Preview' })).toHaveCount(0);
  await expect(page.locator('.wk-output .py-notice')).toHaveText(
    'Python needs about 6 MB, once. It downloads the first time your code runs.',
  );
  await expect(output(page)).toContainText('Nothing printed yet');

  // An empty file runs, and the first test says what is missing.
  await check(page).click();
  await expect(page.locator('.wk-output .py-notice')).toContainText(
    /(Downloading|Starting) Python/,
  );
  await expect(slip(page)).toHaveText(/Not passing yet\. Your code should use print\(\)\./, {
    timeout: LOAD_MS,
  });
  await expect(output(page)).toContainText('Your code ran and printed nothing.');

  // print() with the wrong words fails the second test.
  await replaceCode(page, 'print("Water is on")');
  await page.keyboard.press('Control+Enter');
  await expect(slip(page)).toHaveText(
    /Your code should print the line Water is off in Hall A today\./,
  );
  await expect(output(page)).toContainText('Water is on');

  await replaceCode(page, 'print("Water is off in Hall A today.")');
  await page.keyboard.press('Control+Enter');
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.getByText('Step 1 of 3 done')).toBeVisible();
  await expect(output(page)).toContainText('Water is off in Hall A today.');
  await expect(page.locator('header.topbar').getByText('5 of 60 XP today')).toBeVisible();

  // Python has loaded on this device, so the size note is gone, even after a reload.
  await expect(page.locator('.wk-output .py-notice')).toHaveText('');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Output' })).toBeVisible();
  await expect(page.locator('.wk-output .py-notice')).toHaveText('');
});

test('Run shows what the code prints, and an error in plain words with the line', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  await replaceCode(page, 'print("Hall A")\nprint(totl)');
  await run(page).click();
  const message = page.locator('.py-error');
  await expect(message).toContainText(
    'Your code stopped on line 3 of main.py, which reads print(totl). Python does not know the name "totl".',
    { timeout: LOAD_MS },
  );
  // What was printed before the error stays.
  await expect(output(page)).toContainText('Hall A');
  // Run does not check: no slip, no XP.
  await expect(slip(page)).toBeEmpty();

  // The same error under Check: the slip carries it, and no test message hides it.
  await check(page).click();
  await expect(slip(page)).toContainText('Your code stopped on line 3 of main.py');

  // A syntax error reads as a sentence about the line.
  await replaceCode(page, 'def f(\n    pass');
  await run(page).click();
  await expect(message).toContainText('Python cannot read your code');
  await expect(message).toContainText('main.py');

  await replaceCode(page, 'print("one")\nprint("two")');
  await run(page).click();
  await expect(message).toHaveCount(0);
  await expect(output(page)).toContainText('one');
  await expect(output(page)).toContainText('two');
});

test('a loop that never ends is stopped at 5 seconds and the page stays usable', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  // Load Python first, so the 5 seconds below are the code's alone.
  await replaceCode(page, 'print("ready")');
  await run(page).click();
  await expect(output(page)).toContainText('ready', { timeout: LOAD_MS });

  await replaceCode(page, 'print("start")\nwhile True:\n    pass');
  const started = Date.now();
  await check(page).click();
  await expect(slip(page)).toContainText(
    'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
    { timeout: 15_000 },
  );
  const took = Date.now() - started;
  expect(took).toBeGreaterThanOrEqual(4800);
  expect(took).toBeLessThan(10_000);
  // What the loop printed before the stop is still there.
  await expect(output(page)).toContainText('start');

  // The page answers: the button works again and the editor takes text.
  await expect(check(page)).toBeEnabled();
  await expect(run(page)).toBeEnabled();
  await replaceCode(page, 'print("Water is off in Hall A today.")');
  // The next run starts a fresh worker ("Restarting Python"), then passes.
  await check(page).click();
  await expect(page.locator('.wk-output .py-notice')).toContainText('Restarting Python', {
    timeout: 5000,
  });
  await expect(page.getByText('Your code passes.')).toBeVisible({ timeout: LOAD_MS });
  await expect(output(page)).toContainText('Water is off in Hall A today.');
});

test('step 2 tests a function, with the hint for a wrong answer and plain words for an error', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 2));
  await expect(page.getByText('Step 2 of 3', { exact: true })).toBeVisible();
  // Step 2 starts from step 1's solution.
  await expect(page.locator('.cm-content')).toContainText('Water is off in Hall A today.');

  await check(page).click();
  await expect(slip(page)).toContainText(
    'Your code should define a function called compute_deadline.',
    {
      timeout: LOAD_MS,
    },
  );

  // A function that gives 24 hours to everything fails the "normal" test.
  await replaceCode(page, 'def compute_deadline(urgency):\n    return 24');
  await check(page).click();
  await expect(slip(page)).toContainText('compute_deadline("normal") should return 72.');

  // A function that stops with an error keeps the hint and adds what Python said.
  await replaceCode(page, 'def compute_deadline(urgency):\n    return urgency + 1');
  await check(page).click();
  await expect(slip(page)).toContainText('compute_deadline("urgent") should return 24.');
  await expect(slip(page)).toContainText(
    'Python stopped while checking your code on line 4 of main.py, which reads return urgency + 1.',
  );
  await expect(slip(page)).toContainText('You cannot join text and a whole number with +.');

  await replaceCode(
    page,
    [
      'def compute_deadline(urgency):',
      '    if urgency == "urgent":',
      '        return 24',
      '    elif urgency == "normal":',
      '        return 72',
      '    else:',
      '        return 168',
    ].join('\n'),
  );
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.getByText('Step 2 of 3 done')).toBeVisible();
});

test('step 3 uses defines() and _code, and the last step finishes the workshop', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 3));
  await replaceCode(page, 'print("Deadline: 24 hours")');
  await check(page).click();
  // The text is right but the number is typed, not computed.
  await expect(slip(page)).toContainText(
    'Your code should call compute_deadline as well as define it.',
    { timeout: LOAD_MS },
  );
  await replaceCode(page, `print(f"Deadline: {compute_deadline('urgent')} hours")`);
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(output(page)).toContainText('Deadline: 24 hours');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Workshop done' })).toBeVisible();
});

test('a lesson Try it runs Python, and the typein screen checks it', async ({ page, course }) => {
  const lesson = course.summary('fixture-python-lesson');
  await page.goto(`/learn/fixture-python-lesson/${lesson.id}`);
  const tryit = page.locator('.tryit');
  await expect(tryit.locator('.py-notice')).toHaveText(
    'Python needs about 6 MB, once. It downloads the first time your code runs.',
  );
  await expect(tryit.getByRole('log', { name: 'Output' })).toContainText('Nothing printed yet');

  await tryit.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(tryit.getByRole('log', { name: 'Output' })).toContainText('Hello, Hall A', {
    timeout: LOAD_MS,
  });

  // Edit the code and run again: the new text prints.
  await tryit.locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText('print("Hello, Hall B")\nprint(1 / 0)');
  await page.keyboard.press('Control+Enter');
  await expect(tryit.locator('.py-error')).toContainText(
    'Your code stopped on line 2 of main.py, which reads print(1 / 0). Python cannot divide by zero.',
  );
  await expect(tryit.getByRole('log', { name: 'Output' })).toContainText('Hello, Hall B');

  await page.getByRole('button', { name: 'Continue' }).click();
  // The typein screen: a wrong answer, then the right one.
  const box = page.getByLabel('Your code');
  await box.fill('print("Room B-215")');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
  await expect(page.getByText('Your code should print the text Room B-214.')).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await box.fill('print("Room B-214")');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ })).toBeVisible();
});

test('the typein screen says the download size before the first check', async ({
  page,
  course,
}) => {
  const lesson = course.summary('fixture-python-lesson');
  await page.goto(`/learn/fixture-python-lesson/${lesson.id}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.py-floating .py-notice')).toHaveText(
    'Python needs about 6 MB, once. It downloads the first time your code runs.',
  );
  await page.getByLabel('Your code').fill('print("Room B-214")');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ })).toBeVisible({
    timeout: LOAD_MS,
  });
  // Once Python is ready the note goes away.
  await expect(page.locator('.py-floating .py-notice')).toHaveText('');
});

test('on a phone the Output tab and the download note are reachable', async ({ page, course }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(stepUrl(course, 1));
  // The note sits with the Check button while the Code tab is open.
  await page.getByRole('tab', { name: 'Code' }).click();
  await expect(page.locator('.wk-bottom .py-notice')).toContainText(
    'Python needs about 6 MB, once.',
  );
  await page.getByRole('tab', { name: 'Output' }).click();
  await expect(run(page)).toBeVisible();
  const box = await run(page).boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});
