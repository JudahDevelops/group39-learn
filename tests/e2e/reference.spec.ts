import { expect, test, type APIRequestContext } from '@playwright/test';
import { signInAndOnboard } from './helpers';

const PAGES = [
  { slug: 'glossary', title: 'Glossary' },
  { slug: 'decisions', title: 'Group decisions' },
  { slug: 'dos-donts', title: "Do's and Don'ts" },
  { slug: 'schema', title: 'Database schema' },
];

/** The rows of the built glossary table, so a dropped row fails the test. */
async function glossaryRows(request: APIRequestContext): Promise<number> {
  const response = await request.get('/content/reference/glossary.json');
  const { html } = (await response.json()) as { html: string };
  return (html.match(/<tr>/g) ?? []).length - 1; // minus the header row
}

test.beforeEach(async ({ page }) => {
  await signInAndOnboard(page);
});

test('/reference lists the four pages', async ({ page }) => {
  await page.goto('/reference');
  await expect(page.getByRole('heading', { level: 1, name: 'Reference' })).toBeVisible();
  const links = page.locator('.ref-list a');
  await expect(links).toHaveText(PAGES.map((p) => p.title));
  for (const p of PAGES) {
    await expect(page.getByRole('link', { name: p.title })).toHaveAttribute(
      'href',
      `/reference/${p.slug}`,
    );
  }
  await page.getByRole('link', { name: 'Database schema' }).click();
  await expect(page).toHaveURL('/reference/schema');
});

test('the glossary renders every term', async ({ page, request }) => {
  const expected = await glossaryRows(request);
  await page.goto('/reference/glossary');
  await expect(page.getByRole('heading', { level: 1, name: 'Reference' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Glossary' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Term' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Meaning' })).toBeVisible();

  const rows = page.locator('.ref-body tbody tr');
  await expect(rows).toHaveCount(expected);
  expect(expected).toBeGreaterThanOrEqual(40);

  const endpoint = rows.filter({ has: page.getByRole('cell', { name: 'Endpoint', exact: true }) });
  await expect(endpoint).toContainText('One address on the server, such as /api/complaints');
  await expect(rows.first()).toContainText('Abstract');
  await expect(rows.last()).toContainText('Virtual environment');
  // No raw markdown left behind.
  await expect(page.locator('.ref-body')).not.toContainText('|---');
});

test('the page links move between the pages and mark the current one', async ({ page }) => {
  await page.goto('/reference/glossary');
  const nav = page.getByRole('navigation', { name: 'Reference pages' });
  await expect(nav.getByRole('link')).toHaveText(PAGES.map((p) => p.title));
  await expect(nav.getByRole('link', { name: 'Glossary' })).toHaveAttribute('aria-current', 'page');

  await nav.getByRole('link', { name: 'Group decisions' }).click();
  await expect(page).toHaveURL('/reference/decisions');
  await expect(nav.getByRole('link', { name: 'Group decisions' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { level: 2, name: 'Group decisions' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '★ module' })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Complaint Triage and Escalation Engine' }),
  ).toBeVisible();
  // The open decisions are part of the page, under the title.
  await expect(page.getByRole('heading', { level: 3, name: 'Open decisions' })).toBeVisible();
  await expect(page.getByText('Who presents which slides')).toBeVisible();
  await expect(
    page.getByText('urgency when no keyword matches (placeholder: normal);'),
  ).toBeVisible();
  await expect(page.locator('.ref-body ol > li')).toHaveCount(3);
});

test("do's and don'ts and the schema render", async ({ page }) => {
  await page.goto('/reference/dos-donts');
  await expect(page.getByRole('heading', { level: 2, name: "Do's and Don'ts" })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: "Don't" })).toBeVisible();
  await expect(page.locator('.ref-body tbody tr')).toHaveCount(5);
  await expect(
    page.getByText('Zero tolerance: plagiarism or unverified AI fabrications'),
  ).toBeVisible();

  await page.goto('/reference/schema');
  await expect(page.getByRole('heading', { level: 2, name: 'Database schema' })).toBeVisible();
  const code = page.locator('.ref-body pre');
  await expect(code).toHaveCount(2); // the schema and the sample data
  await expect(code.first()).toContainText('CREATE TABLE complaints');
  await expect(code.first()).toContainText('CREATE UNIQUE INDEX one_active_allocation_per_bed');
  await expect(code.last()).toContainText(
    "INSERT INTO hostels (name, gender, level) VALUES ('Block A'",
  );
  await expect(page.getByText('Sample data for Lesson 13.3')).toBeVisible();
});

test('an unknown page says so and keeps the list', async ({ page }) => {
  await page.goto('/reference/no-such-page');
  await expect(page.getByText('There is no reference page called')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Reference pages' })).toBeVisible();
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const { slug } of PAGES) {
    test(`/reference/${slug} fits the screen`, async ({ page }) => {
      await page.goto(`/reference/${slug}`);
      await expect(page.locator('.ref-body')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
