/**
 * The python runner. One Pyodide interpreter lives in one module Web Worker and is reused by every
 * run (docs/SPIKE.md, S1 and S5):
 *
 *   run(files, tests) -> worker writes the files, runs main.py, runs each test on a fresh namespace
 *   -> { results, firstFailure, logs, error? }
 *
 * The worker, the queue, the boot status and the 5 s stop are shared with the fastapi runner
 * (../pyodide/session.ts). A run that lasts longer than the timeout terminates the worker; the next
 * run starts a fresh one ("Restarting Python", 4 to 6 s).
 *
 * The worker and the Python harness are plain text imported with `?raw`, and the worker starts from
 * a Blob, so no bundler setting decides whether it is a module worker.
 */
import type { TestCase } from '../../content/schema';
import { blobWorkerHost } from '../pyodide/host';
import { createSession, isRecord, type WorkerHost, type WorkerLike } from '../pyodide/session';
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

export type { WorkerHost, WorkerLike };

// ---------------------------------------------------------------------------
// Messages

interface HarnessResult {
  error: PyError | null;
  results: { ok: boolean; detail: string | null; error: PyError | null }[];
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
  const session = createSession({
    host: options.host ?? blobWorkerHost,
    status: options.status ?? pythonStatus,
    bootTimeoutMs: options.bootTimeoutMs ?? BOOT_TIMEOUT_MS,
    initMessage: () => ({ indexURL: PYODIDE_INDEX_URL, harness: harnessSource }),
    bootFailedText: BOOT_FAILED_TEXT,
    bootTimeoutText: BOOT_TIMEOUT_TEXT,
    workerCrashedText: WORKER_CRASHED_TEXT,
  });

  function execute(files: Files, tests: TestCase[], timeoutMs: number): Promise<RunOutput> {
    const logs: string[] = [];
    return session.execute<RunOutput>({
      timeoutMs,
      work: async (h) => {
        const outcome = await session.request<HarnessResult>(
          h,
          (id) => ({ id, type: 'run', payload: { files, tests: tests.map((t) => t.code) } }),
          {
            onOut(text) {
              if (logs.length < MAX_LOG_LINES) logs.push(text);
              else if (logs.length === MAX_LOG_LINES) logs.push('[More output was not shown.]');
            },
          },
        );
        if (!isRecord(outcome) || !Array.isArray((outcome as Partial<HarnessResult>).results)) {
          return failure('Python did not return a result. Try again.', logs);
        }
        return toRunOutput(outcome, tests, logs);
      },
      unavailable: (message) => failure(message),
      stopped: () => failure(timeoutText(timeoutMs), logs),
      lost: (message) => failure(message, logs),
      failed: (detail) =>
        failure(`Python could not check your code${detail ? `: ${detail}` : ''}. Try again.`, logs),
    });
  }

  return {
    run(files, tests, runOptions) {
      const timeoutMs = runOptions?.timeoutMs ?? RUN_TIMEOUT_MS;
      return session.enqueue(() => execute(files, tests, timeoutMs));
    },
    warm: () => session.warm(),
    dispose: () => session.dispose(),
  };
}

/** The runner the app uses. */
export const pythonRunner: PythonRunner = createPythonRunner();
