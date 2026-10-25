/**
 * The sentences a learner reads when their app stops, a test fails with an error, a request cannot
 * be sent, or the FastAPI runner cannot load. Pure text in, text out, so it is unit-tested directly
 * (tests/unit/runner.fastapi.messages.test.ts).
 *
 * `RunOutput.error` is plain text (not HTML), so nothing here uses markup except `failureMessage`,
 * whose result is a test message (HTML). Python's own errors are described by ../python/messages.ts;
 * this file adds what is specific to an app: no `app`, a module the runner does not have.
 */
import type { Phase, RuntimeStatus } from '../pyodide/status';
import { describeError, escapeHtml, whereText, type PyError } from '../python/messages';
import { FASTAPI_DOWNLOAD_MB } from './config';

export { escapeHtml, timeoutText } from '../python/messages';
export type { PyError };

export const BOOT_FAILED_TEXT =
  'The FastAPI runner could not be downloaded. Check your internet connection, then try again.';
export const BOOT_TIMEOUT_TEXT =
  'The FastAPI runner took too long to load, so loading was stopped. Check your internet connection, then try again.';
export const WORKER_CRASHED_TEXT =
  'The FastAPI runner stopped working unexpectedly. Try again; it restarts by itself.';
export const NO_MAIN_TEXT = 'There is no main.py to run.';
export const NOT_RUNNING_TEXT = 'Your app is not running. Press Run to start it.';
export const STOPPED_TEXT = 'Your app was stopped. Press Run to start it again.';

// ---------------------------------------------------------------------------
// What went wrong, in plain words

const AVAILABLE =
  "This runner has FastAPI, pydantic, httpx, SQLAlchemy, bcrypt, PyJWT and Python's standard library.";

function moduleReason(err: PyError): string | null {
  if (err.type !== 'ModuleNotFoundError' && err.type !== 'ImportError') return null;
  const name = /No module named '(.+?)'/.exec(err.message)?.[1];
  if (!name) return null;
  return `The module "${name}" is not available here. Check the spelling, and the name of your own file. ${AVAILABLE}`;
}

/** The whole sentence a learner sees when their app stops, cannot be read, or has no `app`. */
export function describeAppError(err: PyError, context: 'run' | 'test' = 'run'): string {
  if (err.type === 'NoEntry' || err.type === 'NoApp') return err.message;
  const reason = moduleReason(err);
  if (reason === null) return describeError(err, context);
  const where = whereText(err);
  return context === 'test'
    ? `Python stopped while checking your code${where}. ${reason}`
    : `Your code stopped${where}. ${reason}`;
}

/**
 * The message for a failed test. A failed assert shows the test's own hint. Any other exception
 * keeps the hint and adds what Python said, in plain words.
 */
export function failureMessage(hint: string, error: PyError | null): string {
  if (!error) return hint;
  return `${hint} <span class="fa-reason">${escapeHtml(describeAppError(error, 'test'))}</span>`;
}

// ---------------------------------------------------------------------------
// Requests

/** Why the body box cannot be sent, or null when it is empty or valid JSON. */
export function bodyProblem(body: string): string | null {
  if (body.trim() === '') return null;
  try {
    JSON.parse(body);
    return null;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'it could not be read';
    return `The body is not valid JSON (${reason}). Fix it, then send again.`;
  }
}

/** The path as the app sees it: always starting with a slash. */
export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === '') return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

// ---------------------------------------------------------------------------
// The note beside the Run button

export type FastapiPhase = Phase;
export type FastapiStatus = RuntimeStatus;

/** What to tell the learner about the runner itself, or null when there is nothing to say. */
export function statusText(status: FastapiStatus): string | null {
  switch (status.phase) {
    case 'idle':
      return status.firstTime
        ? `The FastAPI runner needs about ${FASTAPI_DOWNLOAD_MB} MB, once. It downloads the first time your app runs.`
        : null;
    case 'downloading':
      return `Downloading the FastAPI runner, about ${FASTAPI_DOWNLOAD_MB} MB, once. This can take a while on a slow connection.`;
    case 'starting':
      return 'Starting the FastAPI runner. Nearly there.';
    case 'restarting':
      return 'Restarting the FastAPI runner after the stop. This takes a few seconds.';
    case 'ready':
    case 'running':
      return null;
  }
}
