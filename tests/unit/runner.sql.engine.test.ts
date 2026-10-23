/**
 * The database side of the sql runner (src/runners/sql/worker.js), run in Node against the real
 * PGlite. The worker is the same PostgreSQL compiled to WebAssembly; the e2e suite
 * (tests/e2e/sql.spec.ts) covers the part that needs a real Web Worker and the CDN.
 */
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createEngine, errorInfo, isBlank, type Engine } from '../../src/runners/sql/worker';

/**
 * The unit tests run in jsdom, whose Blob and File have no arrayBuffer(); PGlite needs it to
 * unpack its bundle. Swap in Node's own Blob, and hide File, as tests/unit/sql.helpers.ts does.
 */
async function swapInNodeBlob(): Promise<void> {
  const nodeBuffer = 'node:buffer';
  const { Blob: NodeBlob } = await import(/* @vite-ignore */ nodeBuffer);
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', undefined);
}

const SETUP = `
  create table rooms (id integer primary key, room_number text not null, beds integer not null);
  insert into rooms values (1, 'A-101', 4), (2, 'B-214', 6);
`;

let engine: Engine;

beforeAll(async () => {
  await swapInNodeBlob();
  engine = createEngine(PGlite);
  await engine.open();
}, 60_000);

afterAll(() => {
  vi.unstubAllGlobals();
});

const run = (code: string, setup: string | null = SETUP) =>
  engine.run({ setup, code, maxRows: 500 });

describe('sql engine: a run', () => {
  it('returns the rows of the last statement that returns rows, as text', async () => {
    const out = await run('select 1 as one; select id, room_number from rooms order by id;');
    expect(out).toEqual({
      ok: true,
      empty: false,
      table: {
        columns: ['id', 'room_number'],
        rows: [
          ['1', 'A-101'],
          ['2', 'B-214'],
        ],
        rowCount: 2,
        numeric: [true, false],
      },
    });
  });

  it('skips a trailing statement that returns nothing', async () => {
    const out = await run('select id from rooms; update rooms set beds = 5;');
    expect(out).toMatchObject({ ok: true, table: { columns: ['id'], rowCount: 2 } });
  });

  it('a select that matches nothing still has its columns', async () => {
    const out = await run('select id, beds from rooms where beds > 99');
    expect(out).toMatchObject({
      ok: true,
      table: { columns: ['id', 'beds'], rows: [], rowCount: 0 },
    });
  });

  it('statements with no rows give no table', async () => {
    expect(await run('insert into rooms values (3, $$C-1$$, 2)')).toEqual({
      ok: true,
      empty: false,
      table: null,
    });
  });

  it('code that is empty or only comments is marked empty', async () => {
    expect(await run('')).toEqual({ ok: true, empty: true, table: null });
    expect(await run('-- nothing yet\n/* still nothing */ ;')).toEqual({
      ok: true,
      empty: true,
      table: null,
    });
  });

  it('prints values as PostgreSQL does: NULL stays null, booleans read true and false, dates keep their text', async () => {
    const out = await run(
      `select null as nothing, true as yes, false as no, 1.50::numeric as price, date '2026-10-23' as day,
              '{"a": 1}'::jsonb as data, array[1, 2] as list, 12345678901234567890::numeric as big`,
      null,
    );
    expect(out).toMatchObject({
      ok: true,
      table: {
        rows: [
          [
            null,
            'true',
            'false',
            '1.50',
            '2026-10-23',
            '{"a": 1}',
            '{1,2}',
            '12345678901234567890',
          ],
        ],
        numeric: [false, false, false, true, false, false, false, true],
      },
    });
  });

  it('keeps duplicate and unnamed column names apart', async () => {
    const out = await run('select 1 as a, 2 as a, 3', null);
    expect(out).toMatchObject({
      table: { columns: ['a', 'a', '?column?'], rows: [['1', '2', '3']] },
    });
  });

  it('shows at most maxRows rows and says how many there were', async () => {
    const out = await engine.run({
      setup: null,
      code: 'select * from generate_series(1, 1200) as n',
      maxRows: 500,
    });
    expect(out).toMatchObject({ ok: true, table: { rowCount: 1200 } });
    if (out.ok && out.table) {
      expect(out.table.rows).toHaveLength(500);
      expect(out.table.rows[0]).toEqual(['1']);
    }
  });
});

describe('sql engine: errors', () => {
  it("a syntax error keeps PostgreSQL's own message and the position", async () => {
    const out = await run('select * form rooms');
    expect(out).toEqual({
      ok: false,
      phase: 'code',
      error: { message: 'syntax error at or near "form"', code: '42601', position: 10 },
    });
  });

  it('the position counts from the start of all the code, so a later statement points at its own line', async () => {
    const out = await run('select 1;\n\nselect room_numbr from rooms');
    expect(out).toMatchObject({
      ok: false,
      phase: 'code',
      error: {
        message: 'column "room_numbr" does not exist',
        position: 19,
        hint: 'Perhaps you meant to reference the column "rooms.room_number".',
      },
    });
  });

  it('a constraint error carries its detail and constraint name', async () => {
    const out = await run("insert into rooms values (1, 'dup', 1)");
    expect(out).toMatchObject({
      ok: false,
      error: {
        message: 'duplicate key value violates unique constraint "rooms_pkey"',
        code: '23505',
        detail: 'Key (id)=(1) already exists.',
        constraint: 'rooms_pkey',
      },
    });
  });

  it("a failing setup is reported as the setup, not as the learner's code", async () => {
    const out = await run('select 1', 'create table broken (');
    expect(out).toMatchObject({ ok: false, phase: 'setup', error: { code: '42601' } });
  });

  it('errorInfo copes with something that is not a PostgreSQL error', () => {
    expect(errorInfo(new Error('boom'))).toEqual({ message: 'boom' });
    expect(errorInfo('text')).toEqual({ message: 'text' });
  });

  it('isBlank ignores comments and semicolons only', () => {
    expect(isBlank('  \n-- c\n;')).toBe(true);
    expect(isBlank('select 1')).toBe(false);
    expect(isBlank("select '--'")).toBe(false);
  });
});

describe('sql engine: a fresh database every run', () => {
  it('forgets tables, other schemas, settings, temp tables and roles from the last run', async () => {
    await run(
      `create table kept (x int); create schema extra; create table extra.t (x int);
       set search_path to extra; create temp table scratch (x int); create role bob;`,
    );
    await run('select 1', null);
    const { rows } = await engine.query(
      `select
         (select count(*)::int from pg_class where relname in ('kept', 't', 'rooms', 'scratch')) as tables,
         (select count(*)::int from pg_namespace where nspname = 'extra') as schemas,
         (select count(*)::int from pg_roles where rolname = 'bob') as roles,
         current_setting('search_path') as path`,
      [],
    );
    expect(rows).toEqual([{ tables: 0, schemas: 0, roles: 0, path: 'public' }]);
  });

  it('starts from an empty database even after a transaction was left open', async () => {
    await run('begin; create table half (x int); select bad_column');
    expect(
      await run(
        'select count(*) as n from information_schema.tables where table_name = $$half$$',
        null,
      ),
    ).toMatchObject({ ok: true, table: { rows: [['0']] } });
  });

  it('runs setup.sql again, so a table the last run changed is back as it was', async () => {
    await run('delete from rooms');
    const out = await run('select count(*) as n from rooms');
    expect(out).toMatchObject({ table: { rows: [['2']] } });
  });
});

describe('sql engine: queries for tests', () => {
  it('returns object rows with JavaScript values and the fields', async () => {
    await run('select 1', SETUP);
    const out = await engine.query('select id, room_number, beds from rooms order by id', []);
    expect(out.rows).toEqual([
      { id: 1, room_number: 'A-101', beds: 4 },
      { id: 2, room_number: 'B-214', beds: 6 },
    ]);
    expect(out.fields.map((f) => f.name)).toEqual(['id', 'room_number', 'beds']);
  });

  it('takes parameters', async () => {
    await run('select 1', SETUP);
    const out = await engine.query('select room_number from rooms where beds > $1', [4]);
    expect(out.rows).toEqual([{ room_number: 'B-214' }]);
  });

  it('without parameters it may hold several statements and answers with the last one that returns rows', async () => {
    await run('select 1', SETUP);
    const out = await engine.query(
      'select 1 as a; select id from rooms order by id; update rooms set beds = 9',
    );
    expect(out.rows).toEqual([{ id: 1 }, { id: 2 }]);
    expect(await engine.query('delete from rooms where false')).toEqual({ rows: [], fields: [] });
  });

  it('an error keeps its fields for the test to read', async () => {
    await run('select 1', SETUP);
    await expect(engine.query('select * from missing')).rejects.toMatchObject({
      message: 'relation "missing" does not exist',
      code: '42P01',
    });
  });
});
