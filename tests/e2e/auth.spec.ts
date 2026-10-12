import { expect, test, type Page } from '@playwright/test';
import { signInAndOnboard } from './helpers';

/** These run against LocalStore, where any email and any non-empty password sign you in. */

const topbar = (page: Page) => page.locator('header.topbar');

test.describe('signed out', () => {
  for (const path of [
    '/',
    '/learn',
    '/learn/b1-complaint-form/step-4',
    '/reference/glossary',
    '/leaderboard',
    '/admin',
    '/onboarding',
    '/profile',
    '/no-such-page',
  ]) {
    test(`${path} redirects to /signin`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL('/signin');
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      // No nav and no XP chips for someone who is not signed in.
      await expect(topbar(page).getByRole('link', { name: 'Learn' })).toHaveCount(0);
      await expect(topbar(page).getByRole('button', { name: 'Sign out' })).toHaveCount(0);
    });
  }

  test('/set-password without a session says the link has expired', async ({ page }) => {
    await page.goto('/set-password');
    await expect(page).toHaveURL('/set-password');
    await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
    await page.getByRole('link', { name: 'sign in' }).click();
    await expect(page).toHaveURL('/signin');
  });
});

test('sign in, onboarding, then home shows the chosen display name', async ({ page }) => {
  await page.goto('/signin');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('anything');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // A new person has no display name, so onboarding comes first.
  await expect(page).toHaveURL('/onboarding');
  await expect(page.getByRole('heading', { name: 'Set up your profile' })).toBeVisible();
  await expect(topbar(page).getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(topbar(page).getByRole('link', { name: 'Learn' })).toHaveCount(0);
  // 60 XP is chosen to start with, and every goal says how long it takes.
  await expect(page.getByRole('radio', { name: /^60 XP a day/ })).toBeChecked();
  for (const [xp, minutes] of [
    [30, 15],
    [60, 30],
    [100, 50],
    [150, 75],
  ]) {
    await expect(
      page.getByRole('radio', { name: `${xp} XP a day About ${minutes} minutes` }),
    ).toBeVisible();
  }
  await expect(page.getByText('We use it to check your projects on GitHub.')).toBeVisible();

  // Display name is required.
  await page.getByRole('button', { name: 'Start learning' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Enter a display name. The group sees it on the leaderboard.',
  );
  await expect(page).toHaveURL('/onboarding');

  // GitHub username is optional but must be valid when given.
  await page.getByLabel('Display name').fill('Ada Okafor');
  await page.getByLabel('GitHub username').fill('not a username!');
  await page.getByRole('button', { name: 'Start learning' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'A GitHub username has letters, numbers and hyphens only',
  );

  await page.getByRole('radio', { name: /^100 XP a day/ }).check();
  await page.getByLabel('GitHub username').fill('https://github.com/ada-o');
  await page.getByRole('button', { name: 'Start learning' }).click();

  await expect(page).toHaveURL('/');
  await expect(topbar(page).getByText('Ada Okafor')).toBeVisible();
  await expect(topbar(page).getByText('0 of 100 XP today')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const saved = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('g39.profile') ?? 'null'),
  );
  expect(saved).toMatchObject({
    displayName: 'Ada Okafor',
    dailyGoalXp: 100,
    githubUsername: 'ada-o',
  });

  // The choice sticks across a reload, and onboarding is not offered again.
  await page.reload();
  await expect(page).toHaveURL('/');
  await expect(topbar(page).getByText('Ada Okafor')).toBeVisible();
  await page.goto('/onboarding');
  await expect(page).toHaveURL('/');
});

test('a blank GitHub username is fine', async ({ page }) => {
  await signInAndOnboard(page, { name: 'Bayo' });
  const saved = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('g39.profile') ?? 'null'),
  );
  expect(saved).toMatchObject({ displayName: 'Bayo', dailyGoalXp: 60, githubUsername: null });
});

test('sign out returns to /signin, and the pages are closed again', async ({ page }) => {
  await signInAndOnboard(page, { name: 'Ada Okafor' });
  await topbar(page).getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/signin');
  await expect(topbar(page).getByRole('button', { name: 'Sign out' })).toHaveCount(0);

  await page.goto('/learn');
  await expect(page).toHaveURL('/signin');

  // Signing back in finds the same profile: no onboarding the second time. The person lands on
  // the page they tried to open.
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('anything');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/learn');
  await expect(topbar(page).getByText('Ada Okafor')).toBeVisible();
});

test('after sign-in you land where you were headed', async ({ page }) => {
  await signInAndOnboard(page, { name: 'Ada Okafor' });
  await topbar(page).getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/signin');

  await page.goto('/leaderboard');
  await expect(page).toHaveURL('/signin');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('anything');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/leaderboard');
});

test.describe('profile page', () => {
  test('is in the top bar, starts with what you chose, and saves changes', async ({ page }) => {
    await signInAndOnboard(page, { name: 'Ada Okafor', goal: 100 });
    await topbar(page).getByRole('link', { name: 'Your profile' }).click();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();

    // The form starts with the saved values.
    await expect(page.getByLabel('Display name')).toHaveValue('Ada Okafor');
    await expect(page.getByRole('radio', { name: /^100 XP a day/ })).toBeChecked();
    await expect(page.getByLabel('GitHub username')).toHaveValue('');

    await page.getByLabel('Display name').fill('Ada O.');
    await page.getByRole('radio', { name: /^150 XP a day/ }).check();
    await page.getByLabel('GitHub username').fill('@ada-o');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('status')).toHaveText('Saved. Your changes are in the top bar.');
    await expect(topbar(page).getByText('Ada O.')).toBeVisible();
    await expect(topbar(page).getByText('0 of 150 XP today')).toBeVisible();
    const saved = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('g39.profile') ?? 'null'),
    );
    expect(saved).toMatchObject({
      displayName: 'Ada O.',
      dailyGoalXp: 150,
      githubUsername: 'ada-o',
    });

    // The message describes what was saved, so editing again removes it.
    await page.getByLabel('Display name').fill('Ada Okafor');
    await expect(page.getByRole('status')).toHaveCount(0);

    // Saved changes survive a reload and fill the form again.
    await page.reload();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByLabel('Display name')).toHaveValue('Ada O.');
    await expect(page.getByRole('radio', { name: /^150 XP a day/ })).toBeChecked();
    await expect(page.getByLabel('GitHub username')).toHaveValue('ada-o');
  });

  test('a GitHub username can be changed or removed later', async ({ page }) => {
    await signInAndOnboard(page, { name: 'Ada Okafor' });
    await page.goto('/profile');
    await page.getByLabel('GitHub username').fill('https://github.com/ada-o');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toBeVisible();

    await page.getByLabel('GitHub username').fill('');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    const saved = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('g39.profile') ?? 'null'),
    );
    expect(saved).toMatchObject({ githubUsername: null });
  });

  test('refuses a blank name or a bad GitHub username and keeps what was saved', async ({
    page,
  }) => {
    await signInAndOnboard(page, { name: 'Ada Okafor' });
    await page.goto('/profile');

    await page.getByLabel('Display name').fill('   ');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Enter a display name. The group sees it on the leaderboard.',
    );

    await page.getByLabel('Display name').fill('Ada O.');
    await page.getByLabel('GitHub username').fill('-nope-');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('alert')).toContainText(
      'A GitHub username has letters, numbers and hyphens only',
    );

    await expect(topbar(page).getByText('Ada Okafor')).toBeVisible();
    const saved = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('g39.profile') ?? 'null'),
    );
    expect(saved).toMatchObject({ displayName: 'Ada Okafor', githubUsername: null });
  });

  test('is not open until onboarding is done', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Password').fill('anything');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/onboarding');
    await page.goto('/profile');
    await expect(page).toHaveURL('/onboarding');
    await expect(topbar(page).getByRole('link', { name: 'Your profile' })).toHaveCount(0);
  });
});

test.describe('set password', () => {
  test('checks the two boxes, then continues to onboarding or home', async ({ page }) => {
    await signInAndOnboard(page, { name: 'Ada Okafor' });
    await page.goto('/set-password');
    await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();

    await page.getByLabel('New password').fill('short');
    await page.getByLabel('Type it again').fill('short');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(page.getByRole('alert')).toHaveText('Use at least 8 characters.');

    await page.getByLabel('New password').fill('a-good-password');
    await page.getByLabel('Type it again').fill('another-password');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      "The two passwords don't match. Type the same password in both boxes.",
    );

    await page.getByLabel('Show password').check();
    await expect(page.getByLabel('New password')).toHaveAttribute('type', 'text');
    await page.getByLabel('Type it again').fill('a-good-password');
    await page.getByRole('button', { name: 'Save password' }).click();
    // Already has a display name, so onboarding passes straight through to home.
    await expect(page).toHaveURL('/');
  });

  test('an invite link sends a signed-in person to set a password first', async ({ page }) => {
    await signInAndOnboard(page, { name: 'Ada Okafor' });
    // What Supabase appends to the site URL on an invite link. LocalStore ignores the tokens;
    // the app only needs to notice the link type before anything clears the hash. A different
    // path first, so this is a full page load and not a same-page hash change.
    await page.goto('/learn');
    await page.goto('/#access_token=fake&refresh_token=fake&type=invite');
    await expect(page).toHaveURL('/set-password');
    await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();

    // Other pages stay behind it until a password is saved.
    await page.goto('/learn');
    await expect(page).toHaveURL('/set-password');

    await page.getByLabel('New password').fill('a-good-password');
    await page.getByLabel('Type it again').fill('a-good-password');
    await page.getByRole('button', { name: 'Save password' }).click();
    await expect(page).toHaveURL('/');
    await page.goto('/learn');
    await expect(page).toHaveURL('/learn');
  });
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('onboarding and the top bar fit without sideways scrolling', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Password').fill('anything');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/onboarding');
    await expectNoSidewaysScroll(page);

    await page.getByLabel('Display name').fill('Ada Okafor');
    await page.getByRole('button', { name: 'Start learning' }).click();
    await expect(page).toHaveURL('/');
    await expectNoSidewaysScroll(page);

    // Sign out stays reachable, and sits inside the screen.
    const signOut = topbar(page).getByRole('button', { name: 'Sign out' });
    await expect(signOut).toBeVisible();
    const box = await signOut.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // The profile link is a round initial here, beside the chips, and also a full touch target.
    const profile = topbar(page).getByRole('link', { name: 'Your profile' });
    await expect(profile).toBeVisible();
    await expect(profile.locator('.topbar-initial')).toHaveText('A');
    await expect(profile.locator('.topbar-name')).toBeHidden();
    const circle = await profile.boundingBox();
    expect(circle).not.toBeNull();
    expect(circle!.x).toBeGreaterThanOrEqual(0);
    expect(circle!.x + circle!.width).toBeLessThanOrEqual(375);
    expect(circle!.width).toBeGreaterThanOrEqual(44);
    expect(circle!.height).toBeGreaterThanOrEqual(44);
    // Row one holds brand, chips and the circle; row two holds the nav and sign-out.
    expect((await topbar(page).boundingBox())!.height).toBeLessThan(100);
    await profile.click();
    await expect(page).toHaveURL('/profile');
    await expectNoSidewaysScroll(page);

    await signOut.click();
    await expect(page).toHaveURL('/signin');
  });

  test('set-password fits too', async ({ page }) => {
    await signInAndOnboard(page);
    await page.goto('/set-password');
    await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();
    await expectNoSidewaysScroll(page);
  });
});

async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}
