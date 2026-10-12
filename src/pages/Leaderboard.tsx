import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { RankedList } from '../components/RankedList';
import '../styles/leaderboard.css';
import { useCurrentUser, useStore } from '../store/StoreContext';
import type { LeaderboardRow } from '../store/types';
import { rankRows, type RankPeriod } from './ranking';

const TABS: { period: RankPeriod; label: string; empty: string }[] = [
  {
    period: 'week',
    label: 'This week',
    empty: 'No XP yet this week. Continue your course to start.',
  },
  { period: 'all', label: 'All time', empty: 'No XP yet. Continue your course to start.' },
];

/** /leaderboard: everyone in the group ranked by XP, this week or all time. */
export function Leaderboard() {
  const store = useStore();
  const user = useCurrentUser();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [period, setPeriod] = useState<RankPeriod>('week');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    store.getLeaderboard().then(
      (list) => {
        if (!cancelled) setRows(list);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [store]);

  function moveTab(event: KeyboardEvent, from: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const to = (from + step + TABS.length) % TABS.length;
    setPeriod(TABS[to].period);
    tabRefs.current[to]?.focus();
  }

  const active = TABS.find((t) => t.period === period) ?? TABS[0];
  const ranked = rows ? rankRows(rows, period) : [];
  const empty = ranked.every((r) => r.xp === 0);

  return (
    <div className="page page-leaderboard">
      <h1>Leaderboard</h1>
      <div className="board-tabs" role="tablist" aria-label="Leaderboard period">
        {TABS.map((tab, i) => (
          <button
            key={tab.period}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`board-tab-${tab.period}`}
            aria-selected={tab.period === period}
            aria-controls="board-panel"
            tabIndex={tab.period === period ? 0 : -1}
            className="board-tab"
            onClick={() => setPeriod(tab.period)}
            onKeyDown={(event) => moveTab(event, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id="board-panel"
        role="tabpanel"
        aria-labelledby={`board-tab-${period}`}
        className="board-panel"
      >
        {failed && (
          <p role="alert" className="form-error">
            The leaderboard could not be loaded. Check your connection, then reload the page.
          </p>
        )}
        {rows &&
          (empty ? (
            <p className="empty-state">{active.empty}</p>
          ) : (
            <RankedList rows={ranked} currentUserId={user?.id} label={active.label} />
          ))}
      </div>
    </div>
  );
}
