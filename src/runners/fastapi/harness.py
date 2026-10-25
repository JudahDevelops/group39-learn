"""Test harness for the fastapi runner (docs/content-format.md, "FastAPI tests").

The worker loads ../python/harness.py first and this file after it, into the same namespace, so
everything here can use that file's helpers (_Tee, _write_files, _forget_learner_modules, _describe,
_rel, _clip) and replaces its ROOT. It adds three functions that the worker calls by name:

    g39_prepare()                  once, after the packages are loaded: the thread patch and the pre-imports
    await g39_fastapi_run(json)    {"files": {name: text}, "tests": [source, ...]}
    await g39_fastapi_send(json)   {"method", "path", "body"}: one request to the app the last run loaded

Every run writes the learner's files to ROOT (/app), forgets the modules it imported last time and
imports `app` from main.py. If that raises, the error comes back and no test runs. Otherwise the app
starts (its lifespan, if it has one) and every test runs against that one app: tests share its
state, as the sql runner's tests share their database. Each test gets its own `client`. After the
tests a second, clean copy of the app is loaded, and that is the app `g39_fastapi_send` talks to.

ErrorInfo: {"type", "message", "file", "line", "source", "syntax"}, as in ../python/harness.py. The
types "NoEntry" and "NoApp" carry a whole sentence in "message".
"""

import ast
import builtins
import importlib
import inspect
import json
import linecache
import os
import sys
import time

# Tests set G39_LEARNER_DIR so they never write into a real /app.
ROOT = os.path.realpath(os.environ.get("G39_LEARNER_DIR") or "/app")

ENTRY_FILE = "main.py"
ENTRY_MODULE = "main"
MAX_REPLY_CHARS = 200_000

# Imported once at start-up, outside the learner's 5 seconds. Importing fastapi, pydantic and
# sqlalchemy takes seconds in the browser; a learner's `from fastapi import FastAPI` then costs nothing.
PRELOAD = (
    "fastapi",
    "fastapi.security",
    "fastapi.responses",
    "pydantic",
    "httpx",
    "sqlalchemy",
    "sqlalchemy.orm",
    "bcrypt",
    "jwt",
)

# What the Requests panel talks to: the app, and its lifespan if it has one.
_served = {"app": None, "lifespan": None}


def g39_prepare():
    """Lets plain `def` handlers run, then imports the big packages (docs/SPIKE.md, snag 1)."""
    import anyio.to_thread

    # FastAPI runs `def` handlers, sync dependencies and form parsing in a thread pool. Pyodide has no
    # threads ("can't start new thread"), so run them in place. A handler that never returns blocks
    # the worker, and the page's 5 second stop deals with that.
    async def run_sync_inline(func, *args, **_ignored):
        return func(*args)

    anyio.to_thread.run_sync = run_sync_inline
    for name in PRELOAD:
        importlib.import_module(name)


def _message_error(kind, message):
    return {"type": kind, "message": message, "file": None, "line": None, "source": None, "syntax": False}


def _error(exc):
    return _describe(exc)


class _AppError(Exception):
    """main.py ran, but it did not leave a usable `app` behind."""

    def __init__(self, kind, message):
        super().__init__(message)
        self.kind = kind


def _load(files, echo):
    """Writes the files and imports main.py. Returns (module, app, printed text)."""
    _write_files(files)
    _forget_learner_modules()
    linecache.checkcache()
    out = _Tee(_ECHO_OUT if echo else None)
    err = _Tee(_ECHO_ERR if echo else None)
    saved = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    try:
        module = importlib.import_module(ENTRY_MODULE)
    finally:
        sys.stdout, sys.stderr = saved
        if echo:
            out.finish()
            err.finish()
            try:
                _ECHO_OUT.flush()
                _ECHO_ERR.flush()
            except Exception:
                pass
    app = getattr(module, "app", None)
    if app is None:
        raise _AppError(
            "NoApp",
            "main.py does not define app. Create it near the top with app = FastAPI().",
        )
    if not callable(app):
        raise _AppError(
            "NoApp",
            "app in main.py is not an application. Create it with app = FastAPI().",
        )
    return module, app, out.text()


async def _start(app):
    """Runs the app's startup (its lifespan, or on_event handlers). Returns what _stop needs."""
    router = getattr(app, "router", None)
    factory = getattr(router, "lifespan_context", None)
    if factory is None:
        return None
    lifespan = factory(app)
    await lifespan.__aenter__()
    return lifespan


async def _stop(lifespan):
    if lifespan is None:
        return
    try:
        await lifespan.__aexit__(None, None, None)
    except BaseException:  # noqa: BLE001 - a shutdown that fails must not hide the result
        pass


async def _stop_served():
    lifespan = _served["lifespan"]
    _served["app"] = None
    _served["lifespan"] = None
    await _stop(lifespan)


def _routes(app):
    """[{"method", "path"}] for the routes the learner wrote, in the order they were added."""
    found = []
    for route in getattr(app, "routes", None) or []:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None)
        if not path or not methods or not getattr(route, "include_in_schema", True):
            continue
        for method in sorted(methods):
            if method not in ("HEAD", "OPTIONS"):
                found.append({"method": method, "path": path})
    return found


def _helpers(files, module, printed):
    trees = {}
    for name, text in files.items():
        if name.endswith(".py"):
            try:
                trees[name] = ast.parse(text, name)
            except SyntaxError:
                pass

    def has_function(name):
        """True when any .py file has a def (or async def) called `name`, at any level."""
        return any(
            isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name
            for tree in trees.values()
            for node in ast.walk(tree)
        )

    def defines(name):
        """True when main.py created a top-level name: a variable, function, class or import."""
        return not (name.startswith("__") and name.endswith("__")) and name in vars(module)

    def prints(text):
        """True when `text` appears in what main.py printed while it loaded. prints("") is True if anything was."""
        text = str(text)
        if text == "":
            return printed.strip() != ""
        return text in printed

    return {"has_function": has_function, "defines": defines, "prints": prints}


async def _run_test(index, source, files, module, app, printed):
    import httpx

    name = "<test %d>" % (index + 1)
    client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")
    try:
        namespace = {
            "__name__": "__g39_test__",
            "__builtins__": builtins,
            "app": app,
            "client": client,
            "_code": dict(files),
            "_stdout": printed,
        }
        namespace.update(_helpers(files, module, printed))
        linecache.cache[name] = (len(source), None, source.splitlines(True), name)
        saved = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = _Tee(), _Tee()
        try:
            # The test may `await` at its top level, as in a notebook.
            code = compile(source, name, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT, dont_inherit=True)
            pending = eval(code, namespace)
            if inspect.isawaitable(pending):
                await pending
        finally:
            sys.stdout, sys.stderr = saved
    except AssertionError as exc:
        if _innermost_is_learner(exc):
            return {"ok": False, "detail": "AssertionError: " + _clip(str(exc), 200), "error": _describe(exc)}
        detail = _clip(str(exc), 200) or _failing_line(exc, name)
        return {"ok": False, "detail": detail, "error": None}
    except BaseException as exc:  # noqa: BLE001 - any failure in a test is a failed test
        return {
            "ok": False,
            "detail": type(exc).__name__ + ": " + _clip(str(exc), 200),
            "error": _describe(exc),
        }
    finally:
        linecache.cache.pop(name, None)
        try:
            await client.aclose()
        except BaseException:  # noqa: BLE001
            pass
    return {"ok": True, "detail": None, "error": None}


def _failure(error):
    if isinstance(error, _AppError):
        info = _message_error(error.kind, str(error))
    else:
        info = _error(error)
    return json.dumps({"error": info, "routes": [], "results": []})


async def g39_fastapi_run(payload_json):
    payload = json.loads(payload_json)
    files = payload.get("files") or {}
    tests = payload.get("tests") or []
    await _stop_served()
    if ENTRY_FILE not in files:
        return json.dumps(
            {
                "error": _message_error("NoEntry", "There is no main.py to run."),
                "routes": [],
                "results": [],
            }
        )

    try:
        module, app, printed = _load(files, echo=True)
    except BaseException as exc:  # noqa: BLE001 - the learner's code can raise anything
        return _failure(exc)
    try:
        lifespan = await _start(app)
    except BaseException as exc:  # noqa: BLE001
        return _failure(exc)
    routes = _routes(app)

    if not tests:
        _served["app"], _served["lifespan"] = app, lifespan
        return json.dumps({"error": None, "routes": routes, "results": []})

    results = []
    for index, source in enumerate(tests):
        results.append(await _run_test(index, source, files, module, app, printed))
    await _stop(lifespan)

    # The tests have changed the app's data. Load a clean copy for the Requests panel.
    try:
        _, fresh, _ = _load(files, echo=False)
        _served["lifespan"] = await _start(fresh)
        _served["app"] = fresh
    except BaseException:  # noqa: BLE001 - the first copy loaded, so this is not the learner's to fix
        _served["app"], _served["lifespan"] = None, None
    return json.dumps({"error": None, "routes": routes, "results": results})


async def g39_fastapi_send(payload_json):
    import httpx

    payload = json.loads(payload_json)
    app = _served["app"]
    if app is None:
        return json.dumps({"kind": "no-app"})
    method = str(payload.get("method") or "GET").upper()
    path = str(payload.get("path") or "/")
    body = payload.get("body")
    options = {}
    if isinstance(body, str) and body.strip() != "":
        try:
            options["json"] = json.loads(body)
        except ValueError as exc:
            return json.dumps({"kind": "bad-body", "message": str(exc)})

    out = _Tee(_ECHO_OUT)
    err = _Tee(_ECHO_ERR)
    saved = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    started = time.perf_counter()
    response = None
    error = None
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as client:
            response = await client.request(method, path, **options)
    except BaseException as exc:  # noqa: BLE001 - a handler can raise anything
        error = _error(exc)
    finally:
        sys.stdout, sys.stderr = saved
        out.finish()
        err.finish()
        try:
            _ECHO_OUT.flush()
            _ECHO_ERR.flush()
        except Exception:
            pass
    elapsed = int(round((time.perf_counter() - started) * 1000))

    if response is None:
        # What a real server answers when a handler raises.
        reply = {
            "status": 500,
            "reason": "Internal Server Error",
            "contentType": None,
            "location": None,
            "body": "Internal Server Error",
            "truncated": False,
        }
    else:
        text = response.text
        reply = {
            "status": response.status_code,
            "reason": response.reason_phrase,
            "contentType": response.headers.get("content-type"),
            "location": response.headers.get("location"),
            "body": text[:MAX_REPLY_CHARS],
            "truncated": len(text) > MAX_REPLY_CHARS,
        }
    reply.update({"kind": "reply", "ms": elapsed, "error": error})
    return json.dumps(reply)
