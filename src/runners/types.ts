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
}

export interface Runner {
  run(files: Files, tests: TestCase[], options?: { timeoutMs?: number }): Promise<RunOutput>;
}

export type GetRunner = (kind: CodeRunner) => Promise<Runner>;
