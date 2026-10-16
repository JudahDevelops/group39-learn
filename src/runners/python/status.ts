/**
 * What the Python runner is doing right now, for the note beside the Run button. The runner writes
 * it; the Output pane, the Try it box and the lesson notice read it.
 */
import { useSyncExternalStore } from 'react';
import { LOADED_FLAG_KEY } from './config';
import type { PythonPhase, PythonStatus } from './messages';

/** The part of localStorage the runner needs. Reads and writes may throw (private mode); callers cope. */
export interface FlagStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StatusStore {
  get(): PythonStatus;
  set(phase: PythonPhase): void;
  /** Python has now loaded on this device. */
  markLoaded(): void;
  subscribe(listener: () => void): () => void;
}

function browserStorage(): FlagStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function wasLoaded(storage: FlagStorage | null): boolean {
  try {
    return storage?.getItem(LOADED_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function createStatusStore(storage: FlagStorage | null = browserStorage()): StatusStore {
  let status: PythonStatus = { phase: 'idle', firstTime: !wasLoaded(storage) };
  const listeners = new Set<() => void>();
  const publish = (next: PythonStatus) => {
    status = next;
    listeners.forEach((listener) => listener());
  };
  return {
    get: () => status,
    set(phase) {
      if (phase !== status.phase) publish({ ...status, phase });
    },
    markLoaded() {
      try {
        storage?.setItem(LOADED_FLAG_KEY, '1');
      } catch {
        // The note is shown again next time; nothing else depends on it.
      }
      if (status.firstTime) publish({ ...status, firstTime: false });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The store the app uses. */
export const pythonStatus: StatusStore = createStatusStore();

export function usePythonStatus(store: StatusStore = pythonStatus): PythonStatus {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
