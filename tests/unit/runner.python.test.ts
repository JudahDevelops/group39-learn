/**
 * The python runner's main-thread side with a stand-in for the worker: the message protocol, the
 * result mapping, the queue, the 5 s stop, the restart, and the load failures. The real worker and
 * Pyodide are covered by tests/e2e/python.spec.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestCase } from '../../src/content/schema';
import { runPassed } from '../../src/runners/outcome';
import { LOADED_FLAG_KEY } from '../../src/runners/python/config';
import { BOOT_FAILED_TEXT, BOOT_TIMEOUT_TEXT } from '../../src/runners/python/messages';
import {
  createPythonRunner,
  type WorkerHost,
  type WorkerLike,
} from '../../src/runners/python/runner';
import { createStatusStore, type FlagStorage } from '../../src/runners/python/status';

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

const ok = { ok: true, detail: null, error: null };
const fail = (detail: string | null = null, error: unknown = null) => ({
  ok: false,
  detail,
  error,
});

/** A worker that boots, then answers every run with `answer(message)`. */
function answering(answer: (message: Message) => unknown): Script {
  return (message, worker) => {
    if (message.type === 'init') {
      worker.reply({ type: 'stage', id: message.id, stage: 'download' });
      worker.reply({ type: 'stage', id: message.id, stage: 'start' });
      worker.reply({ type: 'done', id: message.id });
    } else if (message.type === 'run') {
      worker.reply({ type: 'done', id: message.id, result: answer(message) });
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
  const runner = createPythonRunner({ host, status, bootTimeoutMs: options.bootTimeoutMs });
  return { runner, workers, status, store, phases };
}

const test = (text: string, code = 'assert True'): TestCase => ({ text, code });
const files = { 'main.py': 'print(1)' };

afterEach(() => {
  vi.useRealTimers();
});

describe('python runner: results', () => {
  it('passes when every test passes, and sends the files and the test sources', async () => {
    const { runner, workers } = setup(answering(() => ({ error: null, results: [ok, ok] })));
    const out = await runner.run(files, [test('One.', 'assert 1'), test('Two.', 'assert 2')]);
    expect(out.error).toBeUndefined();
    expect(out.firstFailure).toBeNull();
    expect(runPassed(out)).toBe(true);
    const run = workers[0]?.sent.find((m) => m.type === 'run');
    expect(run?.payload).toEqual({ files, tests: ['assert 1', 'assert 2'] });
    expect(workers[0]?.sent[0]).toMatchObject({
      type: 'init',
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',
    });
  });

  it('reports the first failing test with its hint, and the assertion detail for authors', async () => {
    const { runner } = setup(
      answering(() => ({ error: null, results: [ok, fail('assert x == 2'), fail()] })),
    );
    const out = await runner.run(files, [
      test('A.'),
      test('Needs <code>x</code> to be 2.'),
      test('C.'),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true, false, false]);
    expect(out.firstFailure).toBe(1);
    expect(out.results[1]).toEqual({
      ok: false,
      message: 'Needs <code>x</code> to be 2.',
      detail: 'assert x == 2',
    });
    expect(out.results[2]?.detail).toBeUndefined();
    expect(runPassed(out)).toBe(false);
  });

  it('a test that raised something other than an assert keeps its hint and adds plain words', async () => {
    const error = {
      type: 'TypeError',
      message: "unsupported operand type(s) for +: 'str' and 'int'",
      file: 'main.py',
      line: 2,
      source: 'return urgency + 1',
      syntax: false,
    };
    const { runner } = setup(
      answering(() => ({ error: null, results: [fail('TypeError: ...', error)] })),
    );
    const out = await runner.run(files, [test('Return 24 for urgent.')]);
    const message = out.results[0]?.message ?? '';
    expect(message.startsWith('Return 24 for urgent. ')).toBe(true);
    expect(message).toContain('Python stopped while checking your code on line 2 of main.py');
    expect(out.results[0]?.detail).toBe('TypeError: ...');
  });

  it('code that stopped gives the plain-words error, the lines printed so far, and no results', async () => {
    const script: Script = (message, worker) => {
      answering(() => null)(message, worker);
      if (message.type === 'run') return;
    };
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'run') {
        worker.reply({ type: 'out', id: message.id, stream: 'stdout', text: 'before' });
        worker.reply({
          type: 'done',
          id: message.id,
          result: {
            error: {
              type: 'NameError',
              message: "name 'totl' is not defined",
              file: 'main.py',
              line: 2,
              source: 'print(totl)',
              syntax: false,
            },
            results: [],
          },
        });
      } else script(message, worker);
    });
    const out = await runner.run(files, [test('A.')]);
    expect(out.logs).toEqual(['before']);
    expect(out.results).toEqual([]);
    expect(out.firstFailure).toBeNull();
    expect(out.error).toBe(
      'Your code stopped on line 2 of main.py, which reads print(totl). Python does not know the name "totl". Check the spelling, or give it a value before this line.',
    );
    expect(runPassed(out)).toBe(false);
    expect(workers).toHaveLength(1);
  });

  it('a run with no tests (the Run button) returns the printed lines and no results', async () => {
    const { runner } = setup((message, worker) => {
      answering(() => ({ error: null, results: [] }))(message, worker);
    });
    const out = await runner.run(files, []);
    expect(out.results).toEqual([]);
    expect(out.error).toBeUndefined();
  });

  it('lines the code prints come back as logs, oldest first, and stop at a limit', async () => {
    const { runner } = setup((message, worker) => {
      if (message.type === 'run') {
        for (let i = 0; i < 2100; i += 1) {
          worker.reply({ type: 'out', id: message.id, stream: 'stdout', text: `line ${i}` });
        }
        worker.reply({ type: 'done', id: message.id, result: { error: null, results: [] } });
      } else answering(() => null)(message, worker);
    });
    const out = await runner.run(files, []);
    expect(out.logs).toHaveLength(2001);
    expect(out.logs[0]).toBe('line 0');
    expect(out.logs[2000]).toBe('[More output was not shown.]');
  });
});

describe('python runner: one worker, reused', () => {
  it('boots once for many runs', async () => {
    const { runner, workers } = setup(answering(() => ({ error: null, results: [] })));
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
      else answering(() => null)(message, worker);
    });
    const first = runner.run({ 'main.py': 'one' }, []);
    const second = runner.run({ 'main.py': 'two' }, []);
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    expect((pending[0]?.payload as { files: unknown }).files).toEqual({ 'main.py': 'one' });
    expect(workers[0]?.sent.filter((m) => m.type === 'run')).toHaveLength(1);

    workers[0]?.reply({ type: 'done', id: pending[0]!.id, result: { error: null, results: [] } });
    await first;
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    expect((pending[1]?.payload as { files: unknown }).files).toEqual({ 'main.py': 'two' });
    workers[0]?.reply({ type: 'done', id: pending[1]!.id, result: { error: null, results: [] } });
    await second;
  });

  it('warm() starts loading before the first run, and the run then reuses it', async () => {
    const { runner, workers } = setup(answering(() => ({ error: null, results: [] })));
    runner.warm();
    await vi.waitFor(() => expect(workers).toHaveLength(1));
    await runner.run(files, []);
    expect(workers).toHaveLength(1);
  });
});

describe('python runner: the 5 second stop', () => {
  beforeEach(() => vi.useFakeTimers());

  /** Answers a boot at once, then goes quiet on a run, like a loop that never ends. */
  const hanging = (loopsOn: number[] = [1]): Script => {
    let runs = 0;
    return (message, worker) => {
      if (message.type === 'run') {
        runs += 1;
        if (loopsOn.includes(runs)) {
          worker.reply({ type: 'out', id: message.id, stream: 'stdout', text: 'tick' });
          return; // never answers
        }
        worker.reply({ type: 'done', id: message.id, result: { error: null, results: [ok] } });
      } else answering(() => null)(message, worker);
    };
  };

  it('terminates the worker, says so in plain words, and keeps what was printed', async () => {
    const { runner, workers } = setup(hanging());
    const run = runner.run(files, [test('A.')]);
    await vi.advanceTimersByTimeAsync(4999);
    expect(workers[0]?.terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    const out = await run;
    expect(workers[0]?.terminated).toBe(true);
    expect(out.error).toBe(
      'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
    );
    expect(out.logs).toEqual(['tick']);
    expect(out.results).toEqual([]);
    expect(runPassed(out)).toBe(false);
  });

  it('starts a fresh worker on the next run, not before, and says it is restarting', async () => {
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
    expect(second.error).toBeUndefined();
    expect(runPassed(second)).toBe(true);
  });

  it('honours a shorter timeout and names it in the message', async () => {
    const { runner } = setup(hanging());
    const run = runner.run(files, [], { timeoutMs: 2000 });
    await vi.advanceTimersByTimeAsync(2001);
    expect((await run).error).toMatch(/^Your code ran for more than 2 seconds,/);
  });

  it('counts the time from when the run reaches the worker, not from when it was asked for', async () => {
    // A boot that takes 20 s must not use up the run's 5 s.
    const answer = answering(() => ({ error: null, results: [ok] }));
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

describe('python runner: loading', () => {
  it('goes downloading, starting, ready, running on the first run, and remembers it loaded', async () => {
    const { runner, status, phases, store } = setup(
      answering(() => ({ error: null, results: [] })),
    );
    expect(status.get()).toEqual({ phase: 'idle', firstTime: true });
    await runner.run(files, []);
    // The status also publishes when `firstTime` flips, so the same phase can repeat.
    expect([...new Set(phases)]).toEqual(['downloading', 'starting', 'ready', 'running']);
    expect(status.get().phase).toBe('ready');
    expect(status.get().firstTime).toBe(false);
    expect(store.get(LOADED_FLAG_KEY)).toBe('1');
  });

  it('does not say "downloading" on a device that has loaded Python before', async () => {
    const { runner, phases } = setup(
      answering(() => ({ error: null, results: [] })),
      {
        loaded: true,
      },
    );
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
      answering(() => ({ error: null, results: [ok] }))(message, worker);
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
        worker.reply({ type: 'done', id: message.id, result: { error: null, results: [ok] } });
      } else answering(() => null)(message, worker);
    });
    const crashed = await runner.run(files, [test('A.')]);
    expect(crashed.error).toMatch(/stopped working unexpectedly/);
    const next = await runner.run(files, [test('A.')]);
    expect(runPassed(next)).toBe(true);
    expect(workers).toHaveLength(2);
  });

  it('a failure inside the harness is reported, and the worker stays', async () => {
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'run') {
        worker.reply({ type: 'fail', id: message.id, error: 'Traceback...\nValueError: boom' });
      } else answering(() => null)(message, worker);
    });
    const out = await runner.run(files, []);
    expect(out.error).toBe('Python could not check your code: ValueError: boom. Try again.');
    expect(workers[0]?.terminated).toBe(false);
  });

  it('dispose() stops the worker, and a later run starts a new one', async () => {
    const { runner, workers } = setup(answering(() => ({ error: null, results: [] })));
    await runner.run(files, []);
    runner.dispose();
    expect(workers[0]?.terminated).toBe(true);
    await runner.run(files, []);
    expect(workers).toHaveLength(2);
  });
});
