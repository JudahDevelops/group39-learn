/**
 * The short history of requests the Requests panel keeps for this session: the newest first, in
 * memory only, so it survives moving between panes but not a reload. The panel takes a store as a
 * prop so tests do not share one.
 */
import { useSyncExternalStore } from 'react';
import { MAX_HISTORY } from './config';

export interface HistoryEntry {
  id: number;
  method: string;
  path: string;
  body: string;
  /** The status code the app answered with, or null when no reply came back. */
  status: number | null;
}

export interface HistoryStore {
  get(): readonly HistoryEntry[];
  /** Adds a request at the top. Asking again for the same request replaces the last entry. */
  add(entry: Omit<HistoryEntry, 'id'>): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export function createHistory(max: number = MAX_HISTORY): HistoryStore {
  let entries: readonly HistoryEntry[] = [];
  let nextId = 1;
  const listeners = new Set<() => void>();
  const publish = (next: readonly HistoryEntry[]) => {
    entries = next;
    listeners.forEach((listener) => listener());
  };
  return {
    get: () => entries,
    add(entry) {
      const latest = entries[0];
      const same =
        latest !== undefined &&
        latest.method === entry.method &&
        latest.path === entry.path &&
        latest.body === entry.body;
      const rest = same ? entries.slice(1) : entries;
      publish([{ ...entry, id: nextId++ }, ...rest].slice(0, max));
    },
    clear() {
      if (entries.length > 0) publish([]);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The history the app uses. */
export const requestHistory: HistoryStore = createHistory();

export function useHistory(store: HistoryStore = requestHistory): readonly HistoryEntry[] {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
