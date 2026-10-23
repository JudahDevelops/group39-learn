/**
 * The sentences a learner reads when a query fails, when a check is stopped, or when PostgreSQL
 * cannot load. Pure text in, text out, so it is unit-tested directly
 * (tests/unit/runner.sql.messages.test.ts).
 *
 * `RunOutput.error` is plain text (not HTML), so nothing here uses markup. A PostgreSQL error keeps
 * its own wording: the learner reads the real message (docs/SPIKE.md, snag 8).
 */
import { RUN_TIMEOUT_MS, SQL_DOWNLOAD_MB } from './config';
import type { SqlErrorInfo } from './worker';

export type { SqlErrorInfo };

export function timeoutText(timeoutMs: number = RUN_TIMEOUT_MS): string {
  const seconds = Math.max(1, Math.round(timeoutMs / 1000));
  return `Your query ran for more than ${seconds} ${seconds === 1 ? 'second' : 'seconds'}, so it was stopped. Check for a join with no condition: it pairs every row with every other row.`;
}

export const BOOT_FAILED_TEXT =
  'PostgreSQL could not be downloaded. Check your internet connection, then try again.';
export const BOOT_TIMEOUT_TEXT =
  'PostgreSQL took too long to load, so loading was stopped. Check your internet connection, then try again.';
export const WORKER_CRASHED_TEXT =
  'PostgreSQL stopped working unexpectedly. Try again; it restarts by itself.';
export const NO_QUERY_TEXT = 'There is no query.sql file to run.';

// ---------------------------------------------------------------------------
// Where in the learner's code

/** The 1-based line of a 1-based character position in `text`. */
export function lineAt(text: string, position: number): number {
  const before = text.slice(0, Math.max(0, position - 1));
  return before.split('\n').length;
}

function sentence(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * The whole text for a failed statement: PostgreSQL's message, the line it points at, then its
 * detail and hint when it gives them. `file` names where `code` came from.
 */
export function describeSqlError(error: SqlErrorInfo, file: string, code: string): string {
  const parts = [sentence(error.message)];
  if (error.position !== undefined) {
    parts.push(`Line ${lineAt(code, error.position)} of ${file}.`);
  }
  if (error.detail) parts.push(`Detail: ${sentence(error.detail)}`);
  if (error.hint) parts.push(`Hint: ${sentence(error.hint)}`);
  return parts.join(' ');
}

/** The text when setup.sql itself fails: the learner did not write it, so the file is named. */
export function describeSetupError(error: SqlErrorInfo, setup: string, file: string): string {
  return `The set-up for this exercise failed. ${describeSqlError(error, file, setup)}`;
}

// ---------------------------------------------------------------------------
// Test results

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ENTITIES[c] ?? c);
}

/**
 * The message for a failed test. A failed assertion shows the test's own hint. When PostgreSQL
 * refused a query inside the test (a table or column is missing, say), the hint keeps its place
 * and PostgreSQL's words follow it.
 */
export function failureMessage(hint: string, databaseMessage: string | null): string {
  if (!databaseMessage) return hint;
  return `${hint} <span class="sql-reason">${escapeHtml(`PostgreSQL said: ${sentence(databaseMessage)}`)}</span>`;
}

// ---------------------------------------------------------------------------
// The note beside the Run button

export type SqlPhase = 'idle' | 'downloading' | 'starting' | 'ready' | 'running' | 'restarting';

export interface SqlStatus {
  phase: SqlPhase;
  /** True until PostgreSQL has loaded once on this device. */
  firstTime: boolean;
}

/** What to tell the learner about PostgreSQL itself, or null when there is nothing to say. */
export function statusText(status: SqlStatus): string | null {
  switch (status.phase) {
    case 'idle':
      return status.firstTime
        ? `PostgreSQL needs about ${SQL_DOWNLOAD_MB} MB, once. It downloads the first time your query runs.`
        : null;
    case 'downloading':
      return `Downloading PostgreSQL, about ${SQL_DOWNLOAD_MB} MB, once. This takes a few seconds.`;
    case 'starting':
      return 'Starting PostgreSQL. Nearly there.';
    case 'restarting':
      return 'Restarting PostgreSQL after the stop. This takes a few seconds.';
    case 'ready':
    case 'running':
      return null;
  }
}
