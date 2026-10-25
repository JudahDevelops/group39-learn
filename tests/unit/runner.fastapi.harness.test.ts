/**
 * The Python side of the fastapi runner (src/runners/fastapi/harness.py, loaded after the python
 * runner's harness.py), run with the machine's own python3. Pyodide is CPython compiled to
 * WebAssembly, so the language behaves the same; the e2e suite (tests/e2e/fastapi.spec.ts) covers
 * the part that needs the real worker, FastAPI and the thread patch.
 *
 * FastAPI, pydantic and httpx are not installed here, so the apps below are plain ASGI callables and
 * `httpx` is a small stand-in written into a temporary folder: it has the `AsyncClient` and
 * `ASGITransport` the harness uses, and nothing else. The runner's real packages are exercised by the
 * second suite, which runs only when G39_FASTAPI_PYTHON names a python3 that has them.
 *
 * Without python3 the first suite is skipped on a developer machine and fails in CI (where CI is
 * set), so CI cannot pass by skipping it.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PYTHON_HARNESS = join(ROOT, 'src', 'runners', 'python', 'harness.py');
const HARNESS = join(ROOT, 'src', 'runners', 'fastapi', 'harness.py');

const probe = spawnSync('python3', ['-I', '-c', 'import sys; print(sys.version_info[0])']);
const hasPython = probe.status === 0;

const REAL_PYTHON = process.env.G39_FASTAPI_PYTHON ?? '';
const hasRealPackages =
  REAL_PYTHON !== '' &&
  spawnSync(REAL_PYTHON, ['-I', '-c', 'import fastapi, httpx, pydantic, sqlalchemy, anyio'])
    .status === 0;

/** Just enough of httpx for the harness: an ASGI app is called with a scope, a receive and a send. */
const STUB_HTTPX = `
import json as _json


class ASGITransport:
    def __init__(self, app, **_options):
        self.app = app


class Response:
    def __init__(self, status, headers, body):
        self.status_code = status
        self.headers = {k.decode().lower(): v.decode() for k, v in headers}
        self.content = body
        self.text = body.decode("utf-8", "replace")
        self.reason_phrase = {200: "OK", 201: "Created", 404: "Not Found", 422: "Unprocessable Entity"}.get(status, "")

    def json(self):
        return _json.loads(self.text)


class AsyncClient:
    def __init__(self, transport=None, base_url=""):
        self._app = transport.app

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return None

    async def aclose(self):
        return None

    async def request(self, method, url, json=None):
        path, _, query = url.partition("?")
        body = _json.dumps(json).encode() if json is not None else b""
        scope = {"type": "http", "method": method, "path": path, "query_string": query.encode(), "headers": []}
        sent = {"status": 0, "headers": [], "body": b""}
        delivered = []

        async def receive():
            if delivered:
                return {"type": "http.disconnect"}
            delivered.append(1)
            return {"type": "http.request", "body": body, "more_body": False}

        async def send(event):
            if event["type"] == "http.response.start":
                sent["status"] = event["status"]
                sent["headers"] = event["headers"]
            elif event["type"] == "http.response.body":
                sent["body"] += event.get("body", b"")

        await self._app(scope, receive, send)
        return Response(sent["status"], sent["headers"], sent["body"])

    async def get(self, url, **kw):
        return await self.request("GET", url, **kw)

    async def post(self, url, **kw):
        return await self.request("POST", url, **kw)
`;

/** Loads both harness files the way the worker does, then runs the steps in order and reports each. */
const DRIVER = `
import asyncio, io, json, sys
echo_out, echo_err = io.StringIO(), io.StringIO()
real = sys.stdout
sys.stdout, sys.stderr = echo_out, echo_err
ns = {"__name__": "g39_harness"}
for path in sys.argv[1:3]:
    exec(compile(open(path, encoding="utf-8").read(), path, "exec"), ns)
sys.stdout = real
steps = json.loads(sys.argv[3])
async def main():
    answers = []
    for step in steps:
        fn = ns["g39_fastapi_run"] if step["op"] == "run" else ns["g39_fastapi_send"]
        answers.append(json.loads(await fn(json.dumps(step["payload"]))))
    return answers
answers = asyncio.run(main())
print(json.dumps({"answers": answers, "stdout": echo_out.getvalue(), "stderr": echo_err.getvalue()}))
`;

interface ErrorInfo {
  type: string;
  message: string;
  file: string | null;
  line: number | null;
  source: string | null;
  syntax: boolean;
}
interface RunAnswer {
  error: ErrorInfo | null;
  routes: { method: string; path: string }[];
  results: { ok: boolean; detail: string | null; error: ErrorInfo | null }[];
}
interface SendAnswer {
  kind: 'no-app' | 'bad-body' | 'reply';
  message?: string;
  status?: number;
  reason?: string;
  contentType?: string | null;
  location?: string | null;
  body?: string;
  truncated?: boolean;
  ms?: number;
  error?: ErrorInfo | null;
}
type Step =
  | { op: 'run'; payload: { files: Record<string, string>; tests?: string[] } }
  | { op: 'send'; payload: { method?: string; path?: string; body?: string | null } };
interface Ran {
  answers: unknown[];
  stdout: string;
  stderr: string;
}

/** A small ASGI app in main.py's words: routes answered from a table, state kept in module variables. */
const APP = `
import json
from types import SimpleNamespace

hits = {"count": 0}
rooms = [{"id": 1, "number": "A-101"}]


class App:
    def __init__(self):
        self.routes = [
            SimpleNamespace(path="/rooms", methods={"GET", "HEAD"}, include_in_schema=True),
            SimpleNamespace(path="/rooms", methods={"POST"}, include_in_schema=True),
            SimpleNamespace(path="/docs", methods={"GET", "HEAD"}, include_in_schema=False),
        ]

    async def __call__(self, scope, receive, send):
        status, payload = 200, None
        if scope["path"] == "/rooms" and scope["method"] == "GET":
            payload = rooms
        elif scope["path"] == "/rooms" and scope["method"] == "POST":
            request = await receive()
            rooms.append({"id": len(rooms) + 1, **json.loads(request["body"])})
            status, payload = 201, rooms[-1]
        elif scope["path"] == "/count":
            hits["count"] += 1
            payload = {"count": hits["count"]}
        elif scope["path"] == "/boom":
            return missing_name
        elif scope["path"] == "/say":
            print("said hello")
            payload = {}
        else:
            status, payload = 404, {"detail": "Not Found"}
        await send({"type": "http.response.start", "status": status, "headers": [(b"content-type", b"application/json")]})
        await send({"type": "http.response.body", "body": json.dumps(payload).encode()})


app = App()
`;

describe.skipIf(!hasPython && !process.env.CI)('fastapi harness.py', () => {
  let dir = '';
  beforeAll(() => {
    if (!hasPython) throw new Error('python3 is not installed');
    dir = mkdtempSync(join(tmpdir(), 'g39-fastapi-'));
    mkdirSync(join(dir, 'stub'));
    writeFileSync(join(dir, 'stub', 'httpx.py'), STUB_HTTPX);
  });
  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function drive(steps: Step[], python = 'python3', stub = true): Ran {
    const child = spawnSync(
      python,
      ['-c', DRIVER, PYTHON_HARNESS, HARNESS, JSON.stringify(steps)],
      {
        env: {
          ...process.env,
          G39_LEARNER_DIR: join(dir, 'learner'),
          PYTHONPATH: stub ? join(dir, 'stub') : '',
          PYTHONDONTWRITEBYTECODE: '1',
        },
        encoding: 'utf8',
      },
    );
    if (child.status !== 0) throw new Error(`driver failed: ${child.stderr}`);
    return JSON.parse(child.stdout) as Ran;
  }

  const files = (main: string, extra: Record<string, string> = {}) => ({
    'main.py': main,
    ...extra,
  });
  const run = (f: Record<string, string>, tests: string[] = []): Step => ({
    op: 'run',
    payload: { files: f, tests },
  });
  const send = (path: string, method = 'GET', body: string | null = null): Step => ({
    op: 'send',
    payload: { method, path, body },
  });
  const answersOf = (ran: Ran) => ran.answers as (RunAnswer & SendAnswer)[];
  const oks = (answer: RunAnswer | undefined) => answer?.results.map((r) => r.ok);

  describe('loading the app', () => {
    it('imports app from main.py and lists the routes the learner wrote, without HEAD or the docs', () => {
      const [answer] = answersOf(drive([run(files(APP))]));
      expect(answer?.error).toBeNull();
      expect(answer?.routes).toEqual([
        { method: 'GET', path: '/rooms' },
        { method: 'POST', path: '/rooms' },
      ]);
    });

    it('echoes what main.py prints while it loads', () => {
      const ran = drive([run(files('print("starting")\n' + APP))]);
      expect(ran.stdout).toBe('starting\n');
    });

    it('says there is no main.py, and no app, in whole sentences', () => {
      const [noMain, noApp, notAnApp] = answersOf(
        drive([run({ 'other.py': 'x = 1' }), run(files('x = 1')), run(files('app = 42'))]),
      );
      expect(noMain?.error).toMatchObject({
        type: 'NoEntry',
        message: 'There is no main.py to run.',
      });
      expect(noApp?.error).toMatchObject({
        type: 'NoApp',
        message: 'main.py does not define app. Create it near the top with app = FastAPI().',
      });
      expect(notAnApp?.error?.type).toBe('NoApp');
      expect(notAnApp?.error?.message).toContain('is not an application');
    });

    it('a syntax error comes back with the file, the line and the text of the line, and runs no test', () => {
      const [answer] = answersOf(
        drive([run(files('app = 1\n\ndef broken(:\n    pass\n'), ['assert True'])]),
      );
      expect(answer?.error).toMatchObject({
        type: 'SyntaxError',
        file: 'main.py',
        line: 3,
        syntax: true,
      });
      expect(answer?.error?.source).toBe('def broken(:');
      expect(answer?.results).toEqual([]);
    });

    it('an error in a second file names that file and its line', () => {
      const [answer] = answersOf(
        drive([
          run(
            files('import helpers\napp = helpers.make()', {
              'helpers.py': 'def make():\n    return nope\n',
            }),
          ),
        ]),
      );
      expect(answer?.error).toMatchObject({
        type: 'NameError',
        file: 'helpers.py',
        line: 2,
        source: 'return nope',
      });
    });

    it('a module the runner does not have is a ModuleNotFoundError at the import line', () => {
      const [answer] = answersOf(drive([run(files('import not_a_real_module\napp = 1'))]));
      expect(answer?.error).toMatchObject({
        type: 'ModuleNotFoundError',
        file: 'main.py',
        line: 1,
      });
    });

    it('imports main.py fresh every run: module state and the other files start over', () => {
      const first = files(APP + '\nhits["count"] = 40\n', { 'extra.py': 'VALUE = 1\n' });
      const second = files(APP, { 'extra.py': 'VALUE = 2\n' });
      const answers = answersOf(
        drive([
          run(first),
          send('/count'),
          run(second, ['import extra\nassert extra.VALUE == 2']),
          send('/count'),
        ]),
      );
      expect(JSON.parse(answers[1]?.body ?? '{}')).toEqual({ count: 41 });
      expect(oks(answers[2])).toEqual([true]);
      // The second run started from zero, not from 41.
      expect(JSON.parse(answers[3]?.body ?? '{}')).toEqual({ count: 1 });
    });

    it('imports a file in a folder, and writes data files beside the code', () => {
      const [answer] = answersOf(
        drive([
          run(
            files('from routers import hall\n' + APP + '\nhall_name = hall.NAME\n', {
              'routers/hall.py': 'NAME = "Hall A"\n',
              'data/rooms.json': '[1, 2]',
            }),
            [
              'assert __import__("main").hall_name == "Hall A"',
              'import json\nassert json.load(open("data/rooms.json")) == [1, 2]',
            ],
          ),
        ]),
      );
      expect(answer?.error).toBeNull();
      expect(oks(answer)).toEqual([true, true]);
    });

    it('does not keep files from an earlier run', () => {
      const answers = answersOf(
        drive([
          run(files(APP, { 'old.py': 'x = 1\n' })),
          run(files(APP), [
            'import os\nassert not os.path.exists("old.py")\nassert "old.py" not in _code',
          ]),
        ]),
      );
      expect(oks(answers[1])).toEqual([true]);
    });

    it('runs the app’s startup before the tests and a request, and its failure is the learner’s error', () => {
      const withLifespan = `
from contextlib import asynccontextmanager
${APP}

@asynccontextmanager
async def lifespan(_app):
    app.started = True
    yield
    app.started = False

app.router = type("Router", (), {"lifespan_context": staticmethod(lifespan)})()
`;
      const failing = `
${APP}

@__import__("contextlib").asynccontextmanager
async def lifespan(_app):
    raise RuntimeError("no database")
    yield

app.router = type("Router", (), {"lifespan_context": staticmethod(lifespan)})()
`;
      const [started, failed] = answersOf(
        drive([run(files(withLifespan), ['assert app.started is True']), run(files(failing))]),
      );
      expect(oks(started)).toEqual([true]);
      expect(failed?.error).toMatchObject({ type: 'RuntimeError', file: 'main.py' });
      expect(failed?.error?.message).toBe('no database');
    });
  });

  describe('the tests', () => {
    it('are async Python with client, app, _code and the helpers; top-level await works', () => {
      const [answer] = answersOf(
        drive([
          run(files('print("hi")\ndef helper():\n    return 1\n' + APP), [
            'r = await client.get("/rooms")\nassert r.status_code == 200\nassert r.json()[0]["number"] == "A-101"',
            'assert app is __import__("main").app',
            'assert set(_code) == {"main.py"}\nassert "def helper" in _code["main.py"]',
            'assert has_function("helper") and not has_function("nope")\nassert defines("helper") and defines("rooms") and not defines("nope")',
            'assert prints("hi") and not prints("bye") and _stdout == "hi\\n"',
          ]),
        ]),
      );
      expect(oks(answer)).toEqual([true, true, true, true, true]);
    });

    it('has_function looks in every .py file, and defines only in main.py', () => {
      const [answer] = answersOf(
        drive([
          run(
            files('import helpers\n' + APP, {
              'helpers.py': 'async def make():\n    pass\nVALUE = 1\n',
            }),
            [
              'assert has_function("make")',
              'assert not defines("VALUE")',
              'assert defines("helpers")',
            ],
          ),
        ]),
      );
      expect(oks(answer)).toEqual([true, true, true]);
    });

    it('a failed assert is a failed test with the assertion’s own words as the detail and no error', () => {
      const [answer] = answersOf(
        drive([
          run(files(APP), [
            'r = await client.get("/nothing")\nassert r.status_code == 200, "got " + str(r.status_code)',
            'assert 1 == 2',
          ]),
        ]),
      );
      expect(oks(answer)).toEqual([false, false]);
      expect(answer?.results[0]).toMatchObject({ detail: 'got 404', error: null });
      expect(answer?.results[1]?.detail).toBe('assert 1 == 2');
    });

    it('an exception that is not an assert is a failed test with the error in plain-words form', () => {
      const [answer] = answersOf(
        drive([run(files(APP), ['raise ValueError("boom")', 'await client.get("/boom")'])]),
      );
      expect(oks(answer)).toEqual([false, false]);
      expect(answer?.results[0]?.error).toMatchObject({ type: 'ValueError', message: 'boom' });
      // The app raised inside the request: the line is main.py’s, not the runner’s.
      expect(answer?.results[1]?.error).toMatchObject({ type: 'NameError', file: 'main.py' });
    });

    it('share one app: what one test changes the next sees', () => {
      const [answer] = answersOf(
        drive([
          run(files(APP), [
            'r = await client.post("/rooms", json={"number": "C-301"})\nassert r.status_code == 201',
            'assert len((await client.get("/rooms")).json()) == 2',
          ]),
        ]),
      );
      expect(oks(answer)).toEqual([true, true]);
    });

    it('a test that changes the app does not change the app the Requests panel talks to', () => {
      const answers = answersOf(
        drive([
          run(files(APP), ['await client.post("/rooms", json={"number": "C-301"})']),
          send('/rooms'),
        ]),
      );
      expect(JSON.parse(answers[1]?.body ?? '[]')).toHaveLength(1);
    });

    it('a syntax error in the test itself is a failed test, not a crash', () => {
      const [answer] = answersOf(drive([run(files(APP), ['def (', 'assert True'])]));
      expect(oks(answer)).toEqual([false, true]);
    });
  });

  describe('send', () => {
    it('has no app before the first run, and after a run that failed', () => {
      const answers = answersOf(
        drive([
          send('/rooms'),
          run(files(APP)),
          send('/rooms'),
          run(files('x = 1')),
          send('/rooms'),
        ]),
      );
      expect(answers.map((a) => a.kind)).toEqual([
        'no-app',
        undefined,
        'reply',
        undefined,
        'no-app',
      ]);
    });

    it('sends a request and reports the status, the type and the body', () => {
      const answers = answersOf(drive([run(files(APP)), send('/rooms'), send('/nowhere')]));
      expect(answers[1]).toMatchObject({
        kind: 'reply',
        status: 200,
        reason: 'OK',
        contentType: 'application/json',
        location: null,
        body: '[{"id": 1, "number": "A-101"}]',
        truncated: false,
        error: null,
      });
      expect(typeof answers[1]?.ms).toBe('number');
      expect(answers[2]).toMatchObject({ status: 404, body: '{"detail": "Not Found"}' });
    });

    it('sends a JSON body, and the app keeps its data between requests', () => {
      const answers = answersOf(
        drive([run(files(APP)), send('/rooms', 'POST', '{"number": "C-301"}'), send('/rooms')]),
      );
      expect(answers[1]).toMatchObject({ status: 201 });
      expect(JSON.parse(answers[2]?.body ?? '[]')).toHaveLength(2);
    });

    it('refuses a body that is not JSON without sending anything', () => {
      const answers = answersOf(
        drive([run(files(APP)), send('/rooms', 'POST', '{"number": '), send('/rooms')]),
      );
      expect(answers[1]).toMatchObject({ kind: 'bad-body' });
      expect(JSON.parse(answers[2]?.body ?? '[]')).toHaveLength(1);
    });

    it('a handler that raises is a 500 with the error, the file and the line', () => {
      const [, , reply] = answersOf(drive([run(files(APP)), send('/rooms'), send('/boom')]));
      expect(reply).toMatchObject({ kind: 'reply', status: 500, reason: 'Internal Server Error' });
      expect(reply?.error).toMatchObject({
        type: 'NameError',
        file: 'main.py',
        source: 'return missing_name',
      });
    });

    it('what the handler prints is echoed', () => {
      const ran = drive([run(files(APP)), send('/say')]);
      expect(ran.stdout).toBe('said hello\n');
    });

    it('cuts a very long reply', () => {
      const big = `${APP}\nrooms.extend({"id": i, "number": "X" * 20} for i in range(20000))\n`;
      const [, reply] = answersOf(drive([run(files(big)), send('/rooms')]));
      expect(reply?.truncated).toBe(true);
      expect(reply?.body).toHaveLength(200_000);
    });
  });
});

describe.skipIf(!hasRealPackages)(
  'fastapi harness.py with the real packages (G39_FASTAPI_PYTHON)',
  () => {
    let dir = '';
    beforeAll(() => {
      dir = mkdtempSync(join(tmpdir(), 'g39-fastapi-real-'));
    });
    afterAll(() => {
      if (dir) rmSync(dir, { recursive: true, force: true });
    });

    function drive(steps: Step[]): Ran {
      const child = spawnSync(
        REAL_PYTHON,
        ['-c', DRIVER, PYTHON_HARNESS, HARNESS, JSON.stringify(steps)],
        {
          env: {
            ...process.env,
            G39_LEARNER_DIR: join(dir, 'learner'),
            PYTHONDONTWRITEBYTECODE: '1',
          },
          encoding: 'utf8',
        },
      );
      if (child.status !== 0) throw new Error(`driver failed: ${child.stderr}`);
      return JSON.parse(child.stdout) as Ran;
    }

    const MAIN = `
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()
rooms = [{"id": 1, "number": "A-101", "beds": 4}]


class RoomIn(BaseModel):
    number: str
    beds: int


@app.get("/rooms")
def list_rooms():
    return rooms


@app.get("/rooms/{room_id}")
async def get_room(room_id: int):
    for room in rooms:
        if room["id"] == room_id:
            return room
    raise HTTPException(status_code=404, detail="Room not found")


@app.post("/rooms", status_code=201)
def create_room(room: RoomIn):
    rooms.append({"id": len(rooms) + 1, **room.model_dump()})
    return rooms[-1]
`;

    it('lists the routes, answers 404 and 422 as FastAPI does, and tests run against the app', () => {
      const answers = drive([
        {
          op: 'run',
          payload: {
            files: { 'main.py': MAIN },
            tests: [
              'assert (await client.get("/rooms")).json()[0]["number"] == "A-101"',
              'assert (await client.get("/rooms/9")).status_code == 404',
              'assert (await client.post("/rooms", json={"number": "C-1"})).status_code == 422',
              'assert (await client.post("/rooms", json={"number": "C-1", "beds": 2})).status_code == 201',
            ],
          },
        },
        { op: 'send', payload: { method: 'GET', path: '/rooms/1' } },
      ]).answers as [RunAnswer, SendAnswer];
      expect(answers[0].error).toBeNull();
      expect(answers[0].routes).toEqual([
        { method: 'GET', path: '/rooms' },
        { method: 'GET', path: '/rooms/{room_id}' },
        { method: 'POST', path: '/rooms' },
      ]);
      expect(answers[0].results.map((r) => r.ok)).toEqual([true, true, true, true]);
      expect(answers[1]).toMatchObject({ kind: 'reply', status: 200 });
      expect(JSON.parse(answers[1].body ?? '{}')).toEqual({ id: 1, number: 'A-101', beds: 4 });
    });

    it('a pydantic 422 reaches the Requests panel with its detail', () => {
      const answers = drive([
        { op: 'run', payload: { files: { 'main.py': MAIN } } },
        { op: 'send', payload: { method: 'POST', path: '/rooms', body: '{"number": "C-1"}' } },
      ]).answers as [RunAnswer, SendAnswer];
      expect(answers[1].status).toBe(422);
      expect(answers[1].body).toContain('beds');
    });

    it('the startup of a lifespan runs, so a table made there exists for the tests', () => {
      const main = `
from contextlib import asynccontextmanager
from fastapi import FastAPI

state = {"ready": False}

@asynccontextmanager
async def lifespan(app):
    state["ready"] = True
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/ready")
def ready():
    return state
`;
      const [answer, reply] = drive([
        {
          op: 'run',
          payload: {
            files: { 'main.py': main },
            tests: ['assert (await client.get("/ready")).json() == {"ready": True}'],
          },
        },
        { op: 'send', payload: { method: 'GET', path: '/ready' } },
      ]).answers as [RunAnswer, SendAnswer];
      expect(answer.results.map((r) => r.ok)).toEqual([true]);
      // The copy the Requests panel talks to was started too.
      expect(JSON.parse(reply.body ?? '{}')).toEqual({ ready: true });
    });
  },
);

describe('the harness files', () => {
  it('exist where the runner imports them from', () => {
    expect(existsSync(PYTHON_HARNESS)).toBe(true);
    expect(existsSync(HARNESS)).toBe(true);
    expect(dirname(HARNESS)).toBe(join(ROOT, 'src', 'runners', 'fastapi'));
  });
});
