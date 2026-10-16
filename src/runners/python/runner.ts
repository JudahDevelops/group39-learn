/**
 * The python runner. One Pyodide interpreter lives in one module Web Worker and is reused by every
 * run (docs/SPIKE.md, S1 and S5):
 *
 *   run(files, tests) -> worker writes the files, runs main.py, runs each test on a fresh namespace
 *   -> { results, firstFailure, logs, error? }
 *
 * A run that lasts longer than the timeout terminates the worker. Nothing else can stop a loop that
 * never ends, because Python holds the worker's only thread. The next run starts a fresh worker
 * ("Restarting Python", 4 to 6 s). Runs go one at a time through a queue, since one worker answers
 * one request at a time; the timeout counts only from the moment a run reaches the worker, never
 * the time spent downloading Python or waiting behind another run.
 *
 * The worker and the Python harness are plain text imported with `?raw`, and the worker starts from
 * a Blob, so no bundler setting decides whether it is a module worker.
 */
import type { TestCase } from '../../content/schema';
import type { Files, RunOutput, Runner, TestResult } from '../types';
import { BOOT_TIMEOUT_MS, PYODIDE_INDEX_URL, RUN_TIMEOUT_MS } from './config';
import harnessSource from './harness.py?raw';
import {
  BOOT_FAILED_TEXT,
  BOOT_TIMEOUT_TEXT,
  WORKER_CRASHED_TEXT,
  describeError,
  failureMessage,
  timeoutText,
  type PyError,
} from './messages';
import { pythonStatus, type StatusStore } from './status';
import workerSource from './worker.js?raw';

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

/** The real thing: a module worker started from the worker source as a Blob. */
export const blobWorkerHost: WorkerHost = {
  create() {
    const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
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

// ---------------------------------------------------------------------------
// Messages

interface HarnessResult {
  error: PyError | null;
  results: { ok: boolean; detail: string | null; error: PyError | null }[];
}

type Stage = 'download' | 'start' | 'prepare';

interface Hooks {
  onOut?(text: string): void;
  onStage?(stage: Stage): void;
}

interface Call extends Hooks {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

interface Handle {
  worker: WorkerLike;
  nextId: number;
  calls: Map<number, Call>;
  dead: boolean;
}

/** An error whose message is already the sentence the learner should read. */
class PlainError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Stops showing run output after this many lines, so a print loop cannot fill the page. */
const MAX_LOG_LINES = 2000;

function toRunOutput(result: HarnessResult, tests: TestCase[], logs: string[]): RunOutput {
  if (result.error) {
    return { results: [], firstFailure: null, logs, error: describeError(result.error) };
  }
  const results: TestResult[] = tests.map((test, i) => {
    const got = result.results[i];
    if (got?.ok) return { ok: true, message: test.text };
    const failed: TestResult = {
      ok: false,
      message: failureMessage(test.text, got?.error ?? null),
    };
    if (got?.detail) failed.detail = got.detail;
    return failed;
  });
  const firstFailure = results.findIndex((r) => !r.ok);
  return { results, firstFailure: firstFailure === -1 ? null : firstFailure, logs };
}

function failure(error: string, logs: string[] = []): RunOutput {
  return { results: [], firstFailure: null, logs, error };
}

// ---------------------------------------------------------------------------

export interface PythonRunner extends Runner {
  /** Starts loading Python now, so the first run does not wait. Safe to call again. */
  warm(): void;
  /** Stops the worker. The next run starts a new one. */
  dispose(): void;
}

export interface PythonRunnerOptions {
  host?: WorkerHost;
  status?: StatusStore;
  bootTimeoutMs?: number;
}

export function createPythonRunner(options: PythonRunnerOptions = {}): PythonRunner {
  const host = options.host ?? blobWorkerHost;
  const status = options.status ?? pythonStatus;
  const bootTimeoutMs = options.bootTimeoutMs ?? BOOT_TIMEOUT_MS;

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
    worker.onerror = () => kill(h, BOOT_FAILED_TEXT);
    status.set(restarting ? 'restarting' : status.get().firstTime ? 'downloading' : 'starting');
    const timer = setTimeout(() => kill(h, BOOT_TIMEOUT_TEXT), bootTimeoutMs);
    try {
      await request(
        h,
        (id) => ({ id, type: 'init', indexURL: PYODIDE_INDEX_URL, harness: harnessSource }),
        {
          onStage(stage) {
            if (stage !== 'download' && status.get().phase === 'downloading') {
              status.set('starting');
            }
          },
        },
      );
    } catch (error) {
      clearTimeout(timer);
      kill(h, BOOT_FAILED_TEXT);
      status.set('idle');
      throw error instanceof PlainError ? error : new PlainError(BOOT_FAILED_TEXT);
    }
    clearTimeout(timer);
    if (h.dead) {
      status.set('idle');
      throw new PlainError(BOOT_FAILED_TEXT);
    }
    worker.onerror = () => {
      kill(h, WORKER_CRASHED_TEXT);
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

  async function execute(files: Files, tests: TestCase[], timeoutMs: number): Promise<RunOutput> {
    let h: Handle;
    try {
      h = await ensure();
    } catch (error) {
      return failure(error instanceof Error ? error.message : BOOT_FAILED_TEXT);
    }

    status.set('running');
    const logs: string[] = [];
    const call = request<HarnessResult>(
      h,
      (id) => ({ id, type: 'run', payload: { files, tests: tests.map((t) => t.code) } }),
      {
        onOut(text) {
          if (logs.length < MAX_LOG_LINES) logs.push(text);
          else if (logs.length === MAX_LOG_LINES) logs.push('[More output was not shown.]');
        },
      },
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    });
    try {
      const outcome = await Promise.race([call, stop]);
      if (outcome === 'timeout') {
        kill(h, timeoutText(timeoutMs));
        replaced = true;
        status.set('idle');
        return failure(timeoutText(timeoutMs), logs);
      }
      status.set('ready');
      if (!isRecord(outcome) || !Array.isArray((outcome as Partial<HarnessResult>).results)) {
        return failure('Python did not return a result. Try again.', logs);
      }
      return toRunOutput(outcome, tests, logs);
    } catch (error) {
      if (h.dead) {
        replaced = true;
        status.set('idle');
        return failure(error instanceof Error ? error.message : WORKER_CRASHED_TEXT, logs);
      }
      status.set('ready');
      const detail = error instanceof Error ? error.message.trim().split('\n').pop() : '';
      return failure(
        `Python could not check your code${detail ? `: ${detail}` : ''}. Try again.`,
        logs,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    run(files, tests, runOptions) {
      const timeoutMs = runOptions?.timeoutMs ?? RUN_TIMEOUT_MS;
      const job = queue.then(() => execute(files, tests, timeoutMs));
      queue = job.catch(() => undefined);
      return job;
    },
    warm() {
      ensure().catch(() => undefined);
    },
    dispose() {
      if (handle) kill(handle, WORKER_CRASHED_TEXT);
      replaced = false;
      status.set('idle');
    },
  };
}

/** The runner the app uses. */
export const pythonRunner: PythonRunner = createPythonRunner();
