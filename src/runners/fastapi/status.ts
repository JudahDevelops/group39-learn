/**
 * What the FastAPI runner is doing right now, for the note beside the Run button. The runner writes
 * it; the Requests pane, the Try it box and the lesson notice read it. The store itself is shared
 * with the Python runner (../pyodide/status.ts); the "has loaded" flag is this runner's own.
 */
import { LOADED_FLAG_KEY } from './config';
import {
  browserStorage,
  createStatusStore as createStore,
  useRuntimeStatus,
  type FlagStorage,
  type RuntimeStatus,
  type StatusStore,
} from '../pyodide/status';

export type { FlagStorage, StatusStore };

export function createStatusStore(storage: FlagStorage | null = browserStorage()): StatusStore {
  return createStore(storage, LOADED_FLAG_KEY);
}

/** The store the app uses. */
export const fastapiStatus: StatusStore = createStatusStore();

export function useFastapiStatus(store: StatusStore = fastapiStatus): RuntimeStatus {
  return useRuntimeStatus(store);
}
