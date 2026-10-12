import { expect, test } from '@playwright/test';
import { signInAndOnboard } from './helpers';

test('home shows the hero, today and an empty week', async ({ page }) => {
  await signInAndOnboard(page);
  const topbar = page.locator('header.topbar');
  await expect(topbar.getByText('Group 39 Learn')).toBeVisible();
  // The hero names the next block, whatever the course holds; home.spec.ts checks which one.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^(Start this|Continue with step)/ }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
  await expect(page.getByText('No XP yet this week. Continue your course to start.')).toBeVisible();
  await expect(topbar.getByText('No streak yet')).toBeVisible();
  await expect(topbar.getByText('0 of 60 XP today')).toBeVisible();
});

test('nav links work', async ({ page }) => {
  await signInAndOnboard(page);

  await page.getByRole('link', { name: 'Learn' }).click();
  await expect(page).toHaveURL('/learn');
  await expect(page.getByRole('heading', { name: 'Learn' })).toBeVisible();

  await page.getByRole('link', { name: 'Reference' }).click();
  await expect(page).toHaveURL(/\/reference\//);
  await expect(page.getByRole('heading', { name: 'Reference' })).toBeVisible();

  await page.getByRole('link', { name: 'Leaderboard' }).click();
  await expect(page).toHaveURL('/leaderboard');
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
});

test('sign in with email and password, then land on home', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter your email to sign in.');

  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('anything');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // A new person has no display name yet, so they land on onboarding (see auth.spec.ts).
  await expect(page).toHaveURL('/onboarding');
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('top bar shortens its chips', async ({ page }) => {
    await signInAndOnboard(page);
    const topbar = page.locator('header.topbar');
    await expect(topbar.getByText('No streak', { exact: true })).toBeVisible();
    await expect(topbar.getByText('0/60 XP')).toBeVisible();
    await expect(topbar.getByText('No streak yet')).toBeHidden();
  });

  for (const path of ['/', '/learn', '/reference/glossary', '/leaderboard', '/signin']) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      // Every page except /signin needs someone signed in.
      if (path !== '/signin') await signInAndOnboard(page);
      await page.goto(path);
      await expect(page.locator('header.topbar')).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});
