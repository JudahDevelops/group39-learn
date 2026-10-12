import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Door } from '../components/Door';
import { RankedList } from '../components/RankedList';
import '../styles/home.css';
import { useCurrentUser, useStore } from '../store/StoreContext';
import { DEFAULT_DAILY_GOAL_XP, todayXp } from '../lib/xp';
import type { LeaderboardRow, XpEvent } from '../store/types';
import { blockMetaLine, blockPath, heroFor } from './course';
import { rankRows } from './ranking';
import { writeSeenDoneIfMissing } from './seenDone';
import { lastFinishedBlockId, useCourse } from './useCourse';

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
  const course = useCourse();
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

  // The map celebrates blocks finished since the learner last saw it. Seeing home first must not
  // hide that, so home only leaves a starting point when there is none yet.
  useEffect(() => {
    if (course.status !== 'ready') return;
    writeSeenDoneIfMissing(course.course.blocks.filter((b) => b.done).map((b) => b.summary.id));
  }, [course]);

  const xpToday = todayXp(events, new Date());
  const dailyGoalXp = user?.dailyGoalXp ?? DEFAULT_DAILY_GOAL_XP;
  const ranked = rankRows(leaderboard, 'week');
  const weekIsEmpty = ranked.every((row) => row.xp === 0);
  const hero =
    course.status === 'ready' ? heroFor(course.course, lastFinishedBlockId(course.entries)) : null;

  return (
    <div className="page page-home">
      <section className="home-hero" aria-label="Your next step">
        {hero && (
          <>
            <div className="hero-door" aria-hidden="true">
              <Door
                roomCode={hero.block.summary.roomCode}
                state={hero.allDone ? 'done' : 'next'}
                large
              />
            </div>
            <div className="hero-body">
              <h1>{hero.block.summary.title}</h1>
              <p className="hero-meta">{blockMetaLine(hero.block.summary)}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(blockPath(hero.block))}
              >
                {hero.label}
              </button>
            </div>
          </>
        )}
        {course.status === 'error' && (
          <p role="alert" className="form-error">
            Your course could not be loaded. Check your connection, then reload the page.
          </p>
        )}
        {course.status === 'ready' && !hero && (
          <p className="empty-state">The course has no blocks yet.</p>
        )}
      </section>

      <section className="home-today" aria-label="Today">
        <p className="today-xp">
          {xpToday} of {dailyGoalXp} XP today
        </p>
        <DailyBar xp={xpToday} goal={dailyGoalXp} />
      </section>

      <section className="home-week">
        <h2>This week</h2>
        {weekIsEmpty ? (
          <p className="empty-state">No XP yet this week. Continue your course to start.</p>
        ) : (
          <RankedList rows={ranked} currentUserId={user?.id} label="This week" />
        )}
      </section>
    </div>
  );
}
