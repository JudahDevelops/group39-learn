/**
 * The sql runner. One PGlite (PostgreSQL in WebAssembly) lives in one module Web Worker and is
 * reused by every run (docs/SPIKE.md, S6):
 *
 *   run(files, tests) -> worker resets the database, runs setup.sql, then the learner's query.sql
 *   -> the tests run here, each query they make goes to the worker -> { results, firstFailure, sql }
 *
 * Every run starts from an empty database, so a Run and a Check never see each other's tables.
 *
 * A run (setup, the learner's code and every test) that lasts longer than the timeout terminates
 * the worker. Nothing else can stop a query that never ends, because PostgreSQL holds the worker's
 * only thread. The next run starts a fresh worker ("Restarting PostgreSQL", 3 to 6 s). Runs go one
 * at a time through a queue, since one database answers one request at a time; the timeout counts
 * only from the moment a run reaches the worker, never the time spent downloading PostgreSQL or
 * waiting behind another run.
 *
 * The worker is plain text imported with `?raw` and started from a Blob, so no bundler setting
 * decides whether it is a module worker.
 */
import type { TestCase } from '../../content/schema';
import type { Files, RunOutput, Runner, SqlOutput } from '../types';
import {
  BOOT_TIMEOUT_MS,
  MAX_ROWS,
  PGLITE_MODULE_URL,
  QUERY_FILE,
  RUN_TIMEOUT_MS,
  SETUP_FILE,
} from './config';
import { runTests, SqlError, toTestResults, type QueryResult, type TestDb } from './harness';
import {
  BOOT_FAILED_TEXT,
  BOOT_TIMEOUT_TEXT,
  NO_QUERY_TEXT,
  WORKER_CRASHED_TEXT,
  describeSetupError,
  describeSqlError,
  timeoutText,
} from './messages';
import { sqlStatus, type StatusStore } from './status';
import type { RunReply, SqlErrorInfo } from './worker';
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

type Stage = 'download' | 'start';

interface Hooks {
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

type QueryReply = ({ ok: true } & QueryResult) | { ok: false; error: SqlErrorInfo };

/** An error whose message is already the sentence the learner should read. */
class PlainError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function failure(error: string, sql?: SqlOutput): RunOutput {
  const out: RunOutput = { results: [], firstFailure: null, logs: [], error };
  if (sql) out.sql = sql;
  return out;
}

/**
 * The files the runner reads: setup.sql (optional) and the learner's code. The code is query.sql,
 * or failing that the first other .sql file.
 */
export function pickFiles(files: Files): {
  setup: string | null;
  query: string | null;
  queryFile: string;
} {
  const setup = files[SETUP_FILE] ?? null;
  const queryFile =
    QUERY_FILE in files
      ? QUERY_FILE
      : (Object.keys(files).find((name) => name !== SETUP_FILE && /\.sql$/i.test(name)) ??
        QUERY_FILE);
  return { setup, query: files[queryFile] ?? null, queryFile };
}

function isRunReply(value: unknown): value is RunReply {
  return isRecord(value) && typeof value.ok === 'boolean';
}

// ---------------------------------------------------------------------------

export interface SqlRunner extends Runner {
  /** Starts loading PostgreSQL now, so the first run does not wait. Safe to call again. */
  warm(): void;
  /** Stops the worker. The next run starts a new one. */
  dispose(): void;
}

export interface SqlRunnerOptions {
  host?: WorkerHost;
  status?: StatusStore;
  bootTimeoutMs?: number;
}

export function createSqlRunner(options: SqlRunnerOptions = {}): SqlRunner {
  const host = options.host ?? blobWorkerHost;
  const status = options.status ?? sqlStatus;
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
    if (data.type === 'stage') call.onStage?.(data.stage as Stage);
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
      // A test that was still waiting when the check was stopped must not hang.
      if (h.dead) {
        reject(new PlainError(WORKER_CRASHED_TEXT));
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
    worker.onerror = () => kill(h, BOOT_FAILED_TEXT);
    status.set(restarting ? 'restarting' : status.get().firstTime ? 'downloading' : 'starting');
    const timer = setTimeout(() => kill(h, BOOT_TIMEOUT_TEXT), bootTimeoutMs);
    try {
      await request(h, (id) => ({ id, type: 'init', moduleURL: PGLITE_MODULE_URL }), {
        onStage(stage) {
          if (stage !== 'download' && status.get().phase === 'downloading') {
            status.set('starting');
          }
        },
      });
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

  /** The `db` the tests get: each query is one message to the worker. */
  function databaseFor(h: Handle): TestDb {
    return {
      async query(sql, params) {
        if (typeof sql !== 'string') throw new TypeError('db.query needs the SQL as a string.');
        const reply = await request<QueryReply>(h, (id) => ({ id, type: 'query', sql, params }));
        if (!reply.ok) throw new SqlError(reply.error);
        return { rows: reply.rows, fields: reply.fields };
      },
    };
  }

  /** setup.sql, the learner's code, then the tests, on one database. */
  async function check(
    h: Handle,
    picked: { setup: string | null; query: string; queryFile: string },
    tests: TestCase[],
    isStopped: () => boolean,
  ): Promise<RunOutput> {
    const reply = await request<unknown>(h, (id) => ({
      id,
      type: 'run',
      setup: picked.setup,
      code: picked.query,
      maxRows: MAX_ROWS,
    }));
    if (!isRunReply(reply)) return failure('PostgreSQL did not return a result. Try again.');
    if (!reply.ok) {
      return failure(
        reply.phase === 'setup'
          ? describeSetupError(reply.error, picked.setup ?? '', SETUP_FILE)
          : describeSqlError(reply.error, picked.queryFile, picked.query),
      );
    }
    const sql: SqlOutput = { table: reply.table, empty: reply.empty };
    if (tests.length === 0) return { results: [], firstFailure: null, logs: [], sql };

    const outcomes = await runTests(
      tests.map((t) => t.code),
      { db: databaseFor(h), code: picked.query, shouldStop: isStopped },
    );
    const results = toTestResults(tests, outcomes);
    const firstFailure = results.findIndex((r) => !r.ok);
    return { results, firstFailure: firstFailure === -1 ? null : firstFailure, logs: [], sql };
  }

  async function execute(files: Files, tests: TestCase[], timeoutMs: number): Promise<RunOutput> {
    const { setup, query, queryFile } = pickFiles(files);
    if (query === null) return failure(NO_QUERY_TEXT);

    let h: Handle;
    try {
      h = await ensure();
    } catch (error) {
      return failure(error instanceof Error ? error.message : BOOT_FAILED_TEXT);
    }

    status.set('running');
    let stopped = false;
    const work = check(h, { setup, query, queryFile }, tests, () => stopped);
    // The caller may stop waiting (a timeout) before this settles; that must not be an unhandled rejection.
    work.catch(() => undefined);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    });
    try {
      const outcome = await Promise.race([work, stop]);
      if (outcome === 'timeout') {
        stopped = true;
        kill(h, timeoutText(timeoutMs));
        replaced = true;
        status.set('idle');
        return failure(timeoutText(timeoutMs));
      }
      status.set('ready');
      return outcome;
    } catch (error) {
      if (h.dead) {
        replaced = true;
        status.set('idle');
        return failure(error instanceof Error ? error.message : WORKER_CRASHED_TEXT);
      }
      status.set('ready');
      const detail = error instanceof Error ? error.message.trim().split('\n').pop() : '';
      return failure(
        `PostgreSQL could not check your query${detail ? `: ${detail}` : ''}. Try again.`,
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
export const sqlRunner: SqlRunner = createSqlRunner();
