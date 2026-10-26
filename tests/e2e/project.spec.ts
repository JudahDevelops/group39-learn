import type { Page } from '@playwright/test';
import { expect, makeAdmin, seedProjectSubmission, test } from './course-helpers';
import { signInAndOnboard } from './helpers';

/**
 * The project page against a mocked GitHub API: no test here ever reaches the real api.github.com.
 * Every request is answered by `mockGithub`, and `requests` lists what the page asked for.
 */

const OWNER = 'ada-okafor';
const REPO = 'ihms';
const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
const RUN_ID = 4242;
const RUN_URL = `${REPO_URL}/actions/runs/${RUN_ID}`;
const RUNS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/labs.yml/runs?branch=main&status=completed&per_page=1`;
const JOBS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${RUN_ID}/jobs?per_page=100`;

const NO_RUNS =
  'No finished run on main yet. Push a commit, wait for the Actions tab to show a tick or a cross, then check again.';

// The browser only lets a page read these headers when GitHub exposes them, as the real API does.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'x-ratelimit-remaining, x-ratelimit-reset, retry-after',
};

interface Reply {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Fail like a lost connection. */
  abort?: boolean;
}
type Script = (url: URL) => Reply;

const runsBody = () => ({
  total_count: 1,
  workflow_runs: [
    {
      id: RUN_ID,
      html_url: RUN_URL,
      head_sha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
      updated_at: new Date().toISOString(),
    },
  ],
});

const jobId = (i: number) => 9000 + i;
const jobUrl = (i: number) => `${RUN_URL}/job/${jobId(i)}`;
const jobsBody = (jobs: [name: string, conclusion: string][]) => ({
  total_count: jobs.length,
  jobs: jobs.map(([name, conclusion], i) => ({
    id: jobId(i),
    name,
    status: 'completed',
    conclusion,
    html_url: jobUrl(i),
  })),
});

/** A repo whose latest finished run has these jobs. */
function runWith(jobs: [string, string][]): Script {
  return (url) =>
    url.pathname.endsWith('/jobs') ? { body: jobsBody(jobs) } : { body: runsBody() };
}

const PASSING = runWith([
  ['lab-setup', 'success'],
  ['lab-db', 'failure'],
  ['lab-allocation', 'skipped'],
  ['lab-complaints', 'success'],
]);
const FAILING = runWith([
  ['lab-setup', 'failure'],
  ['lab-db', 'failure'],
  ['lab-allocation', 'success'],
]);

async function mockGithub(page: Page, initial: Script) {
  let script = initial;
  const requests: string[] = [];
  await page.route('https://api.github.com/**', async (route) => {
    requests.push(route.request().url());
    const reply = script(new URL(route.request().url()));
    if (reply.abort) {
      await route.abort('internetdisconnected');
      return;
    }
    await route.fulfill({
      status: reply.status ?? 200,
      contentType: 'application/json',
      headers: { ...CORS, ...reply.headers },
      body: JSON.stringify(reply.body ?? {}),
    });
  });
  return {
    requests,
    /** Answer differently from now on. */
    answer(next: Script) {
      script = next;
    },
  };
}

const stored = <T>(page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? 'null') as T, key);

const field = (page: Page) => page.getByLabel('Repository link');
const check = (page: Page) => page.getByRole('button', { name: 'Check my repo' });
const jobs = (page: Page) =>
  page.getByRole('list', { name: 'Jobs in the latest run on main' }).getByRole('listitem');
const job = (page: Page, name: string) => jobs(page).filter({ hasText: name });
const topbar = (page: Page) => page.locator('header.topbar');

/** Types a repo link and checks it. */
async function checkRepo(page: Page, link = REPO_URL) {
  await field(page).fill(link);
  await check(page).click();
}

test.beforeEach(async ({ page }) => {
  await signInAndOnboard(page);
});

const projectPath = (id: string) => `/learn/fixture-project/${id}`;

test('shows the user stories and instructions, with an empty field the first time', async ({
  page,
  course,
}) => {
  const project = course.summary('fixture-project');
  await page.goto(projectPath(project.id));
  await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible();
  const stories = page.locator('ol.pj-stories > li');
  await expect(stories).toHaveCount(3);
  await expect(stories.first()).toContainText(
    'You have a GitHub repository for your IHMS project.',
  );
  await expect(page.getByText('Create your repository from the group template')).toBeVisible();
  await expect(field(page)).toHaveValue('');
  await expect(check(page)).toBeVisible();
  // Nothing is shown until a check has been made.
  await expect(page.getByRole('region', { name: 'Result of your last check' })).toBeHidden();
  await expect(page.getByText('Project complete')).toBeHidden();
});

test('a green job completes the project and pays 80 XP once', async ({ page, course }) => {
  const project = course.summary('fixture-project');
  const github = await mockGithub(page, PASSING);
  await page.goto(projectPath(project.id));
  await expect(topbar(page).getByText('0 of 60 XP today')).toBeVisible();

  // A pasted link with .git and a slash is accepted, and saved without them.
  await checkRepo(page, `${REPO_URL}.git/`);
  await expect(page.getByText('Your project passes.')).toBeVisible();
  await expect(page.getByText('You earned 80 XP.')).toBeVisible();
  await expect(topbar(page).getByText('80 of 60 XP today')).toBeVisible();
  await expect(page.getByText('Project complete')).toBeVisible();
  // The latest finished run on main, then that run's jobs. Nothing else.
  expect(github.requests).toEqual([RUNS_URL, JOBS_URL]);

  // This project's job first; another project's job is never shown as a failure.
  await expect(jobs(page)).toHaveCount(4);
  await expect(jobs(page).first()).toContainText('lab-setup');
  await expect(job(page, 'lab-setup')).toContainText('This project');
  await expect(job(page, 'lab-setup')).toContainText('Passed');
  await expect(job(page, 'lab-complaints')).toContainText('Passed');
  await expect(job(page, 'lab-db')).toContainText('Not started yet');
  await expect(job(page, 'lab-allocation')).toContainText('Not started yet');
  await expect(page.getByText('Failed')).toHaveCount(0);

  // Saved for the admin dashboard.
  const saved = await stored<
    { projectId: string; repoUrl: string; runUrl: string; passed: boolean; checkedAt: string }[]
  >(page, 'g39.projectSubmissions');
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({
    projectId: project.id,
    repoUrl: REPO_URL,
    runUrl: RUN_URL,
    passed: true,
  });
  const progress = await stored<{ itemId: string }[]>(page, 'g39.progress');
  expect(progress.map((p) => p.itemId)).toContain(project.id);

  // A second check passes again and adds nothing.
  await check(page).click();
  await expect.poll(() => github.requests.length).toBe(4);
  await expect(check(page)).toBeEnabled();
  await expect(page.getByText('Your project passes.')).toBeVisible();
  await expect(page.getByText('You earned 80 XP.')).toBeHidden();
  await expect(topbar(page).getByText('80 of 60 XP today')).toBeVisible();
  const events = await stored<{ itemId: string; reason: string; amount: number }[]>(
    page,
    'g39.xpEvents',
  );
  expect(events.filter((e) => e.reason === 'project')).toEqual([
    expect.objectContaining({ itemId: project.id, amount: 80 }),
  ]);

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL('/learn');
});

test('Enter in the field checks the repo', async ({ page, course }) => {
  await mockGithub(page, PASSING);
  await page.goto(projectPath(course.summary('fixture-project').id));
  await field(page).fill(REPO_URL);
  await field(page).press('Enter');
  await expect(page.getByText('Your project passes.')).toBeVisible();
});

test('a failing job shows the failure and links to the run', async ({ page, course }) => {
  const project = course.summary('fixture-project');
  await mockGithub(page, FAILING);
  await page.goto(projectPath(project.id));
  await checkRepo(page);

  await expect(page.getByText('The lab-setup job failed.')).toBeVisible();
  await expect(page.getByText('Your project passes.')).toBeHidden();
  await expect(page.getByText('Project complete')).toBeHidden();
  await expect(topbar(page).getByText('0 of 60 XP today')).toBeVisible();

  await expect(job(page, 'lab-setup')).toContainText('Failed');
  await expect(job(page, 'lab-setup').getByRole('link')).toHaveAttribute('href', jobUrl(0));
  const runLink = page.getByRole('link', { name: 'View the run on GitHub' });
  await expect(runLink).toHaveAttribute('href', RUN_URL);
  await expect(runLink).toHaveAttribute('target', '_blank');
  await expect(runLink).toHaveAttribute('rel', /noopener/);

  const saved = await stored<{ passed: boolean; runUrl: string }[]>(page, 'g39.projectSubmissions');
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ passed: false, runUrl: RUN_URL });
  expect(await stored(page, 'g39.xpEvents')).toBeNull();
});

test("another lab's failure reads Not started yet, and never Failed", async ({ page, course }) => {
  const project = course.summary('fixture-project');
  // This project's job is green; the later labs are red, skipped, or not in the run at all.
  await mockGithub(
    page,
    runWith([
      ['lab-setup', 'success'],
      ['lab-db', 'failure'],
      ['lab-email', 'cancelled'],
      ['lab-portals', 'timed_out'],
    ]),
  );
  await page.goto(projectPath(project.id));
  await checkRepo(page);

  await expect(page.getByText('Your project passes.')).toBeVisible();
  for (const name of ['lab-db', 'lab-email', 'lab-portals']) {
    await expect(job(page, name)).toContainText('Not started yet');
  }
  await expect(page.getByText(/Failed|Cancelled|Timed out/)).toHaveCount(0);
  await expect(page.locator('.pj-job.is-fail')).toHaveCount(0);
});

test('says when the project job is not in the run', async ({ page, course }) => {
  await mockGithub(page, runWith([['lab-db', 'failure']]));
  await page.goto(projectPath(course.summary('fixture-project').id));
  await checkRepo(page);
  await expect(page.getByText('The latest run has no lab-setup job.')).toBeVisible();
  await expect(job(page, 'lab-setup')).toContainText('Not in this run');
  await expect(job(page, 'lab-db')).toContainText('Not started yet');
  await expect(topbar(page).getByText('0 of 60 XP today')).toBeVisible();
});

test('no finished run yet: says to push a commit and check again', async ({ page, course }) => {
  const github = await mockGithub(page, () => ({ body: { total_count: 0, workflow_runs: [] } }));
  await page.goto(projectPath(course.summary('fixture-project').id));
  await checkRepo(page);
  await expect(page.getByText(NO_RUNS)).toBeVisible();
  // Nothing to list, and the jobs were never asked for.
  await expect(jobs(page)).toHaveCount(0);
  expect(github.requests).toEqual([RUNS_URL]);
  await expect(topbar(page).getByText('0 of 60 XP today')).toBeVisible();
  // It is a real answer about the repo, so the admin sees the repo.
  const saved = await stored<{ repoUrl: string; passed: boolean }[]>(
    page,
    'g39.projectSubmissions',
  );
  expect(saved).toEqual([expect.objectContaining({ repoUrl: REPO_URL, passed: false })]);
});

test('a repo that is not found or is private (404)', async ({ page, course }) => {
  await mockGithub(page, () => ({ status: 404, body: { message: 'Not Found' } }));
  await page.goto(projectPath(course.summary('fixture-project').id));
  await checkRepo(page);
  await expect(page.getByText('GitHub cannot find that repository or its labs workflow.')).toBeVisible();
  await expect(page.getByText(/If the repository is private, make it public/)).toBeVisible();
  await expect(jobs(page)).toHaveCount(0);
});

test('a rate limit says when to try again in Lagos time, and keeps the last real result', async ({
  page,
  course,
}) => {
  const github = await mockGithub(page, FAILING);
  await page.goto(projectPath(course.summary('fixture-project').id));
  await checkRepo(page);
  await expect(page.getByText('The lab-setup job failed.')).toBeVisible();

  // 14:42 UTC is 3:42 pm in Lagos.
  const reset = Date.UTC(2026, 9, 25, 14, 42, 0) / 1000;
  github.answer(() => ({
    status: 403,
    body: { message: 'API rate limit exceeded' },
    headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) },
  }));
  await check(page).click();
  await expect(page.getByText('GitHub is limiting checks from your network.')).toBeVisible();
  await expect(page.getByText('Try again after 3:42 pm, Lagos time.')).toBeVisible();
  // The earlier result is still there, and was not written over.
  await expect(page.getByText('The lab-setup job failed.')).toBeVisible();
  const saved = await stored<{ passed: boolean; runUrl: string }[]>(page, 'g39.projectSubmissions');
  expect(saved).toEqual([expect.objectContaining({ passed: false, runUrl: RUN_URL })]);

  // Once GitHub answers again, the notice goes.
  github.answer(PASSING);
  await check(page).click();
  await expect(page.getByText('Your project passes.')).toBeVisible();
  await expect(page.getByText('GitHub is limiting checks from your network.')).toBeHidden();
});

test('a lost connection says so and saves nothing', async ({ page, course }) => {
  await mockGithub(page, () => ({ abort: true }));
  await page.goto(projectPath(course.summary('fixture-project').id));
  await checkRepo(page);
  await expect(page.getByText('Could not reach GitHub.')).toBeVisible();
  await expect(
    page.getByText('Check your internet connection, then press Check my repo again.'),
  ).toBeVisible();
  expect(await stored(page, 'g39.projectSubmissions')).toBeNull();
  await expect(check(page)).toBeEnabled();
});

test('a GitHub error says its code', async ({ page, course }) => {
  await mockGithub(page, () => ({ status: 502, body: { message: 'Bad Gateway' } }));
  await page.goto(projectPath(course.summary('fixture-project').id));
  await checkRepo(page);
  await expect(page.getByText('GitHub did not answer properly (code 502).')).toBeVisible();
});

test.describe('a link that is not a repository', () => {
  const NOT_A_REPO =
    'That is not a link to a GitHub repository. It looks like https://github.com/your-name/your-repo, with nothing after the repository name.';

  for (const [name, link, message] of [
    ['an empty field', '', 'Paste the link to your repository first.'],
    ['another website', 'https://gitlab.com/ada/ihms', NOT_A_REPO],
    ['an http link', 'http://github.com/ada/ihms', NOT_A_REPO],
    ['a page inside the repository', `${REPO_URL}/tree/main`, NOT_A_REPO],
    ['plain words', 'my repo', NOT_A_REPO],
  ] as const) {
    test(`is refused before any request: ${name}`, async ({ page, course }) => {
      const github = await mockGithub(page, PASSING);
      await page.goto(projectPath(course.summary('fixture-project').id));
      await checkRepo(page, link);
      const alert = page.getByRole('alert');
      await expect(alert).toHaveText(message);
      await expect(field(page)).toHaveAttribute('aria-invalid', 'true');
      expect(github.requests).toEqual([]);
      expect(await stored(page, 'g39.projectSubmissions')).toBeNull();
    });
  }

  test('the message goes once the link is fixed', async ({ page, course }) => {
    await mockGithub(page, PASSING);
    await page.goto(projectPath(course.summary('fixture-project').id));
    await checkRepo(page, 'nonsense');
    await expect(page.getByRole('alert')).toBeVisible();
    await checkRepo(page);
    await expect(page.getByText('Your project passes.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test('the saved result shows when the page opens again, without asking GitHub', async ({
  page,
  course,
}) => {
  const project = course.summary('fixture-project');
  const github = await mockGithub(page, FAILING);
  await page.goto(projectPath(project.id));
  await checkRepo(page);
  await expect(page.getByText('The lab-setup job failed.')).toBeVisible();
  await expect(page.getByText(/^Checked (just now|\d+ minutes? ago)$/)).toBeVisible();
  expect(github.requests).toHaveLength(2);

  await page.reload();
  await expect(field(page)).toHaveValue(REPO_URL);
  await expect(page.getByText('The lab-setup job failed.')).toBeVisible();
  await expect(page.getByText(/^Checked (just now|\d+ minutes? ago)$/)).toBeVisible();
  await expect(page.getByText(`Repository ${OWNER}/${REPO}, commit a1b2c3d`)).toBeVisible();
  await expect(job(page, 'lab-setup')).toContainText('Failed');
  await expect(job(page, 'lab-db')).toContainText('Not started yet');
  await expect(job(page, 'lab-allocation')).toContainText('Passed');
  await expect(page.getByRole('link', { name: 'View the run on GitHub' })).toHaveAttribute(
    'href',
    RUN_URL,
  );
  // Reading it back made no request.
  expect(github.requests).toHaveLength(2);
});

test('a saved pass shows again, with no new XP', async ({ page, course }) => {
  const project = course.summary('fixture-project');
  await mockGithub(page, PASSING);
  await page.goto(projectPath(project.id));
  await checkRepo(page);
  await expect(page.getByText('You earned 80 XP.')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Your project passes.')).toBeVisible();
  await expect(page.getByText('Project complete')).toBeVisible();
  await expect(page.getByText('You earned 80 XP.')).toBeHidden();
  await expect(job(page, 'lab-setup')).toContainText('Passed');
});

test('the field starts with the link from the latest check of any project', async ({
  page,
  course,
}) => {
  await seedProjectSubmission(page, 'zz9abc12', 'https://github.com/ada-okafor/earlier-repo', true);
  await page.goto(projectPath(course.summary('fixture-project').id));
  await expect(field(page)).toHaveValue('https://github.com/ada-okafor/earlier-repo');
  // That check was for another project: nothing is shown as this project's result.
  await expect(page.getByRole('region', { name: 'Result of your last check' })).toBeHidden();
});

test('the admin dashboard reads the check by the project block id', async ({ page, course }) => {
  const project = course.summary('fixture-project');
  await mockGithub(page, PASSING);
  await page.goto(projectPath(project.id));
  await checkRepo(page);
  await expect(page.getByText('Your project passes.')).toBeVisible();

  await makeAdmin(page);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Admin' }).click();
  await expect(page).toHaveURL('/admin');
  const row = page
    .getByRole('table', { name: /Repo check for each member/ })
    .locator('tbody tr')
    .filter({ hasText: project.title });
  await expect(row).toContainText('Passed');
  await expect(row.getByRole('link', { name: `${OWNER}/${REPO}` })).toHaveAttribute(
    'href',
    REPO_URL,
  );
  await expect(row.locator('time')).toBeVisible();
});

test.describe('375 px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the page does not scroll sideways, and controls are at least 44 px tall', async ({
    page,
    course,
  }) => {
    await mockGithub(
      page,
      runWith([
        ['lab-setup', 'failure'],
        ['lab-triage-escalation', 'failure'],
        ['lab-api-tests', 'success'],
      ]),
    );
    await page.goto(projectPath(course.summary('fixture-project').id));
    await checkRepo(
      page,
      'https://github.com/a-very-long-student-name-here/a-very-long-repository-name-ihms',
    );
    await expect(page.getByText('The lab-setup job failed.')).toBeVisible();
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways).toBeLessThanOrEqual(0);
    for (const control of [
      check(page),
      field(page),
      page.getByRole('link', { name: 'View the run on GitHub' }),
    ]) {
      const box = await control.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});
