import type { Page } from '@playwright/test';
import { expect, seedProgress, seedXp, test, type BuiltCourse } from './course-helpers';
import { signInAndOnboard } from './helpers';

/** Finishes everything outside the fixture track, so the fixtures are the course to continue. */
async function finishRealCourse(page: Page, course: BuiltCourse) {
  await seedProgress(page, course.realCourseEntries());
}

const hero = (page: Page) => page.locator('.home-hero');
const topbar = (page: Page) => page.locator('header.topbar');

test('the hero is the next block: its title above a "Start this lesson" button', async ({
  page,
  course,
}) => {
  await signInAndOnboard(page);
  await finishRealCourse(page, course);
  await page.goto('/');

  const lesson = course.summary('fixture-lesson');
  await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText(lesson.title);
  await expect(hero(page).locator('.door-plate')).toHaveText(lesson.roomCode);
  await expect(hero(page).locator('.door-next')).toHaveCount(1);
  // At double size.
  const box = await hero(page).locator('.door').boundingBox();
  expect([box!.width, box!.height]).toEqual([208, 312]);

  // The title comes first, then the button.
  const title = await hero(page).getByRole('heading', { level: 1 }).boundingBox();
  const button = await hero(page).getByRole('button').boundingBox();
  expect(title!.y).toBeLessThan(button!.y);

  await hero(page).getByRole('button', { name: 'Start this lesson' }).click();
  await expect(page).toHaveURL(`/learn/fixture-lesson/${course.itemIds('fixture-lesson')[0]}`);
});

test('Continue opens the workshop at the first step not done', async ({ page, course }) => {
  await signInAndOnboard(page);
  await finishRealCourse(page, course);
  await seedProgress(page, course.doneEntries('fixture-lesson'));
  await page.goto('/');

  const workshop = course.summary('fixture-workshop');
  await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText(workshop.title);
  // Not started: "Start this workshop".
  await expect(hero(page).getByRole('button')).toHaveText('Start this workshop');

  await seedProgress(page, course.doneEntries('fixture-workshop', 1));
  await page.goto('/');
  const button = hero(page).getByRole('button', { name: 'Continue with step 2' });
  await expect(button).toBeVisible();
  await button.click();
  await expect(page).toHaveURL(`/learn/fixture-workshop/${course.itemIds('fixture-workshop')[1]}`);
});

test('Continue opens the same block the map marks as next up', async ({ page, course }) => {
  await signInAndOnboard(page);
  await finishRealCourse(page, course);
  await seedProgress(page, [
    ...course.doneEntries('fixture-lesson'),
    ...course.doneEntries('fixture-workshop'),
    ...course.doneEntries('fixture-lab'),
  ]);
  await page.goto('/');
  const quiz = course.summary('fixture-quiz');
  await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText(quiz.title);
  await hero(page).getByRole('button', { name: 'Start this quiz' }).click();
  await expect(page).toHaveURL(`/learn/fixture-quiz/${course.itemIds('fixture-quiz')[0]}`);

  await page.goto('/learn');
  await expect(page.locator('.room-link', { hasText: 'Next up' })).toContainText(quiz.roomCode);
});

test('when everything is done the button says "Review it again"', async ({ page, course }) => {
  await signInAndOnboard(page);
  await finishRealCourse(page, course);
  await seedProgress(
    page,
    course.slugsOf('Z').flatMap((slug) => course.doneEntries(slug)),
  );
  await page.goto('/');
  // Everything done: the block finished last is the one to review.
  await expect(hero(page).getByRole('button')).toHaveText('Review it again');
  await expect(hero(page).locator('.door-tag')).toBeVisible();
  await expect(hero(page).locator('.door-next')).toHaveCount(0);
  await hero(page).getByRole('button', { name: 'Review it again' }).click();
  await expect(page).toHaveURL(/\/learn\/fixture-[a-z]+\/[a-z0-9]{8}$/);
});

test('today shows XP against the goal as a segmented bar, with no streak on the page', async ({
  page,
}) => {
  await signInAndOnboard(page, { goal: 30 });
  await seedXp(page, 10, 'step');
  await seedXp(page, 5, 'lesson_perfect');
  await page.goto('/');

  const today = page.locator('.home-today');
  await expect(today).toContainText('15 of 30 XP today');
  const bar = today.getByRole('progressbar', { name: 'XP today' });
  await expect(bar).toHaveAttribute('aria-valuenow', '15');
  await expect(bar).toHaveAttribute('aria-valuemax', '30');
  await expect(bar.locator('.segment')).toHaveCount(3);
  // One and a half segments filled: the second is half full.
  const fills = await bar
    .locator('.segment-fill')
    .evaluateAll((els) =>
      els.map((el) =>
        Math.round(
          (el.getBoundingClientRect().width / el.parentElement!.getBoundingClientRect().width) *
            100,
        ),
      ),
    );
  expect(fills).toEqual([100, 50, 0]);

  // The streak is in the top bar, and only there.
  await expect(topbar(page).getByText('1-day streak')).toBeVisible();
  await expect(page.locator('main').getByText(/streak/i)).toHaveCount(0);
});

test('this week is a ranked list, and says so when nobody has XP yet', async ({ page }) => {
  await signInAndOnboard(page, { name: 'Ada Okafor' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2, name: 'This week' })).toBeVisible();
  await expect(page.getByText('No XP yet this week. Continue your course to start.')).toBeVisible();
  await expect(page.locator('.board')).toHaveCount(0);

  await seedXp(page, 30, 'quiz');
  await page.goto('/');
  await expect(page.getByText('No XP yet this week.')).toHaveCount(0);
  const rows = page.locator('.home-week .board-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('1');
  await expect(rows.first()).toContainText('Ada Okafor (you)');
  await expect(rows.first()).toContainText('30 XP');
});

test.describe('375 px phone', () => {
  test('the hero stacks and nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signInAndOnboard(page);
    await expect(hero(page).getByRole('button')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await hero(page).getByRole('button').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });
});
