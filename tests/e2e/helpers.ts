import { expect, type Page } from '@playwright/test';

interface SignInOptions {
  name?: string;
  goal?: 30 | 60 | 100 | 150;
}

/**
 * Signs in on LocalStore (any email and password work) and finishes onboarding, ending on home.
 * Every route except /signin needs this first.
 */
export async function signInAndOnboard(page: Page, options: SignInOptions = {}): Promise<void> {
  const { name = 'Ada Okafor', goal } = options;
  await page.goto('/signin');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('anything');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/onboarding');
  await page.getByLabel('Display name').fill(name);
  if (goal) await page.getByRole('radio', { name: new RegExp(`^${goal} XP a day`) }).check();
  await page.getByRole('button', { name: 'Start learning' }).click();
  await expect(page).toHaveURL('/');
}
