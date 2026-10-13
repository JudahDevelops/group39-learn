import type { Page } from '@playwright/test';
import { expect, expectDoneLabels, test } from './course-helpers';
import { signInAndOnboard } from './helpers';

async function openReview(page: Page, url: string) {
  await signInAndOnboard(page);
  await page.goto('/learn');
  await page.getByRole('link', { name: /Z1-05/ }).click();
  await expect(page).toHaveURL(url);
}

test('the review shows its text, table and Try it snippet', async ({ page, course }) => {
  const url = `/learn/fixture-review/${course.itemIds('fixture-review')[0]}`;
  await openReview(page, url);
  await expect(page.getByRole('heading', { level: 1, name: 'HTML Basics Review' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'HTML basics', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'The main heading' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Remember', exact: true })).toBeVisible();
  await expect(page.getByText('Visible content goes inside body.')).toBeVisible();
  await expect(page.locator('.tryit')).toHaveCount(1);
});

test('"Mark as read" completes the review with no XP, and the map shows its door done', async ({
  page,
  course,
}) => {
  const url = `/learn/fixture-review/${course.itemIds('fixture-review')[0]}`;
  await openReview(page, url);
  await page.getByRole('button', { name: 'Mark as read' }).click();
  await expect(page).toHaveURL('/learn');

  const door = page.getByRole('link', { name: /Z1-05/ });
  await expect(door).toHaveAccessibleName(/Done/);
  await expect(door.locator('.door-tag')).toBeVisible();

  const stored = await page.evaluate(() => ({
    progress: JSON.parse(window.localStorage.getItem('g39.progress') ?? '[]'),
    xp: JSON.parse(window.localStorage.getItem('g39.xpEvents') ?? '[]'),
  }));
  const id = course.itemIds('fixture-review')[0];
  expect(
    stored.progress.map((p: { itemId: string; blockId: string }) => [p.itemId, p.blockId]),
  ).toEqual([[id, id]]);
  expect(stored.xp).toEqual([]);
  await expect(page.locator('header.topbar').getByText('0 of 60 XP today')).toBeVisible();
});

test('a review already read says so, and offers no second "Mark as read"', async ({
  page,
  course,
}) => {
  const url = `/learn/fixture-review/${course.itemIds('fixture-review')[0]}`;
  await openReview(page, url);
  await page.getByRole('button', { name: 'Mark as read' }).click();
  await expect(page).toHaveURL('/learn');
  await page.goto(url);
  await expect(page.getByText('You marked this as read.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark as read' })).toHaveCount(0);
});

test('leaving without marking it leaves the door as it was', async ({ page, course }) => {
  const url = `/learn/fixture-review/${course.itemIds('fixture-review')[0]}`;
  await openReview(page, url);
  await page.getByRole('button', { name: 'Back to the map' }).click();
  await expect(page).toHaveURL('/learn');
  await expect(page.getByRole('link', { name: /Z1-05/ })).not.toHaveAccessibleName(/Done/);
  await expectDoneLabels(page, course);
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the review fits the screen and the button is a full touch target', async ({
    page,
    course,
  }) => {
    await openReview(page, `/learn/fixture-review/${course.itemIds('fixture-review')[0]}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await page.getByRole('button', { name: 'Mark as read' }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
