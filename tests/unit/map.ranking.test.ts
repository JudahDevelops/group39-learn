import { describe, expect, it } from 'vitest';
import { rankRows } from '../../src/pages/ranking';
import type { LeaderboardRow } from '../../src/store/types';

const row = (userId: string, weekXp: number, allTimeXp: number): LeaderboardRow => ({
  userId,
  displayName: userId.toUpperCase(),
  weekXp,
  allTimeXp,
});

describe('rankRows', () => {
  const rows = [row('a', 10, 300), row('b', 50, 100), row('c', 30, 200)];

  it('puts the most XP first, for the chosen period', () => {
    expect(rankRows(rows, 'week').map((r) => r.userId)).toEqual(['b', 'c', 'a']);
    expect(rankRows(rows, 'all').map((r) => r.userId)).toEqual(['a', 'c', 'b']);
    expect(rankRows(rows, 'week').map((r) => r.xp)).toEqual([50, 30, 10]);
  });

  it('numbers from 1; equal XP shares a rank and the next rank skips', () => {
    const tied = [row('a', 40, 0), row('b', 40, 0), row('c', 10, 0), row('d', 0, 0)];
    expect(rankRows(tied, 'week').map((r) => [r.userId, r.rank])).toEqual([
      ['a', 1],
      ['b', 1],
      ['c', 3],
      ['d', 4],
    ]);
  });

  it('keeps the store order between people on the same XP', () => {
    const tied = [row('z', 5, 0), row('y', 5, 0)];
    expect(rankRows(tied, 'week').map((r) => r.userId)).toEqual(['z', 'y']);
  });

  it('is empty for no rows', () => {
    expect(rankRows([], 'week')).toEqual([]);
  });
});
