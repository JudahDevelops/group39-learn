/**
 * The fixture lesson content/blocks/fixture-widgets (chapter Z2): the four widgets with real IHMS data,
 * then an order screen with 15 items and a match screen with 7 pairs. Every widget renders, the scored ones
 * fail and then pass, and at 375 px nothing scrolls sideways and every target is at least 44 px tall.
 */
import type { Page } from '@playwright/test';
import { expect, test, type BuiltCourse } from './course-helpers';
import { signInAndOnboard } from './helpers';

const SLUG = 'fixture-widgets';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tierButton = (page: Page, tier: string) =>
  page.getByRole('button', { name: new RegExp(`^${tier}( |$)`) });
const sheetTitle = (page: Page, title: 'Correct' | 'Not quite') =>
  title === 'Correct'
    ? page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ })
    : page.getByRole('heading', { name: 'Not quite' });
const litArrows = (page: Page) => page.locator('.w-link-lit');

const SORTER_CARDS: [card: string, tier: string][] = [
  ['Student Portal', 'Client'],
  ['Staff Dashboard', 'Client'],
  ['Room Allocation', 'Logic'],
  ['★ Complaint Triage and Escalation Engine', 'Logic'],
  ['Complaint history and audit log', 'Data'],
  ['Tables for users, hostels, rooms, bed spaces, allocations and complaints', 'Data'],
  ['Email Notification Service', 'Output'],
  ['Report Export', 'Output'],
];

/** The tier that handles each step of F2, in order. */
const F2_TIERS = ['Client', 'Logic', 'Logic', 'Data', 'Output', 'Client'];

const FIFTEEN_STEPS = [
  'Understand the topic',
  'Three research questions',
  'Search Consensus',
  'Study the research',
  'Export the CSV',
  'Upload to AI',
  'Identify gaps',
  'Define the value-add',
  'Problem statement',
  'Aim and three objectives',
  'Design the architecture',
  'Explain every component',
  'Write the Word document',
  'Build the slide deck',
  'Defend the project',
];

const STACK_PAIRS: [part: string, technology: string][] = [
  ['Frontend', 'HTML, CSS, JavaScript (Fetch API)'],
  ['Backend', 'FastAPI (Python) with Pydantic'],
  ['Database', 'PostgreSQL with SQLAlchemy'],
  ['Scheduling', 'APScheduler'],
  ['Notifications', 'SMTP email'],
  ['Security', 'bcrypt password hashing, JSON Web Tokens'],
  ['Triage (optional)', 'TypeSafe Jev API'],
];

async function openLesson(page: Page, course: BuiltCourse) {
  await signInAndOnboard(page);
  await page.goto(`/learn/${SLUG}/${course.itemIds(SLUG)[0]}`);
}

async function onScreen(page: Page, course: BuiltCourse, n: number) {
  await expect(page.getByRole('progressbar', { name: 'Lesson progress' })).toHaveAttribute(
    'aria-valuetext',
    `Screen ${n} of ${course.summary(SLUG).itemCount}`,
  );
}

async function cont(page: Page) {
  await button(page, 'Continue').click();
}

/** Nothing on the page, or inside the lesson, reaches past the right edge of the screen. */
async function expectNoSidewaysScroll(page: Page) {
  const { scrollWidth, clientWidth, outside } = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const outside = Array.from(document.querySelectorAll('.lesson-main *'))
      // Code listings scroll inside their own box, so their long lines are allowed.
      .filter((el) => !el.closest('pre') && el.getBoundingClientRect().right > width + 0.5)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: width,
      outside,
    };
  });
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  expect(outside).toEqual([]);
}

/** Every button and slider the learner can see is at least 44 px tall. */
async function expectTouchTargets(page: Page) {
  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.lesson button, .lesson input[type="range"]'))
      .map((el) => ({ el, box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 0 && box.height > 0 && box.height < 43.9)
      .map(
        ({ el, box }) =>
          `${el.textContent?.trim() || el.getAttribute('aria-label')}: ${box.height}px`,
      ),
  );
  expect(small).toEqual([]);
}

/** What the 375 px run checks on every screen; the laptop run checks nothing extra. */
type Layout = () => Promise<void>;

// --- the widgets ------------------------------------------------------------------------------

async function playExchange(page: Page, layout: Layout) {
  await expect(page.getByText('Step 1 of 5')).toBeVisible();
  const request = page.getByLabel('Request', { exact: true });
  await expect(request).toContainText('POST /api/complaints');
  await expect(request).toContainText(
    '"description": "Water is pouring from the ceiling near the light"',
  );
  // In the code style: Mono on the bench colour.
  expect(await request.evaluate((el) => getComputedStyle(el).fontFamily)).toContain(
    'Atkinson Hyperlegible Mono',
  );
  expect(
    await request.evaluate((el) => getComputedStyle(el.closest('figure')!).backgroundColor),
  ).toBe('rgb(20, 32, 27)');
  await expect(page.getByLabel('Response', { exact: true })).toHaveCount(0);
  await expect(button(page, 'Back')).toBeDisabled();
  await layout();

  await button(page, 'Next').click();
  await expect(page.getByText('Step 2 of 5')).toBeVisible();
  await expect(litArrows(page)).toHaveCount(1); // browser to server
  expect(
    await page.locator('.w-dot-down').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('w-run-down');
  await button(page, 'Next').click(); // the database
  await expect(page.getByText('Step 3 of 5')).toBeVisible();
  await expect(page.getByLabel('Response', { exact: true })).toHaveCount(0);
  await button(page, 'Next').click(); // the server builds the response
  const response = page.getByLabel('Response', { exact: true });
  await expect(response).toContainText('201 Created');
  await expect(response).toContainText('"category": "plumbing"');
  await expect(page.locator('.w-dot-up')).toHaveCount(1); // database back to server
  await layout();

  await button(page, 'Next').click();
  await expect(page.getByText('Step 5 of 5')).toBeVisible();
  await expect(button(page, 'Next')).toBeDisabled();
  await button(page, 'Back').click();
  await expect(page.getByText('Step 4 of 5')).toBeVisible();
  await expect(response).toBeVisible();
  // Nothing is scored: Continue is there all along.
  await expect(button(page, 'Continue')).toBeEnabled();
}

async function placeCards(page: Page, placements: [card: string, tier: string][]) {
  for (const [card, tier] of placements) {
    await button(page, card).click();
    await button(page, `Place ${card} in ${tier}`).click();
  }
}

async function playSorter(page: Page, layout: Layout) {
  await expect(page.getByRole('heading', { name: 'Cards to place' })).toBeVisible();
  await expect(button(page, 'Check')).toBeDisabled();
  await expect(page.getByText('0 of 8 placed')).toBeVisible();
  await layout();

  // First try: two cards in the wrong tier.
  await placeCards(
    page,
    SORTER_CARDS.map(([card, tier]): [string, string] => [
      card,
      card === 'Report Export' ? 'Data' : card === 'Student Portal' ? 'Output' : tier,
    ]),
  );
  await expect(page.getByText('8 of 8 placed')).toBeVisible();
  await layout();
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Not quite')).toBeVisible();
  await expect(page.getByText('6 of 8 cards are in the right tier.')).toBeVisible();
  await layout();
  await button(page, 'Try again').click();

  // Second try: everything in its tier.
  await expect(page.getByText('0 of 8 placed')).toBeVisible();
  await expect(button(page, 'Check')).toBeDisabled();
  await placeCards(page, SORTER_CARDS);
  await expect(page.getByText('Every card is in a tier.')).toBeVisible();
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Correct')).toBeVisible();
  await layout();
  await cont(page);
}

async function playTracer(page: Page, layout: Layout) {
  await expect(page.getByText('F2 Complaint triage')).toBeVisible();
  await expect(page.getByText('Step 1 of 6')).toBeVisible();
  await layout();

  // First try: one wrong tier on the first step.
  await tierButton(page, 'Data').click();
  await expect(page.getByText('Data is not right for this step. Pick another tier.')).toBeVisible();
  await expect(page.getByText('Step 1 of 6')).toBeVisible();
  await expect(tierButton(page, 'Data')).toHaveAttribute('aria-disabled', 'true');
  await layout();
  for (const tier of F2_TIERS) await tierButton(page, tier).click();
  await expect(
    page.getByText('That is the whole flow. Press Check to see how you did.'),
  ).toBeVisible();
  await layout();
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Not quite')).toBeVisible();
  await expect(page.getByText('You picked a wrong tier once, on 1 of 6 steps.')).toBeVisible();
  await button(page, 'Try again').click();

  // Second try: no slips. The arrows light up for the gaps each move crosses.
  await expect(page.getByText('Step 1 of 6')).toBeVisible();
  const lit = [0, 1, 0, 1, 1, 3]; // Client, Logic, Logic, Data, Output, Client (up three gaps)
  for (const [i, tier] of F2_TIERS.entries()) {
    await tierButton(page, tier).click();
    await expect(litArrows(page)).toHaveCount(lit[i]);
  }
  await expect(page.locator('.w-dot-up')).toHaveCount(3);
  await layout();
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Correct')).toBeVisible();
  await cont(page);
}

async function playExplorer(page: Page, layout: Layout) {
  const slider = page.getByRole('slider', { name: 'Time the complaint has been open, in hours' });
  await expect(page.getByText('Normal: d = 72 hours, 2d = 144 hours')).toBeVisible();
  await expect(page.getByText('L = 0', { exact: true })).toBeVisible();
  await expect(page.getByText('Nobody', { exact: true })).toBeVisible();
  await layout();
  await slider.fill('71');
  await expect(page.getByText('L = 0', { exact: true })).toBeVisible();
  await slider.fill('72');
  await expect(page.getByText('L = 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Hall warden', { exact: true })).toBeVisible();
  await expect(page.getByText('Overdue. The hall warden is emailed.')).toBeVisible();
  await slider.fill('144');
  await expect(page.getByText('L = 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Hall warden and Student Affairs', { exact: true })).toBeVisible();
  await layout();
  // An explorer: the explanation shows at once, and Continue is there.
  await expect(page.getByText('The level L is 0 before the deadline d')).toBeVisible();
  await expect(button(page, 'Continue')).toBeEnabled();
  await cont(page);
}

async function playScoredSlider(page: Page, layout: Layout) {
  const slider = page.getByRole('slider', { name: 'Time the complaint has been open, in hours' });
  await expect(
    page.getByText('Move the slider to the first moment the hall warden is emailed.'),
  ).toBeVisible();
  await layout();

  // One hour early.
  await slider.fill('71');
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Not quite')).toBeVisible();
  await expect(
    page.getByText(
      'You stopped at 71 hours, when nobody has been emailed yet. That is before the hall warden is first emailed.',
    ),
  ).toBeVisible();
  await layout();
  await button(page, 'Try again').click();

  // One hour late.
  await expect(page.getByText('t = 0 hours')).toBeVisible();
  await slider.fill('73');
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Not quite')).toBeVisible();
  await expect(page.getByText('The hall warden was emailed earlier than that.')).toBeVisible();
  await button(page, 'Try again').click();

  // Exactly d, reached with the one-hour buttons.
  await slider.fill('71');
  await button(page, '1 hour later').click();
  await expect(page.getByText('t = 72 hours')).toBeVisible();
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Correct')).toBeVisible();
  await layout();
  await cont(page);
}

async function orderTexts(page: Page): Promise<string[]> {
  return page.locator('ol.order-list .order-text').allInnerTexts();
}

async function playOrder(page: Page, layout: Layout) {
  await expect(page.locator('ol.order-list > li')).toHaveCount(15);
  await layout();

  // The keyboard moves a row: Enter on its Down button, and focus stays on the row that moved.
  const first = (await orderTexts(page))[0];
  const down = button(page, `Move down: ${first}`);
  await down.focus();
  await page.keyboard.press('Enter');
  expect((await orderTexts(page))[1]).toBe(first);
  await expect(down).toBeFocused();

  // Then put the 15 steps in order, by selection sort.
  for (const [want, text] of FIFTEEN_STEPS.entries()) {
    for (let guard = 0; guard < 20; guard += 1) {
      const at = (await orderTexts(page)).indexOf(text);
      expect(at, `"${text}" is on the screen`).toBeGreaterThanOrEqual(want);
      if (at === want) break;
      await button(page, `Move up: ${text}`).click();
    }
  }
  await layout();
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Correct')).toBeVisible();
  await layout();
  await cont(page);
}

async function pairOf(page: Page, part: string, technology: string, how: 'click' | 'keyboard') {
  const left = page
    .getByRole('list', { name: 'Left side' })
    .getByRole('button', { name: part, exact: true });
  const right = page
    .getByRole('list', { name: 'Right side' })
    .getByRole('button', { name: technology, exact: true });
  if (how === 'click') {
    await left.click();
    await right.click();
  } else {
    await left.focus();
    await page.keyboard.press('Enter');
    await right.focus();
    await page.keyboard.press('Space');
  }
}

async function playMatch(page: Page, layout: Layout) {
  await expect(page.getByRole('list', { name: 'Left side' }).getByRole('button')).toHaveCount(7);
  await layout();
  const pairs = page.getByRole('list', { name: 'Your pairs' }).getByRole('listitem');

  await pairOf(page, ...STACK_PAIRS[0], 'keyboard');
  await expect(pairs).toHaveCount(1);
  for (const [part, technology] of STACK_PAIRS.slice(1))
    await pairOf(page, part, technology, 'click');
  await expect(pairs).toHaveCount(7);
  await layout();
  await button(page, 'Check').click();
  await expect(sheetTitle(page, 'Correct')).toBeVisible();
  await layout();
  await cont(page);
  await expect(page.getByRole('heading', { name: 'Lesson done' })).toBeVisible();
}

/** Plays every screen of the lesson. `layout` runs at each state worth measuring. */
async function playLesson(page: Page, course: BuiltCourse, layout: Layout) {
  await openLesson(page, course);

  await onScreen(page, course, 1);
  await playExchange(page, layout);
  await cont(page);

  await onScreen(page, course, 2);
  await playSorter(page, layout);

  await onScreen(page, course, 3);
  await playTracer(page, layout);

  await onScreen(page, course, 4);
  await playExplorer(page, layout);

  await onScreen(page, course, 5);
  await playScoredSlider(page, layout);

  await onScreen(page, course, 6);
  await playOrder(page, layout);

  await onScreen(page, course, 7);
  await playMatch(page, layout);
}

// --- tests ---------------------------------------------------------------------------------------

test('every widget renders, and the scored ones fail and then pass', async ({ page, course }) => {
  // Seven screens with a failed try on four of them.
  test.setTimeout(120_000);
  await playLesson(page, course, async () => {});
});

test('the fixture sits in chapter Z2, after the six block types of Z1', async ({
  page,
  course,
}) => {
  const block = course.summary(SLUG);
  expect(block.roomCode).toBe('Z2-01');
  expect(block.itemCount).toBe(7);
  await signInAndOnboard(page);
  await page.goto('/learn');
  await expect(
    page.getByRole('heading', { name: 'Chapter Z2: Interactive widgets' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Z2-01/ }).click();
  await expect(page).toHaveURL(`/learn/${SLUG}/${course.itemIds(SLUG)[0]}`);
});

test('the tier sorter works with the keyboard alone', async ({ page, course }) => {
  await openLesson(page, course);
  await cont(page); // past the request and response screen
  await onScreen(page, course, 2);

  const [card, tier] = SORTER_CARDS[2]; // Room Allocation, Logic
  await button(page, card).focus();
  await page.keyboard.press('Enter');
  await expect(button(page, card)).toHaveAttribute('aria-pressed', 'true');
  // Picking a card sends focus to the tiers, so the next Enter or Space places it.
  await expect(button(page, `Place ${card} in Client`)).toBeFocused();
  await button(page, `Place ${card} in ${tier}`).focus();
  await page.keyboard.press('Space');
  const logic = page.locator('.w-bucket', {
    has: page.getByRole('button', { name: tier, exact: true }),
  });
  await expect(logic.getByRole('button', { name: card, exact: true })).toBeVisible();
  await expect(page.getByText('1 of 8 placed')).toBeVisible();

  // After a card is placed, focus moves on to the next card that is still waiting.
  const waiting = page.locator('.w-group .w-card');
  await expect(waiting.first()).toBeFocused();

  // Nothing is drag-only: a placed card is picked up and moved with the same two presses.
  await logic.getByRole('button', { name: card, exact: true }).focus();
  await page.keyboard.press('Enter');
  await button(page, `Place ${card} in Data`).focus();
  await page.keyboard.press('Enter');
  await expect(
    page
      .locator('.w-bucket', { has: page.getByRole('button', { name: 'Data', exact: true }) })
      .getByRole('button', { name: card, exact: true }),
  ).toBeVisible();
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the arrows still show the direction, and the travelling dot is gone', async ({
    page,
    course,
  }) => {
    await openLesson(page, course);
    await button(page, 'Next').click();
    await expect(litArrows(page)).toHaveCount(1);
    await expect(page.locator('.w-link-lit path').nth(1)).toBeVisible(); // the arrowhead
    const dot = page.locator('.w-dot-down');
    await expect(dot).toHaveCount(1);
    expect(await dot.evaluate((el) => getComputedStyle(el).display)).toBe('none');
    expect(await dot.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('every widget fits: nothing scrolls sideways and every target is 44 px tall', async ({
    page,
    course,
  }) => {
    test.setTimeout(150_000);
    const layout: Layout = async () => {
      await expectNoSidewaysScroll(page);
      await expectTouchTargets(page);
    };
    await playLesson(page, course, layout);
  });
});
