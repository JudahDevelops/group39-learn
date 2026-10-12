import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isPasswordSetupPending } from '../store/authLanding';
import { useCurrentUser } from '../store/StoreContext';

/**
 * Wraps every route except /signin and /set-password. In order:
 * 1. Nobody signed in: go to /signin, remembering where they were headed.
 * 2. Arrived from an invite or recovery link and has not saved a password: /set-password.
 * 3. Signed in but no display name yet: /onboarding.
 * 4. Already has a display name and asks for /onboarding: home.
 * Both stores go through here, so dev mode behaves like the real thing.
 */
export function RequireAuth() {
  const user = useCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  if (isPasswordSetupPending()) {
    return <Navigate to="/set-password" replace />;
  }
  const onboarded = user.displayName.trim() !== '';
  const onOnboarding = location.pathname === '/onboarding';
  if (!onboarded && !onOnboarding) return <Navigate to="/onboarding" replace />;
  if (onboarded && onOnboarding) return <Navigate to="/" replace />;
  return <Outlet />;
}
