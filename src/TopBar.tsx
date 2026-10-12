import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearPasswordSetupPending } from './store/authLanding';
import { useCurrentUser, useStore } from './store/StoreContext';
import { DEFAULT_DAILY_GOAL_XP, streakDays, todayXp } from './lib/xp';
import { onProgress } from './lib/progress';
import type { XpEvent } from './store/types';

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export function TopBar() {
  const store = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [events, setEvents] = useState<XpEvent[]>([]);
  // The nav and the XP chips only mean something once someone is signed in and has a name.
  const onboarded = user !== null && user.displayName.trim() !== '';

  useEffect(() => {
    let cancelled = false;
    if (!user || !onboarded) {
      setEvents([]);
      return;
    }
    const load = () => {
      store.listXpEvents(user.id).then((list) => {
        if (!cancelled) setEvents(list);
      });
    };
    load();
    const unsubscribe = onProgress(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [store, user, onboarded]);

  async function handleSignOut() {
    await store.signOut();
    clearPasswordSetupPending();
    navigate('/signin', { replace: true });
  }

  const now = new Date();
  const streak = streakDays(events, now);
  const xpToday = todayXp(events, now);
  const dailyGoalXp = user?.dailyGoalXp ?? DEFAULT_DAILY_GOAL_XP;

  return (
    <header className="topbar">
      <span className="topbar-brand">Group 39 Learn</span>
      {onboarded && (
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
      )}
      {onboarded && (
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
      )}
      {user && (
        <div className="topbar-account">
          {onboarded && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `topbar-profile${isActive ? ' active' : ''}`}
              aria-label="Your profile"
              title="Your profile"
            >
              {/* The name on wide screens, a round initial where there is no room for it. */}
              <span className="topbar-name">{user.displayName}</span>
              <span className="topbar-initial" aria-hidden="true">
                {Array.from(user.displayName.trim())[0]?.toUpperCase()}
              </span>
            </NavLink>
          )}
          <button type="button" className="topbar-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
