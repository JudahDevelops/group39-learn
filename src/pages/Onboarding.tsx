import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_DAILY_GOAL_XP } from '../lib/xp';
import { useCurrentUser, useStore } from '../store/StoreContext';

/**
 * The four daily goals. Minutes are a plain estimate at roughly 2 XP a minute: a lesson (10 XP)
 * takes about five minutes and a workshop step (5 XP) two or three.
 */
const GOALS = [
  { xp: 30, minutes: 15 },
  { xp: 60, minutes: 30 },
  { xp: 100, minutes: 50 },
  { xp: 150, minutes: 75 },
] as const;

const NAME_MAX = 40;

/** GitHub usernames: letters, numbers and hyphens, not starting or ending with a hyphen, up to 39. */
const GITHUB_USERNAME = /^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

/** Accepts "ada", "@ada" or a pasted profile link, and returns the bare username. */
function cleanGithub(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');
}

export function Onboarding() {
  const store = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<number>(DEFAULT_DAILY_GOAL_XP);
  const [github, setGithub] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const displayName = name.trim();
    if (!displayName) {
      setError('Enter a display name. The group sees it on the leaderboard.');
      return;
    }
    const githubUsername = cleanGithub(github);
    if (githubUsername && !GITHUB_USERNAME.test(githubUsername)) {
      setError(
        'A GitHub username has letters, numbers and hyphens only, no hyphen at the start or end, and at most 39 characters.',
      );
      return;
    }
    setBusy(true);
    try {
      await store.updateProfile(user.id, {
        displayName,
        dailyGoalXp: goal,
        githubUsername: githubUsername || null,
      });
      navigate('/', { replace: true });
    } catch {
      setError("Your profile wasn't saved. Check your internet connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Set up your profile</h1>
      <p>This takes under a minute. You only do it once.</p>
      <form onSubmit={handleSubmit} className="onboarding-form" noValidate>
        <div className="field">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            type="text"
            autoComplete="nickname"
            maxLength={NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby="display-name-hint"
            className="text-input"
          />
          <p id="display-name-hint" className="field-hint">
            The group sees this name on the leaderboard.
          </p>
        </div>

        <fieldset className="choice-group">
          <legend>Daily XP goal</legend>
          <p className="field-hint">
            XP is what you earn for finishing lessons and steps. Pick a goal you can reach most
            days.
          </p>
          <div className="choices">
            {GOALS.map((g) => (
              <label key={g.xp} className={`choice${goal === g.xp ? ' choice-selected' : ''}`}>
                <input
                  type="radio"
                  name="daily-goal"
                  value={g.xp}
                  checked={goal === g.xp}
                  onChange={() => setGoal(g.xp)}
                />
                <span className="choice-text">
                  <span className="choice-label">{g.xp} XP a day</span>
                  <span className="choice-detail">About {g.minutes} minutes</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="github-username">GitHub username (optional)</label>
          <input
            id="github-username"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            aria-describedby="github-username-hint"
            className="text-input"
          />
          <p id="github-username-hint" className="field-hint">
            We use it to check your projects on GitHub.
          </p>
        </div>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Start learning
        </button>
      </form>
    </div>
  );
}
