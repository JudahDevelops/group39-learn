/**
 * The test harness for the sql runner (docs/content-format.md, "SQL tests"). Each test is the body
 * of an async function with three names in scope:
 *
 *   db      `await db.query(sql, params?)` -> { rows, fields }, on the database the learner's code left
 *   code    the text of the learner's query.sql
 *   assert  chai's assert
 *
 * Tests run here, on the page, one after the other. Only the queries go to the worker, so a test
 * that waits on PostgreSQL never freezes the page, and a query that never ends is stopped by the
 * runner's timeout, which replaces the worker.
 */
import { assert } from 'chai';
import type { TestResult } from '../types';
import { failureMessage } from './messages';
import type { SqlErrorInfo } from './worker';

export interface QueryField {
  name: string;
  dataTypeID: number;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  fields: QueryField[];
}

/** The `db` a test sees. */
export interface TestDb {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
}

/**
 * PostgreSQL refused a query. Carries the server's own fields, so a test can check
 * `error.code === '23505'` or match `error.message`.
 */
export class SqlError extends Error {
  readonly code?: string;
  readonly detail?: string;
  readonly hint?: string;
  readonly constraint?: string;
  readonly table?: string;
  readonly column?: string;
  readonly schema?: string;

  constructor(info: SqlErrorInfo) {
    super(info.message);
    this.name = 'SqlError';
    this.code = info.code;
    this.detail = info.detail;
    this.hint = info.hint;
    this.constraint = info.constraint;
    this.table = info.table;
    this.column = info.column;
    this.schema = info.schema;
  }
}

export interface TestOutcome {
  ok: boolean;
  /** The assertion's own wording, or the error text. For course authors. */
  detail: string | null;
  /** PostgreSQL's message when it refused a query the test made and the test did not catch it. */
  databaseMessage: string | null;
}

export interface TestEnv {
  db: TestDb;
  /** The learner's query.sql. */
  code: string;
  /** Checked before each test. Once true, the remaining tests are not run (the check timed out). */
  shouldStop?: () => boolean;
}

type AsyncFunctionConstructor = new (
  ...args: string[]
) => (...values: unknown[]) => Promise<unknown>;
const AsyncFunction = Object.getPrototypeOf(async function () {})
  .constructor as AsyncFunctionConstructor;

function describeThrown(error: unknown): TestOutcome {
  if (error instanceof SqlError) {
    return { ok: false, detail: error.message, databaseMessage: error.message };
  }
  const detail = error instanceof Error ? error.message : String(error);
  return { ok: false, detail, databaseMessage: null };
}

/** Runs every test body in order. A test that throws fails; the others still run. */
export async function runTests(sources: readonly string[], env: TestEnv): Promise<TestOutcome[]> {
  const outcomes: TestOutcome[] = [];
  for (const source of sources) {
    if (env.shouldStop?.()) {
      outcomes.push({ ok: false, detail: 'The check was stopped.', databaseMessage: null });
      continue;
    }
    try {
      const body = new AsyncFunction('db', 'code', 'assert', source);
      await body(env.db, env.code, assert);
      outcomes.push({ ok: true, detail: null, databaseMessage: null });
    } catch (error) {
      outcomes.push(describeThrown(error));
    }
  }
  return outcomes;
}

/** The learner-facing results: every test's own text, plus PostgreSQL's words when it refused a query. */
export function toTestResults(
  tests: readonly { text: string }[],
  outcomes: readonly TestOutcome[],
): TestResult[] {
  return tests.map((test, i) => {
    const got = outcomes[i];
    if (got?.ok) return { ok: true, message: test.text };
    const failed: TestResult = {
      ok: false,
      message: failureMessage(test.text, got?.databaseMessage ?? null),
    };
    if (got?.detail) failed.detail = got.detail;
    return failed;
  });
}
