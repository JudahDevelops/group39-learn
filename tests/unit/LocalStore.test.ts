import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStore } from '../../src/store/LocalStore';
import type { XpEvent } from '../../src/store/types';

const DAY_MS = 86_400_000;

beforeEach(() => {
  window.localStorage.clear();
});

describe('LocalStore auth', () => {
  it('restores the saved user on init and notifies listeners', async () => {
    const first = new LocalStore();
    const created = await first.signIn('ada@example.com', 'pw');
    // A new local user starts with an empty display name, like a new Supabase user.
    expect(created.displayName).toBe('');
    await first.updateProfile(created.id, { displayName: 'ada' });

    const second = new LocalStore();
    const listener = vi.fn();
    second.onAuthChange(listener);
    expect(second.getCurrentUser()).toBeNull();
    await second.init();
    expect(second.getCurrentUser()?.displayName).toBe('ada');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'ada' }));
  });

  it('stops notifying after unsubscribe', async () => {
    const store = new LocalStore();
    const listener = vi.fn();
    const unsubscribe = store.onAuthChange(listener);
    unsubscribe();
    await store.signIn('ada@example.com', 'pw');
    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects an empty password and requires a user for setPassword', async () => {
    const store = new LocalStore();
    await expect(store.signIn('ada@example.com', '')).rejects.toThrow();
    await expect(store.setPassword('new-password')).rejects.toThrow('No signed-in user');
    await store.signIn('ada@example.com', 'pw');
    await expect(store.setPassword('new-password')).resolves.toBeUndefined();
  });
});

describe('LocalStore.getLeaderboard', () => {
  it('reports weekXp for this week only, not the all-time total', async () => {
    const old: XpEvent = {
      userId: 'local-dev-user',
      itemId: 'old-lesson',
      reason: 'lesson',
      amount: 100,
      createdAt: new Date(Date.now() - 21 * DAY_MS).toISOString(),
    };
    window.localStorage.setItem('g39.xpEvents', JSON.stringify([old]));

    const store = new LocalStore();
    await store.signIn('ada@example.com', 'pw');
    await store.awardXp('new-lesson', 'lesson', 10);

    const rows = await store.getLeaderboard();
    expect(rows).toHaveLength(1);
    expect(rows[0].weekXp).toBe(10);
    expect(rows[0].allTimeXp).toBe(110);
  });
});

describe('LocalStore.awardXp', () => {
  it('awards once per item and reason, like the database constraint', async () => {
    const store = new LocalStore();
    await store.signIn('ada@example.com', 'pw');
    expect(await store.awardXp('lesson-1', 'lesson', 10)).toBe(true);
    expect(await store.awardXp('lesson-1', 'lesson', 10)).toBe(false);
    expect(await store.awardXp('lesson-1', 'lesson_perfect', 5)).toBe(true);
  });

  it('refuses a reason that is not in XP_REASONS and an amount that does not match its reason', async () => {
    const store = new LocalStore();
    await store.signIn('ada@example.com', 'pw');
    // @ts-expect-error not a real reason: the type refuses it, and so does the store at run time
    await expect(store.awardXp('lesson-1', 'workshop_step', 5)).rejects.toThrow(
      'Unknown XP reason',
    );
    for (const amount of [0, -5, 5, 100, 101, 2.5]) {
      await expect(store.awardXp('lesson-2', 'lesson', amount), String(amount)).rejects.toThrow(
        'A "lesson" award is 10 XP',
      );
    }
    expect(await store.awardXp('exam-1', 'exam', 100)).toBe(true);
    expect(await store.listXpEvents('local-dev-user')).toHaveLength(1);
  });
});
