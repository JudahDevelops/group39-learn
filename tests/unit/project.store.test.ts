import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStore } from '../../src/store/LocalStore';

beforeEach(() => {
  window.localStorage.clear();
});

describe('LocalStore.getLatestProjectSubmission', () => {
  it('is null before anything was checked', async () => {
    const store = new LocalStore();
    await store.signIn('ada@example.com', 'pw');
    expect(await store.getLatestProjectSubmission()).toBeNull();
  });

  it('returns the most recently checked submission of any project', async () => {
    const store = new LocalStore();
    await store.signIn('ada@example.com', 'pw');
    await store.saveProjectSubmission('project-1', 'https://github.com/ada/first');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await store.saveProjectSubmission('project-2', 'https://github.com/ada/second');
    expect((await store.getLatestProjectSubmission())?.repoUrl).toBe(
      'https://github.com/ada/second',
    );

    // Checking the first project again makes it the latest.
    await new Promise((resolve) => setTimeout(resolve, 5));
    await store.saveProjectSubmission('project-1', 'https://github.com/ada/third');
    expect((await store.getLatestProjectSubmission())?.repoUrl).toBe(
      'https://github.com/ada/third',
    );
  });

  it('keeps jobs and the run link as saved', async () => {
    const store = new LocalStore();
    await store.signIn('ada@example.com', 'pw');
    const jobs = { outcome: 'no-runs' };
    await store.saveProjectSubmission('project-1', 'https://github.com/ada/ihms', {
      runUrl: null,
      jobs,
      passed: false,
    });
    const latest = await store.getLatestProjectSubmission();
    expect(latest).toMatchObject({ projectId: 'project-1', jobs, passed: false, runUrl: null });
  });
});
