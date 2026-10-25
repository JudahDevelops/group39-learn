/** The sentences of the fastapi runner (src/runners/fastapi/messages.ts) and the helpers behind the Requests panel. */
import { describe, expect, it } from 'vitest';
import {
  bodyProblem,
  describeAppError,
  failureMessage,
  normalizePath,
  statusText,
  timeoutText,
  type PyError,
} from '../../src/runners/fastapi/messages';
import { shownBody, statusKind, routesText } from '../../src/runners/fastapi/view';
import { createHistory } from '../../src/runners/fastapi/history';

const error = (over: Partial<PyError>): PyError => ({
  type: 'NameError',
  message: "name 'totl' is not defined",
  file: 'main.py',
  line: 12,
  source: 'return totl',
  syntax: false,
  ...over,
});

describe('describeAppError', () => {
  it('says a missing app or a missing main.py in the harness own words', () => {
    const noApp = error({
      type: 'NoApp',
      message: 'main.py does not define app. Create it near the top with app = FastAPI().',
      file: null,
      line: null,
      source: null,
    });
    expect(describeAppError(noApp)).toBe(noApp.message);
    const noEntry = error({ type: 'NoEntry', message: 'There is no main.py to run.' });
    expect(describeAppError(noEntry, 'test')).toBe('There is no main.py to run.');
  });

  it('names the file and the line of a Python error in the learner’s code', () => {
    expect(describeAppError(error({}))).toBe(
      'Your code stopped on line 12 of main.py, which reads return totl. Python does not know the name "totl". Check the spelling, or give it a value before this line.',
    );
  });

  it('names the packages the runner has when a module is missing, instead of "built-in modules only"', () => {
    const text = describeAppError(
      error({
        type: 'ModuleNotFoundError',
        message: "No module named 'passlib'",
        line: 2,
        source: 'import passlib',
      }),
    );
    expect(text).toContain('on line 2 of main.py, which reads import passlib');
    expect(text).toContain('The module "passlib" is not available here.');
    expect(text).toContain('FastAPI, pydantic, httpx, SQLAlchemy, bcrypt, PyJWT');
    expect(text).not.toContain('built-in modules');
  });

  it('reads a syntax error as a sentence about the line', () => {
    const text = describeAppError(
      error({
        type: 'SyntaxError',
        message: "expected ':'",
        syntax: true,
        line: 10,
        source: 'def f()',
      }),
    );
    expect(text).toMatch(/^Python cannot read your code on line 10 of main\.py/);
    expect(text).toContain('A colon (:) is missing');
  });
});

describe('failureMessage', () => {
  it('is the test’s own hint when the assert failed', () => {
    expect(failureMessage('Return <code>200</code>.', null)).toBe('Return <code>200</code>.');
  });

  it('keeps the hint and adds Python’s words, escaped, when the test raised', () => {
    const message = failureMessage('Return 24.', error({ message: "name '<x>' is not defined" }));
    expect(message.startsWith('Return 24. <span class="fa-reason">')).toBe(true);
    expect(message).toContain('Python stopped while checking your code on line 12 of main.py');
    expect(message).not.toContain('<x>');
  });
});

describe('timeoutText', () => {
  it('is the same sentence as the Python runner’s, and names a shorter limit', () => {
    expect(timeoutText()).toBe(
      'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
    );
    expect(timeoutText(2000)).toMatch(/^Your code ran for more than 2 seconds,/);
  });
});

describe('statusText', () => {
  it('names the size before the first download, once', () => {
    expect(statusText({ phase: 'idle', firstTime: true })).toBe(
      'The FastAPI runner needs about 10.8 MB, once. It downloads the first time your app runs.',
    );
    expect(statusText({ phase: 'idle', firstTime: false })).toBeNull();
  });

  it('says what it is doing while it loads or restarts, and nothing when ready', () => {
    expect(statusText({ phase: 'downloading', firstTime: true })).toContain('about 10.8 MB, once');
    expect(statusText({ phase: 'starting', firstTime: false })).toBe(
      'Starting the FastAPI runner. Nearly there.',
    );
    expect(statusText({ phase: 'restarting', firstTime: false })).toContain('Restarting');
    expect(statusText({ phase: 'ready', firstTime: false })).toBeNull();
    expect(statusText({ phase: 'running', firstTime: false })).toBeNull();
  });
});

describe('request helpers', () => {
  it('bodyProblem accepts an empty box and valid JSON, and explains anything else', () => {
    expect(bodyProblem('')).toBeNull();
    expect(bodyProblem('   ')).toBeNull();
    expect(bodyProblem('{"number": "A-101", "beds": 4}')).toBeNull();
    expect(bodyProblem('[1, 2]')).toBeNull();
    expect(bodyProblem('{"number": ')).toMatch(
      /^The body is not valid JSON \(.+\)\. Fix it, then send again\.$/,
    );
  });

  it('normalizePath puts a slash in front and trims', () => {
    expect(normalizePath('rooms')).toBe('/rooms');
    expect(normalizePath('  /rooms/2?x=1 ')).toBe('/rooms/2?x=1');
    expect(normalizePath('')).toBe('/');
  });

  it('statusKind groups codes the way the plate colours them', () => {
    expect([200, 201, 204].map(statusKind)).toEqual(['ok', 'ok', 'ok']);
    expect([301, 307].map(statusKind)).toEqual(['redirect', 'redirect']);
    expect([404, 422, 500].map(statusKind)).toEqual(['error', 'error', 'error']);
  });

  it('routesText counts', () => {
    expect([0, 1, 3].map(routesText)).toEqual(['no routes', '1 route', '3 routes']);
  });
});

describe('shownBody', () => {
  it('prints JSON with indentation', () => {
    const shown = shownBody({
      body: '[{"a":1}]',
      contentType: 'application/json',
      truncated: false,
    });
    expect(shown).toEqual({ text: '[\n  {\n    "a": 1\n  }\n]', json: true, cut: false });
  });

  it('shows text as it came, and a body that only looks like JSON as it came', () => {
    expect(shownBody({ body: 'plain', contentType: 'text/plain', truncated: false })).toEqual({
      text: 'plain',
      json: false,
      cut: false,
    });
    expect(shownBody({ body: '{not json', contentType: 'text/html', truncated: false }).json).toBe(
      false,
    );
  });

  it('leaves a body the runner already cut alone, and says it is cut', () => {
    const shown = shownBody({
      body: '{"a": [1, 2',
      contentType: 'application/json',
      truncated: true,
    });
    expect(shown).toEqual({ text: '{"a": [1, 2', json: false, cut: true });
  });

  it('cuts a very long reply at the limit', () => {
    const shown = shownBody({
      body: 'x'.repeat(25_000),
      contentType: 'text/plain',
      truncated: false,
    });
    expect(shown.text).toHaveLength(20_000);
    expect(shown.cut).toBe(true);
  });
});

describe('request history', () => {
  const entry = (path: string, status: number | null = 200) => ({
    method: 'GET',
    path,
    body: '',
    status,
  });

  it('lists the newest first and keeps only the last few', () => {
    const history = createHistory(3);
    for (const path of ['/a', '/b', '/c', '/d']) history.add(entry(path));
    expect(history.get().map((e) => e.path)).toEqual(['/d', '/c', '/b']);
  });

  it('asking again for the same request replaces the last entry instead of repeating it', () => {
    const history = createHistory();
    history.add(entry('/a', 404));
    history.add(entry('/a', 200));
    expect(history.get()).toHaveLength(1);
    expect(history.get()[0]?.status).toBe(200);
    history.add({ ...entry('/a'), method: 'POST' });
    expect(history.get()).toHaveLength(2);
  });

  it('tells its listeners and can be cleared', () => {
    const history = createHistory();
    let calls = 0;
    const stop = history.subscribe(() => (calls += 1));
    history.add(entry('/a'));
    history.clear();
    expect(calls).toBe(2);
    expect(history.get()).toEqual([]);
    stop();
    history.add(entry('/b'));
    expect(calls).toBe(2);
  });
});
