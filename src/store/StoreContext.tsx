import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocalStore } from './LocalStore';
import type { ProgressStore, Profile } from './types';

const StoreContext = createContext<ProgressStore | null>(null);

/**
 * Provides a ProgressStore to the app. Always LocalStore for now; swapping in
 * SupabaseStore later only touches this file. Waits for store.init() (session
 * restore) to resolve before rendering children, so getCurrentUser() is
 * reliable the moment any screen reads it.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useMemo<ProgressStore>(() => new LocalStore(), []);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    store.init().then(
      () => {
        if (!cancelled) setReady(true);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [store]);

  if (failed) {
    return (
      <p role="alert" className="boot-error">
        Your session could not be restored. Reload the page to try again.
      </p>
    );
  }
  if (!ready) return null;

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): ProgressStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
}

/** The signed-in profile (or null), kept current through onAuthChange. */
export function useCurrentUser(): Profile | null {
  const store = useStore();
  const [user, setUser] = useState<Profile | null>(() => store.getCurrentUser());
  useEffect(() => store.onAuthChange(setUser), [store]);
  return user;
}
