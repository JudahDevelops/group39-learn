"""Test harness for the python runner (docs/content-format.md, section 5).

Loaded once into the Pyodide worker (worker.js). `g39_run(payload_json)` takes
{"files": {name: text}, "tests": [source, ...]} and returns a JSON string:

    {"error": null | ErrorInfo, "results": [{"ok": bool, "detail": str | null, "error": ErrorInfo | null}, ...]}

The learner's files are written to disk and main.py runs once for the console. If it raises, the
error comes back and no test runs. Otherwise every test gets a fresh namespace: main.py runs again
in a new dict, the helpers are added, then the test source runs in that same dict.

ErrorInfo: {"type", "message", "file", "line", "source", "syntax"}. `file`, `line` and `source` point
into the learner's own files and are null when the error did not come from them.
"""

import ast
import builtins
import importlib
import io
import json
import linecache
import os
import shutil
import sys
import traceback
import warnings

# Tests set G39_LEARNER_DIR so they never write into a real home directory.
ROOT = os.path.realpath(os.environ.get("G39_LEARNER_DIR") or "/home/pyodide/learner")

MAX_ECHO_LINES = 1000
MAX_CAPTURE_CHARS = 1_000_000
MAX_MESSAGE_CHARS = 300

# Where the console output goes. A test can replace these two names.
_ECHO_OUT = sys.stdout
_ECHO_ERR = sys.stderr

_BASE_NAMES = frozenset({"__name__", "__file__", "__builtins__"})

sys.dont_write_bytecode = True


class _Tee(io.TextIOBase):
    """Stands in for sys.stdout or sys.stderr: keeps what was written and optionally echoes it."""

    encoding = "utf-8"

    def __init__(self, echo=None):
        self._echo = echo
        self._parts = []
        self._chars = 0
        self._lines = 0
        self._cut = False
        self._last = ""

    def writable(self):
        return True

    def isatty(self):
        return False

    def write(self, text):
        if not isinstance(text, str):
            raise TypeError("write() argument must be str, not " + type(text).__name__)
        if self._chars < MAX_CAPTURE_CHARS:
            self._parts.append(text)
        self._chars += len(text)
        if self._echo is not None and not self._cut:
            self._lines += text.count("\n")
            if self._lines > MAX_ECHO_LINES:
                self._cut = True
                self._echo.write("\n[Output stopped after %d lines.]\n" % MAX_ECHO_LINES)
            else:
                self._echo.write(text)
                if text:
                    self._last = text[-1]
        return len(text)

    def finish(self):
        """Ends a last line that has no newline. Pyodide holds such a line back until the next newline,
        and it would then appear at the start of the next run's output."""
        if self._echo is not None and not self._cut and self._last not in ("", "\n"):
            self._echo.write("\n")
            self._last = "\n"

    def flush(self):
        if self._echo is not None:
            self._echo.flush()

    def text(self):
        return "".join(self._parts)


def _show_warning(message, category, filename, lineno, file=None, line=None):
    # "main.py:2: SyntaxWarning: ..." instead of the full path and the source line.
    stream = file if file is not None else sys.stderr
    stream.write("%s:%s: %s: %s\n" % (_rel(filename) or filename, lineno, category.__name__, message))


warnings.showwarning = _show_warning


def _forget_learner_modules():
    prefix = ROOT + os.sep
    for name, module in list(sys.modules.items()):
        path = getattr(module, "__file__", None)
        paths = [p for p in (getattr(module, "__path__", None) or []) if isinstance(p, str)]
        if (isinstance(path, str) and path.startswith(prefix)) or any(
            p.startswith(prefix) for p in paths
        ):
            del sys.modules[name]
    importlib.invalidate_caches()


def _write_files(files):
    os.chdir("/")
    linecache.clearcache()
    shutil.rmtree(ROOT, ignore_errors=True)
    os.makedirs(ROOT, exist_ok=True)
    for name, text in files.items():
        rel = os.path.normpath(name)
        if os.path.isabs(rel) or rel == ".." or rel.startswith(".." + os.sep):
            continue
        path = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(text)
    if ROOT not in sys.path:
        sys.path.insert(0, ROOT)
    os.chdir(ROOT)


def _entry(files):
    if "main.py" in files:
        return "main.py"
    for name in files:
        if name.endswith(".py"):
            return name
    return None


def _rel(path):
    prefix = ROOT + os.sep
    if isinstance(path, str) and path.startswith(prefix):
        return path[len(prefix):]
    return None


def _clip(text, limit):
    text = text.strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _describe(exc):
    info = {
        "type": type(exc).__name__,
        "message": _clip(str(exc), MAX_MESSAGE_CHARS),
        "file": None,
        "line": None,
        "source": None,
        "syntax": False,
    }
    if isinstance(exc, SyntaxError):
        info["syntax"] = True
        info["message"] = _clip(exc.msg or str(exc), MAX_MESSAGE_CHARS)
        rel = _rel(exc.filename)
        if rel is not None:
            info["file"] = rel
            info["line"] = exc.lineno
            info["source"] = _clip(exc.text or "", 120) or None
        return info
    for frame in reversed(traceback.extract_tb(exc.__traceback__)):
        rel = _rel(frame.filename)
        if rel is not None:
            info["file"] = rel
            info["line"] = frame.lineno
            info["source"] = _clip(frame.line or "", 120) or None
            break
    return info


def _execute(source, filename, echo):
    """Runs the learner's code in a new namespace. Returns (namespace, printed text)."""
    _forget_learner_modules()
    linecache.checkcache()
    namespace = {"__name__": "__main__", "__file__": filename, "__builtins__": builtins}
    out = _Tee(_ECHO_OUT if echo else None)
    err = _Tee(_ECHO_ERR if echo else None)
    saved = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    try:
        code = compile(source, filename, "exec", dont_inherit=True)
        exec(code, namespace)
    except SystemExit:
        pass
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
    return namespace, out.text()


def _helpers(tree, defined, printed):
    def has_function(name):
        """True when the code has a def (or async def) called `name`, at any level."""
        return any(
            isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name
            for node in ast.walk(tree)
        )

    def defines(name):
        """True when running the code created a top-level name: a variable, function, class or import."""
        return name in defined

    def prints(text):
        """True when `text` appears in what the code printed. prints("") is True if anything was printed."""
        text = str(text)
        if text == "":
            return printed.strip() != ""
        return text in printed

    return {"has_function": has_function, "defines": defines, "prints": prints}


def _failing_line(exc, name):
    for frame in reversed(traceback.extract_tb(exc.__traceback__)):
        if frame.filename == name:
            return _clip(frame.line or "", 200) or None
    return None


def _innermost_is_learner(exc):
    frames = traceback.extract_tb(exc.__traceback__)
    return bool(frames) and _rel(frames[-1].filename) is not None


def _run_test(index, source, learner_source, entry_path):
    name = "<test %d>" % (index + 1)
    try:
        namespace, printed = _execute(learner_source, entry_path, echo=False)
        defined = frozenset(key for key in namespace if key not in _BASE_NAMES)
        tree = ast.parse(learner_source, entry_path)
        namespace.update(_helpers(tree, defined, printed))
        namespace["_code"] = learner_source
        namespace["_stdout"] = printed
        namespace["_tree"] = tree
        linecache.cache[name] = (len(source), None, source.splitlines(True), name)
        saved = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = _Tee(), _Tee()
        try:
            exec(compile(source, name, "exec", dont_inherit=True), namespace)
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
    return {"ok": True, "detail": None, "error": None}


def g39_run(payload_json):
    payload = json.loads(payload_json)
    files = payload.get("files") or {}
    tests = payload.get("tests") or []
    entry = _entry(files)
    if entry is None:
        error = {
            "type": "NoEntry",
            "message": "There is no main.py to run.",
            "file": None,
            "line": None,
            "source": None,
            "syntax": False,
        }
        return json.dumps({"error": error, "results": []})
    _write_files(files)
    entry_path = os.path.join(ROOT, entry)
    learner_source = files[entry]
    try:
        _execute(learner_source, entry_path, echo=True)
    except BaseException as exc:  # noqa: BLE001 - the learner's code can raise anything
        return json.dumps({"error": _describe(exc), "results": []})
    results = [_run_test(i, source, learner_source, entry_path) for i, source in enumerate(tests)]
    return json.dumps({"error": None, "results": results})
