import { describe, expect, it } from 'vitest';
import type { CheckOutcome, JobInfo, RunInfo } from '../../src/lib/github';
import { checkedWhen, lagosClock } from '../../src/players/project/format';
import { describeOutcome, labelJob } from '../../src/players/project/messages';
import {
  githubLink,
  outcomeFromSubmission,
  toRecord,
  type SavedCheck,
} from '../../src/players/project/saved';

const RUN: RunInfo = {
  id: 777,
  url: 'https://github.com/ada/ihms/actions/runs/777',
  sha: '3f9a2c1d4e5b6a79',
  finishedAt: '2026-10-25T10:00:00Z',
};
const job = (name: string, conclusion: string | null): JobInfo => ({
  name,
  status: 'completed',
  conclusion,
  url: `https://github.com/ada/ihms/actions/runs/777/job/${name}`,
});

const passed: CheckOutcome = {
  kind: 'passed',
  run: RUN,
  jobs: [job('lab-setup', 'success'), job('lab-db', 'failure')],
  job: job('lab-setup', 'success'),
};

describe('checkedWhen', () => {
  const now = new Date('2026-10-25T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it.each([
    [0, 'just now'],
    [59_000, 'just now'],
    [60_000, '1 minute ago'],
    [2 * 60_000, '2 minutes ago'],
    [59 * 60_000, '59 minutes ago'],
    [60 * 60_000, '1 hour ago'],
    [5 * 3_600_000, '5 hours ago'],
    [23 * 3_600_000, '23 hours ago'],
  ])('%i ms ago reads "%s"', (ms, expected) => {
    expect(checkedWhen(ago(ms), now)).toBe(expected);
  });

  it('reads a time in the future (a slow clock) as just now', () => {
    expect(checkedWhen(ago(-5 * 60_000), now)).toBe('just now');
  });

  it('gives the Lagos date and time from a day on', () => {
    // 10:05 UTC is 11:05 in Lagos.
    expect(checkedWhen('2026-10-23T10:05:00Z', now)).toBe('on 23 Oct 2026 at 11:05');
  });

  it('is empty for a timestamp that is not a date', () => {
    expect(checkedWhen('not a date', now)).toBe('');
  });
});

describe('lagosClock', () => {
  it('shows Lagos time (UTC+1) on a 12-hour clock', () => {
    expect(lagosClock(new Date('2026-10-25T14:42:00Z'))).toBe('3:42 pm');
    expect(lagosClock(new Date('2026-10-25T23:05:00Z'))).toBe('12:05 am');
  });
});

describe('describeOutcome', () => {
  it('says a pass in one line', () => {
    expect(describeOutcome(passed, 'lab-setup')).toEqual({
      tone: 'pass',
      lead: 'Your project passes.',
      rest: 'The lab-setup job is green in the latest run on main.',
    });
  });

  it('names the failing job and what to do', () => {
    const outcome: CheckOutcome = {
      kind: 'failed',
      run: RUN,
      jobs: [job('lab-setup', 'failure')],
      job: job('lab-setup', 'failure'),
    };
    const message = describeOutcome(outcome, 'lab-setup');
    expect(message.tone).toBe('fix');
    expect(message.lead).toBe('The lab-setup job failed.');
    expect(message.rest).toContain('push to main');
  });

  it('tells the learner to push a commit when nothing has finished', () => {
    const message = describeOutcome({ kind: 'no-runs' }, 'lab-setup');
    expect(`${message.lead} ${message.rest}`).toBe(
      'No finished run on main yet. Push a commit, wait for the Actions tab to show a tick or a cross, then check again.',
    );
  });

  it('says the job is missing from the run', () => {
    const message = describeOutcome({ kind: 'job-missing', run: RUN, jobs: [] }, 'lab-db');
    expect(message.tone).toBe('fix');
    expect(message.lead).toBe('The latest run has no lab-db job.');
    expect(message.rest).toContain('labs.yml');
  });

  it('says a repository was not found or is private', () => {
    const message = describeOutcome({ kind: 'not-found' }, 'lab-setup');
    expect(message.tone).toBe('fix');
    expect(message.rest).toContain('private');
  });

  it('says when to try again after a rate limit, in Lagos time', () => {
    const message = describeOutcome(
      { kind: 'rate-limited', retryAt: new Date('2026-10-25T14:42:00Z') },
      'lab-setup',
    );
    expect(message.tone).toBe('wait');
    expect(message.rest).toBe('Try again after 3:42 pm, Lagos time.');
  });

  it('still helps when GitHub gives no reset time', () => {
    const message = describeOutcome({ kind: 'rate-limited', retryAt: null }, 'lab-setup');
    expect(message.rest).toBe('Try again in a few minutes.');
  });

  it('separates a lost connection from a GitHub error', () => {
    expect(describeOutcome({ kind: 'network-error' }, 'lab-setup').lead).toBe(
      'Could not reach GitHub.',
    );
    expect(describeOutcome({ kind: 'network-error', status: 502 }, 'lab-setup').lead).toBe(
      'GitHub did not answer properly (code 502).',
    );
  });
});

describe('labelJob', () => {
  it('judges this project: green passes, anything else fails', () => {
    expect(labelJob(job('lab-setup', 'success'), true)).toEqual({ tone: 'pass', text: 'Passed' });
    expect(labelJob(job('lab-setup', 'failure'), true)).toEqual({ tone: 'fail', text: 'Failed' });
    expect(labelJob(job('lab-setup', 'cancelled'), true)).toEqual({
      tone: 'fail',
      text: 'Cancelled',
    });
    expect(labelJob(job('lab-setup', 'timed_out'), true)).toEqual({
      tone: 'fail',
      text: 'Timed out',
    });
    expect(labelJob(job('lab-setup', null), true)).toEqual({ tone: 'fail', text: 'No result' });
    expect(labelJob(null, true)).toEqual({ tone: 'fail', text: 'Not in this run' });
  });

  it('never shows another project as a failure', () => {
    expect(labelJob(job('lab-db', 'success'), false)).toEqual({ tone: 'pass', text: 'Passed' });
    for (const conclusion of ['failure', 'cancelled', 'skipped', 'timed_out', null]) {
      expect(labelJob(job('lab-db', conclusion), false)).toEqual({
        tone: 'pending',
        text: 'Not started yet',
      });
    }
    expect(labelJob(null, false)).toEqual({ tone: 'pending', text: 'Not started yet' });
  });
});

describe('toRecord', () => {
  it('saves a pass with its run link and jobs', () => {
    const record = toRecord(passed);
    expect(record).toEqual({
      runUrl: RUN.url,
      passed: true,
      jobs: { outcome: 'run', run: RUN, jobs: passed.kind === 'passed' ? passed.jobs : [] },
    });
  });

  it('saves a failing job, and a missing job, as not passed', () => {
    const jobs = [job('lab-db', 'success')];
    expect(toRecord({ kind: 'job-missing', run: RUN, jobs })).toMatchObject({
      runUrl: RUN.url,
      passed: false,
    });
    expect(
      toRecord({ kind: 'failed', run: RUN, jobs, job: job('lab-setup', 'failure') }),
    ).toMatchObject({ runUrl: RUN.url, passed: false });
  });

  it('saves "no runs" and "not found" with no run link', () => {
    expect(toRecord({ kind: 'no-runs' })).toEqual({
      runUrl: null,
      passed: false,
      jobs: { outcome: 'no-runs' },
    });
    expect(toRecord({ kind: 'not-found' })).toEqual({
      runUrl: null,
      passed: false,
      jobs: { outcome: 'not-found' },
    });
  });

  it('saves nothing for a rate limit or a network error', () => {
    expect(toRecord({ kind: 'rate-limited', retryAt: null })).toBeNull();
    expect(toRecord({ kind: 'network-error' })).toBeNull();
  });
});

describe('outcomeFromSubmission', () => {
  it('rebuilds each saved outcome, judged against the project job', () => {
    for (const outcome of [passed]) {
      const record = toRecord(outcome);
      expect(
        outcomeFromSubmission({ jobs: JSON.parse(JSON.stringify(record?.jobs)) }, 'lab-setup'),
      ).toEqual(outcome);
    }
    const failedRun = toRecord({
      kind: 'failed',
      run: RUN,
      jobs: [job('lab-setup', 'failure')],
      job: job('lab-setup', 'failure'),
    });
    expect(outcomeFromSubmission({ jobs: failedRun?.jobs }, 'lab-setup')?.kind).toBe('failed');
    // The same saved run, read for a different project, finds that project's job missing.
    expect(outcomeFromSubmission({ jobs: failedRun?.jobs }, 'lab-email')?.kind).toBe('job-missing');
    expect(outcomeFromSubmission({ jobs: { outcome: 'no-runs' } }, 'lab-setup')).toEqual({
      kind: 'no-runs',
    });
    expect(outcomeFromSubmission({ jobs: { outcome: 'not-found' } }, 'lab-setup')).toEqual({
      kind: 'not-found',
    });
  });

  it.each([
    ['null', null],
    ['an array (the old plain job list)', [{ name: 'lab-setup' }]],
    ['an unknown outcome', { outcome: 'weird' }],
    ['a run without jobs', { outcome: 'run', run: RUN }],
    ['a run with a bad job', { outcome: 'run', run: RUN, jobs: [{ status: 'completed' }] }],
    ['a run with a non-numeric id', { outcome: 'run', run: { ...RUN, id: 'x' }, jobs: [] }],
  ])('returns null for %s', (_name, jobs) => {
    expect(outcomeFromSubmission({ jobs }, 'lab-setup')).toBeNull();
  });

  it('drops links that are not on github.com, and refuses a run link that is not', () => {
    const saved: SavedCheck = {
      outcome: 'run',
      run: RUN,
      jobs: [{ ...job('lab-setup', 'failure'), url: 'javascript:alert(1)' }],
    };
    const outcome = outcomeFromSubmission({ jobs: saved }, 'lab-setup');
    expect(outcome?.kind === 'failed' && outcome.job.url).toBeNull();

    const badRun: SavedCheck = { ...saved, run: { ...RUN, url: 'https://evil.example/run' } };
    expect(outcomeFromSubmission({ jobs: badRun }, 'lab-setup')).toBeNull();
  });
});

describe('githubLink', () => {
  it('only lets github.com addresses through', () => {
    expect(githubLink('https://github.com/ada/ihms/actions/runs/1')).toBe(
      'https://github.com/ada/ihms/actions/runs/1',
    );
    expect(githubLink('http://github.com/ada')).toBeNull();
    expect(githubLink('https://github.com.evil.example/x')).toBeNull();
    expect(githubLink('javascript:alert(1)')).toBeNull();
    expect(githubLink(null)).toBeNull();
  });
});
