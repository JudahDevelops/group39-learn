import type { CodeRunner, TestCase } from '../content/schema';

/** File name → contents, e.g. { 'index.html': '<h1>Hi</h1>' }. */
export type Files = Record<string, string>;

/** One test's outcome. `message` is the test's text (HTML), shown when it fails. */
export interface TestResult {
  ok: boolean;
  message: string;
}

export interface RunOutput {
  results: TestResult[];
  /** Index of the first failing test, or null when every test passed. */
  firstFailure: number | null;
  /** Console / stdout lines produced while running, oldest first. */
  logs: string[];
  /** Set when the code could not run at all (syntax error, timeout). Plain text. */
  error?: string;
}

export interface Runner {
  run(files: Files, tests: TestCase[], options?: { timeoutMs?: number }): Promise<RunOutput>;
}

export type GetRunner = (kind: CodeRunner) => Promise<Runner>;
