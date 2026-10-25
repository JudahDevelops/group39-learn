/**
 * One Pyodide interpreter in one module Web Worker, shared by the python and fastapi runners
 * (docs/SPIKE.md, S1 and S5). A runner supplies what differs: the init message (which packages, which
 * harness) and what to say when something goes wrong. The session supplies the rest:
 *
 *   - the worker, started from a Blob so no bundler setting decides whether it is a module worker
 *   - the message protocol (see worker.js): requests with ids, streamed output, stages
 *   - one job at a time through a queue, since one worker answers one request at a time
 *   - boot with a "downloading", "starting", "restarting" status and a boot timeout
 *   - the stop: a job that lasts longer than the timeout terminates the worker, because Python holds
 *     the worker's only thread and nothing else can stop a loop that never ends. The next job starts
 *     a fresh worker (4 to 6 s). The timeout counts only from the moment a job reaches the worker,
 *     never the time spent downloading or waiting behind another job.
 */
import type { StatusStore } from './status';

// ---------------------------------------------------------------------------
// The worker, behind a small interface so tests can stand in for it

export interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export interface WorkerHost {
  create(): WorkerLike;
}

/** The real thing: a module worker started from `source` as a Blob. */
export function createBlobHost(source: string): WorkerHost {
  return {
    create() {
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      const worker = new Worker(url, { type: 'module' });
      const adapter: WorkerLike = {
        postMessage: (message) => worker.postMessage(message),
        terminate() {
          worker.terminate();
          URL.revokeObjectURL(url);
        },
        onmessage: null,
        onerror: null,
      };
      worker.onmessage = (event: MessageEvent) => adapter.onmessage?.({ data: event.data });
      worker.onerror = (event) => adapter.onerror?.(event);
      return adapter;
    },
  };
}

// ---------------------------------------------------------------------------
// Requests

export type Stage = 'download' | 'start' | 'prepare';

export interface Hooks {
  onOut?(text: string): void;
  onStage?(stage: Stage): void;
}

interface Call extends Hooks {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

export interface Handle {
  worker: WorkerLike;
  nextId: number;
  calls: Map<number, Call>;
  dead: boolean;
}

/** An error whose message is already the sentence the learner should read. */
export class PlainError extends Error {}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// ---------------------------------------------------------------------------

export interface SessionOptions {
  host: WorkerHost;
  status: StatusStore;
  bootTimeoutMs: number;
  /** The init message for a new worker, without its `id` and `type`. */
  initMessage(): Record<string, unknown>;
  bootFailedText: string;
  bootTimeoutText: string;
  workerCrashedText: string;
}

/** What `execute` does for one job, and what it answers when the job cannot finish normally. */
export interface Execution<T> {
  timeoutMs: number;
  /** Sends the job's requests and turns the replies into the answer. */
  work(h: Handle): Promise<T>;
  /** The worker could not be started. */
  unavailable(message: string): T;
  /** The job ran past the timeout and the worker was terminated. */
  stopped(): T;
  /** The worker died during the job. */
  lost(message: string): T;
  /** The worker is fine but the job's request failed. `detail` is the last line of what it said. */
  failed(detail: string): T;
}

export interface Session {
  /** Runs `job` after every earlier job has finished. */
  enqueue<T>(job: () => Promise<T>): Promise<T>;
  /** The running worker, or null when there is none (never started, stopped, or crashed). */
  current(): Handle | null;
  request<T>(h: Handle, build: (id: number) => object, hooks?: Hooks): Promise<T>;
  execute<T>(execution: Execution<T>): Promise<T>;
  /** Starts the worker now. Safe to call again. */
  warm(): void;
  /** Stops the worker. The next job starts a new one. */
  dispose(): void;
}

export function createSession(options: SessionOptions): Session {
  const { host, status, bootTimeoutMs } = options;

  let handle: Handle | null = null;
  let booting: Promise<Handle> | null = null;
  /** True after a worker was stopped: the next start is a restart, not a first start. */
  let replaced = false;
  let queue: Promise<unknown> = Promise.resolve();

  function dispatch(h: Handle, data: unknown) {
    if (!isRecord(data) || typeof data.id !== 'number') return;
    const call = h.calls.get(data.id);
    if (!call) return;
    if (data.type === 'out' && typeof data.text === 'string') call.onOut?.(data.text);
    else if (data.type === 'stage') call.onStage?.(data.stage as Stage);
    else if (data.type === 'done') {
      h.calls.delete(data.id);
      call.resolve(data.result);
    } else if (data.type === 'fail') {
      h.calls.delete(data.id);
      call.reject(new Error(String(data.error)));
    }
  }

  /** Terminates the worker and fails every request still waiting on it. */
  function kill(h: Handle, reason: string) {
    if (h.dead) return;
    h.dead = true;
    h.worker.terminate();
    if (handle === h) handle = null;
    const pending = [...h.calls.values()];
    h.calls.clear();
    for (const call of pending) call.reject(new PlainError(reason));
  }

  function request<T>(h: Handle, build: (id: number) => object, hooks: Hooks = {}): Promise<T> {
    const promise = new Promise<T>((resolve, reject) => {
      // A request made after the worker was stopped must not wait for an answer that cannot come.
      if (h.dead) {
        reject(new PlainError(options.workerCrashedText));
        return;
      }
      const id = h.nextId++;
      h.calls.set(id, { ...hooks, resolve: resolve as (value: unknown) => void, reject });
      h.worker.postMessage(build(id));
    });
    // The caller may stop waiting (a timeout) before this settles; that must not be an unhandled rejection.
    promise.catch(() => undefined);
    return promise;
  }

  async function start(restarting: boolean): Promise<Handle> {
    const worker = host.create();
    const h: Handle = { worker, nextId: 1, calls: new Map(), dead: false };
    worker.onmessage = (event) => dispatch(h, event.data);
    worker.onerror = () => kill(h, options.bootFailedText);
    status.set(restarting ? 'restarting' : status.get().firstTime ? 'downloading' : 'starting');
    const timer = setTimeout(() => kill(h, options.bootTimeoutText), bootTimeoutMs);
    try {
      await request(h, (id) => ({ id, type: 'init', ...options.initMessage() }), {
        onStage(stage) {
          if (stage !== 'download' && status.get().phase === 'downloading') {
            status.set('starting');
          }
        },
      });
    } catch (error) {
      clearTimeout(timer);
      kill(h, options.bootFailedText);
      status.set('idle');
      throw error instanceof PlainError ? error : new PlainError(options.bootFailedText);
    }
    clearTimeout(timer);
    if (h.dead) {
      status.set('idle');
      throw new PlainError(options.bootFailedText);
    }
    worker.onerror = () => {
      kill(h, options.workerCrashedText);
      replaced = true;
      status.set('idle');
    };
    handle = h;
    status.markLoaded();
    status.set('ready');
    return h;
  }

  function ensure(): Promise<Handle> {
    if (handle && !handle.dead) return Promise.resolve(handle);
    booting ??= start(replaced)
      .then((h) => {
        replaced = false;
        return h;
      })
      .finally(() => {
        booting = null;
      });
    return booting;
  }

  async function execute<T>(execution: Execution<T>): Promise<T> {
    let h: Handle;
    try {
      h = await ensure();
    } catch (error) {
      return execution.unavailable(error instanceof Error ? error.message : options.bootFailedText);
    }

    status.set('running');
    const work = execution.work(h);
    // The caller may stop waiting (a timeout) before this settles; that must not be an unhandled rejection.
    work.catch(() => undefined);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), execution.timeoutMs);
    });
    try {
      const outcome = await Promise.race([work, stop]);
      if (outcome === 'timeout') {
        kill(h, 'stopped');
        replaced = true;
        status.set('idle');
        return execution.stopped();
      }
      status.set('ready');
      return outcome;
    } catch (error) {
      if (h.dead) {
        replaced = true;
        status.set('idle');
        return execution.lost(error instanceof Error ? error.message : options.workerCrashedText);
      }
      status.set('ready');
      const detail = error instanceof Error ? (error.message.trim().split('\n').pop() ?? '') : '';
      return execution.failed(detail);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    enqueue<T>(job: () => Promise<T>): Promise<T> {
      const next = queue.then(job);
      queue = next.catch(() => undefined);
      return next;
    },
    current: () => (handle && !handle.dead ? handle : null),
    request,
    execute,
    warm() {
      ensure().catch(() => undefined);
    },
    dispose() {
      if (handle) kill(handle, options.workerCrashedText);
      replaced = false;
      status.set('idle');
    },
  };
}
