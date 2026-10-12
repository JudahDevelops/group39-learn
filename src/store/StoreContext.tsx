import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import './authLanding'; // must load before the Supabase client is created: it reads the URL hash
import { supabaseConfig } from './config';
import { LocalStore } from './LocalStore';
import { SupabaseStore } from './SupabaseStore';
import type { ProgressStore, Profile } from './types';

const StoreContext = createContext<ProgressStore | null>(null);

/** SupabaseStore when both VITE_SUPABASE_* variables are set, LocalStore (dev mode) otherwise. */
function createStore(): ProgressStore {
  const config = supabaseConfig();
  return config ? new SupabaseStore(config.url, config.anonKey) : new LocalStore();
}

// One store for the page's lifetime. React StrictMode runs initialisers twice in development,
// and two Supabase clients would fight over the same stored session.
let shared: ProgressStore | null = null;
function sharedStore(): ProgressStore {
  shared ??= createStore();
  return shared;
}

/**
 * Provides a ProgressStore to the app. Waits for store.init() (session restore) to resolve
 * before rendering children, so getCurrentUser() is reliable the moment any screen reads it.
 * `store` is for tests that want to supply their own.
 */
export function StoreProvider({
  children,
  store: provided,
}: {
  children: ReactNode;
  store?: ProgressStore;
}) {
  const store = useMemo<ProgressStore>(() => provided ?? sharedStore(), [provided]);
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
