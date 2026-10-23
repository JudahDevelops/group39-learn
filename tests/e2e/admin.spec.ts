import type { Locator, Page } from '@playwright/test';
import {
  expect,
  makeAdmin,
  plain,
  seedAttempts,
  seedFeedback,
  seedProgress,
  seedProjectSubmission,
  seedQuizAttempt,
  test,
} from './course-helpers';
import { signInAndOnboard } from './helpers';

const WORKSHOP = 'b1-student-profile';

/** Signs in as Ada on LocalStore, runs `seed`, then makes her an admin and opens /admin the way she would. */
async function openAdmin(page: Page, seed: () => Promise<void> = async () => {}): Promise<void> {
  await signInAndOnboard(page, { name: 'Ada Okafor' });
  await seed();
  await makeAdmin(page);
  // On phones the top bar has no Admin link; the profile page has one instead.
  if ((page.viewportSize()?.width ?? 1280) < 480) {
    await page.getByRole('link', { name: 'Your profile' }).click();
    await page.getByRole('link', { name: 'Open the admin dashboard' }).click();
  } else {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Admin' }).click();
  }
  await expect(page).toHaveURL('/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'Admin' })).toBeVisible();
}

/** The data rows of a table (the header row left out). */
function bodyRows(table: Locator): Locator {
  return table.locator('tbody tr');
}

test.describe('access', () => {
  test('a member gets the not-found page and no Admin link', async ({ page }) => {
    await signInAndOnboard(page);
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Leaderboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Admin' })).toHaveCount(0);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Admin' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Stuck steps' })).toHaveCount(0);
  });

  test('on a phone an admin reaches the dashboard from the profile page, and the top bar keeps two rows', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signInAndOnboard(page);
    const topbar = page.locator('.topbar');
    const memberHeight = (await topbar.boundingBox())!.height;
    await makeAdmin(page);
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Admin' })).toBeHidden();
    expect((await topbar.boundingBox())!.height).toBe(memberHeight);

    await page.getByRole('link', { name: 'Your profile' }).click();
    await page.getByRole('link', { name: 'Open the admin dashboard' }).click();
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Admin' })).toBeVisible();
  });

  test('a member has no admin link on the profile page', async ({ page }) => {
    await signInAndOnboard(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Your profile' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open the admin dashboard' })).toHaveCount(0);
  });

  test('an admin sees the Admin link, and with no activity every list says so', async ({
    page,
  }) => {
    await openAdmin(page);
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Admin' }),
    ).toHaveAttribute('aria-current', 'page');

    await expect(page.getByText('No one is stuck.')).toBeVisible();
    await expect(page.getByText('No quiz attempts yet.')).toBeVisible();
    await expect(page.getByText('No lesson feedback yet.')).toBeVisible();
    // The grid still lists the member, with nothing done.
    const grid = page.getByRole('table', { name: /Share of each module/ });
    await expect(bodyRows(grid)).toHaveCount(1);
    await expect(bodyRows(grid).first().getByRole('rowheader')).toHaveText('Ada Okafor');
    await expect(bodyRows(grid).first()).toContainText('Never');
  });
});

test.describe('progress grid', () => {
  test('shows the share of each module finished, modules in course order, and last active', async ({
    page,
    course,
  }) => {
    const modules = course.modules();
    const [first, second] = [modules[0], modules[1]];
    const b1 = modules.find((m) => m.id === 'B1')!;
    // A0 whole, three blocks of the second module, and in B1 the lessons before the first workshop
    // plus one step of that workshop (which does not finish it).
    const lessons = b1.blocks.slice(
      0,
      b1.blocks.findIndex((b) => b.type === 'workshop'),
    );
    const done = new Set([
      ...first.blocks.map((b) => b.slug),
      ...second.blocks.slice(0, 3).map((b) => b.slug),
      ...lessons.map((b) => b.slug),
    ]);
    const percent = (blocks: { slug: string; optional?: boolean }[]) => {
      const counted = blocks.filter((b) => !b.optional);
      return Math.floor((100 * counted.filter((b) => done.has(b.slug)).length) / counted.length);
    };

    await openAdmin(page, async () => {
      await seedProgress(page, [
        ...[...done].flatMap((slug) => course.doneEntries(slug)),
        ...course.doneEntries(WORKSHOP, 1),
      ]);
    });

    const grid = page.getByRole('table', { name: /Share of each module/ });
    // One column per module of tracks A and B (never the fixtures), after Member and Last active.
    await expect(grid.getByRole('columnheader')).toHaveCount(modules.length + 2);
    await expect(grid.getByRole('columnheader').nth(2)).toContainText(first.id);
    await expect(grid.getByRole('columnheader').nth(2)).toContainText(first.title);
    await expect(grid.getByRole('columnheader', { name: /Z1/ })).toHaveCount(0);
    await expect(grid.getByRole('columnheader')).toContainText([
      'Member',
      'Last active',
      ...modules.map((m) => m.id),
    ]);

    const row = bodyRows(grid).filter({ has: page.getByRole('rowheader', { name: 'Ada Okafor' }) });
    await expect(row).toHaveCount(1);
    for (const m of modules) {
      await expect(row.locator(`td[data-module="${m.id}"]`), m.id).toContainText(
        `${percent(m.blocks)}%`,
      );
    }
    expect(percent(first.blocks)).toBe(100);
    expect(percent(b1.blocks)).toBeGreaterThan(0);
    await expect(row.locator(`td[data-module="${first.id}"]`)).toHaveClass(/is-complete/);
    await expect(row.locator('td[data-module="B1"]')).not.toHaveClass(/is-complete/);

    // Seeded now, so the member was active today.
    await expect(row).toContainText('Today');
  });
});

test.describe('stuck list', () => {
  test('lists a step after five failed checks, with its most common failing test', async ({
    page,
    course,
  }) => {
    const [, stuckStep, fewFails, passedLater] = course.itemIds(WORKSHOP);
    expect(course.testCount(stuckStep)).toBeGreaterThanOrEqual(3);
    // Test 2 (index 1) fails three times, so it is the one shown.
    const fail = (failedTestIndex: number) => ({ passed: false as const, failedTestIndex });
    await openAdmin(page, async () => {
      await seedAttempts(page, stuckStep, [fail(1), fail(2), fail(1), fail(0), fail(1)]);
      await seedAttempts(page, fewFails, [fail(0), fail(0), fail(0), fail(0)]);
      await seedAttempts(page, passedLater, [
        fail(0),
        fail(0),
        fail(0),
        fail(0),
        fail(0),
        { passed: true },
      ]);
    });

    const stuck = page.getByRole('table', { name: /at least 5 failed checks/ });
    await expect(bodyRows(stuck)).toHaveCount(1);
    const row = bodyRows(stuck).first();
    await expect(row.getByRole('rowheader')).toHaveText('Ada Okafor');
    await expect(row).toContainText(course.summary(WORKSHOP).title);
    await expect(row).toContainText('Step 2');
    await expect(row.getByRole('cell').nth(1)).toHaveText('5'); // after the step cell: failed count
    await expect(row).toContainText('Test 2');
    await expect(row).toContainText(plain(course.testMessage(stuckStep, 1)));
    await expect(page.getByText('No one is stuck.')).toHaveCount(0);
  });
});

test.describe('quiz scores', () => {
  test('shows the best score, the number of attempts and whether it was passed', async ({
    page,
    course,
  }) => {
    const passedQuiz = course.summary('a0-orientation-quiz');
    const failedQuiz = course.summary('b1-html-quiz');
    await openAdmin(page, async () => {
      await seedQuizAttempt(page, passedQuiz.id, 9, 15, false);
      await seedQuizAttempt(page, passedQuiz.id, 13, 15, true);
      await seedQuizAttempt(page, failedQuiz.id, 6, 15, false);
    });

    const table = page.getByRole('table', { name: /Best score for each member/ });
    await expect(bodyRows(table)).toHaveCount(2);
    // Course order: the Track A quiz first.
    const first = bodyRows(table).nth(0);
    await expect(first).toContainText('Ada Okafor');
    await expect(first).toContainText(passedQuiz.title);
    await expect(first).toContainText(passedQuiz.roomCode);
    await expect(first).toContainText('13 of 15');
    await expect(first.getByRole('cell').nth(2)).toHaveText('2');
    await expect(first).toContainText('Passed');

    const second = bodyRows(table).nth(1);
    await expect(second).toContainText(failedQuiz.title);
    await expect(second).toContainText('6 of 15');
    await expect(second).toContainText('Not passed');
  });
});

test.describe('lesson feedback', () => {
  test('counts ratings per lesson and lists comments newest first with name and date', async ({
    page,
    course,
  }) => {
    const lesson = course.summary('b1-first-web-page');
    const other = course.summary('b1-forms');
    await openAdmin(page, async () => {
      await seedFeedback(
        page,
        lesson.id,
        'confusing',
        'The doctype line lost me',
        '2026-10-20T10:00:00.000Z',
      );
      await seedFeedback(
        page,
        lesson.id,
        'just_right',
        'Clear, but a bit long',
        '2026-10-22T10:00:00.000Z',
      );
      await seedFeedback(page, other.id, 'too_hard', null, '2026-10-21T10:00:00.000Z');
    });

    const ratings = page.getByRole('table', { name: /each rating was chosen/ });
    await expect(bodyRows(ratings)).toHaveCount(2);
    const row = bodyRows(ratings).filter({ hasText: lesson.title });
    // Too easy, Just right, Too hard, Confusing.
    await expect(row.getByRole('cell')).toHaveText(['0', '1', '0', '1']);
    const hard = bodyRows(ratings).filter({ hasText: other.title });
    await expect(hard.getByRole('cell')).toHaveText(['0', '0', '1', '0']);

    const comments = page.getByRole('list', { name: 'Comments' }).getByRole('listitem');
    await expect(comments).toHaveCount(2); // the row without a comment is not listed
    await expect(comments.nth(0)).toContainText('Clear, but a bit long');
    await expect(comments.nth(0)).toContainText('Ada Okafor');
    await expect(comments.nth(0)).toContainText('22 Oct 2026');
    await expect(comments.nth(0)).toContainText(lesson.title);
    await expect(comments.nth(1)).toContainText('The doctype line lost me');
    await expect(comments.nth(1)).toContainText('20 Oct 2026');
  });
});

test.describe('projects', () => {
  test('shows the repo link, the result and when it was checked', async ({ page, course }) => {
    const project = course.summary('fixture-project');
    await openAdmin(page, async () => {
      await seedProjectSubmission(page, project.id, 'https://github.com/ada-okafor/ihms', false);
    });

    const table = page.getByRole('table', { name: /Repo check for each member/ });
    const row = bodyRows(table).filter({ hasText: project.title });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Failing');
    const link = row.getByRole('link', { name: 'ada-okafor/ihms' });
    await expect(link).toHaveAttribute('href', 'https://github.com/ada-okafor/ihms');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(row.locator('time')).toBeVisible();
  });

  test('a repo address that is not a web address is shown as text, not a link', async ({
    page,
    course,
  }) => {
    const project = course.summary('fixture-project');
    await openAdmin(page, async () => {
      await seedProjectSubmission(page, project.id, 'javascript:alert(1)', true);
    });
    const row = bodyRows(page.getByRole('table', { name: /Repo check for each member/ })).filter({
      hasText: project.title,
    });
    await expect(row).toContainText('Passed');
    await expect(row).toContainText('javascript:alert(1)');
    await expect(row.getByRole('link')).toHaveCount(0);
  });

  test('says "Not submitted" when there is no submission', async ({ page, course }) => {
    const project = course.summary('fixture-project');
    await openAdmin(page);
    const row = bodyRows(page.getByRole('table', { name: /Repo check for each member/ })).filter({
      hasText: project.title,
    });
    await expect(row).toContainText('Not submitted');
  });
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the tables scroll inside their own boxes and the page does not scroll sideways', async ({
    page,
    course,
  }) => {
    const [, stuckStep] = course.itemIds(WORKSHOP);
    await openAdmin(page, async () => {
      await seedProgress(page, course.doneEntries('a0-orientation-quiz'));
      await seedAttempts(
        page,
        stuckStep,
        Array.from({ length: 5 }, () => ({ passed: false as const, failedTestIndex: 1 })),
      );
      await seedQuizAttempt(page, course.summary('a0-orientation-quiz').id, 12, 15, true);
    });
    await expect(page.getByRole('table', { name: /at least 5 failed checks/ })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // The grid has a column for every module, so it is wider than the phone and scrolls in its box.
    const box = page.getByRole('region', { name: 'Progress' });
    const [scrollWidth, clientWidth] = await box.evaluate((el) => [el.scrollWidth, el.clientWidth]);
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    await expect(box).toHaveAttribute('tabindex', '0');
    // The box never grows past the page.
    expect(clientWidth).toBeLessThanOrEqual(375);

    // Every other table is inside a box that fits the page too.
    for (const name of ['Stuck steps', 'Quiz scores']) {
      const region = page.getByRole('region', { name });
      const width = await region.evaluate((el) => el.getBoundingClientRect().width);
      expect(width, name).toBeLessThanOrEqual(375);
    }
  });
});
