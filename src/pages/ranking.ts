import type { LeaderboardRow } from '../store/types';

export type RankPeriod = 'week' | 'all';

export interface RankedRow {
  userId: string;
  name: string;
  xp: number;
  /** 1-based. People on the same XP share a rank, and the next rank skips (1, 2, 2, 4). */
  rank: number;
}

/** Highest XP first. The store's order breaks ties, so the list does not shuffle between renders. */
export function rankRows(rows: readonly LeaderboardRow[], period: RankPeriod): RankedRow[] {
  const xpOf = (row: LeaderboardRow) => (period === 'week' ? row.weekXp : row.allTimeXp);
  const sorted = rows
    .map((row, position) => ({ row, position }))
    .sort((a, b) => xpOf(b.row) - xpOf(a.row) || a.position - b.position);
  let rank = 0;
  return sorted.map(({ row }, i) => {
    if (i === 0 || xpOf(row) !== xpOf(sorted[i - 1].row)) rank = i + 1;
    return { userId: row.userId, name: row.displayName, xp: xpOf(row), rank };
  });
}
