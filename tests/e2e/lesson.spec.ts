import { expect, test, type Page } from '@playwright/test';
import { signInAndOnboard } from './helpers';

/** The fixture lesson (content/blocks/fixture-lesson): every screen type, 13 screens. */
const LESSON = '/learn/fixture-lesson/lbj9me1r';
const SCREENS = 13;

const topbar = (page: Page) => page.locator('header.topbar');
const combo = (page: Page) => page.getByText(/\d+ in a row/);
const sheetTitle = (page: Page) =>
  page.getByRole('heading', { name: /^(Correct|That's it|Spot on|Not quite)$/ });
const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });

/** The visible row around an option. The input inside it is hidden, so a person (and a test) clicks the row. */
const optionRow = (page: Page, role: 'radio' | 'checkbox', name: string) =>
  page.locator('label.option').filter({ has: page.getByRole(role, { name, exact: true }) });
const pickRadio = (page: Page, name: string) => optionRow(page, 'radio', name).click();
const pickCheckbox = (page: Page, name: string) => optionRow(page, 'checkbox', name).click();
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function cont(page: Page) {
  await button(page, 'Continue').click();
}

async function check(page: Page, name = 'Check') {
  await button(page, name).click();
}

/** Check, then expect the feedback sheet to say `title`. */
async function checkExpecting(page: Page, title: 'Correct' | 'Not quite') {
  await check(page);
  if (title === 'Correct') {
    await expect(
      page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ }),
    ).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
  }
}

async function onScreen(page: Page, n: number) {
  await expect(page.getByRole('progressbar', { name: 'Lesson progress' })).toHaveAttribute(
    'aria-valuetext',
    `Screen ${n} of ${SCREENS}`,
  );
}

/** Put the order screen's items in their right order by pressing the move buttons. */
async function solveOrder(page: Page) {
  const target = [
    'The opening tag, such as <p>',
    'The content, such as Hello',
    'The closing tag, such as </p>',
  ];
  const texts = () => page.locator('ol.order-list .order-text').allInnerTexts();
  for (let want = 0; want < target.length; want += 1) {
    for (let guard = 0; guard < 10; guard += 1) {
      const at = (await texts()).indexOf(target[want]);
      expect(at, `"${target[want]}" is on the screen`).toBeGreaterThanOrEqual(want);
      if (at === want) break;
      await page.getByRole('button', { name: `Move up: ${target[want]}`, exact: true }).click();
    }
  }
}

async function pair(page: Page, left: string, right: string) {
  await page
    .getByRole('list', { name: 'Left side' })
    .getByRole('button', { name: left, exact: true })
    .click();
  await page
    .getByRole('list', { name: 'Right side' })
    .getByRole('button', { name: right, exact: true })
    .click();
}

/**
 * Plays the fixture lesson from the first screen to the end card. `slip` makes one question wrong on the
 * first try (right on the second), `watchCombo` asserts the combo counter along the way.
 */
async function playLesson(
  page: Page,
  options: { slip?: 'mcq' | 'predict'; watchCombo?: boolean } = {},
) {
  const { slip, watchCombo = false } = options;
  await page.goto(LESSON);
  await onScreen(page, 1);

  // 1-2: concept screens. Ungraded, so Continue is there from the start.
  await expect(page.getByText('A web page is built from')).toBeVisible();
  await cont(page);
  await onScreen(page, 2);
  await cont(page);

  // 3: mcq
  await onScreen(page, 3);
  if (slip === 'mcq') {
    await pickRadio(page, 'p');
    await checkExpecting(page, 'Not quite');
    await expect(page.getByText('No. p holds a paragraph of text.')).toBeVisible();
    await button(page, 'Try again').click();
  }
  await pickRadio(page, 'h1');
  await checkExpecting(page, 'Correct');
  await cont(page);

  // 4: multi (the right set only)
  await onScreen(page, 4);
  await pickCheckbox(page, '</p>');
  await pickCheckbox(page, '</h1>');
  await checkExpecting(page, 'Correct');
  await cont(page);

  // 5: tapbuild
  await onScreen(page, 5);
  await button(page, '<h1>').click();
  await button(page, '</h1>').click();
  await checkExpecting(page, 'Correct');
  if (watchCombo && !slip) await expect(page.getByText('3 in a row')).toBeVisible();
  await cont(page);

  // 6: typein. With the runner built it is checked; without it the learner may carry on.
  await onScreen(page, 6);
  await expect(page.locator('[data-runner]:not([data-runner="checking"])')).toBeVisible();
  const runnerReady = (await page.locator('[data-runner="ready"]').count()) > 0;
  if (runnerReady) {
    const code = page.getByRole('textbox', { name: 'Your code' });
    if (watchCombo) {
      await code.fill('Hello');
      await check(page, 'Check your code');
      await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
      await expect(page.getByText('Your page needs a p element.')).toBeVisible();
      await button(page, 'Try again').click();
    }
    await code.fill('  <p>Water will be off on Friday.</p>');
    await check(page, 'Check your code');
    await expect(
      page.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByText('This exercise needs the code runner, which arrives in a later update.'),
    ).toBeVisible();
  }
  await cont(page);

  // 7: predict
  await onScreen(page, 7);
  if (slip === 'predict') {
    await pickRadio(page, '1');
    await checkExpecting(page, 'Not quite');
    // The wrong answer reset the combo without comment.
    if (watchCombo) await expect(combo(page)).toHaveCount(0);
    await button(page, 'Try again').click();
  }
  await pickRadio(page, '3');
  await checkExpecting(page, 'Correct');
  // Right again, but the run starts over from one.
  if (watchCombo && slip === 'predict') await expect(combo(page)).toHaveCount(0);
  await cont(page);

  // 8: spotbug
  await onScreen(page, 8);
  await pickRadio(page, 'The h1 element is missing its closing tag.');
  await checkExpecting(page, 'Correct');
  await cont(page);

  // 9: order
  await onScreen(page, 9);
  await solveOrder(page);
  await checkExpecting(page, 'Correct');
  if (watchCombo && slip === 'predict') await expect(page.getByText('3 in a row')).toBeVisible();
  await cont(page);

  // 10: match
  await onScreen(page, 10);
  await pair(page, 'h1', 'The main heading');
  await pair(page, 'p', 'A paragraph');
  await pair(page, 'button', 'Something to click');
  await pair(page, 'li', 'One item in a list');
  await expect(page.getByRole('list', { name: 'Your pairs' }).getByRole('listitem')).toHaveCount(4);
  await checkExpecting(page, 'Correct');
  await cont(page);

  // 11: flashcard (not graded)
  await onScreen(page, 11);
  await button(page, 'Show answer').click();
  await expect(page.getByText('An opening tag, the content, and a closing tag.')).toBeVisible();
  await button(page, 'Got it').click();

  // 12: widget. The escalation slider is an explorer: Continue is there from the start, and moving the
  // slider changes the level and who has been emailed.
  await onScreen(page, 12);
  const slider = page.getByRole('slider', { name: 'Time the complaint has been open, in hours' });
  await expect(slider).toBeVisible();
  await expect(page.getByText('L = 0', { exact: true })).toBeVisible();
  await expect(page.getByText('Nobody', { exact: true })).toBeVisible();
  await slider.fill('30'); // d is 24 hours in the fixture
  await expect(page.getByText('L = 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Hall warden', { exact: true })).toBeVisible();
  await expect(page.getByText('The level L is 0 before the deadline d')).toBeVisible();
  await expect(button(page, 'Continue')).toBeEnabled();
  await cont(page);

  // 13: checklist
  await onScreen(page, 13);
  await expect(button(page, 'Continue')).toBeDisabled();
  const python = page.getByRole('checkbox', { name: /^Install Python 3\.11/ });
  await python.click();
  await expect(python).not.toBeChecked();
  await expect(page.getByRole('alert')).toContainText('Your Python is older than 3.11.');
  const paste = page.getByRole('textbox', { name: 'Paste what it prints' });
  await paste.fill('Python 3.9.18');
  await python.click();
  await expect(python).not.toBeChecked();
  await paste.fill('Python 3.12.4');
  await python.check();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('checkbox', { name: /^Create a folder called/ }).check();
  await cont(page);

  await expect(page.getByRole('heading', { name: 'Lesson done' })).toBeVisible();
}

test('completes the fixture lesson, resets the combo on a wrong answer, and awards XP once', async ({
  page,
}) => {
  // Three full runs of a 13-screen lesson: about 20 s alone, slower when other suites share the machine.
  test.setTimeout(120_000);
  await signInAndOnboard(page);
  await expect(topbar(page).getByText('0 of 60 XP today')).toBeVisible();

  // First run: the 7th screen is wrong on the first try.
  await playLesson(page, { slip: 'predict', watchCombo: true });

  // The end card: screens, XP actually gained, accuracy below 100%, and the pulse.
  await expect(page.getByText(`${SCREENS} screens`, { exact: true })).toBeVisible();
  await expect(page.getByText('10 XP earned', { exact: true })).toBeVisible();
  const accuracy = page.getByText(/^\d+% accuracy, \d+ of \d+ right on the first try$/);
  await expect(accuracy).toBeVisible();
  await expect(accuracy).not.toContainText('100%');
  await expect(page.getByText('How did this lesson feel?')).toBeVisible();
  for (const label of ['Too easy', 'Just right', 'Too hard', 'Confusing']) {
    await expect(page.getByRole('radio', { name: label, exact: true })).toBeVisible();
  }
  // The top-bar XP chip rose.
  await expect(topbar(page).getByText('10 of 60 XP today')).toBeVisible();

  await page.locator('label.pulse-option', { hasText: 'Just right' }).click();
  await page.getByLabel('Anything to add? (optional)').fill('Clear and short.');
  await cont(page);
  await expect(page).toHaveURL('/learn');

  // Second run, still with a slip: nothing new to award, and it says so instead of "0 XP".
  await playLesson(page, { slip: 'mcq' });
  await expect(page.getByText('Already done earlier', { exact: true })).toBeVisible();
  await expect(page.getByText(/\b0 XP\b/)).toHaveCount(0);
  await expect(topbar(page).getByText('10 of 60 XP today')).toBeVisible();
  await cont(page);
  await expect(page).toHaveURL('/learn');

  // A perfect run now earns only the bonus that was left: 5 XP.
  await playLesson(page);
  await expect(page.getByText('5 XP earned', { exact: true })).toBeVisible();
  await expect(page.getByText(/^100% accuracy,/)).toBeVisible();
  await expect(topbar(page).getByText('15 of 60 XP today')).toBeVisible();
});

test('keys pick options and Enter checks and continues, once per press', async ({ page }) => {
  await signInAndOnboard(page);
  await page.goto(LESSON);
  await onScreen(page, 1);

  await page.keyboard.press('Enter');
  await onScreen(page, 2);
  await page.keyboard.press('Enter');
  await onScreen(page, 3);

  await page.keyboard.press('b');
  await expect(radio(page, 'p')).toBeChecked();
  await page.keyboard.press('1');
  await expect(radio(page, 'h1')).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(sheetTitle(page)).toHaveText(/^(Correct|That's it|Spot on)$/);
  // Enter lands on the sheet's Continue button; one more press moves on exactly one screen.
  await page.keyboard.press('Enter');
  await onScreen(page, 4);
  await expect(page.getByText('Select every closing tag.')).toBeVisible();

  // A wrong pick: Enter is Try again, and a multi screen keeps what was picked.
  await page.keyboard.press('b');
  await page.keyboard.press('Enter');
  await expect(sheetTitle(page)).toHaveText('Not quite');
  await page.keyboard.press('Enter');
  await expect(sheetTitle(page)).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: '<p>', exact: true })).toBeChecked();
  await expect(button(page, 'Check')).toBeEnabled();
});

test('the lesson ✕ goes back to the map', async ({ page }) => {
  await signInAndOnboard(page);
  await page.goto(LESSON);
  await page.getByRole('button', { name: 'Exit lesson' }).click();
  await expect(page).toHaveURL('/learn');
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a question, its feedback sheet and the end card fit without sideways scrolling', async ({
    page,
  }) => {
    await signInAndOnboard(page);
    await page.goto(LESSON);
    const noOverflow = async () => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    };

    await onScreen(page, 1);
    await noOverflow();
    await cont(page);
    await cont(page);
    await onScreen(page, 3);
    await noOverflow();

    // Touch targets are at least 44 px tall.
    for (const row of await page.locator('label.option').all()) {
      expect((await row.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await pickRadio(page, 'p');
    await check(page);
    await expect(sheetTitle(page)).toHaveText('Not quite');
    await noOverflow();

    // The sheet is stuck to the bottom of the screen once its 180 ms slide has finished.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    const sheet = page.getByRole('region', { name: 'Not quite' });
    const box = await sheet.boundingBox();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(812, 0);
  });
});
