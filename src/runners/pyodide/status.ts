/**
 * What a Pyodide runner (python, fastapi) is doing right now, for the note beside the Run button.
 * The runner writes it; the output pane, the Try it box and the lesson notice read it. One store per
 * runner: each has its own "has loaded on this device" flag, because each downloads different files.
 */
import { useSyncExternalStore } from 'react';

export type Phase = 'idle' | 'downloading' | 'starting' | 'ready' | 'running' | 'restarting';

export interface RuntimeStatus {
  phase: Phase;
  /** True until the runner has loaded once on this device. */
  firstTime: boolean;
}

/** The part of localStorage the runner needs. Reads and writes may throw (private mode); callers cope. */
export interface FlagStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StatusStore {
  get(): RuntimeStatus;
  set(phase: Phase): void;
  /** The runner has now loaded on this device. */
  markLoaded(): void;
  subscribe(listener: () => void): () => void;
}

export function browserStorage(): FlagStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function wasLoaded(storage: FlagStorage | null, key: string): boolean {
  try {
    return storage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function createStatusStore(storage: FlagStorage | null, loadedFlagKey: string): StatusStore {
  let status: RuntimeStatus = { phase: 'idle', firstTime: !wasLoaded(storage, loadedFlagKey) };
  const listeners = new Set<() => void>();
  const publish = (next: RuntimeStatus) => {
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
        storage?.setItem(loadedFlagKey, '1');
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

export function useRuntimeStatus(store: StatusStore): RuntimeStatus {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
