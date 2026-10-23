/**
 * The sql runner in the real app: PGlite (PostgreSQL in WebAssembly) loads from jsDelivr in a
 * worker (needs the network). The fixtures are content/blocks/fixture-sql-workshop (a workshop
 * with a setup.sql) and fixture-sql-lesson (a lesson with a Try it box and a typein screen), both
 * in chapter Z4.
 *
 * PGlite is about 5.3 MB. The tests share one browser context, so only the first one downloads it
 * and the others start from the browser's cache, as a returning learner does. Every test gets a new
 * page and empty local storage, so each starts as a first visit (progress, and "PostgreSQL has
 * loaded here").
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

// The first test downloads PGlite (about 5.3 MB) and starts it. On a slow link, or while other e2e
// runs share it, that can take minutes; later tests reuse the shared context's cache.
const LOAD_MS = 240_000;

const check = (page: Page) => page.getByRole('button', { name: 'Check your code' });
const run = (page: Page) => page.getByRole('button', { name: 'Run', exact: true });
const slip = (page: Page) => page.locator('.wk-slip-region');
const results = (page: Page) => page.getByRole('region', { name: 'Query results' });
const notice = (page: Page) => page.locator('.wk-output .sql-notice');

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
  return `/learn/fixture-sql-workshop/${course.itemIds('fixture-sql-workshop')[n - 1]}`;
}

test('the Results tab says the download size first, then step 1 fails and passes', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Query the Hostel Rooms' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Results' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Preview' })).toHaveCount(0);
  await expect(notice(page)).toHaveText(
    'PostgreSQL needs about 5.3 MB, once. It downloads the first time your query runs.',
  );
  await expect(results(page)).toContainText('No results yet');

  // The table the exercise starts with is a locked tab the learner can read.
  const files = page.getByRole('tablist', { name: 'Files' });
  await expect(files.getByRole('tab')).toHaveText(['query.sql', 'setup.sql']);

  // An empty query runs, and the first test says what is missing.
  await check(page).click();
  await expect(notice(page)).toContainText(/(Downloading|Starting) PostgreSQL/);
  await expect(slip(page)).toHaveText(
    /Not passing yet\. Your query should select from the rooms table\./,
    {
      timeout: LOAD_MS,
    },
  );
  await expect(results(page)).toContainText('Nothing to run yet');

  // A query for two rows fails the second test, and its rows are in the table.
  await replaceCode(page, 'select * from rooms limit 2;');
  await page.keyboard.press('Control+Enter');
  await expect(slip(page)).toHaveText(/Your query should return all 5 rooms\./);
  await expect(results(page).getByRole('table')).toBeVisible();
  await expect(results(page).getByRole('row')).toHaveCount(3);
  await expect(page.locator('.sql-count')).toHaveText('2 rows');

  await replaceCode(page, 'select * from rooms;');
  await page.keyboard.press('Control+Enter');
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.getByText('Step 1 of 3 done')).toBeVisible();
  await expect(page.locator('.sql-count')).toHaveText('5 rows');
  await expect(results(page).getByRole('columnheader')).toHaveText([
    'id',
    'room_number',
    'hall',
    'beds',
  ]);
  await expect(results(page).getByRole('cell', { name: 'B-214' })).toBeVisible();
  await expect(page.locator('header.topbar').getByText('5 of 60 XP today')).toBeVisible();

  // PostgreSQL has loaded on this device, so the size note is gone, even after a reload.
  await expect(notice(page)).toHaveText('');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Results' })).toBeVisible();
  // PostgreSQL is cached, so it starts in the background; "Starting PostgreSQL" goes when it is up.
  await expect(notice(page)).toHaveText('', { timeout: LOAD_MS });
});

test("Run shows the rows, a note for a statement with none, and PostgreSQL's own error message", async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  await replaceCode(page, 'select room_number, beds from rooms order by room_number;');
  await run(page).click();
  await expect(results(page).getByRole('cell', { name: 'A-101' })).toBeVisible({
    timeout: LOAD_MS,
  });
  await expect(page.locator('.sql-count')).toHaveText('5 rows');
  // Run does not check: no slip, no XP.
  await expect(slip(page)).toBeEmpty();

  // A statement with no rows says so.
  await replaceCode(page, 'update rooms set beds = 5;');
  await run(page).click();
  await expect(results(page)).toContainText('Query ran. No rows to show.');
  await expect(results(page).getByRole('table')).toHaveCount(0);

  // A select that matches nothing keeps its columns.
  await replaceCode(page, 'select room_number from rooms where beds > 99;');
  await run(page).click();
  await expect(results(page).getByRole('columnheader')).toHaveText(['room_number']);
  await expect(page.locator('.sql-count')).toHaveText('0 rows');

  // An error reads as PostgreSQL wrote it, with the line of query.sql.
  await replaceCode(page, 'select * from nothing;');
  await run(page).click();
  const message = page.locator('.sql-error');
  await expect(message).toContainText('relation "nothing" does not exist. Line 2 of query.sql.');
  await expect(results(page).getByRole('table')).toHaveCount(0);
  await expect(slip(page)).toBeEmpty();

  // The same error under Check: the slip carries it, and no test message hides it.
  await check(page).click();
  await expect(slip(page)).toContainText('relation "nothing" does not exist. Line 2 of query.sql.');

  // A syntax error keeps the server's wording too.
  await replaceCode(page, 'select * form rooms;');
  await run(page).click();
  await expect(message).toContainText('syntax error at or near "form". Line 2 of query.sql.');

  // Every run starts from an empty database: the update above is gone.
  await replaceCode(page, 'select distinct beds from rooms order by beds;');
  await run(page).click();
  await expect(message).toHaveCount(0);
  await expect(page.locator('.sql-count')).toHaveText('3 rows');
});

test('a query that never ends is stopped at 5 seconds, and the next run works', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 1));
  // Load PostgreSQL first, so the 5 seconds below are the query's alone.
  await replaceCode(page, 'select 1 as ready;');
  await run(page).click();
  await expect(results(page).getByRole('cell', { name: '1', exact: true })).toBeVisible({
    timeout: LOAD_MS,
  });

  // Ten billion rows: a join with no condition.
  await replaceCode(
    page,
    'select count(*) from generate_series(1, 100000) a, generate_series(1, 100000) b;',
  );
  const started = Date.now();
  await check(page).click();
  await expect(slip(page)).toContainText(
    'Your query ran for more than 5 seconds, so it was stopped. Check for a join with no condition: it pairs every row with every other row.',
    { timeout: 20_000 },
  );
  const took = Date.now() - started;
  expect(took).toBeGreaterThanOrEqual(4800);
  expect(took).toBeLessThan(12_000);

  // The page answers: the buttons work again and the editor takes text.
  await expect(check(page)).toBeEnabled();
  await expect(run(page)).toBeEnabled();
  await replaceCode(page, 'select * from rooms;');
  // The next run starts a fresh worker ("Restarting PostgreSQL"), then passes.
  await check(page).click();
  await expect(notice(page)).toContainText('Restarting PostgreSQL', { timeout: 5000 });
  await expect(page.getByText('Your code passes.')).toBeVisible({ timeout: LOAD_MS });
  await expect(page.locator('.sql-count')).toHaveText('5 rows');

  // And Run works after that too.
  await run(page).click();
  await expect(page.locator('.sql-count')).toHaveText('5 rows');
});

test("setup.sql is read-only in a lab with no editable region, and a check runs the lab's own", async ({
  page,
  course,
}) => {
  const lab = course.summary('fixture-sql-lab');
  await page.goto(`/learn/fixture-sql-lab/${lab.id}`);
  await expect(page.getByRole('heading', { level: 1, name: lab.title })).toBeVisible();
  const files = page.getByRole('tablist', { name: 'Files' });
  await expect(files.getByRole('tab')).toHaveText(['query.sql', 'setup.sql']);

  // query.sql takes typing (the lab has no region, so all of it is open).
  await replaceCode(page, 'select * from rooms;');
  await expect(page.locator('.cm-content')).toContainText('select * from rooms;');

  // setup.sql can be read but not changed: typing, deleting and select-all-and-type do nothing.
  await files.getByRole('tab', { name: 'setup.sql' }).click();
  const editor = page.getByTestId('code-editor').locator('.cm-content');
  await expect(editor).toContainText('create table rooms');
  const before = await editor.innerText();
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('drop table rooms;');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Delete');
  expect(await editor.innerText()).toBe(before);
  await expect(page.locator('.editor-notice')).toContainText('locked');

  // A Run and a Check use the lab's own table: all 5 rooms are there.
  await run(page).click();
  await expect(page.locator('.sql-count')).toHaveText('5 rows', { timeout: LOAD_MS });

  await files.getByRole('tab', { name: 'query.sql' }).click();
  await replaceCode(
    page,
    'select hall, sum(beds) as total_beds from rooms group by hall order by hall;',
  );
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.locator('.sql-count')).toHaveText('2 rows');
  await expect(results(page).getByRole('cell', { name: '12' })).toBeVisible();
});

test('step 2 checks the rows and the columns, step 3 checks what an insert changed', async ({
  page,
  course,
}) => {
  await page.goto(stepUrl(course, 2));
  await expect(page.getByText('Step 2 of 3', { exact: true })).toBeVisible();
  // Step 2 starts from step 1's solution.
  await expect(page.locator('.cm-content')).toContainText('select * from rooms;');

  await check(page).click();
  await expect(slip(page)).toContainText(
    'Your new query should use where to keep only some rooms.',
    {
      timeout: LOAD_MS,
    },
  );

  // Rooms in Hall B, but every column: fails the columns test.
  await replaceCode(page, "select * from rooms where hall = 'Hall B';");
  await check(page).click();
  await expect(slip(page)).toContainText('Your query should show only room_number and beds.');

  await replaceCode(page, "select room_number, beds from rooms where hall = 'Hall B';");
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.getByText('Step 2 of 3 done')).toBeVisible();
  await expect(page.locator('.sql-count')).toHaveText('3 rows');

  await page.goto(stepUrl(course, 3));
  await check(page).click();
  await expect(slip(page)).toContainText('Your code should add a row with insert into rooms.');
  // A table the test needs but the code dropped: PostgreSQL's words follow the hint.
  await replaceCode(
    page,
    "insert into rooms (id, room_number, hall, beds) values (6, 'B-217', 'Hall B', 4);\ndrop table rooms;",
  );
  await check(page).click();
  await expect(slip(page)).toContainText(
    'The rooms table should now have 6 rows. PostgreSQL said: relation "rooms" does not exist.',
  );

  // Wrong number of beds fails the last test.
  await replaceCode(
    page,
    "insert into rooms (id, room_number, hall, beds) values (6, 'B-217', 'Hall B', 3);",
  );
  await check(page).click();
  await expect(slip(page)).toContainText('Room B-217 should be in Hall B and have 4 beds.');

  // The row from the last check is gone, so id 6 is free again (it would clash otherwise).
  await replaceCode(
    page,
    "insert into rooms (id, room_number, hall, beds) values (6, 'B-217', 'Hall B', 4);",
  );
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Workshop done' })).toBeVisible();
});

test('a lesson Try it runs SQL, and the typein screen checks the schema', async ({
  page,
  course,
}) => {
  const lesson = course.summary('fixture-sql-lesson');
  await page.goto(`/learn/fixture-sql-lesson/${lesson.id}`);
  const tryit = page.locator('.tryit');
  await expect(tryit.locator('.sql-notice')).toHaveText(
    'PostgreSQL needs about 5.3 MB, once. It downloads the first time your query runs.',
  );
  await expect(tryit.getByRole('region', { name: 'Query results' })).toContainText(
    'No results yet',
  );

  await tryit.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(tryit.getByRole('cell', { name: 'A-101' })).toBeVisible({ timeout: LOAD_MS });
  await expect(tryit.locator('.sql-count')).toHaveText('5 rows');
  await expect(tryit.getByRole('columnheader')).toHaveText(['id', 'room_number', 'hall', 'beds']);

  // Edit the code and run again with the keyboard: the new rows show.
  await tryit.locator('.cm-content').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText("select room_number from rooms where hall = 'Hall A';");
  await page.keyboard.press('Control+Enter');
  await expect(tryit.locator('.sql-count')).toHaveText('2 rows');
  await expect(tryit.getByRole('cell', { name: 'B-214' })).toHaveCount(0);

  // A mistake shows PostgreSQL's message.
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText('select * from room;');
  await page.keyboard.press('Control+Enter');
  await expect(tryit.locator('.sql-error')).toContainText(
    'relation "room" does not exist. Line 1 of query.sql.',
  );

  await page.getByRole('button', { name: 'Continue' }).click();
  // The typein screen: a wrong answer, then the right one.
  const box = page.getByLabel('Your code');
  await box.fill('create table complaints (id integer);');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
  await expect(
    page.getByText(
      'The complaints table should have the columns id and description, in that order.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await box.fill('create table complaints (id integer, description text);');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ })).toBeVisible();
});

test('the typein screen says the download size before the first check', async ({
  page,
  course,
}) => {
  const lesson = course.summary('fixture-sql-lesson');
  await page.goto(`/learn/fixture-sql-lesson/${lesson.id}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.sql-floating .sql-notice')).toHaveText(
    'PostgreSQL needs about 5.3 MB, once. It downloads the first time your query runs.',
  );
  await page
    .getByLabel('Your code')
    .fill('create table complaints (id integer, description text);');
  await page.getByRole('button', { name: 'Check your code' }).click();
  await expect(page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ })).toBeVisible({
    timeout: LOAD_MS,
  });
  // Once PostgreSQL is ready the note goes away.
  await expect(page.locator('.sql-floating .sql-notice')).toHaveText('');
});

test('on a phone the Results tab and the download note are reachable', async ({ page, course }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(stepUrl(course, 1));
  // The note sits with the Check button while the Code tab is open.
  await page.getByRole('tab', { name: 'Code' }).click();
  await expect(page.locator('.wk-bottom .sql-notice')).toContainText(
    'PostgreSQL needs about 5.3 MB, once.',
  );
  await page.getByRole('tab', { name: 'Results' }).click();
  await expect(run(page)).toBeVisible();
  const box = await run(page).boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});
