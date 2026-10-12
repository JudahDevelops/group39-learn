import '../styles/leaderboard.css';
import type { RankedRow } from '../pages/ranking';

/** A ranked list of people and their XP. The signed-in person's row says "(you)" and is marked. */
export function RankedList({
  rows,
  currentUserId,
  label,
}: {
  rows: readonly RankedRow[];
  currentUserId: string | undefined;
  label: string;
}) {
  return (
    <ol className="board" aria-label={label}>
      {rows.map((row) => {
        const you = row.userId === currentUserId;
        return (
          <li key={row.userId} className={you ? 'board-row is-you' : 'board-row'}>
            <span className="board-rank">{row.rank}</span>
            <span className="board-name">
              {row.name}
              {you && <span className="board-you"> (you)</span>}
            </span>
            <span className="board-xp">{row.xp} XP</span>
          </li>
        );
      })}
    </ol>
  );
}
