import type { CheckOutcome } from '../../lib/github';
import { lagosClock } from './format';

/** What the result band says. `lead` is the first sentence and is set in bold; `rest` follows it. */
export interface Message {
  /** pass: green. fix: the learner has something to change. wait: nothing to fix, try again. */
  tone: 'pass' | 'fix' | 'wait';
  lead: string;
  rest: string;
}

export const URL_MESSAGES = {
  empty: 'Paste the link to your repository first.',
  invalid:
    'That is not a link to a GitHub repository. It looks like https://github.com/your-name/your-repo, with nothing after the repository name.',
} as const;

/** The plain-language message for each outcome. */
export function describeOutcome(outcome: CheckOutcome, ciJob: string): Message {
  switch (outcome.kind) {
    case 'passed':
      return {
        tone: 'pass',
        lead: 'Your project passes.',
        rest: `The ${ciJob} job is green in the latest run on main.`,
      };
    case 'failed':
      return {
        tone: 'fix',
        lead: `The ${ciJob} job failed.`,
        rest: 'Open it on GitHub to read which test failed, fix your code, push to main, wait for the run to finish, then check again.',
      };
    case 'job-missing':
      return {
        tone: 'fix',
        lead: `The latest run has no ${ciJob} job.`,
        rest: 'Your repo needs the .github/workflows/labs.yml file from the group template. Copy it in, push to main, wait for the run to finish, then check again.',
      };
    case 'no-runs':
      return {
        tone: 'wait',
        lead: 'No finished run on main yet.',
        rest: 'Push a commit, wait for the Actions tab to show a tick or a cross, then check again.',
      };
    case 'not-found':
      return {
        tone: 'fix',
        lead: 'GitHub cannot find that repository or its labs workflow.',
        rest: 'Check the link for typos. If the repository is private, make it public in its Settings. It also needs .github/workflows/labs.yml from the template.',
      };
    case 'rate-limited':
      return {
        tone: 'wait',
        lead: 'GitHub is limiting checks from your network.',
        rest: outcome.retryAt
          ? `Try again after ${lagosClock(outcome.retryAt)}, Lagos time.`
          : 'Try again in a few minutes.',
      };
    case 'network-error':
      return outcome.status === undefined
        ? {
            tone: 'wait',
            lead: 'Could not reach GitHub.',
            rest: 'Check your internet connection, then press Check my repo again.',
          }
        : {
            tone: 'wait',
            lead: `GitHub did not answer properly (code ${outcome.status}).`,
            rest: 'Wait a minute, then check again.',
          };
  }
}

/** How a job in the list reads. `pending` is a job that is not this project's and is not green. */
export interface JobLabel {
  tone: 'pass' | 'fail' | 'pending';
  text: string;
}

const FAILED_TEXT: Record<string, string> = {
  failure: 'Failed',
  timed_out: 'Timed out',
  cancelled: 'Cancelled',
  skipped: 'Skipped',
  neutral: 'No result',
  action_required: 'Needs approval',
};

/**
 * One row of the job list. The project's own job is judged: green passes, anything else fails.
 * Every other job belongs to another project, so it is never shown as a failure: green reads
 * "Passed", anything else (red, skipped, not in the run) reads "Not started yet".
 */
export function labelJob(
  job: { conclusion: string | null } | null,
  isThisProject: boolean,
): JobLabel {
  const passed = job?.conclusion === 'success';
  if (passed) return { tone: 'pass', text: 'Passed' };
  if (!isThisProject) return { tone: 'pending', text: 'Not started yet' };
  if (!job) return { tone: 'fail', text: 'Not in this run' };
  return { tone: 'fail', text: FAILED_TEXT[job.conclusion ?? ''] ?? 'No result' };
}
