import type { Page } from '@playwright/test';
import { expect, expectDoneLabels, seedProgress, test, type BuiltCourse } from './course-helpers';
import { signInAndOnboard } from './helpers';

const FIXTURES = [
  'fixture-lesson',
  'fixture-workshop',
  'fixture-lab',
  'fixture-quiz',
  'fixture-review',
  'fixture-project',
];

/** The door for a room code, as a link: its name holds the code, title, size and status. */
const door = (page: Page, roomCode: string) =>
  page.getByRole('link', { name: new RegExp(roomCode) });

/**
 * The row of doors that holds a block, found through the block's room code in the built course. Other
 * chapters (B1, Z2) have rows of their own, so the first row on the page is not necessarily this one.
 */
const corridorOf = (page: Page, course: BuiltCourse, slug: string) =>
  page.locator('.corridor', { has: door(page, course.summary(slug).roomCode) });

async function openMap(page: Page) {
  await signInAndOnboard(page);
  await page.goto('/learn');
  await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeVisible();
}

test('fixture doors show room codes Z1-01 to Z1-06, titles and a plain size line', async ({
  page,
  course,
}) => {
  await openMap(page);
  await expect(page.getByRole('heading', { name: 'Track Z: Fixtures' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Chapter Z1: One of each block type' }),
  ).toBeVisible();

  const expectedMeta: Record<string, string> = {
    lesson: 'screen',
    workshop: 'step',
    lab: 'user stor',
    quiz: 'question',
    review: 'min read',
    project: 'user stor',
  };
  for (const [i, slug] of FIXTURES.entries()) {
    const block = course.summary(slug);
    const code = `Z1-0${i + 1}`;
    expect(block.roomCode).toBe(code);
    await expect(page.locator('.door-plate', { hasText: code })).toBeVisible();
    const link = door(page, code);
    await expect(link).toContainText(block.title);
    const meta = link.locator('.room-meta').first();
    const label = block.type[0].toUpperCase() + block.type.slice(1);
    await expect(meta).toHaveText(new RegExp(`^${label}, .*${expectedMeta[block.type]}`));
  }
  // The sizes come from the build, not from the page.
  await expect(door(page, 'Z1-02').locator('.room-meta').first()).toHaveText(
    `Workshop, ${course.summary('fixture-workshop').itemCount} steps`,
  );
  await expect(door(page, 'Z1-04').locator('.room-meta').first()).toHaveText(
    `Quiz, ${course.summary('fixture-quiz').itemCount} questions`,
  );
});

test('counts "n of m done" per chapter and per track', async ({ page, course }) => {
  await openMap(page);
  await expectDoneLabels(page, course); // every track and chapter, counted from the built course
  await seedProgress(page, course.doneEntries('fixture-lesson'));
  await page.goto('/learn');
  await expectDoneLabels(page, course, ['fixture-lesson']);
});

test('the first block not done is next up; nothing is locked or greyed', async ({
  page,
  course,
}) => {
  await openMap(page);
  const nextUp = course.order().find((b) => !b.optional)!;
  const links = page.locator('.room-link');
  await expect(links.filter({ hasText: 'Next up' })).toHaveCount(1);
  await expect(links.filter({ hasText: 'Next up' })).toContainText(nextUp.roomCode);

  const nextDoor = page.locator('.door-next');
  await expect(nextDoor).toHaveCount(1);
  expect(
    await nextDoor.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.outlineWidth, style.outlineStyle, style.backgroundColor];
    }),
  ).toEqual(['3px', 'solid', 'rgb(43, 106, 80)']); // 3 px brass outline on --door-hi

  // Every door is a plain link at full strength.
  const count = await links.count();
  expect(count).toBeGreaterThanOrEqual(FIXTURES.length);
  for (let i = 0; i < count; i++) {
    await expect(links.nth(i)).toHaveAttribute('href', /^\/learn\/[a-z0-9-]+\/[a-z0-9]{8}$/);
    await expect(links.nth(i)).not.toHaveAttribute('aria-disabled', /.*/);
    expect(await links.nth(i).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  }

  // Finishing the next-up block moves the mark to the block after it.
  await seedProgress(page, course.doneEntries(nextUp.slug));
  await page.goto('/learn');
  await expect(links.filter({ hasText: 'Next up' })).toHaveCount(1);
  await expect(links.filter({ hasText: 'Next up' })).not.toContainText(nextUp.roomCode);
});

test('a door opens the block: the block id, or the first incomplete step of a workshop', async ({
  page,
  course,
}) => {
  await openMap(page);
  for (const [i, slug] of FIXTURES.entries()) {
    await expect(door(page, `Z1-0${i + 1}`)).toHaveAttribute(
      'href',
      `/learn/${slug}/${course.itemIds(slug)[0]}`,
    );
  }

  const steps = course.itemIds('fixture-workshop');
  await seedProgress(page, course.doneEntries('fixture-workshop', 2));
  await page.goto('/learn');
  await expect(door(page, 'Z1-02')).toHaveAttribute('href', `/learn/fixture-workshop/${steps[2]}`);
  // Two of three steps is not done: no key tag.
  await expect(door(page, 'Z1-02').locator('.door-tag')).toHaveCount(0);

  await door(page, 'Z1-02').click();
  await expect(page).toHaveURL(`/learn/fixture-workshop/${steps[2]}`);
});

test('a workshop is done when every step is, and then its door shows a key tag', async ({
  page,
  course,
}) => {
  await openMap(page);
  await seedProgress(page, course.doneEntries('fixture-workshop'));
  await page.goto('/learn');
  const link = door(page, 'Z1-02');
  await expect(link).toHaveAccessibleName(/Done/);
  await expect(link.locator('.door-tag')).toBeVisible();
  await expect(link.locator('.door-tag')).toHaveText('✓');
  await expectDoneLabels(page, course, ['fixture-workshop']);
  // A finished workshop reopens from its first step.
  await expect(link).toHaveAttribute(
    'href',
    `/learn/fixture-workshop/${course.itemIds('fixture-workshop')[0]}`,
  );
});

test('marking the review as read makes its door done, and the key tag drops once', async ({
  page,
  course,
}) => {
  await openMap(page);
  await expect(door(page, 'Z1-05').locator('.door-tag')).toHaveCount(0);
  await door(page, 'Z1-05').click();
  await expect(page).toHaveURL(`/learn/fixture-review/${course.itemIds('fixture-review')[0]}`);
  await page.getByRole('button', { name: 'Mark as read' }).click();

  await expect(page).toHaveURL('/learn');
  const link = door(page, 'Z1-05');
  await expect(link).toHaveAccessibleName(/Done/);
  await expect(link.locator('.door-tag')).toBeVisible();
  await expectDoneLabels(page, course, ['fixture-review']);
  // It became done since the last visit, so it celebrates...
  await expect(link.locator('.door-tag-drop')).toHaveCount(1);
  expect(
    await link.locator('.door-tag').evaluate((el) => getComputedStyle(el).animationDuration),
  ).toBe('0.6s');

  // ...once. Coming back later it simply hangs there.
  await page.goto('/learn');
  await expect(door(page, 'Z1-05').locator('.door-tag')).toBeVisible();
  await expect(page.locator('.door-tag-drop')).toHaveCount(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the key tag appears without the drop', async ({ page }) => {
    await openMap(page);
    await door(page, 'Z1-05').click();
    await page.getByRole('button', { name: 'Mark as read' }).click();
    await expect(page).toHaveURL('/learn');
    await expect(door(page, 'Z1-05').locator('.door-tag')).toBeVisible();
    await expect(page.locator('.door-tag-drop')).toHaveCount(0);
    expect(
      await page.locator('.door-tag').evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
  });
});

test.describe('laptop', () => {
  test.use({ viewport: { width: 700, height: 900 } });

  test('rows wrap instead of scrolling', async ({ page, course }) => {
    await openMap(page);
    const first = await door(page, 'Z1-01').boundingBox();
    const last = await door(page, 'Z1-06').boundingBox();
    expect(last!.y).toBeGreaterThan(first!.y + first!.height / 2);
    const corridor = corridorOf(page, course, 'fixture-project');
    expect(await corridor.evaluate((el) => getComputedStyle(el).flexWrap)).toBe('wrap');
    expect(await corridor.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the row of doors scrolls sideways and snaps; the page does not', async ({
    page,
    course,
  }) => {
    await openMap(page);
    // Chapter Z1: its last door (Z1-06, the project) sits beyond the right edge of a phone.
    const corridor = corridorOf(page, course, 'fixture-project');
    const style = await corridor.evaluate((el) => {
      const s = getComputedStyle(el);
      return { snap: s.scrollSnapType, overflowX: s.overflowX, wrap: s.flexWrap };
    });
    expect(style.overflowX).toBe('auto');
    expect(style.wrap).toBe('nowrap');
    expect(style.snap).toContain('x');
    expect(await corridor.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

    const page0 = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(page0.scrollWidth).toBeLessThanOrEqual(page0.clientWidth);

    // The last door is reachable by scrolling the row.
    await door(page, 'Z1-06').scrollIntoViewIfNeeded();
    await expect(door(page, 'Z1-06')).toBeInViewport();
    expect(await corridor.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);

    // And it opens.
    await door(page, 'Z1-06').click();
    await expect(page).toHaveURL(`/learn/fixture-project/${course.itemIds('fixture-project')[0]}`);
  });
});
