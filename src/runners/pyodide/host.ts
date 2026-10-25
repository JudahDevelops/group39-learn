import { createBlobHost, type WorkerHost } from './session';
import workerSource from './worker.js?raw';

/** The real Pyodide worker: a module worker started from worker.js as a Blob. */
export const blobWorkerHost: WorkerHost = createBlobHost(workerSource);
