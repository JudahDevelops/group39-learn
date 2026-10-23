import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStore } from '../../src/store/LocalStore';

beforeEach(() => {
  window.localStorage.clear();
});

describe('LocalStore.getAdminData', () => {
  it('is empty before anyone has signed in', async () => {
    const data = await new LocalStore().getAdminData();
    expect(data).toEqual({
      profiles: [],
      progress: [],
      xpEvents: [],
      attempts: [],
      quizAttempts: [],
      lessonFeedback: [],
      projectSubmissions: [],
    });
  });

  it("returns the local user's rows, cut down to the columns the dashboard uses", async () => {
    const store = new LocalStore();
    const user = await store.signIn('ada@example.com', 'pw');
    await store.updateProfile(user.id, { displayName: 'Ada Okafor' });
    await store.markComplete('step-1', 'block-1');
    await store.awardXp('step-1', 'step', 5);
    await store.recordAttempt('step-1', false, 2);
    await store.recordQuizAttempt('quiz-1', 12, 15, true, ['q1']);
    await store.recordLessonFeedback('lesson-1', 'confusing', 'Lost me');
    await store.saveProjectSubmission('project-1', 'https://github.com/ada/ihms', { passed: true });

    const data = await store.getAdminData();
    expect(data.profiles).toEqual([{ id: user.id, displayName: 'Ada Okafor' }]);
    expect(data.progress).toEqual([
      { userId: user.id, itemId: 'step-1', completedAt: expect.any(String) },
    ]);
    expect(data.xpEvents).toEqual([{ userId: user.id, createdAt: expect.any(String) }]);
    expect(data.attempts).toEqual([
      {
        userId: user.id,
        itemId: 'step-1',
        passed: false,
        failedTestIndex: 2,
        createdAt: expect.any(String),
      },
    ]);
    expect(data.quizAttempts).toEqual([
      {
        userId: user.id,
        quizId: 'quiz-1',
        score: 12,
        total: 15,
        passed: true,
        createdAt: expect.any(String),
      },
    ]);
    expect(data.lessonFeedback).toEqual([
      {
        userId: user.id,
        blockId: 'lesson-1',
        rating: 'confusing',
        comment: 'Lost me',
        createdAt: expect.any(String),
      },
    ]);
    expect(data.projectSubmissions).toEqual([
      {
        userId: user.id,
        projectId: 'project-1',
        repoUrl: 'https://github.com/ada/ihms',
        passed: true,
        checkedAt: expect.any(String),
      },
    ]);
  });

  it('leaves out rows that belong to anyone else', async () => {
    const store = new LocalStore();
    const user = await store.signIn('ada@example.com', 'pw');
    await store.markComplete('mine', 'block-1');
    const stored = JSON.parse(window.localStorage.getItem('g39.progress') ?? '[]') as unknown[];
    stored.push({
      userId: 'someone-else',
      itemId: 'theirs',
      blockId: 'block-1',
      completedAt: new Date().toISOString(),
    });
    window.localStorage.setItem('g39.progress', JSON.stringify(stored));

    const data = await new LocalStore().getAdminData();
    expect(data.progress.map((r) => r.itemId)).toEqual(['mine']);
    expect(data.progress[0].userId).toBe(user.id);
  });
});
