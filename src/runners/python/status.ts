/**
 * What the Python runner is doing right now, for the note beside the Run button. The runner writes
 * it; the Output pane, the Try it box and the lesson notice read it. The store itself is shared with
 * the other Pyodide runner (../pyodide/status.ts).
 */
import { LOADED_FLAG_KEY } from './config';
import {
  browserStorage,
  createStatusStore as createStore,
  useRuntimeStatus,
  type FlagStorage,
  type StatusStore,
} from '../pyodide/status';
import type { PythonStatus } from './messages';

export type { FlagStorage, StatusStore };

export function createStatusStore(storage: FlagStorage | null = browserStorage()): StatusStore {
  return createStore(storage, LOADED_FLAG_KEY);
}

/** The store the app uses. */
export const pythonStatus: StatusStore = createStatusStore();

export function usePythonStatus(store: StatusStore = pythonStatus): PythonStatus {
  return useRuntimeStatus(store);
}
