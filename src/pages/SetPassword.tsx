import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearPasswordSetupPending } from '../store/authLanding';
import { useCurrentUser, useStore } from '../store/StoreContext';

const MIN_LENGTH = 8;

/**
 * Where invite and recovery links land. By the time this renders, supabase-js has read the
 * session out of the URL, so a person with a good link is already signed in. Someone who is
 * signed in can also open it later to change their password.
 */
export function SetPassword() {
  const store = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <div className="page">
        <h1>This link has expired</h1>
        <p>
          Invite and reset links work once, and only for a short time. Ask Judah to send you a new
          one, or <Link to="/signin">sign in</Link> if you already have a password.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== again) {
      setError("The two passwords don't match. Type the same password in both boxes.");
      return;
    }
    setBusy(true);
    try {
      await store.setPassword(password);
      clearPasswordSetupPending();
      // New members have no display name yet and land on onboarding; others are sent home.
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your password wasn't saved. Try again, and tell Judah if it keeps happening.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Set your password</h1>
      <p>You will use this password with your email address to sign in.</p>
      <form onSubmit={handleSubmit} className="signin-form" noValidate>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="new-password-hint"
            className="text-input"
          />
          <p id="new-password-hint" className="field-hint">
            At least {MIN_LENGTH} characters.
          </p>
        </div>
        <div className="field">
          <label htmlFor="new-password-again">Type it again</label>
          <input
            id="new-password-again"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            className="text-input"
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          Show password
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Save password
        </button>
      </form>
    </div>
  );
}
