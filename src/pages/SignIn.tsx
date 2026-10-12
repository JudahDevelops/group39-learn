import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearPasswordSetupPending, hadBadEmailLink } from '../store/authLanding';
import { isSupabaseConfigured } from '../store/config';
import { useCurrentUser, useStore } from '../store/StoreContext';

/** Where RequireAuth was sending the person before it stopped them here. */
function destination(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';
}

export function SignIn() {
  const store = useStore();
  const user = useCurrentUser();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Signed in already, or just now: the route guard decides what comes next.
  if (user) return <Navigate to={destination(location.state)} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter your email to sign in.');
      return;
    }
    if (!password) {
      setError('Enter your password to sign in.');
      return;
    }
    setBusy(true);
    try {
      await store.signIn(email.trim(), password);
      // They typed a password, so they have one: drop any leftover "set a password" prompt.
      clearPasswordSetupPending();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That email and password don't match. Check both and try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Sign in</h1>
      {isSupabaseConfigured() ? (
        <p>Use the email address Judah invited you with.</p>
      ) : (
        <p>
          Dev mode: any email and password sign you in on this device. Nothing is sent anywhere.
        </p>
      )}
      {hadBadEmailLink() && (
        <p role="alert" className="form-error">
          That link has expired or was already used. Ask Judah to send you a new invite.
        </p>
      )}
      <form onSubmit={handleSubmit} className="signin-form" noValidate>
        <div className="field">
          <label htmlFor="signin-email">Email</label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="field">
          <label htmlFor="signin-password">Password</label>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-input"
          />
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Sign in
        </button>
      </form>
    </div>
  );
}
