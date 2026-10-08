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
    await first.signIn('ada@example.com', 'pw');

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
