/**
 * The fastapi runner. The learner's files are written under /app in a Pyodide interpreter (a module
 * Web Worker shared in kind with the python runner, ../pyodide/session.ts), and `app` is imported
 * from main.py fresh for every Run and every Check (docs/SPIKE.md, S2 to S5):
 *
 *   run(files, tests) -> worker writes the files, imports the app, starts it, runs each test as async
 *   Python with `client` bound to the app -> { results, firstFailure, logs, fastapi: { routes } }
 *   send(request)     -> one request to the app the last run loaded -> { status, body, ... }
 *
 * Plain `def` handlers work because the harness runs anyio's thread calls in place (snag 1). A Run,
 * a Check or a request that lasts longer than the timeout terminates the worker, and the next one
 * starts a fresh worker ("Restarting the FastAPI runner"). The app is gone after that: Send says so
 * until the learner runs the code again.
 */
import type { TestCase } from '../../content/schema';
import { blobWorkerHost } from '../pyodide/host';
import { createSession, isRecord, type WorkerHost, type WorkerLike } from '../pyodide/session';
import pythonHarness from '../python/harness.py?raw';
import type {
  Files,
  HttpOutcome,
  HttpRequest,
  RouteInfo,
  RunOutput,
  Runner,
  TestResult,
} from '../types';
import {
  BOOT_TIMEOUT_MS,
  ENTRY_FILE,
  PIP_PACKAGES,
  PYODIDE_INDEX_URL,
  PYODIDE_PACKAGES,
  RUN_TIMEOUT_MS,
} from './config';
import harnessSource from './harness.py?raw';
import {
  BOOT_FAILED_TEXT,
  BOOT_TIMEOUT_TEXT,
  NOT_RUNNING_TEXT,
  NO_MAIN_TEXT,
  WORKER_CRASHED_TEXT,
  bodyProblem,
  describeAppError,
  failureMessage,
  normalizePath,
  timeoutText,
  type PyError,
} from './messages';
import { fastapiStatus, type StatusStore } from './status';

export type { WorkerHost, WorkerLike };

/** The python harness comes first: this runner's harness uses its helpers and shares its namespace. */
const HARNESS = `${pythonHarness}\n\n${harnessSource}`;

// ---------------------------------------------------------------------------
// Messages

interface HarnessResult {
  error: PyError | null;
  routes: RouteInfo[];
  results: { ok: boolean; detail: string | null; error: PyError | null }[];
}

type SendReply =
  | { kind: 'no-app' }
  | { kind: 'bad-body'; message: string }
  | {
      kind: 'reply';
      status: number;
      reason: string;
      contentType: string | null;
      location: string | null;
      body: string;
      truncated: boolean;
      ms: number;
      error: PyError | null;
    };

/** Stops showing run output after this many lines, so a print loop cannot fill the page. */
const MAX_LOG_LINES = 2000;

function addLog(logs: string[], text: string) {
  if (logs.length < MAX_LOG_LINES) logs.push(text);
  else if (logs.length === MAX_LOG_LINES) logs.push('[More output was not shown.]');
}

function toRunOutput(result: HarnessResult, tests: TestCase[], logs: string[]): RunOutput {
  if (result.error) {
    return { results: [], firstFailure: null, logs, error: describeAppError(result.error) };
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
  return {
    results,
    firstFailure: firstFailure === -1 ? null : firstFailure,
    logs,
    fastapi: { routes: Array.isArray(result.routes) ? result.routes : [] },
  };
}

function failure(error: string, logs: string[] = []): RunOutput {
  return { results: [], firstFailure: null, logs, error };
}

const notice = (text: string, appGone: boolean): HttpOutcome => ({
  kind: 'notice',
  text,
  appGone,
});

// ---------------------------------------------------------------------------

export interface FastapiRunner extends Runner {
  /** Sends one request to the app the last run loaded. */
  send(request: HttpRequest, options?: { timeoutMs?: number }): Promise<HttpOutcome>;
  /** Starts loading the runner now, so the first run does not wait. Safe to call again. */
  warm(): void;
  /** Stops the worker. The next run starts a new one. */
  dispose(): void;
}

export interface FastapiRunnerOptions {
  host?: WorkerHost;
  status?: StatusStore;
  bootTimeoutMs?: number;
}

export function createFastapiRunner(options: FastapiRunnerOptions = {}): FastapiRunner {
  const session = createSession({
    host: options.host ?? blobWorkerHost,
    status: options.status ?? fastapiStatus,
    bootTimeoutMs: options.bootTimeoutMs ?? BOOT_TIMEOUT_MS,
    initMessage: () => ({
      indexURL: PYODIDE_INDEX_URL,
      harness: HARNESS,
      packages: PYODIDE_PACKAGES,
      pip: PIP_PACKAGES,
      after: 'g39_prepare()',
    }),
    bootFailedText: BOOT_FAILED_TEXT,
    bootTimeoutText: BOOT_TIMEOUT_TEXT,
    workerCrashedText: WORKER_CRASHED_TEXT,
  });

  function execute(files: Files, tests: TestCase[], timeoutMs: number): Promise<RunOutput> {
    if (!(ENTRY_FILE in files)) return Promise.resolve(failure(NO_MAIN_TEXT));
    const logs: string[] = [];
    return session.execute<RunOutput>({
      timeoutMs,
      work: async (h) => {
        const outcome = await session.request<HarnessResult>(
          h,
          (id) => ({
            id,
            type: 'run',
            fn: 'g39_fastapi_run',
            payload: { files, tests: tests.map((t) => t.code) },
          }),
          { onOut: (text) => addLog(logs, text) },
        );
        if (!isRecord(outcome) || !Array.isArray((outcome as Partial<HarnessResult>).results)) {
          return failure('The FastAPI runner did not return a result. Try again.', logs);
        }
        return toRunOutput(outcome, tests, logs);
      },
      unavailable: (message) => failure(message),
      stopped: () => failure(timeoutText(timeoutMs), logs),
      lost: (message) => failure(message, logs),
      failed: (detail) =>
        failure(
          `The FastAPI runner could not check your code${detail ? `: ${detail}` : ''}. Try again.`,
          logs,
        ),
    });
  }

  function send(request: HttpRequest, timeoutMs: number): Promise<HttpOutcome> {
    const problem = bodyProblem(request.body);
    if (problem) return Promise.resolve(notice(problem, false));
    // Decided in the queue, so a Run that was started first has finished (or stopped the worker).
    return session.enqueue(() => {
      if (!session.current()) return Promise.resolve(notice(NOT_RUNNING_TEXT, true));
      const logs: string[] = [];
      return session.execute<HttpOutcome>({
        timeoutMs,
        work: async (h) => {
          const reply = await session.request<SendReply>(
            h,
            (id) => ({
              id,
              type: 'run',
              fn: 'g39_fastapi_send',
              payload: {
                method: request.method,
                path: normalizePath(request.path),
                body: request.body,
              },
            }),
            { onOut: (text) => addLog(logs, text) },
          );
          if (!isRecord(reply)) return notice('The app did not answer. Try again.', false);
          if (reply.kind === 'no-app') return notice(NOT_RUNNING_TEXT, true);
          if (reply.kind === 'bad-body') {
            return notice(
              `The body is not valid JSON (${reply.message}). Fix it, then send again.`,
              false,
            );
          }
          return {
            kind: 'reply',
            status: reply.status,
            reason: reply.reason,
            contentType: reply.contentType,
            location: reply.location,
            body: reply.body,
            truncated: reply.truncated,
            ms: reply.ms,
            logs,
            error: reply.error ? describeAppError(reply.error) : null,
          };
        },
        unavailable: (message) => notice(message, true),
        stopped: () => notice(timeoutText(timeoutMs), true),
        lost: (message) => notice(message, true),
        failed: (detail) =>
          notice(`The request could not be sent${detail ? `: ${detail}` : ''}. Try again.`, false),
      });
    });
  }

  return {
    run(files, tests, runOptions) {
      const timeoutMs = runOptions?.timeoutMs ?? RUN_TIMEOUT_MS;
      return session.enqueue(() => execute(files, tests, timeoutMs));
    },
    send: (request, sendOptions) => send(request, sendOptions?.timeoutMs ?? RUN_TIMEOUT_MS),
    warm: () => session.warm(),
    dispose: () => session.dispose(),
  };
}

/** The runner the app uses. */
export const fastapiRunner: FastapiRunner = createFastapiRunner();
