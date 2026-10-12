import { expect, test, type Page } from '@playwright/test';
import { signInAndOnboard } from './helpers';

const LAB = '/learn/fixture-lab/i0r4ciea';

const SOLUTION = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Bursary Notice</title>
  </head>
  <body>
    <h1>Bursary Notice</h1>
    <p>Second semester fees are now open.</p>
    <p>Bring your receipt to the bursary.</p>
    <ul>
      <li>Pay at an approved bank.</li>
      <li>Keep the receipt.</li>
      <li>Visit the bursary.</li>
    </ul>
    <button>I have paid</button>
  </body>
</html>`;

const check = (page: Page) => page.getByRole('button', { name: 'Check your code' });
const results = (page: Page) => page.getByRole('region', { name: 'Test results' });

async function replaceAll(page: Page, text: string) {
  await page.getByTestId('code-editor').locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(text);
}

test.beforeEach(async ({ page }) => {
  await signInAndOnboard(page);
});

test('the lab lists the user stories and offers the example project', async ({ page }) => {
  await page.goto(LAB);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Build a Bursary Notice Page' }),
  ).toBeVisible();
  await expect(page.getByText('Lab', { exact: true })).toBeVisible();
  const stories = page.locator('ol.wk-stories > li');
  await expect(stories).toHaveCount(4);
  await expect(stories.first()).toContainText('Your page has one h1 element');
  // No test list until the first check.
  await expect(results(page)).toBeHidden();
  // The whole file is editable: this lab has no region, so nothing is dimmed.
  await expect(page.locator('.cm-line-locked')).toHaveCount(0);

  await page.getByRole('button', { name: 'See the example project' }).click();
  const dialog = page.getByRole('dialog', { name: 'The example project' });
  const frame = dialog.frameLocator('iframe');
  await expect(frame.getByRole('heading', { name: 'Bursary Notice' })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'I have paid' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('every test shows a tick or a cross after a check, and all tick once solved', async ({
  page,
}) => {
  await page.goto(LAB);
  const topbar = page.locator('header.topbar');
  await expect(topbar.getByText('0 of 60 XP today')).toBeVisible();

  // Empty body: only the tests that need no content can pass.
  await check(page).click();
  await expect(results(page)).toBeVisible();
  const items = results(page).getByRole('listitem');
  await expect(items).toHaveCount(7);
  await expect(results(page).getByText(/\d of 7 tests pass/)).toBeVisible();
  await expect(items.filter({ hasText: 'Failing:' }).first()).toBeVisible();
  await expect(items.filter({ hasText: 'Passing:' })).not.toHaveCount(7);
  // Each failing row has a cross and each passing row a tick, as well as a colour.
  await expect(items.first().locator('.wk-test-icon')).toHaveText('✗');
  await expect(items.first().locator('.wk-test-icon')).toHaveCSS('color', 'rgb(184, 50, 42)');
  // A failing lab does not complete or pay.
  await expect(page.getByText('Your code passes.')).toBeHidden();
  await expect(topbar.getByText('0 of 60 XP today')).toBeVisible();

  // One user story at a time: an h1 turns the first two tests green.
  await replaceAll(
    page,
    SOLUTION.replace(/<h1>[^]*?<\/h1>/, '<h1>Notice</h1>').replace(/<p>[^]*?<\/button>/, ''),
  );
  await check(page).click();
  await expect(items.first().locator('.wk-test-icon')).toHaveText('✓');
  await expect(items.first().locator('.wk-test-icon')).toHaveCSS('color', 'rgb(30, 74, 56)');
  await expect(items.filter({ hasText: 'Failing:' }).first()).toBeVisible();

  // Solve it.
  await replaceAll(page, SOLUTION);
  await page.keyboard.press('Control+Enter');
  await expect(items.filter({ hasText: 'Passing:' })).toHaveCount(7);
  await expect(items.filter({ hasText: 'Failing:' })).toHaveCount(0);
  await expect(results(page).getByText('7 of 7 tests pass')).toBeVisible();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.getByText('Lab done')).toBeVisible();
  await expect(topbar.getByText('40 of 60 XP today')).toBeVisible();

  // Continue leaves the lab, and passing again does not pay twice.
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL('/learn');
  await expect(topbar.getByText('40 of 60 XP today')).toBeVisible();
});

test('lab help is hints, WhatsApp and the integrity line', async ({ page }) => {
  await page.goto(LAB);
  await page.getByRole('button', { name: 'Help' }).click();
  const dialog = page.getByRole('dialog', { name: 'Help' });
  await dialog.getByRole('button', { name: 'Show hint 1' }).click();
  await expect(dialog.getByText('Each user story names one element.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Show hint 2' }).click();
  await expect(dialog.getByText('A list needs two kinds of element')).toBeVisible();
  // The fixture lab has two hints.
  await expect(dialog.getByRole('button', { name: /Show hint/ })).toBeHidden();
  await expect(dialog.getByRole('link', { name: 'Ask the group on WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/\?text=/,
  );
  await expect(
    dialog.getByText('AI may explain code to you, but it must not write it.'),
  ).toBeVisible();
});

test('reset lab asks first and restores the starting code', async ({ page }) => {
  await page.goto(LAB);
  await replaceAll(page, '<p>mine</p>');
  await page.getByRole('button', { name: 'Reset lab' }).click();
  await expect(page.getByText('Reset this lab to its starting code?')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset lab' }).click();
  await expect(page.locator('.cm-content')).not.toContainText('mine');
  await expect(page.locator('.cm-content')).toContainText('Bursary Notice');
});
