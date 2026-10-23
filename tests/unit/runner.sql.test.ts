/**
 * The sql runner's main-thread side with a stand-in for the worker: the message protocol, the
 * result mapping, the tests' queries, the queue, the 5 s stop, the restart, and the load failures.
 * The real worker and PostgreSQL are covered by runner.sql.engine.test.ts and
 * runner.sql.integration.test.ts (the real engine) and tests/e2e/sql.spec.ts (a real Web Worker).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TestCase } from '../../src/content/schema';
import { runPassed } from '../../src/runners/outcome';
import { LOADED_FLAG_KEY } from '../../src/runners/sql/config';
import { BOOT_FAILED_TEXT, BOOT_TIMEOUT_TEXT } from '../../src/runners/sql/messages';
import {
  createSqlRunner,
  pickFiles,
  type WorkerHost,
  type WorkerLike,
} from '../../src/runners/sql/runner';
import { createStatusStore, type FlagStorage } from '../../src/runners/sql/status';

type Message = { id: number; type: string; [key: string]: unknown };
type Script = (message: Message, worker: FakeWorker) => void;

class FakeWorker implements WorkerLike {
  sent: Message[] = [];
  terminated = false;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  constructor(private readonly script: Script) {}
  postMessage(message: unknown) {
    const m = message as Message;
    this.sent.push(m);
    this.script(m, this);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: unknown) {
    if (!this.terminated) this.onmessage?.({ data });
  }
}

const table = {
  columns: ['room_number'],
  rows: [['A-101']],
  rowCount: 1,
  numeric: [false],
};
const rowsReply = { ok: true, empty: false, table };

/** A worker that boots, then answers `run` with `answer(message)` and `query` with `query(message)`. */
function answering(
  answer: (message: Message) => unknown = () => rowsReply,
  query: (message: Message) => unknown = () => ({ ok: true, rows: [], fields: [] }),
): Script {
  return (message, worker) => {
    if (message.type === 'init') {
      worker.reply({ type: 'stage', id: message.id, stage: 'download' });
      worker.reply({ type: 'stage', id: message.id, stage: 'start' });
      worker.reply({ type: 'done', id: message.id });
    } else if (message.type === 'run') {
      worker.reply({ type: 'done', id: message.id, result: answer(message) });
    } else if (message.type === 'query') {
      worker.reply({ type: 'done', id: message.id, result: query(message) });
    }
  };
}

function setup(script: Script, options: { loaded?: boolean; bootTimeoutMs?: number } = {}) {
  const workers: FakeWorker[] = [];
  const host: WorkerHost = {
    create() {
      const worker = new FakeWorker(script);
      workers.push(worker);
      return worker;
    },
  };
  const store = new Map<string, string>(options.loaded ? [[LOADED_FLAG_KEY, '1']] : []);
  const storage: FlagStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
  };
  const status = createStatusStore(storage);
  const phases: string[] = [];
  status.subscribe(() => phases.push(status.get().phase));
  const runner = createSqlRunner({ host, status, bootTimeoutMs: options.bootTimeoutMs });
  return { runner, workers, status, store, phases };
}

const test = (text: string, code = 'assert.ok(true)'): TestCase => ({ text, code });
const files = {
  'query.sql': 'select room_number from rooms;',
  'setup.sql': 'create table rooms (x int);',
};

afterEach(() => {
  vi.useRealTimers();
});

describe('sql runner: which files it reads', () => {
  it('uses setup.sql and query.sql', () => {
    expect(pickFiles(files)).toEqual({
      setup: 'create table rooms (x int);',
      query: 'select room_number from rooms;',
      queryFile: 'query.sql',
    });
  });

  it('works with no setup.sql', () => {
    expect(pickFiles({ 'query.sql': 'select 1' })).toMatchObject({
      setup: null,
      query: 'select 1',
    });
  });

  it('falls back to the first other .sql file, and to nothing', () => {
    expect(pickFiles({ 'setup.sql': 's', 'report.sql': 'select 2' })).toMatchObject({
      query: 'select 2',
      queryFile: 'report.sql',
    });
    expect(pickFiles({ 'setup.sql': 's', 'notes.txt': 'x' }).query).toBeNull();
  });

  it('says so when there is no query file, without starting the worker', async () => {
    const { runner, workers } = setup(answering());
    const out = await runner.run({ 'setup.sql': 'create table t (x int)' }, [test('A.')]);
    expect(out.error).toBe('There is no query.sql file to run.');
    expect(workers).toHaveLength(0);
  });
});

describe('sql runner: results', () => {
  it('sends setup and code to a fresh database, then passes when every test passes', async () => {
    const { runner, workers } = setup(answering());
    const out = await runner.run(files, [test('One.'), test('Two.')]);
    expect(out.error).toBeUndefined();
    expect(out.firstFailure).toBeNull();
    expect(runPassed(out)).toBe(true);
    expect(out.sql).toEqual({ table, empty: false });
    expect(workers[0]?.sent[0]).toMatchObject({
      type: 'init',
      moduleURL: 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js',
    });
    expect(workers[0]?.sent.find((m) => m.type === 'run')).toMatchObject({
      setup: 'create table rooms (x int);',
      code: 'select room_number from rooms;',
      maxRows: 500,
    });
  });

  it("a test's queries go to the worker, with its rows coming back to the test", async () => {
    const { runner, workers } = setup(
      answering(undefined, (m) => ({
        ok: true,
        rows: [{ n: m.params ? 7 : 3 }],
        fields: [{ name: 'n', dataTypeID: 23 }],
      })),
    );
    const out = await runner.run(files, [
      test(
        'Plain.',
        "const { rows, fields } = await db.query('select 3'); assert.equal(rows[0].n, 3); assert.equal(fields[0].name, 'n');",
      ),
      test(
        'Params.',
        "const { rows } = await db.query('select $1', [7]); assert.equal(rows[0].n, 7);",
      ),
      test('Code.', "assert.equal(code, 'select room_number from rooms;')"),
    ]);
    expect(runPassed(out)).toBe(true);
    const queries = workers[0]?.sent.filter((m) => m.type === 'query');
    expect(queries?.map((m) => [m.sql, m.params])).toEqual([
      ['select 3', undefined],
      ['select $1', [7]],
    ]);
  });

  it('reports the first failing test with its hint, and the assertion detail for authors', async () => {
    const { runner } = setup(answering());
    const out = await runner.run(files, [
      test('A.'),
      test('Needs <code>3</code> rows.', 'assert.equal(1, 3)'),
      test('C.', 'assert.equal(1, 2)'),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true, false, false]);
    expect(out.firstFailure).toBe(1);
    expect(out.results[1]).toEqual({
      ok: false,
      message: 'Needs <code>3</code> rows.',
      detail: 'expected 1 to equal 3',
    });
    expect(runPassed(out)).toBe(false);
  });

  it("a query PostgreSQL refuses inside a test keeps the hint and adds PostgreSQL's words", async () => {
    const { runner } = setup(
      answering(undefined, () => ({
        ok: false,
        error: { message: 'relation "complaints" does not exist', code: '42P01' },
      })),
    );
    const out = await runner.run(files, [
      test(
        'Create the <code>complaints</code> table.',
        "await db.query('select * from complaints')",
      ),
    ]);
    const message = out.results[0]?.message ?? '';
    expect(message.startsWith('Create the <code>complaints</code> table. ')).toBe(true);
    expect(message).toContain('PostgreSQL said: relation &quot;complaints&quot; does not exist.');
  });

  it('a Run with no tests returns the rows and no results', async () => {
    const { runner, workers } = setup(answering());
    const out = await runner.run(files, []);
    expect(out.results).toEqual([]);
    expect(out.error).toBeUndefined();
    expect(out.sql?.table).toEqual(table);
    expect(workers[0]?.sent.some((m) => m.type === 'query')).toBe(false);
  });

  it('an empty query is a run with nothing to show, and the tests still run', async () => {
    const { runner } = setup(answering(() => ({ ok: true, empty: true, table: null })));
    const out = await runner.run({ 'query.sql': '-- soon' }, [
      test('A.', 'assert.fail("nothing")'),
    ]);
    expect(out.sql).toEqual({ table: null, empty: true });
    expect(out.firstFailure).toBe(0);
  });

  it("an error in the learner's code is PostgreSQL's message with the line, and no test runs", async () => {
    const { runner, workers } = setup(
      answering(() => ({
        ok: false,
        phase: 'code',
        error: { message: 'syntax error at or near "form"', position: 10, code: '42601' },
      })),
    );
    const out = await runner.run({ 'query.sql': 'select * form rooms' }, [test('A.')]);
    expect(out.error).toBe('syntax error at or near "form". Line 1 of query.sql.');
    expect(out.results).toEqual([]);
    expect(out.firstFailure).toBeNull();
    expect(runPassed(out)).toBe(false);
    expect(workers[0]?.sent.some((m) => m.type === 'query')).toBe(false);
  });

  it('a failing setup.sql says it was the set-up', async () => {
    const { runner } = setup(
      answering(() => ({
        ok: false,
        phase: 'setup',
        error: { message: 'syntax error at end of input', position: 22 },
      })),
    );
    const out = await runner.run({ ...files, 'setup.sql': 'create table broken (' }, []);
    expect(out.error).toBe(
      'The set-up for this exercise failed. syntax error at end of input. Line 1 of setup.sql.',
    );
  });
});

describe('sql runner: one worker, reused', () => {
  it('boots once for many runs', async () => {
    const { runner, workers } = setup(answering());
    await runner.run(files, []);
    await runner.run(files, []);
    await runner.run(files, []);
    expect(workers).toHaveLength(1);
    expect(workers[0]?.sent.filter((m) => m.type === 'init')).toHaveLength(1);
    expect(workers[0]?.sent.filter((m) => m.type === 'run')).toHaveLength(3);
  });

  it('queues runs that start together and sends them one at a time, in order', async () => {
    const pending: Message[] = [];
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'run') pending.push(message);
      else answering()(message, worker);
    });
    const first = runner.run({ 'query.sql': 'one' }, []);
    const second = runner.run({ 'query.sql': 'two' }, []);
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    expect(pending[0]?.code).toBe('one');
    expect(workers[0]?.sent.filter((m) => m.type === 'run')).toHaveLength(1);

    workers[0]?.reply({ type: 'done', id: pending[0]!.id, result: rowsReply });
    await first;
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    expect(pending[1]?.code).toBe('two');
    workers[0]?.reply({ type: 'done', id: pending[1]!.id, result: rowsReply });
    await second;
  });

  it('warm() starts loading before the first run, and the run then reuses it', async () => {
    const { runner, workers } = setup(answering());
    runner.warm();
    await vi.waitFor(() => expect(workers).toHaveLength(1));
    await runner.run(files, []);
    expect(workers).toHaveLength(1);
  });
});

describe('sql runner: the 5 second stop', () => {
  /** Answers a boot at once, then goes quiet on a run, like a query that never ends. */
  const hanging = (hangOn: number[] = [1]): Script => {
    let runs = 0;
    return (message, worker) => {
      if (message.type === 'run') {
        runs += 1;
        if (hangOn.includes(runs)) return; // never answers
        worker.reply({ type: 'done', id: message.id, result: rowsReply });
      } else answering()(message, worker);
    };
  };

  it('terminates the worker and says so in plain words', async () => {
    vi.useFakeTimers();
    const { runner, workers } = setup(hanging());
    const run = runner.run(files, [test('A.')]);
    await vi.advanceTimersByTimeAsync(4999);
    expect(workers[0]?.terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    const out = await run;
    expect(workers[0]?.terminated).toBe(true);
    expect(out.error).toBe(
      'Your query ran for more than 5 seconds, so it was stopped. Check for a join with no condition: it pairs every row with every other row.',
    );
    expect(out.results).toEqual([]);
    expect(runPassed(out)).toBe(false);
  });

  it('stops a test that is waiting on a query too, and runs no more tests', async () => {
    vi.useFakeTimers();
    let queries = 0;
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'query') {
        queries += 1; // never answers
        return;
      }
      answering()(message, worker);
    });
    const run = runner.run(files, [
      test('A.', "await db.query('select pg_sleep(60)')"),
      test('B.', "await db.query('select 1')"),
    ]);
    await vi.advanceTimersByTimeAsync(5001);
    expect((await run).error).toMatch(/more than 5 seconds/);
    expect(workers[0]?.terminated).toBe(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(queries).toBe(1);
  });

  it('starts a fresh worker on the next run, not before, and says it is restarting', async () => {
    vi.useFakeTimers();
    const { runner, workers, status, phases } = setup(hanging());
    const first = runner.run(files, [test('A.')]);
    await vi.advanceTimersByTimeAsync(5001);
    await first;
    expect(workers).toHaveLength(1);
    expect(status.get().phase).toBe('idle');

    phases.length = 0;
    const second = await runner.run(files, [test('A.')]);
    expect(workers).toHaveLength(2);
    expect(workers[1]?.terminated).toBe(false);
    expect(phases).toContain('restarting');
    expect(runPassed(second)).toBe(true);
  });

  it('honours a shorter timeout and names it in the message', async () => {
    vi.useFakeTimers();
    const { runner } = setup(hanging());
    const run = runner.run(files, [], { timeoutMs: 2000 });
    await vi.advanceTimersByTimeAsync(2001);
    expect((await run).error).toMatch(/^Your query ran for more than 2 seconds,/);
  });

  it('counts the time from when the run reaches the worker, not from when it was asked for', async () => {
    vi.useFakeTimers();
    const answer = answering();
    const slowBoot = setup((message, worker) => {
      if (message.type === 'init') setTimeout(() => answer(message, worker), 20_000);
      else answer(message, worker);
    });
    const run = slowBoot.runner.run(files, [test('A.')]);
    await vi.advanceTimersByTimeAsync(20_001);
    const out = await run;
    expect(out.error).toBeUndefined();
    expect(runPassed(out)).toBe(true);
    expect(slowBoot.workers[0]?.terminated).toBe(false);
  });

  it('a run waiting behind a stopped run gets its own full 5 seconds on the new worker', async () => {
    vi.useFakeTimers();
    const { runner, workers } = setup(hanging([1]));
    const first = runner.run(files, [test('A.')]);
    const second = runner.run(files, [test('B.')]);
    await vi.advanceTimersByTimeAsync(5001);
    expect((await first).error).toMatch(/more than 5 seconds/);
    const out = await second;
    expect(out.error).toBeUndefined();
    expect(workers).toHaveLength(2);
  });
});

describe('sql runner: loading', () => {
  it('goes downloading, starting, ready, running on the first run, and remembers it loaded', async () => {
    const { runner, status, phases, store } = setup(answering());
    expect(status.get()).toEqual({ phase: 'idle', firstTime: true });
    await runner.run(files, []);
    expect([...new Set(phases)]).toEqual(['downloading', 'starting', 'ready', 'running']);
    expect(status.get().phase).toBe('ready');
    expect(status.get().firstTime).toBe(false);
    expect(store.get(LOADED_FLAG_KEY)).toBe('1');
  });

  it('does not say "downloading" on a device that has loaded PostgreSQL before', async () => {
    const { runner, phases } = setup(answering(), { loaded: true });
    await runner.run(files, []);
    expect(phases).not.toContain('downloading');
    expect(phases[0]).toBe('starting');
  });

  it('a failed download is a plain-words error, no result, and the next run tries again', async () => {
    let attempts = 0;
    const { runner, workers, status } = setup((message, worker) => {
      if (message.type === 'init') {
        attempts += 1;
        if (attempts === 1) {
          worker.reply({
            type: 'fail',
            id: message.id,
            error: 'Failed to fetch dynamically imported module',
          });
          return;
        }
      }
      answering()(message, worker);
    });
    const failed = await runner.run(files, [test('A.')]);
    expect(failed.error).toBe(BOOT_FAILED_TEXT);
    expect(failed.results).toEqual([]);
    expect(workers[0]?.terminated).toBe(true);
    expect(status.get()).toEqual({ phase: 'idle', firstTime: true });

    const again = await runner.run(files, [test('A.')]);
    expect(again.error).toBeUndefined();
    expect(workers).toHaveLength(2);
    expect(status.get().firstTime).toBe(false);
  });

  it('a worker that cannot start at all is the same plain-words error', async () => {
    const { runner } = setup((message, worker) => {
      if (message.type === 'init') worker.onerror?.({});
    });
    expect((await runner.run(files, [])).error).toBe(BOOT_FAILED_TEXT);
  });

  it('gives up on a load that never finishes', async () => {
    vi.useFakeTimers();
    const { runner, workers } = setup(() => undefined, { bootTimeoutMs: 1000 });
    const run = runner.run(files, []);
    await vi.advanceTimersByTimeAsync(1001);
    expect((await run).error).toBe(BOOT_TIMEOUT_TEXT);
    expect(workers[0]?.terminated).toBe(true);
  });

  it('a worker that crashes during a run is replaced on the next run', async () => {
    let runs = 0;
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'run') {
        runs += 1;
        if (runs === 1) {
          worker.onerror?.({});
          return;
        }
        worker.reply({ type: 'done', id: message.id, result: rowsReply });
      } else answering()(message, worker);
    });
    const crashed = await runner.run(files, [test('A.')]);
    expect(crashed.error).toMatch(/stopped working unexpectedly/);
    const next = await runner.run(files, [test('A.')]);
    expect(runPassed(next)).toBe(true);
    expect(workers).toHaveLength(2);
  });

  it('a failure inside the worker is reported, and the worker stays', async () => {
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'run') {
        worker.reply({
          type: 'fail',
          id: message.id,
          error: 'Cannot read properties of null\nat run',
        });
      } else answering()(message, worker);
    });
    const out = await runner.run(files, [test('A.')]);
    expect(out.error).toBe('PostgreSQL could not check your query: at run. Try again.');
    expect(workers[0]?.terminated).toBe(false);
  });

  it('a reply that is not a result is reported', async () => {
    const { runner } = setup(answering(() => 'nonsense'));
    expect((await runner.run(files, [])).error).toBe(
      'PostgreSQL did not return a result. Try again.',
    );
  });

  it('dispose() stops the worker, and the next run starts a new one', async () => {
    const { runner, workers } = setup(answering());
    await runner.run(files, []);
    runner.dispose();
    expect(workers[0]?.terminated).toBe(true);
    await runner.run(files, []);
    expect(workers).toHaveLength(2);
  });
});
