/**
 * The sql runner end to end in Node: the real runner and harness, with the real engine from
 * worker.js on PGlite standing in for the Web Worker. This is the fixture workflow: a check is a
 * fresh database, setup.sql, the learner's code, then tests that query the result.
 */
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TestCase } from '../../src/content/schema';
import { runPassed } from '../../src/runners/outcome';
import { withOwnSetup } from '../../src/runners/sql/files';
import { createSqlRunner, type SqlRunner, type WorkerLike } from '../../src/runners/sql/runner';
import { createStatusStore } from '../../src/runners/sql/status';
import { createEngine, type Engine } from '../../src/runners/sql/worker';

let runner: SqlRunner;
let engine: Engine;

/** A worker that answers the runner's messages with the real engine, the way worker.js does. */
function engineWorker(): WorkerLike {
  const worker: WorkerLike = {
    onmessage: null,
    onerror: null,
    terminate() {},
    postMessage(message) {
      const m = message as { id: number; type: string; [key: string]: unknown };
      const reply = (data: object) => queueMicrotask(() => worker.onmessage?.({ data }));
      void (async () => {
        if (m.type === 'init') {
          reply({ type: 'done', id: m.id });
        } else if (m.type === 'run') {
          const result = await engine.run(m as never);
          reply({ type: 'done', id: m.id, result });
        } else if (m.type === 'query') {
          let result;
          try {
            result = { ok: true, ...(await engine.query(m.sql as string, m.params as unknown[])) };
          } catch (error) {
            const e = error as { message: string; code?: string };
            result = { ok: false, error: { message: e.message, code: e.code } };
          }
          reply({ type: 'done', id: m.id, result });
        }
      })();
    },
  };
  return worker;
}

beforeAll(async () => {
  const nodeBuffer = 'node:buffer';
  const { Blob: NodeBlob } = await import(/* @vite-ignore */ nodeBuffer);
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', undefined);
  engine = createEngine(PGlite);
  await engine.open();
  runner = createSqlRunner({
    host: { create: engineWorker },
    status: createStatusStore(null),
  });
}, 60_000);

afterAll(() => {
  vi.unstubAllGlobals();
});

const SETUP = `create table rooms (id integer primary key, room_number text, hall text, beds integer);
insert into rooms values (1, 'A-101', 'Hall A', 4), (2, 'B-214', 'Hall B', 4), (3, 'B-215', 'Hall B', 6);`;

const test = (text: string, code: string): TestCase => ({ text, code });

describe('sql runner with the real engine', () => {
  it("a test re-runs the learner's code and checks the rows", async () => {
    const tests = [
      test('Select from rooms.', 'assert.match(code, /from\\s+rooms/i)'),
      test('Return 2 rooms.', 'const { rows } = await db.query(code); assert.lengthOf(rows, 2);'),
      test(
        'Show only the room number.',
        "const { rows } = await db.query(code); assert.sameMembers(Object.keys(rows[0]), ['room_number']);",
      ),
    ];
    const seed = { 'query.sql': '-- soon', 'setup.sql': SETUP };
    const solution = {
      'query.sql': "select room_number from rooms where hall = 'Hall B';",
      'setup.sql': SETUP,
    };
    const failing = await runner.run(seed, tests);
    expect(runPassed(failing)).toBe(false);
    expect(failing.firstFailure).toBe(0);

    const passing = await runner.run(solution, tests);
    expect(passing.error).toBeUndefined();
    expect(runPassed(passing)).toBe(true);
    expect(passing.sql?.table).toMatchObject({
      columns: ['room_number'],
      rows: [['B-214'], ['B-215']],
      rowCount: 2,
    });
  });

  it('a test can check what the code changed, and the next check starts clean', async () => {
    const tests = [
      test(
        'Add room B-217.',
        "const { rows } = await db.query('select count(*)::int as n from rooms where room_number = $1', ['B-217']); assert.equal(rows[0].n, 1);",
      ),
    ];
    const insert = {
      'query.sql': "insert into rooms values (4, 'B-217', 'Hall B', 4);",
      'setup.sql': SETUP,
    };
    expect(runPassed(await runner.run(insert, tests))).toBe(true);
    // The same test on code that does nothing: the row from the last check is gone.
    const nothing = await runner.run({ 'query.sql': 'select 1;', 'setup.sql': SETUP }, tests);
    expect(runPassed(nothing)).toBe(false);
  });

  it('a test can check the schema through information_schema', async () => {
    const tests = [
      test(
        'Create the complaints table with id and description.',
        `const { rows } = await db.query("select column_name from information_schema.columns where table_name = 'complaints' order by ordinal_position");
         assert.deepEqual(rows.map((r) => r.column_name), ['id', 'description']);`,
      ),
    ];
    const good = await runner.run(
      { 'query.sql': 'create table complaints (id integer, description text);' },
      tests,
    );
    expect(runPassed(good)).toBe(true);
    const bad = await runner.run({ 'query.sql': 'create table complaints (id integer);' }, tests);
    expect(bad.firstFailure).toBe(0);
  });

  it("a test that queries a table the learner has not made fails with PostgreSQL's words", async () => {
    const out = await runner.run({ 'query.sql': 'select 1;' }, [
      test(
        'Create the <code>complaints</code> table.',
        "await db.query('select * from complaints')",
      ),
    ]);
    expect(out.firstFailure).toBe(0);
    expect(out.results[0]?.message).toContain(
      'PostgreSQL said: relation &quot;complaints&quot; does not exist.',
    );
  });

  it('a test can expect a constraint to refuse a row', async () => {
    const tests = [
      test(
        'Room numbers should be unique.',
        `let error;
         try { await db.query("insert into rooms values (9, 'A-101', 'Hall A', 1)"); } catch (e) { error = e; }
         assert.exists(error);
         assert.equal(error.code, '23505');`,
      ),
    ];
    const unique = await runner.run(
      {
        'query.sql': 'alter table rooms add constraint u unique (room_number);',
        'setup.sql': SETUP,
      },
      tests,
    );
    expect(runPassed(unique)).toBe(true);
    const free = await runner.run({ 'query.sql': 'select 1;', 'setup.sql': SETUP }, tests);
    expect(runPassed(free)).toBe(false);
  });

  it("an error in the code is PostgreSQL's message with the line; Run then shows no rows", async () => {
    const out = await runner.run(
      { 'query.sql': 'select 1;\nselect * from nothing;', 'setup.sql': SETUP },
      [test('A.', 'assert.ok(true)')],
    );
    expect(out.error).toBe('relation "nothing" does not exist. Line 2 of query.sql.');
    expect(out.results).toEqual([]);
  });

  it('a Run of statements without rows says so in the output', async () => {
    const out = await runner.run({ 'query.sql': 'create table t (x int);' }, []);
    expect(out.sql).toEqual({ table: null, empty: false });
  });
  it("a setup.sql edited in the editor cannot change a check: the block's own runs", async () => {
    const tests = [
      test(
        'Return all 3 rooms.',
        'const { rows } = await db.query(code); assert.lengthOf(rows, 3);',
      ),
    ];
    const edited = {
      'query.sql': 'select * from rooms;',
      'setup.sql': 'create table rooms (id integer); insert into rooms values (1);',
    };
    // Run as it stands, the edited copy decides the result.
    expect(runPassed(await runner.run(edited, tests))).toBe(false);
    // What the player sends: the block's own setup.sql, whatever the editor held.
    const own = [{ name: 'setup.sql', contents: SETUP }];
    expect(runPassed(await runner.run(withOwnSetup(edited, 'sql', own), tests))).toBe(true);
  });
});
