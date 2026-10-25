import type { CodeRunner, TestCase } from '../content/schema';

/** File name → contents, e.g. { 'index.html': '<h1>Hi</h1>' }. */
export type Files = Record<string, string>;

/** One test's outcome. `message` is the test's text (HTML), shown when it fails. */
export interface TestResult {
  ok: boolean;
  message: string;
  /** The assertion's own wording, e.g. "expected 0 to equal 1". For course authors; learners see `message`. */
  detail?: string;
}

/** The rows of one SQL statement, as text, for the Results panel. */
export interface ResultTable {
  columns: string[];
  /** Every value as PostgreSQL prints it; null is SQL NULL. At most the first rows of the result. */
  rows: (string | null)[][];
  /** How many rows the statement returned in all. `rows` may hold fewer. */
  rowCount: number;
  /** True for each column of numbers (they are lined up on the right). */
  numeric: boolean[];
}

/** What the sql runner adds to a run: what the Results panel shows. */
export interface SqlOutput {
  /** The last statement that returns rows, or null when no statement did. */
  table: ResultTable | null;
  /** True when the code held no statement to run (it was empty, or only comments). */
  empty: boolean;
}

/** One route of the learner's app, one entry per method. */
export interface RouteInfo {
  method: string;
  path: string;
}

/** What the fastapi runner adds to a run: what the Requests panel shows. */
export interface FastapiOutput {
  /** The routes the learner wrote, in the order they were added. Empty when the app has none. */
  routes: RouteInfo[];
}

/** One request from the Requests panel. `body` is JSON text, or '' for none. */
export interface HttpRequest {
  method: string;
  path: string;
  body: string;
}

/** What a request came back with, or why nothing did (fastapi runner). */
export type HttpOutcome =
  | {
      kind: 'reply';
      status: number;
      reason: string;
      contentType: string | null;
      location: string | null;
      /** The body as text, at most a fixed number of characters. */
      body: string;
      truncated: boolean;
      ms: number;
      /** What the app printed while answering, oldest first. */
      logs: string[];
      /** Plain words, with the file and line, when the handler raised: the reply is then a 500. */
      error: string | null;
    }
  | {
      kind: 'notice';
      text: string;
      /** True when the app is no longer loaded (it never ran, it was stopped, the worker died). */
      appGone: boolean;
    };

export interface RunOutput {
  results: TestResult[];
  /** Index of the first failing test, or null when every test passed. */
  firstFailure: number | null;
  /** Console / stdout lines produced while running, oldest first. */
  logs: string[];
  /** Set when the code could not run at all (syntax error, timeout). Plain text. */
  error?: string;
  /** sql runner only: what the Results panel shows. Absent when the code could not run. */
  sql?: SqlOutput;
  /** fastapi runner only: what the Requests panel shows. Absent when the code could not run. */
  fastapi?: FastapiOutput;
}

export interface Runner {
  run(files: Files, tests: TestCase[], options?: { timeoutMs?: number }): Promise<RunOutput>;
}

export type GetRunner = (kind: CodeRunner) => Promise<Runner>;
