import { classifyRun, type CheckOutcome, type JobInfo, type RunInfo } from '../../lib/github';
import type { ProjectSubmission } from '../../store/types';

/**
 * What a check keeps in `project_submissions.jobs` (jsonb), so the page can show the same result when
 * it opens again. The admin dashboard reads only repo, passed and time, never this column.
 *
 * - `run`: GitHub had a finished run; `run` and `jobs` describe it.
 * - `no-runs`, `not-found`: GitHub answered, but there was no run to read.
 */
export type SavedCheck =
  { outcome: 'run'; run: RunInfo; jobs: JobInfo[] } | { outcome: 'no-runs' | 'not-found' };

/** What `saveProjectSubmission` takes after the repo address. */
export interface SubmissionRecord {
  runUrl: string | null;
  jobs: SavedCheck;
  passed: boolean;
}

/**
 * The record to save for a check, or null when there is nothing to save. A rate limit and a network
 * error say nothing about the repo, so they are shown but never written over an earlier real result.
 */
export function toRecord(outcome: CheckOutcome): SubmissionRecord | null {
  switch (outcome.kind) {
    case 'passed':
    case 'failed':
    case 'job-missing':
      return {
        runUrl: outcome.run.url,
        jobs: { outcome: 'run', run: outcome.run, jobs: outcome.jobs },
        passed: outcome.kind === 'passed',
      };
    case 'no-runs':
    case 'not-found':
      return { runUrl: null, jobs: { outcome: outcome.kind }, passed: false };
    case 'rate-limited':
    case 'network-error':
      return null;
  }
}

/** Only GitHub addresses become links: this data comes back from the database, where a member can write. */
export function githubLink(url: string | null): string | null {
  return url !== null && url.startsWith('https://github.com/') ? url : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJobs(value: unknown): JobInfo[] | null {
  if (!Array.isArray(value)) return null;
  const jobs: JobInfo[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.name !== 'string') return null;
    jobs.push({
      name: item.name,
      status: typeof item.status === 'string' ? item.status : 'completed',
      conclusion: typeof item.conclusion === 'string' ? item.conclusion : null,
      url: githubLink(typeof item.url === 'string' ? item.url : null),
    });
  }
  return jobs;
}

/**
 * The outcome a saved submission stands for, judged again against the project's job name. Null when
 * the saved `jobs` is not in the shape above (an older or hand-made row): the page then falls back
 * to the `passed` flag.
 */
export function outcomeFromSubmission(
  submission: Pick<ProjectSubmission, 'jobs'>,
  ciJob: string,
): CheckOutcome | null {
  const saved = submission.jobs;
  if (!isRecord(saved)) return null;
  if (saved.outcome === 'no-runs' || saved.outcome === 'not-found') return { kind: saved.outcome };
  if (saved.outcome !== 'run' || !isRecord(saved.run)) return null;
  const { id, url, sha, finishedAt } = saved.run;
  const jobs = readJobs(saved.jobs);
  if (typeof id !== 'number' || typeof sha !== 'string' || !jobs) return null;
  const runUrl = githubLink(typeof url === 'string' ? url : null);
  if (runUrl === null) return null;
  const run: RunInfo = {
    id,
    url: runUrl,
    sha,
    finishedAt: typeof finishedAt === 'string' ? finishedAt : null,
  };
  return classifyRun(run, jobs, ciJob);
}
