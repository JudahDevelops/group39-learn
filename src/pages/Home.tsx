import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/StoreContext';
import { DEFAULT_DAILY_GOAL_XP, streakDays, todayXp } from '../lib/xp';
import type { LeaderboardRow, XpEvent } from '../store/types';

// Placeholder for the learner's next item. The map (WP 1.6) will resolve the
// real one from the curriculum and the learner's progress.
const NEXT_ITEM = {
  blockSlug: 'b1-complaint-form',
  itemId: 'step-4',
  roomCode: 'B1-07',
  title: 'Build the Complaint Form',
  stepLabel: 'step 4',
};

/** One segment of the daily bar stands for this much XP. */
const XP_PER_SEGMENT = 10;

function DailyBar({ xp, goal }: { xp: number; goal: number }) {
  const segments = Math.max(1, Math.ceil(goal / XP_PER_SEGMENT));
  return (
    <div
      className="segmented-bar"
      role="progressbar"
      aria-label="XP today"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(xp, goal)}
    >
      {Array.from({ length: segments }, (_, i) => {
        const filled = Math.min(1, Math.max(0, (xp - i * XP_PER_SEGMENT) / XP_PER_SEGMENT));
        return (
          <span key={i} className="segment">
            <span className="segment-fill" style={{ width: `${filled * 100}%` }} />
          </span>
        );
      })}
    </div>
  );
}

export function Home() {
  const store = useStore();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [events, setEvents] = useState<XpEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setEvents([]);
      setLeaderboard([]);
      return;
    }
    store.listXpEvents(user.id).then((list) => {
      if (!cancelled) setEvents(list);
    });
    store.getLeaderboard().then((rows) => {
      if (!cancelled) setLeaderboard(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [store, user]);

  const now = new Date();
  const xpToday = todayXp(events, now);
  const streak = streakDays(events, now);
  const dailyGoalXp = user?.dailyGoalXp ?? DEFAULT_DAILY_GOAL_XP;
  const ranked = leaderboard.slice().sort((a, b) => b.weekXp - a.weekXp);
  const weekIsEmpty = ranked.every((row) => row.weekXp === 0);

  return (
    <div className="page page-home">
      <section className="home-hero">
        <div className="door door-next" aria-hidden="true">
          <span className="door-plate">{NEXT_ITEM.roomCode}</span>
          <span className="door-knob" />
        </div>
        <div>
          <h1>{NEXT_ITEM.title}</h1>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/learn/${NEXT_ITEM.blockSlug}/${NEXT_ITEM.itemId}`)}
          >
            Continue {NEXT_ITEM.title}, {NEXT_ITEM.stepLabel}
          </button>
        </div>
      </section>

      <section className="home-today" aria-label="Today">
        <p className="today-xp">
          {xpToday} of {dailyGoalXp} XP today
        </p>
        <DailyBar xp={xpToday} goal={dailyGoalXp} />
        <p className="streak-line">
          <span className="key-tag">{streak}-day streak</span>
          {xpToday === 0 && (
            <span>{streak > 0 ? 'Earn XP today to keep it.' : 'Earn XP today to start one.'}</span>
          )}
        </p>
      </section>

      <section className="home-week">
        <h2>This week</h2>
        {weekIsEmpty ? (
          <p className="empty-state">No XP yet this week. Continue your course to start.</p>
        ) : (
          <ol className="week-list">
            {ranked.map((row, i) => (
              <li key={row.userId}>
                <span className="week-rank">{i + 1}</span>
                <span className="week-name">{row.displayName}</span>
                <span className="week-xp">{row.weekXp} XP</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
