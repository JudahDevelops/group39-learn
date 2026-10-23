/** How tests run (src/runners/sql/harness.ts): their names, what a failure carries, and the stop. */
import { describe, expect, it } from 'vitest';
import { runTests, SqlError, toTestResults, type TestDb } from '../../src/runners/sql/harness';

const emptyDb: TestDb = { query: async () => ({ rows: [], fields: [] }) };

function dbReturning(rows: Record<string, unknown>[]): TestDb & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  return {
    calls,
    async query(sql, params) {
      calls.push([sql, params]);
      return { rows, fields: Object.keys(rows[0] ?? {}).map((name) => ({ name, dataTypeID: 25 })) };
    },
  };
}

describe('sql harness: running tests', () => {
  it('gives each test db, code and chai assert, and lets it await', async () => {
    const db = dbReturning([{ n: 5 }]);
    const out = await runTests(
      [
        'const { rows } = await db.query(code); assert.equal(rows[0].n, 5);',
        "assert.equal(code, 'select 5 as n');",
        "assert.match(code, /select/); assert.isTrue(typeof assert.lengthOf === 'function');",
      ],
      { db, code: 'select 5 as n' },
    );
    expect(out.map((o) => o.ok)).toEqual([true, true, true]);
    expect(db.calls).toEqual([['select 5 as n', undefined]]);
  });

  it('passes the parameters through', async () => {
    const db = dbReturning([]);
    await runTests(["await db.query('select $1', ['x'])"], { db, code: '' });
    expect(db.calls).toEqual([['select $1', ['x']]]);
  });

  it("a failed assertion fails the test and keeps the assertion's wording as the detail", async () => {
    const out = await runTests(['assert.equal(1, 2)', 'assert.lengthOf([1], 1)'], {
      db: emptyDb,
      code: '',
    });
    expect(out[0]).toEqual({ ok: false, detail: 'expected 1 to equal 2', databaseMessage: null });
    expect(out[1]?.ok).toBe(true);
  });

  it("a query PostgreSQL refused that the test did not catch fails it and carries PostgreSQL's words", async () => {
    const db: TestDb = {
      query: async () => {
        throw new SqlError({ message: 'relation "rooms" does not exist', code: '42P01' });
      },
    };
    const out = await runTests(["await db.query('select * from rooms')"], { db, code: '' });
    expect(out[0]).toEqual({
      ok: false,
      detail: 'relation "rooms" does not exist',
      databaseMessage: 'relation "rooms" does not exist',
    });
  });

  it('a test can catch the error and read its code and constraint', async () => {
    const db: TestDb = {
      query: async () => {
        throw new SqlError({
          message: 'duplicate key value violates unique constraint "rooms_pkey"',
          code: '23505',
          constraint: 'rooms_pkey',
        });
      },
    };
    const out = await runTests(
      [
        `let error;
         try { await db.query('insert into rooms values (1)'); } catch (e) { error = e; }
         assert.equal(error.code, '23505');
         assert.equal(error.constraint, 'rooms_pkey');
         assert.match(error.message, /duplicate key/);`,
      ],
      { db, code: '' },
    );
    expect(out[0]?.ok).toBe(true);
  });

  it('a mistake in the test itself fails it without a database message, and the others still run', async () => {
    const out = await runTests(['undefinedName.x', 'this is not javascript', 'assert.ok(true)'], {
      db: emptyDb,
      code: '',
    });
    expect(out.map((o) => o.ok)).toEqual([false, false, true]);
    expect(out[0]?.detail).toContain('undefinedName');
    expect(out[0]?.databaseMessage).toBeNull();
    expect(out[1]?.databaseMessage).toBeNull();
  });

  it('something thrown that is not an Error is still a failure', async () => {
    const out = await runTests(["throw 'plain text'"], { db: emptyDb, code: '' });
    expect(out[0]).toEqual({ ok: false, detail: 'plain text', databaseMessage: null });
  });

  it('stops running tests once told to', async () => {
    let stopped = false;
    const db: TestDb = {
      query: async () => {
        stopped = true;
        return { rows: [], fields: [] };
      },
    };
    const out = await runTests(["await db.query('x')", 'assert.ok(true)', 'assert.ok(true)'], {
      db,
      code: '',
      shouldStop: () => stopped,
    });
    expect(out.map((o) => o.ok)).toEqual([true, false, false]);
  });
});

describe('sql harness: results', () => {
  const tests = [{ text: 'First.' }, { text: 'Second <code>x</code>.' }, { text: 'Third.' }];

  it("maps outcomes to results in the tests' order, with the author's detail on failures only", () => {
    const results = toTestResults(tests, [
      { ok: true, detail: null, databaseMessage: null },
      { ok: false, detail: 'expected 0 to equal 3', databaseMessage: null },
      { ok: false, detail: null, databaseMessage: null },
    ]);
    expect(results).toEqual([
      { ok: true, message: 'First.' },
      { ok: false, message: 'Second <code>x</code>.', detail: 'expected 0 to equal 3' },
      { ok: false, message: 'Third.' },
    ]);
  });

  it("adds PostgreSQL's words to the message when it refused a query", () => {
    const [result] = toTestResults(tests, [
      { ok: false, detail: 'no such column', databaseMessage: 'column "x" does not exist' },
    ]);
    expect(result?.message).toContain('First. <span class="sql-reason">');
    expect(result?.message).toContain('PostgreSQL said: column &quot;x&quot; does not exist.');
  });

  it('a test with no outcome counts as failed', () => {
    expect(toTestResults(tests, []).map((r) => r.ok)).toEqual([false, false, false]);
  });
});
