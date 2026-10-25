/**
 * The fastapi runner's main-thread side with a stand-in for the worker: the init message, the run
 * and send messages, the result mapping, the queue, the 5 s stop, the restart, and the load
 * failures. The real worker, Pyodide and FastAPI are covered by tests/e2e/fastapi.spec.ts, and the
 * Python harness by tests/unit/runner.fastapi.harness.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestCase } from '../../src/content/schema';
import {
  createFastapiRunner,
  type WorkerHost,
  type WorkerLike,
} from '../../src/runners/fastapi/runner';
import { LOADED_FLAG_KEY, PIP_PACKAGES, PYODIDE_PACKAGES } from '../../src/runners/fastapi/config';
import {
  BOOT_FAILED_TEXT,
  BOOT_TIMEOUT_TEXT,
  NOT_RUNNING_TEXT,
  NO_MAIN_TEXT,
} from '../../src/runners/fastapi/messages';
import { createStatusStore, type FlagStorage } from '../../src/runners/fastapi/status';
import { runPassed } from '../../src/runners/outcome';
import type { HttpOutcome } from '../../src/runners/types';

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
const routes = [
  { method: 'GET', path: '/rooms' },
  { method: 'POST', path: '/rooms' },
];

const goodReply = {
  kind: 'reply',
  status: 200,
  reason: 'OK',
  contentType: 'application/json',
  location: null,
  body: '[]',
  truncated: false,
  ms: 3,
  error: null,
};

/** A worker that boots, then answers a run with `run(message)` and a send with `send(message)`. */
function answering(
  run: (message: Message) => unknown = () => ({ error: null, routes, results: [] }),
  send: (message: Message) => unknown = () => goodReply,
): Script {
  return (message, worker) => {
    if (message.type === 'init') {
      worker.reply({ type: 'stage', id: message.id, stage: 'download' });
      worker.reply({ type: 'stage', id: message.id, stage: 'start' });
      worker.reply({ type: 'done', id: message.id });
    } else if (message.type === 'run') {
      const result = message.fn === 'g39_fastapi_send' ? send(message) : run(message);
      worker.reply({ type: 'done', id: message.id, result });
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
  const runner = createFastapiRunner({ host, status, bootTimeoutMs: options.bootTimeoutMs });
  return { runner, workers, status, store, phases };
}

const test = (text: string, code = 'assert True'): TestCase => ({ text, code });
const files = { 'main.py': 'from fastapi import FastAPI\napp = FastAPI()' };
const get = (path: string) => ({ method: 'GET', path, body: '' });

afterEach(() => {
  vi.useRealTimers();
});

describe('fastapi runner: the worker it starts', () => {
  it('loads the built-in packages, installs the PyPI ones, then runs the prepare step', async () => {
    const { runner, workers } = setup(answering());
    await runner.run(files, []);
    const init = workers[0]?.sent[0];
    expect(init).toMatchObject({
      type: 'init',
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',
      packages: PYODIDE_PACKAGES,
      pip: PIP_PACKAGES,
      after: 'g39_prepare()',
    });
    expect(PYODIDE_PACKAGES).toEqual(
      expect.arrayContaining(['fastapi', 'pydantic', 'httpx', 'sqlalchemy', 'bcrypt', 'micropip']),
    );
    // The versions the spike ran, not whatever PyPI has newest.
    expect(PIP_PACKAGES).toEqual(['pyjwt==2.15.1', 'python-multipart==0.0.32']);
  });

  it('sends the python harness first and this runner’s harness after it, in one text', async () => {
    const { runner, workers } = setup(answering());
    await runner.run(files, []);
    const harness = String(workers[0]?.sent[0]?.harness);
    expect(harness.indexOf('def _write_files')).toBeGreaterThan(-1);
    expect(harness.indexOf('async def g39_fastapi_run')).toBeGreaterThan(
      harness.indexOf('def _write_files'),
    );
    expect(harness).toContain('async def g39_fastapi_send');
    expect(harness).toContain('def g39_prepare');
  });
});

describe('fastapi runner: results', () => {
  it('passes when every test passes, and sends the files and the test sources to g39_fastapi_run', async () => {
    const { runner, workers } = setup(
      answering(() => ({ error: null, routes, results: [ok, ok] })),
    );
    const out = await runner.run(files, [test('One.', 'assert 1'), test('Two.', 'assert 2')]);
    expect(out.error).toBeUndefined();
    expect(out.firstFailure).toBeNull();
    expect(runPassed(out)).toBe(true);
    expect(out.fastapi).toEqual({ routes });
    const run = workers[0]?.sent.find((m) => m.type === 'run');
    expect(run).toMatchObject({
      fn: 'g39_fastapi_run',
      payload: { files, tests: ['assert 1', 'assert 2'] },
    });
  });

  it('reports the first failing test with its hint, and the assertion detail for authors', async () => {
    const { runner } = setup(
      answering(() => ({ error: null, routes, results: [ok, fail('got 404'), fail()] })),
    );
    const out = await runner.run(files, [test('A.'), test('Needs <code>200</code>.'), test('C.')]);
    expect(out.results.map((r) => r.ok)).toEqual([true, false, false]);
    expect(out.firstFailure).toBe(1);
    expect(out.results[1]).toEqual({
      ok: false,
      message: 'Needs <code>200</code>.',
      detail: 'got 404',
    });
    expect(runPassed(out)).toBe(false);
  });

  it('a test that raised keeps its hint and adds plain words with the file and line', async () => {
    const error = {
      type: 'KeyError',
      message: "'beds'",
      file: 'main.py',
      line: 17,
      source: 'new_room["beds"]',
      syntax: false,
    };
    const { runner } = setup(
      answering(() => ({ error: null, routes, results: [fail('KeyError', error)] })),
    );
    const out = await runner.run(files, [test('Add the room.')]);
    const message = out.results[0]?.message ?? '';
    expect(message.startsWith('Add the room. ')).toBe(true);
    expect(message).toContain('on line 17 of main.py');
  });

  it('an app that did not start gives the plain-words error and no results or routes', async () => {
    const { runner } = setup(
      answering(() => ({
        error: {
          type: 'SyntaxError',
          message: 'invalid syntax',
          file: 'main.py',
          line: 10,
          source: 'def f(:',
          syntax: true,
        },
        routes: [],
        results: [],
      })),
    );
    const out = await runner.run(files, [test('A.')]);
    expect(out.results).toEqual([]);
    expect(out.fastapi).toBeUndefined();
    expect(out.error).toMatch(/^Python cannot read your code on line 10 of main\.py/);
    expect(runPassed(out)).toBe(false);
  });

  it('what the app printed while starting comes back as logs', async () => {
    const { runner } = setup((message, worker) => {
      if (message.type === 'run') {
        worker.reply({ type: 'out', id: message.id, stream: 'stdout', text: 'starting' });
        worker.reply({
          type: 'done',
          id: message.id,
          result: { error: null, routes, results: [] },
        });
      } else answering()(message, worker);
    });
    expect((await runner.run(files, [])).logs).toEqual(['starting']);
  });

  it('with no main.py it says so at once, without starting the runner', async () => {
    const { runner, workers } = setup(answering());
    const out = await runner.run({ 'app.py': 'x = 1' }, [test('A.')]);
    expect(out.error).toBe(NO_MAIN_TEXT);
    expect(workers).toHaveLength(0);
  });
});

describe('fastapi runner: send', () => {
  it('has nothing to talk to before the first run, and does not start the runner for it', async () => {
    const { runner, workers } = setup(answering());
    const out = await runner.send(get('/rooms'));
    expect(out).toEqual({ kind: 'notice', text: NOT_RUNNING_TEXT, appGone: true });
    expect(workers).toHaveLength(0);
  });

  it('sends one request to the app the last run loaded, with the path fixed up', async () => {
    const { runner, workers } = setup(answering());
    await runner.run(files, []);
    const out = await runner.send({ method: 'POST', path: 'rooms', body: '{"beds": 4}' });
    expect(out).toMatchObject({
      kind: 'reply',
      status: 200,
      reason: 'OK',
      contentType: 'application/json',
      body: '[]',
      ms: 3,
      logs: [],
      error: null,
    });
    const send = workers[0]?.sent.find((m) => m.fn === 'g39_fastapi_send');
    expect(send?.payload).toEqual({ method: 'POST', path: '/rooms', body: '{"beds": 4}' });
    expect(workers).toHaveLength(1);
  });

  it('does not send a body that is not JSON, and says why', async () => {
    const { runner, workers } = setup(answering());
    await runner.run(files, []);
    const out = await runner.send({ method: 'POST', path: '/rooms', body: '{"beds": ' });
    expect(out).toMatchObject({ kind: 'notice', appGone: false });
    expect((out as { text: string }).text).toMatch(/^The body is not valid JSON/);
    expect(workers[0]?.sent.some((m) => m.fn === 'g39_fastapi_send')).toBe(false);
  });

  it('a handler that raised is a 500 with the error in plain words and the line', async () => {
    const { runner } = setup(
      answering(undefined, () => ({
        ...goodReply,
        status: 500,
        reason: 'Internal Server Error',
        body: 'Internal Server Error',
        contentType: null,
        error: {
          type: 'NameError',
          message: "name 'totl' is not defined",
          file: 'main.py',
          line: 12,
          source: 'return totl',
          syntax: false,
        },
      })),
    );
    await runner.run(files, []);
    const out = (await runner.send(get('/rooms'))) as Extract<HttpOutcome, { kind: 'reply' }>;
    expect(out.status).toBe(500);
    expect(out.error).toContain('on line 12 of main.py, which reads return totl');
  });

  it('lines the handler printed come back with the reply', async () => {
    const { runner } = setup((message, worker) => {
      if (message.type === 'run' && message.fn === 'g39_fastapi_send') {
        worker.reply({ type: 'out', id: message.id, stream: 'stdout', text: 'asked' });
        worker.reply({ type: 'done', id: message.id, result: goodReply });
      } else answering()(message, worker);
    });
    await runner.run(files, []);
    const out = (await runner.send(get('/rooms'))) as Extract<HttpOutcome, { kind: 'reply' }>;
    expect(out.logs).toEqual(['asked']);
  });

  it('the harness saying there is no app (the last run failed) is a notice that the app is gone', async () => {
    const { runner } = setup(answering(undefined, () => ({ kind: 'no-app' })));
    await runner.run(files, []);
    expect(await runner.send(get('/rooms'))).toEqual({
      kind: 'notice',
      text: NOT_RUNNING_TEXT,
      appGone: true,
    });
  });

  it('waits for a run that was started first, then talks to its app', async () => {
    const pending: Message[] = [];
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'run' && message.fn === 'g39_fastapi_run') pending.push(message);
      else answering()(message, worker);
    });
    const run = runner.run(files, []);
    const sent = runner.send(get('/rooms'));
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    expect(workers[0]?.sent.some((m) => m.fn === 'g39_fastapi_send')).toBe(false);
    workers[0]?.reply({
      type: 'done',
      id: pending[0]!.id,
      result: { error: null, routes, results: [] },
    });
    await run;
    expect(await sent).toMatchObject({ kind: 'reply', status: 200 });
  });
});

describe('fastapi runner: the 5 second stop', () => {
  beforeEach(() => vi.useFakeTimers());

  /** Answers a boot at once, then goes quiet on the nth run or send, like a loop that never ends. */
  const hanging = (kind: 'run' | 'send', nth = 1): Script => {
    let seen = 0;
    return (message, worker) => {
      const isSend = message.fn === 'g39_fastapi_send';
      if (message.type === 'run' && isSend === (kind === 'send')) {
        seen += 1;
        if (seen === nth) return; // never answers
      }
      answering(() => ({ error: null, routes, results: [ok] }))(message, worker);
    };
  };

  it('a run that never ends terminates the worker and says so in plain words', async () => {
    const { runner, workers } = setup(hanging('run'));
    const run = runner.run(files, [test('A.')]);
    await vi.advanceTimersByTimeAsync(4999);
    expect(workers[0]?.terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    const out = await run;
    expect(workers[0]?.terminated).toBe(true);
    expect(out.error).toBe(
      'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
    );
    expect(out.results).toEqual([]);
  });

  it('a request that never ends does the same, and the app is gone afterwards', async () => {
    const { runner, workers, status } = setup(hanging('send'));
    await runner.run(files, []);
    const sent = runner.send(get('/rooms'));
    await vi.advanceTimersByTimeAsync(5001);
    const out = await sent;
    expect(workers[0]?.terminated).toBe(true);
    expect(out).toEqual({
      kind: 'notice',
      text: 'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
      appGone: true,
    });
    expect(status.get().phase).toBe('idle');
    // Nothing to talk to until the next Run, and asking does not start a worker.
    expect(await runner.send(get('/rooms'))).toMatchObject({ kind: 'notice', appGone: true });
    expect(workers).toHaveLength(1);
  });

  it('starts a fresh worker on the next run, not before, and says it is restarting', async () => {
    const { runner, workers, phases } = setup(hanging('send'));
    await runner.run(files, []);
    const sent = runner.send(get('/rooms'));
    await vi.advanceTimersByTimeAsync(5001);
    await sent;

    phases.length = 0;
    const again = await runner.run(files, [test('A.')]);
    expect(workers).toHaveLength(2);
    expect(phases).toContain('restarting');
    expect(runPassed(again)).toBe(true);
    expect(await runner.send(get('/rooms'))).toMatchObject({ kind: 'reply', status: 200 });
  });

  it('counts the time from when the job reaches the worker, not from when it was asked for', async () => {
    const answer = answering();
    const slowBoot = setup((message, worker) => {
      if (message.type === 'init') setTimeout(() => answer(message, worker), 20_000);
      else answer(message, worker);
    });
    const run = slowBoot.runner.run(files, []);
    await vi.advanceTimersByTimeAsync(20_001);
    expect((await run).error).toBeUndefined();
    expect(slowBoot.workers[0]?.terminated).toBe(false);
  });
});

describe('fastapi runner: loading', () => {
  it('goes downloading, starting, ready, running on the first run, and remembers it loaded', async () => {
    const { runner, status, phases, store } = setup(answering());
    expect(status.get()).toEqual({ phase: 'idle', firstTime: true });
    await runner.run(files, []);
    expect([...new Set(phases)]).toEqual(['downloading', 'starting', 'ready', 'running']);
    expect(status.get().firstTime).toBe(false);
    expect(store.get(LOADED_FLAG_KEY)).toBe('1');
    expect(LOADED_FLAG_KEY).toBe('g39.fastapi.loaded');
  });

  it('does not say "downloading" on a device that has loaded the runner before', async () => {
    const { runner, phases } = setup(answering(), { loaded: true });
    await runner.run(files, []);
    expect(phases).not.toContain('downloading');
    expect(phases[0]).toBe('starting');
  });

  it('a failed download is a plain-words error, and the next run tries again', async () => {
    let attempts = 0;
    const { runner, workers } = setup((message, worker) => {
      if (message.type === 'init') {
        attempts += 1;
        if (attempts === 1) {
          worker.reply({ type: 'fail', id: message.id, error: 'micropip could not reach PyPI' });
          return;
        }
      }
      answering()(message, worker);
    });
    const failed = await runner.run(files, [test('A.')]);
    expect(failed.error).toBe(BOOT_FAILED_TEXT);
    expect(workers[0]?.terminated).toBe(true);
    const again = await runner.run(files, []);
    expect(again.error).toBeUndefined();
    expect(workers).toHaveLength(2);
  });

  it('gives up on a load that never finishes', async () => {
    vi.useFakeTimers();
    const { runner, workers } = setup(() => undefined, { bootTimeoutMs: 1000 });
    const run = runner.run(files, []);
    await vi.advanceTimersByTimeAsync(1001);
    expect((await run).error).toBe(BOOT_TIMEOUT_TEXT);
    expect(workers[0]?.terminated).toBe(true);
  });

  it('warm() starts loading before the first run, and the run then reuses it', async () => {
    const { runner, workers } = setup(answering());
    runner.warm();
    await vi.waitFor(() => expect(workers).toHaveLength(1));
    await runner.run(files, []);
    expect(workers).toHaveLength(1);
  });

  it('dispose() stops the worker, and the next run starts a new one', async () => {
    const { runner, workers, status } = setup(answering());
    await runner.run(files, []);
    runner.dispose();
    expect(workers[0]?.terminated).toBe(true);
    expect(status.get().phase).toBe('idle');
    await runner.run(files, []);
    expect(workers).toHaveLength(2);
  });
});
