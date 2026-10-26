import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkRepo,
  parseRepoUrl,
  type CheckOutcome,
  type FetchFn,
  type RepoRef,
} from '../../src/lib/github';

describe('parseRepoUrl', () => {
  const ok = (raw: string) => {
    const parsed = parseRepoUrl(raw);
    if (!parsed.ok) throw new Error(`expected ${raw} to be accepted`);
    return parsed.repo;
  };

  it('accepts the plain address', () => {
    expect(ok('https://github.com/ada-okafor/ihms')).toEqual({
      owner: 'ada-okafor',
      repo: 'ihms',
      url: 'https://github.com/ada-okafor/ihms',
    });
  });

  it.each([
    ['a .git ending', 'https://github.com/ada/ihms.git'],
    ['a trailing slash', 'https://github.com/ada/ihms/'],
    ['both', 'https://github.com/ada/ihms.git/'],
    ['spaces around a pasted link', '  https://github.com/ada/ihms\n'],
  ])('accepts %s and saves the plain address', (_name, raw) => {
    expect(ok(raw).url).toBe('https://github.com/ada/ihms');
  });

  it('keeps dots, hyphens and underscores in the repository name', () => {
    expect(ok('https://github.com/ada/group-39_ihms.v2').repo).toBe('group-39_ihms.v2');
  });

  it('says an empty field is empty', () => {
    expect(parseRepoUrl('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseRepoUrl('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it.each([
    ['http', 'http://github.com/ada/ihms'],
    ['no scheme', 'github.com/ada/ihms'],
    ['www', 'https://www.github.com/ada/ihms'],
    ['another host', 'https://gitlab.com/ada/ihms'],
    ['a host that only starts with github.com', 'https://github.com.evil.example/ada/ihms'],
    ['a credential trick', 'https://github.com@evil.example/ada/ihms'],
    ['the profile page', 'https://github.com/ada'],
    ['the home page', 'https://github.com/'],
    ['a branch page', 'https://github.com/ada/ihms/tree/main'],
    ['the actions page', 'https://github.com/ada/ihms/actions'],
    ['a query string', 'https://github.com/ada/ihms?tab=readme'],
    ['a fragment', 'https://github.com/ada/ihms#readme'],
    ['a dot-only repository', 'https://github.com/ada/..'],
    ['an empty repository name', 'https://github.com/ada/.git'],
    ['a script address', 'javascript:alert(1)'],
    ['plain words', 'my repo'],
  ])('refuses %s', (_name, raw) => {
    expect(parseRepoUrl(raw)).toEqual({ ok: false, reason: 'invalid' });
  });
});

const REPO: RepoRef = { owner: 'ada', repo: 'ihms', url: 'https://github.com/ada/ihms' };
const RUNS_URL =
  'https://api.github.com/repos/ada/ihms/actions/workflows/labs.yml/runs?branch=main&status=completed&per_page=1';
const JOBS_URL = 'https://api.github.com/repos/ada/ihms/actions/runs/777/jobs?per_page=100';

const RUN = {
  id: 777,
  html_url: 'https://github.com/ada/ihms/actions/runs/777',
  head_sha: '3f9a2c1d4e5b6a7988776655443322110ffeeddc',
  updated_at: '2026-10-25T10:00:00Z',
};

const job = (name: string, conclusion: string | null, status = 'completed') => ({
  id: name.length,
  name,
  status,
  conclusion,
  html_url: `https://github.com/ada/ihms/actions/runs/777/job/${name}`,
});

const reply = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });

const runsReply = (...runs: object[]) =>
  reply(200, { total_count: runs.length, workflow_runs: runs });
const jobsReply = (...jobs: object[]) => reply(200, { total_count: jobs.length, jobs });

/** A fetch that answers each call in turn, and remembers what it was asked. */
function scripted(...answers: (Response | Error)[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchFn: FetchFn = async (url, init) => {
    calls.push({ url, init });
    const answer = answers[calls.length - 1];
    if (!answer) throw new Error(`unexpected request ${calls.length}: ${url}`);
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { fetchFn, calls };
}

async function run(answers: (Response | Error)[], ciJob = 'lab-setup') {
  const { fetchFn, calls } = scripted(...answers);
  const outcome = await checkRepo(fetchFn, REPO, ciJob);
  return { outcome, calls };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRepo', () => {
  it('passes when the project job is green, reading the latest completed run and then its jobs', async () => {
    const { outcome, calls } = await run([
      runsReply(RUN),
      jobsReply(job('lab-setup', 'success'), job('lab-db', 'failure')),
    ]);
    expect(calls.map((c) => c.url)).toEqual([RUNS_URL, JOBS_URL]);
    expect(outcome).toMatchObject({
      kind: 'passed',
      run: {
        id: 777,
        url: 'https://github.com/ada/ihms/actions/runs/777',
        sha: RUN.head_sha,
        finishedAt: '2026-10-25T10:00:00Z',
      },
      job: { name: 'lab-setup', conclusion: 'success' },
    });
    expect(outcome.kind === 'passed' && outcome.jobs.map((j) => j.name)).toEqual([
      'lab-setup',
      'lab-db',
    ]);
  });

  it('sends no credentials', async () => {
    const { calls } = await run([runsReply(RUN), jobsReply(job('lab-setup', 'success'))]);
    for (const { init } of calls) {
      expect(init?.headers).toEqual({ Accept: 'application/vnd.github+json' });
    }
  });

  it('fails when the project job is red, and keeps the job and the run for the link', async () => {
    const { outcome } = await run([runsReply(RUN), jobsReply(job('lab-setup', 'failure'))]);
    expect(outcome).toMatchObject({
      kind: 'failed',
      run: { url: 'https://github.com/ada/ihms/actions/runs/777' },
      job: {
        name: 'lab-setup',
        conclusion: 'failure',
        url: 'https://github.com/ada/ihms/actions/runs/777/job/lab-setup',
      },
    });
  });

  it.each(['cancelled', 'skipped', 'timed_out', 'neutral', null])(
    'does not count a project job that ended as %s as a pass',
    async (conclusion) => {
      const { outcome } = await run([runsReply(RUN), jobsReply(job('lab-setup', conclusion))]);
      expect(outcome.kind).toBe('failed');
    },
  );

  it('ignores every other job: a red job for another project does not fail this one', async () => {
    const { outcome } = await run(
      [
        runsReply(RUN),
        jobsReply(
          job('lab-setup', 'success'),
          job('lab-db', 'failure'),
          job('lab-email', 'skipped'),
        ),
      ],
      'lab-setup',
    );
    expect(outcome.kind).toBe('passed');
    const other = await run(
      [runsReply(RUN), jobsReply(job('lab-setup', 'success'), job('lab-db', 'success'))],
      'lab-db',
    );
    expect(other.outcome.kind).toBe('passed');
  });

  it('reports a job that is not in the run', async () => {
    const { outcome } = await run([runsReply(RUN), jobsReply(job('lab-db', 'success'))]);
    expect(outcome).toMatchObject({ kind: 'job-missing', run: { id: 777 } });
    expect(outcome.kind === 'job-missing' && outcome.jobs.map((j) => j.name)).toEqual(['lab-db']);
  });

  it('reports no completed runs yet, without asking for jobs', async () => {
    const { outcome, calls } = await run([runsReply()]);
    expect(outcome).toEqual({ kind: 'no-runs' });
    expect(calls).toHaveLength(1);
  });

  it('reports a repository that is not found or is private (404)', async () => {
    const { outcome, calls } = await run([reply(404, { message: 'Not Found' })]);
    expect(outcome).toEqual({ kind: 'not-found' });
    expect(calls).toHaveLength(1);
  });

  it('treats a 403 that is not a rate limit as not found', async () => {
    const { outcome } = await run([reply(403, { message: 'Forbidden' })]);
    expect(outcome).toEqual({ kind: 'not-found' });
  });

  describe('rate limits', () => {
    const resetAt = Date.UTC(2026, 9, 25, 14, 42, 0) / 1000;

    it('reads x-ratelimit-reset from a 403', async () => {
      const { outcome } = await run([
        reply(
          403,
          { message: 'API rate limit exceeded' },
          {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(resetAt),
          },
        ),
      ]);
      expect(outcome).toEqual({ kind: 'rate-limited', retryAt: new Date(resetAt * 1000) });
    });

    it('reads x-ratelimit-reset from a 429', async () => {
      const { outcome } = await run([reply(429, {}, { 'x-ratelimit-reset': String(resetAt) })]);
      expect(outcome).toEqual({ kind: 'rate-limited', retryAt: new Date(resetAt * 1000) });
    });

    it('falls back to retry-after (seconds from now) when there is no reset time', async () => {
      const { fetchFn } = scripted(reply(403, {}, { 'retry-after': '90' }));
      const outcome = await checkRepo(fetchFn, REPO, 'lab-setup', { now: () => 1_000_000 });
      expect(outcome).toEqual({ kind: 'rate-limited', retryAt: new Date(1_090_000) });
    });

    it('is still rate-limited, with no time, when GitHub sends none', async () => {
      const { outcome } = await run([reply(429, {})]);
      expect(outcome).toEqual({ kind: 'rate-limited', retryAt: null });
    });

    it('also stops on the second request', async () => {
      const { outcome, calls } = await run([
        runsReply(RUN),
        reply(403, {}, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(resetAt) }),
      ]);
      expect(outcome).toEqual({ kind: 'rate-limited', retryAt: new Date(resetAt * 1000) });
      expect(calls).toHaveLength(2);
    });
  });

  describe('network errors', () => {
    it('reports a request that fails', async () => {
      const { outcome } = await run([new TypeError('Failed to fetch')]);
      expect(outcome).toEqual({ kind: 'network-error' });
    });

    it('reports a failure on the second request', async () => {
      const { outcome } = await run([runsReply(RUN), new TypeError('Failed to fetch')]);
      expect(outcome).toEqual({ kind: 'network-error' });
    });

    it.each([500, 502, 503])('reports a %i from GitHub with its code', async (status) => {
      const { outcome } = await run([reply(status, 'Server Error')]);
      expect(outcome).toEqual({ kind: 'network-error', status });
    });

    it('reports a run whose jobs page is gone', async () => {
      const { outcome } = await run([runsReply(RUN), reply(404, { message: 'Not Found' })]);
      expect(outcome).toEqual({ kind: 'network-error', status: 404 });
    });

    it.each<[string, Response[]]>([
      ['an answer that is not JSON', [reply(200, '<html>oops</html>')]],
      ['a runs answer with the wrong shape', [reply(200, { runs: [] })]],
      ['a run without an id', [runsReply({ html_url: RUN.html_url, head_sha: 'abc' })]],
      ['a jobs answer with the wrong shape', [runsReply(RUN), reply(200, { jobs: 'none' })]],
    ])('reports %s', async (_name, answers) => {
      const { outcome } = await run(answers);
      expect(outcome).toEqual({ kind: 'network-error' });
    });

    it('gives up on a request that never answers', async () => {
      vi.useFakeTimers();
      const hung: FetchFn = (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        });
      const pending = checkRepo(hung, REPO, 'lab-setup', { timeoutMs: 5000 });
      await vi.advanceTimersByTimeAsync(5000);
      expect(await pending).toEqual({ kind: 'network-error' });
    });
  });

  it('covers every outcome kind', async () => {
    const kinds = new Set<CheckOutcome['kind']>();
    const cases: (Response | Error)[][] = [
      [runsReply(RUN), jobsReply(job('lab-setup', 'success'))],
      [runsReply(RUN), jobsReply(job('lab-setup', 'failure'))],
      [runsReply(RUN), jobsReply()],
      [runsReply()],
      [reply(404, {})],
      [reply(429, {})],
      [new TypeError('offline')],
    ];
    for (const answers of cases) kinds.add((await run(answers)).outcome.kind);
    expect([...kinds].sort()).toEqual([
      'failed',
      'job-missing',
      'network-error',
      'no-runs',
      'not-found',
      'passed',
      'rate-limited',
    ]);
  });
});
