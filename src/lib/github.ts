/**
 * Reads a member's repo from GitHub's public API: the latest finished Actions run on `main` and the
 * jobs in it (docs/PLAN.md § Repo checks). Pure: no DOM and no global `fetch`. The caller passes the
 * fetch function, so unit tests hand in a mock and the app hands in `window.fetch`.
 *
 * Calls are unauthenticated (60 an hour per network), so there is no token here and none is needed.
 */

/** The part of `fetch` this module uses. */
export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export interface RepoRef {
  owner: string;
  repo: string;
  /** The canonical address, `https://github.com/owner/repo`, which is what gets saved. */
  url: string;
}

export type ParsedRepo = { ok: true; repo: RepoRef } | { ok: false; reason: 'empty' | 'invalid' };

// owner: letters, digits and hyphens. repo: letters, digits, dots, hyphens and underscores, with an
// optional `.git` and an optional trailing slash. Nothing else after it: no branch, query or fragment.
const REPO_URL =
  /^https:\/\/github\.com\/([a-z0-9][a-z0-9-]{0,38})\/([a-z0-9._-]+?)(?:\.git)?\/?$/i;

/**
 * Reads `https://github.com/owner/repo`, with or without `.git` or a trailing slash. Anything else is
 * refused, so the caller never sends a request for it. Whitespace around a pasted link is ignored.
 */
export function parseRepoUrl(raw: string): ParsedRepo {
  const text = raw.trim();
  if (text === '') return { ok: false, reason: 'empty' };
  const match = REPO_URL.exec(text);
  if (!match) return { ok: false, reason: 'invalid' };
  const [, owner, repo] = match;
  if (repo === '.' || repo === '..' || repo === '.git') return { ok: false, reason: 'invalid' };
  return { ok: true, repo: { owner, repo, url: `https://github.com/${owner}/${repo}` } };
}

export interface RunInfo {
  id: number;
  /** The run's page on GitHub. */
  url: string;
  /** The commit the run tested. */
  sha: string;
  /** When the run last changed (its finish time), as an ISO string, or null. */
  finishedAt: string | null;
}

export interface JobInfo {
  name: string;
  /** GitHub's job status: `completed` for every job of a finished run. */
  status: string;
  /** `success`, `failure`, `cancelled`, `skipped`, `timed_out` and so on; null while unfinished. */
  conclusion: string | null;
  /** The job's page on GitHub, or null when GitHub did not send one. */
  url: string | null;
}

export type CheckOutcome =
  /** The project's job is green. */
  | { kind: 'passed'; run: RunInfo; jobs: JobInfo[]; job: JobInfo }
  /** The project's job is in the run and is not green. */
  | { kind: 'failed'; run: RunInfo; jobs: JobInfo[]; job: JobInfo }
  /** The latest finished run has no job with the project's name. */
  | { kind: 'job-missing'; run: RunInfo; jobs: JobInfo[] }
  /** The repo exists but no run has finished on `main` yet. */
  | { kind: 'no-runs' }
  /** GitHub answered 404 (or 403): the repo does not exist or is private. */
  | { kind: 'not-found' }
  /** GitHub's limit for unauthenticated calls is used up. `retryAt` is when it resets, if known. */
  | { kind: 'rate-limited'; retryAt: Date | null }
  /**
   * No usable answer: the request failed, timed out, or GitHub replied with an error or something
   * unreadable. `status` is the HTTP status when there was one.
   */
  | { kind: 'network-error'; status?: number };

export interface CheckOptions {
  /** Milliseconds to wait for each request. Default 15 000. */
  timeoutMs?: number;
  /** Current time in ms, used only for a `Retry-After` header. Default `Date.now`. */
  now?: () => number;
}

const API = 'https://api.github.com';
/** The workflow file in the group39-ihms template that runs the lab-<id> jobs. */
export const LABS_WORKFLOW = 'labs.yml';

/** Where a project's job stands in a run: green, or not. Only `success` counts as green. */
export function classifyRun(
  run: RunInfo,
  jobs: JobInfo[],
  ciJob: string,
): Extract<CheckOutcome, { kind: 'passed' | 'failed' | 'job-missing' }> {
  const job = jobs.find((j) => j.name === ciJob);
  if (!job) return { kind: 'job-missing', run, jobs };
  return job.conclusion === 'success'
    ? { kind: 'passed', run, jobs, job }
    : { kind: 'failed', run, jobs, job };
}

/**
 * Checks one repo: GET the latest completed run on `main`, then GET that run's jobs. Never throws;
 * every way it can go wrong is an outcome.
 */
export async function checkRepo(
  fetchFn: FetchFn,
  repo: RepoRef,
  ciJob: string,
  options: CheckOptions = {},
): Promise<CheckOutcome> {
  const base = `${API}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/actions`;

  // Only the template's labs workflow counts, so a member's own extra workflow can never stand in for it.
  const runs = await getJson(
    fetchFn,
    `${base}/workflows/${LABS_WORKFLOW}/runs?branch=main&status=completed&per_page=1`,
    options,
    'repo',
  );
  if (!runs.ok) return runs.outcome;
  const list = isRecord(runs.body) ? runs.body.workflow_runs : undefined;
  if (!Array.isArray(list)) return { kind: 'network-error' };
  if (list.length === 0) return { kind: 'no-runs' };
  const run = readRun(list[0]);
  if (!run) return { kind: 'network-error' };

  const jobsResponse = await getJson(
    fetchFn,
    `${base}/runs/${run.id}/jobs?per_page=100`,
    options,
    'run',
  );
  if (!jobsResponse.ok) return jobsResponse.outcome;
  const rawJobs = isRecord(jobsResponse.body) ? jobsResponse.body.jobs : undefined;
  if (!Array.isArray(rawJobs)) return { kind: 'network-error' };
  const jobs = rawJobs.map(readJob).filter((j): j is JobInfo => j !== null);

  return classifyRun(run, jobs, ciJob);
}

type Fetched = { ok: true; body: unknown } | { ok: false; outcome: CheckOutcome };

/** One GET with a timeout. `missing` says what a 404 means: no repo, or (for the jobs call) a run that vanished. */
async function getJson(
  fetchFn: FetchFn,
  url: string,
  options: CheckOptions,
  missing: 'repo' | 'run',
): Promise<Fetched> {
  const now = options.now ?? Date.now;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  try {
    const response = await fetchFn(url, {
      headers: { Accept: 'application/vnd.github+json' },
      // Ask GitHub whether the cached copy is still current: a re-check after a push must not
      // read a minute-old answer, and an unchanged answer (304) costs none of the hourly limit.
      cache: 'no-cache',
      signal: controller.signal,
    });
    if (response.status === 200) {
      return { ok: true, body: (await response.json()) as unknown };
    }
    const limited = readRateLimit(response, now);
    if (limited) return { ok: false, outcome: limited };
    if (response.status === 404 || response.status === 403) {
      return {
        ok: false,
        outcome:
          missing === 'repo'
            ? { kind: 'not-found' }
            : { kind: 'network-error', status: response.status },
      };
    }
    return { ok: false, outcome: { kind: 'network-error', status: response.status } };
  } catch {
    // fetch rejected (offline, blocked, timed out) or the body was not JSON.
    return { ok: false, outcome: { kind: 'network-error' } };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GitHub signals the limit with 403 or 429 plus `x-ratelimit-remaining: 0` and `x-ratelimit-reset`
 * (seconds since 1970). The abuse limit sends `retry-after` (seconds) instead. A 403 with neither is
 * a plain refusal, not a limit.
 */
function readRateLimit(response: Response, now: () => number): CheckOutcome | null {
  if (response.status !== 403 && response.status !== 429) return null;
  const remaining = response.headers.get('x-ratelimit-remaining');
  const retryAfter = response.headers.get('retry-after');
  const limited = response.status === 429 || remaining === '0' || retryAfter !== null;
  if (!limited) return null;

  const reset = Number(response.headers.get('x-ratelimit-reset'));
  if (response.headers.get('x-ratelimit-reset') !== null && Number.isFinite(reset) && reset > 0) {
    return { kind: 'rate-limited', retryAt: new Date(reset * 1000) };
  }
  const wait = Number(retryAfter);
  if (retryAfter !== null && Number.isFinite(wait) && wait >= 0) {
    return { kind: 'rate-limited', retryAt: new Date(now() + wait * 1000) };
  }
  return { kind: 'rate-limited', retryAt: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRun(value: unknown): RunInfo | null {
  if (!isRecord(value)) return null;
  const { id, html_url: url, head_sha: sha, updated_at: updatedAt } = value;
  if (typeof id !== 'number' || typeof url !== 'string' || typeof sha !== 'string') return null;
  return { id, url, sha, finishedAt: typeof updatedAt === 'string' ? updatedAt : null };
}

function readJob(value: unknown): JobInfo | null {
  if (!isRecord(value)) return null;
  const { name, status, conclusion, html_url: url } = value;
  if (typeof name !== 'string') return null;
  return {
    name,
    status: typeof status === 'string' ? status : 'completed',
    conclusion: typeof conclusion === 'string' ? conclusion : null,
    url: typeof url === 'string' ? url : null,
  };
}
