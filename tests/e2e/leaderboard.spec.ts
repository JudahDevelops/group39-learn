import { expect, seedXp, test } from './course-helpers';
import { signInAndOnboard } from './helpers';

test('the page has "This week" and "All time" tabs, and starts on this week', async ({ page }) => {
  await signInAndOnboard(page);
  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible();
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveText(['This week', 'All time']);
  await expect(page.getByRole('tab', { name: 'This week' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tab', { name: 'All time' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
});

test('with no XP each tab invites the learner to start', async ({ page }) => {
  await signInAndOnboard(page);
  await page.goto('/leaderboard');
  await expect(page.getByText('No XP yet this week. Continue your course to start.')).toBeVisible();
  await page.getByRole('tab', { name: 'All time' }).click();
  await expect(page.getByText('No XP yet. Continue your course to start.')).toBeVisible();
});

test('the ranked list marks the signed-in person with "(you)" and a styled row', async ({
  page,
}) => {
  await signInAndOnboard(page, { name: 'Ada Okafor' });
  await seedXp(page, 30, 'quiz');
  await seedXp(page, 10, 'step');
  await page.goto('/leaderboard');

  const rows = page.locator('.board-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('.board-rank')).toHaveText('1');
  await expect(rows.first().locator('.board-name')).toHaveText('Ada Okafor (you)');
  await expect(rows.first().locator('.board-xp')).toHaveText('40 XP');
  await expect(rows.first()).toHaveClass(/is-you/);

  await page.getByRole('tab', { name: 'All time' }).click();
  await expect(page.getByRole('tab', { name: 'All time' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(rows.first().locator('.board-name')).toHaveText('Ada Okafor (you)');
  await expect(rows.first().locator('.board-xp')).toHaveText('40 XP');
});

test('arrow keys move between the tabs', async ({ page }) => {
  await signInAndOnboard(page);
  await page.goto('/leaderboard');
  await page.getByRole('tab', { name: 'This week' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'All time' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tab', { name: 'All time' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'This week' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('fits the screen, with full-size tabs', async ({ page }) => {
    await signInAndOnboard(page);
    await seedXp(page, 30, 'quiz');
    await page.goto('/leaderboard');
    await expect(page.locator('.board-row')).toHaveCount(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    for (const name of ['This week', 'All time']) {
      const box = await page.getByRole('tab', { name }).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
