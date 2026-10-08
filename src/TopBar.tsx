import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useCurrentUser, useStore } from './store/StoreContext';
import { DEFAULT_DAILY_GOAL_XP, streakDays, todayXp } from './lib/xp';
import type { XpEvent } from './store/types';

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export function TopBar() {
  const store = useStore();
  const user = useCurrentUser();
  const [events, setEvents] = useState<XpEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setEvents([]);
      return;
    }
    store.listXpEvents(user.id).then((list) => {
      if (!cancelled) setEvents(list);
    });
    return () => {
      cancelled = true;
    };
  }, [store, user]);

  const now = new Date();
  const streak = streakDays(events, now);
  const xpToday = todayXp(events, now);
  const dailyGoalXp = user?.dailyGoalXp ?? DEFAULT_DAILY_GOAL_XP;

  return (
    <header className="topbar">
      <span className="topbar-brand">Group 39 Learn</span>
      <nav className="topbar-nav" aria-label="Main">
        <NavLink to="/learn" className={navClass}>
          Learn
        </NavLink>
        <NavLink to="/reference/glossary" className={navClass}>
          Reference
        </NavLink>
        <NavLink to="/leaderboard" className={navClass}>
          Leaderboard
        </NavLink>
      </nav>
      <div className="topbar-stats">
        <span className="key-tag chip-full" title="Current streak">
          {streak}-day streak
        </span>
        <span className="key-tag chip-short" title={`${streak}-day streak`}>
          {streak} days
        </span>
        <span className="key-tag chip-full" title="XP earned today">
          {xpToday} of {dailyGoalXp} XP today
        </span>
        <span className="key-tag chip-short" title={`${xpToday} of ${dailyGoalXp} XP today`}>
          {xpToday}/{dailyGoalXp} XP
        </span>
      </div>
    </header>
  );
}
