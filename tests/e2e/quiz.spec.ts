import type { Page } from '@playwright/test';
import { expect, plain, test, type BuiltQuiz } from './course-helpers';
import { signInAndOnboard } from './helpers';

const SLUG = 'fixture-quiz';
const norm = (text: string) => text.replace(/\s+/g, ' ').trim();

async function openQuiz(page: Page, itemId: string) {
  await signInAndOnboard(page);
  await page.goto('/learn');
  await page.getByRole('link', { name: /Z1-04/ }).click();
  await expect(page).toHaveURL(`/learn/${SLUG}/${itemId}`);
  await expect(page.getByRole('radiogroup')).toBeVisible();
}

/**
 * Answers every question of one attempt and stops on the end screen. Returns the question texts
 * in the order they were asked. `how` says whether to pick the right option each time, and
 * whether to use the A-D keys or the mouse.
 */
async function playAttempt(
  page: Page,
  quiz: BuiltQuiz,
  how: { right: boolean; keys?: boolean },
): Promise<string[]> {
  const asked: string[] = [];
  for (let n = 1; n <= quiz.draw; n++) {
    const shown = norm(await page.locator('#quiz-question').innerText());
    const question = quiz.questions.find((q) => plain(q.text) === shown);
    expect(question, `unknown question "${shown}"`).toBeTruthy();
    asked.push(shown);

    const wanted = plain(how.right ? question!.answer : question!.distractors[0]);
    const options = (await page.locator('.option-text').allInnerTexts()).map(norm);
    const index = options.indexOf(wanted);
    expect(index, `option "${wanted}" among ${options.join(' | ')}`).toBeGreaterThanOrEqual(0);

    if (how.keys) await page.keyboard.press(String.fromCharCode(97 + index));
    else await page.getByRole('radio').nth(index).click();
    await expect(page.getByRole('radio').nth(index)).toHaveAttribute('aria-checked', 'true');

    if (how.keys) await page.keyboard.press('Enter');
    else await page.getByRole('button', { name: 'Check' }).click();

    // Feedback with the explanation, and a mark on the options as well as the colour.
    const sheet = page.getByRole('region', { name: how.right ? 'Correct' : 'Not quite' });
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText(plain(question!.explanation));
    await expect(page.locator('.quiz-option.is-right .option-mark')).toHaveText('✓');
    if (!how.right)
      await expect(page.locator('.quiz-option.is-wrong .option-mark')).toHaveText('✗');

    const last = n === quiz.draw;
    const next = page.getByRole('button', { name: last ? 'See your score' : 'Continue' });
    if (how.keys) await page.keyboard.press('Enter');
    else await next.click();
  }
  return asked;
}

test('options are shuffled, lettered A to D, and Check waits for a choice', async ({
  page,
  course,
}) => {
  const quiz = course.quiz(SLUG);
  await openQuiz(page, course.itemIds(SLUG)[0]);
  const options = page.getByRole('radio');
  await expect(options).toHaveCount(4);
  await expect(page.locator('.option-key')).toHaveText(['A', 'B', 'C', 'D']);
  await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled();
  await page.keyboard.press('c');
  await expect(options.nth(2)).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: 'Check' })).toBeEnabled();
  // One question per screen, with a segment for each.
  await expect(page.locator('.quiz-progress span')).toHaveCount(quiz.draw);
  await expect(page.locator('.quiz-count')).toHaveText(`1 of ${quiz.draw}`);
});

test('a pass saves the score, gives 30 XP and marks the door done', async ({ page, course }) => {
  const quiz = course.quiz(SLUG);
  await openQuiz(page, course.itemIds(SLUG)[0]);
  await playAttempt(page, quiz, { right: true, keys: true });

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    `You passed: ${quiz.draw} of ${quiz.draw}`,
  );
  await expect(page.getByText('You earned 30 XP.')).toBeVisible();
  await expect(page.locator('.quiz-review')).toHaveCount(0); // nothing wrong, nothing to review
  await expect(page.locator('header.topbar').getByText('30 of 60 XP today')).toBeVisible();

  const attempts = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('g39.quizAttempts') ?? '[]'),
  );
  expect(attempts).toHaveLength(1);
  expect(attempts[0]).toMatchObject({
    quizId: course.itemIds(SLUG)[0],
    score: quiz.draw,
    total: quiz.draw,
    passed: true,
    wrongIds: [],
  });

  await page.getByRole('button', { name: 'Back to the map' }).click();
  await expect(page).toHaveURL('/learn');
  await expect(page.getByRole('link', { name: /Z1-04/ })).toHaveAccessibleName(/Done/);
  await expect(page.getByRole('link', { name: /Z1-04/ }).locator('.door-tag')).toBeVisible();
});

test('a fail says what is needed, shows what was missed, and a retry draws a new set', async ({
  page,
  course,
}) => {
  const quiz = course.quiz(SLUG);
  await openQuiz(page, course.itemIds(SLUG)[0]);
  const first = await playAttempt(page, quiz, { right: false });

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    `Not yet: 0 of ${quiz.draw}. You need ${quiz.pass}.`,
  );
  // Every question is listed with the explanation.
  const missed = page.locator('.quiz-missed');
  await expect(missed).toHaveCount(quiz.draw);
  for (const text of first) {
    const question = quiz.questions.find((q) => plain(q.text) === text)!;
    const item = missed.filter({ hasText: text });
    await expect(item).toContainText(plain(question.explanation));
    await expect(item).toContainText(`Your answer: ${plain(question.distractors[0])}`);
    await expect(item).toContainText(`Correct answer: ${plain(question.answer)}`);
  }
  await expect(page.getByText(/You earned/)).toHaveCount(0);

  // Not passed: the door stays plain.
  await page.getByRole('button', { name: 'Back to the map' }).click();
  await expect(page.getByRole('link', { name: /Z1-04/ })).not.toHaveAccessibleName(/Done/);
  await expect(page.getByRole('link', { name: /Z1-04/ }).locator('.door-tag')).toHaveCount(0);

  // Try again: a fresh draw, never the same set while the pool is bigger than the draw.
  await page.getByRole('link', { name: /Z1-04/ }).click();
  await expect(page.getByRole('radiogroup')).toBeVisible();
  const second = await playAttempt(page, quiz, { right: false });
  expect([...second].sort()).not.toEqual([...first].sort());
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('radiogroup')).toBeVisible();
  await expect(page.locator('.quiz-count')).toHaveText(`1 of ${quiz.draw}`);
  const third = await playAttempt(page, quiz, { right: true });
  expect([...third].sort()).not.toEqual([...second].sort());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    `You passed: ${quiz.draw} of ${quiz.draw}`,
  );

  // Two failed attempts and one pass were all recorded.
  const attempts = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('g39.quizAttempts') ?? '[]'),
  );
  expect(attempts.map((a: { passed: boolean }) => a.passed)).toEqual([false, false, true]);
  expect(attempts[0].wrongIds).toHaveLength(quiz.draw);
});

test('Try again on the end screen of a fail starts at question 1', async ({ page, course }) => {
  const quiz = course.quiz(SLUG);
  await openQuiz(page, course.itemIds(SLUG)[0]);
  await playAttempt(page, quiz, { right: false });
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.quiz-count')).toHaveText(`1 of ${quiz.draw}`);
  await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled();
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('questions, feedback and the end screen fit the screen', async ({ page, course }) => {
    const quiz = course.quiz(SLUG);
    await openQuiz(page, course.itemIds(SLUG)[0]);
    const overflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    expect(await overflow()).toBeLessThanOrEqual(0);

    const heights = await page
      .getByRole('radio')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);

    // Check stays on screen, in the bottom bar.
    await expect(page.getByRole('button', { name: 'Check' })).toBeInViewport();
    await page.getByRole('radio').first().click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(
      page.getByRole('button', { name: /^(Continue|See your score)$/ }),
    ).toBeInViewport();
    expect(await overflow()).toBeLessThanOrEqual(0);

    await page.getByRole('button', { name: /^(Continue|See your score)$/ }).click();
    for (let n = 2; n <= quiz.draw; n++) {
      await page.getByRole('radio').first().click();
      await page.getByRole('button', { name: 'Check' }).click();
      await page.getByRole('button', { name: /^(Continue|See your score)$/ }).click();
    }
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
});
