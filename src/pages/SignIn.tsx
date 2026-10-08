import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';

export function SignIn() {
  const store = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign in failed. Check your details and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Sign in</h1>
      <p>Dev mode: any email and password sign you in on this device. Nothing is sent anywhere.</p>
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
