/**
 * The Python side of the python runner (src/runners/python/harness.py), run with the machine's own
 * python3. Pyodide is CPython compiled to WebAssembly, so the language behaves the same; the e2e
 * suite (tests/e2e/python.spec.ts) covers the part that needs the real worker.
 *
 * Without python3 the suite is skipped on a developer machine and fails in CI (where CI is set), so
 * CI cannot pass by skipping it.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HARNESS = join(ROOT, 'src', 'runners', 'python', 'harness.py');

const probe = spawnSync('python3', ['-I', '-c', 'import sys; print(sys.version_info[0])']);
const hasPython = probe.status === 0;

/** Loads harness.py the way worker.js does, calls g39_run, and reports the result and the console. */
const DRIVER = `
import io, json, sys
src = open(sys.argv[1], encoding="utf-8").read()
payload = sys.argv[2]
echo_out, echo_err = io.StringIO(), io.StringIO()
real = sys.stdout
sys.stdout, sys.stderr = echo_out, echo_err
ns = {"__name__": "g39_harness"}
exec(compile(src, "harness.py", "exec"), ns)
sys.stdout = real
result = json.loads(ns["g39_run"](payload))
print(json.dumps({"result": result, "stdout": echo_out.getvalue(), "stderr": echo_err.getvalue()}))
`;

interface ErrorInfo {
  type: string;
  message: string;
  file: string | null;
  line: number | null;
  source: string | null;
  syntax: boolean;
}
interface Ran {
  result: {
    error: ErrorInfo | null;
    results: { ok: boolean; detail: string | null; error: ErrorInfo | null }[];
  };
  stdout: string;
  stderr: string;
}

describe.skipIf(!hasPython && !process.env.CI)('harness.py', () => {
  let dir = '';
  beforeAll(() => {
    if (!hasPython) throw new Error('python3 is not installed');
    dir = mkdtempSync(join(tmpdir(), 'g39-python-'));
  });
  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function run(files: Record<string, string>, tests: string[] = []): Ran {
    const child = spawnSync(
      'python3',
      ['-I', '-c', DRIVER, HARNESS, JSON.stringify({ files, tests })],
      { env: { ...process.env, G39_LEARNER_DIR: join(dir, 'learner') }, encoding: 'utf8' },
    );
    if (child.status !== 0) throw new Error(`driver failed: ${child.stderr}`);
    return JSON.parse(child.stdout) as Ran;
  }

  const main = (code: string, tests: string[] = []) => run({ 'main.py': code }, tests);
  const oks = (ran: Ran) => ran.result.results.map((r) => r.ok);

  describe('the helpers', () => {
    const code = [
      'import math',
      'greeting = "Hello, Amina"',
      'def compute_deadline(urgency):',
      '    return 24',
      'class Room:',
      '    def area(self):',
      '        return 1',
      'print("Hall A is open")',
    ].join('\n');

    it('has_function finds a def at any level, and nothing else', () => {
      const ran = main(code, [
        'assert has_function("compute_deadline")',
        'assert has_function("area")', // a method counts
        'assert not has_function("Room")', // a class is not a function
        'assert not has_function("greeting")',
        'assert not has_function("print")', // calling a function is not defining one
        'assert not has_function("missing")',
      ]);
      expect(oks(ran)).toEqual([true, true, true, true, true, true]);
    });

    it('has_function does not count a lambda or an imported function', () => {
      const ran = main('square = lambda n: n * n\nfrom math import sqrt', [
        'assert not has_function("square")',
        'assert not has_function("sqrt")',
      ]);
      expect(oks(ran)).toEqual([true, true]);
    });

    it('defines finds top-level names the code created: variables, functions, classes, imports', () => {
      const ran = main(code, [
        'assert defines("greeting")',
        'assert defines("compute_deadline")',
        'assert defines("Room")',
        'assert defines("math")',
        'assert not defines("print")', // a built-in is not the learner\'s
        'assert not defines("has_function")', // nor is a helper
        'assert not defines("_code")',
        'assert not defines("urgency")', // a parameter is local to the function
        'assert not defines("missing")',
      ]);
      expect(oks(ran)).toEqual(Array(9).fill(true));
    });

    it('prints matches text anywhere in the output, with the exact letters', () => {
      const ran = main(code, [
        'assert prints("Hall A is open")',
        'assert prints("Hall A")',
        'assert not prints("hall a is open")', // letters must match
        'assert not prints("Hall B")',
        'assert prints("")', // something was printed
      ]);
      expect(oks(ran)).toEqual(Array(5).fill(true));
    });

    it('prints("") is false when nothing was printed', () => {
      const ran = main('x = 1', ['assert not prints("")', 'assert _stdout == ""']);
      expect(oks(ran)).toEqual([true, true]);
    });

    it('_code is the source of main.py, _stdout is everything printed, _tree is its ast', () => {
      const ran = main('print("a")\nprint("b")', [
        'assert _code == \'print("a")\\nprint("b")\'',
        'assert _stdout == "a\\nb\\n"',
        'import ast\nassert isinstance(_tree, ast.Module) and len(_tree.body) == 2',
      ]);
      expect(oks(ran)).toEqual([true, true, true]);
    });

    it("a test can call the learner's function from the same namespace", () => {
      const ran = main('def compute_deadline(u):\n    return 24 if u == "urgent" else 72', [
        'assert compute_deadline("urgent") == 24',
        'assert compute_deadline("normal") == 24',
      ]);
      expect(oks(ran)).toEqual([true, false]);
    });
  });

  describe('tests', () => {
    it('each test gets a fresh namespace, so one cannot leak into the next', () => {
      const ran = main('items = []\ncounter = 0', [
        'items.append(1)\ncounter += 5\nassert items == [1]',
        'assert items == [] and counter == 0',
        'import builtins\nbuiltins.leak = 1\nitems.append(2)',
        'assert not hasattr(items, "leak") and items == []',
      ]);
      expect(oks(ran)).toEqual([true, true, true, true]);
    });

    it("runs the learner's code once for the console and again for each test", () => {
      const ran = main('print("hi")', ['assert prints("hi")', 'assert prints("hi")']);
      expect(ran.stdout).toBe('hi\n');
      expect(oks(ran)).toEqual([true, true]);
    });

    it('a failed assert is a failure with no error, and the detail is the message or the failing line', () => {
      const ran = main('x = 1', ['assert x == 2', 'assert x == 2, "x should be 2"']);
      expect(oks(ran)).toEqual([false, false]);
      expect(ran.result.results[0]).toEqual({ ok: false, detail: 'assert x == 2', error: null });
      expect(ran.result.results[1]).toEqual({ ok: false, detail: 'x should be 2', error: null });
    });

    it('any other exception in a test is a failure that carries the error', () => {
      const ran = main('x = 1', ['y = x + "a"', 'assert x == 1']);
      expect(oks(ran)).toEqual([false, true]);
      const failed = ran.result.results[0];
      expect(failed?.detail).toMatch(/^TypeError: /);
      expect(failed?.error).toMatchObject({ type: 'TypeError', file: null, line: null });
    });

    it("an error inside the learner's function points at the learner's own line", () => {
      const code = 'def compute_deadline(urgency):\n    return urgency + 1\n';
      const ran = main(code, ['compute_deadline("urgent")']);
      expect(oks(ran)).toEqual([false]);
      expect(ran.result.results[0]?.error).toMatchObject({
        type: 'TypeError',
        file: 'main.py',
        line: 2,
        source: 'return urgency + 1',
      });
    });

    it("an assert inside the learner's own function is the learner's error, not the test failing", () => {
      const code = 'def check(n):\n    assert n > 0, "n must be positive"\n';
      const ran = main(code, ['check(0)']);
      expect(ran.result.results[0]?.error).toMatchObject({
        type: 'AssertionError',
        file: 'main.py',
        line: 2,
      });
    });

    it('a syntax error in a test snippet fails that test and names no learner line', () => {
      const ran = main('x = 1', ['assert (', 'assert x == 1']);
      expect(oks(ran)).toEqual([false, true]);
      expect(ran.result.results[0]?.error).toMatchObject({ syntax: true, file: null });
    });

    it('prints inside a test do not reach the console', () => {
      const ran = main('def f():\n    print("noise")', ['f()']);
      expect(ran.stdout).toBe('');
      expect(oks(ran)).toEqual([true]);
    });
  });

  describe('learner code that stops', () => {
    it("reports an uncaught exception with the learner's line, and runs no test", () => {
      const ran = main('a = 1\nprint(totl)\n', ['assert True']);
      expect(ran.result.results).toEqual([]);
      expect(ran.result.error).toMatchObject({
        type: 'NameError',
        file: 'main.py',
        line: 2,
        source: 'print(totl)',
        syntax: false,
      });
    });

    it('keeps what was printed before the exception', () => {
      const ran = main('print("before")\n1 / 0');
      expect(ran.stdout).toBe('before\n');
      expect(ran.result.error).toMatchObject({ type: 'ZeroDivisionError', line: 2 });
    });

    it("reports a syntax error with its line, in the learner's file", () => {
      const ran = main('x = 1\ndef f(\n    pass\n', ['assert True']);
      expect(ran.result.results).toEqual([]);
      expect(ran.result.error).toMatchObject({ syntax: true, file: 'main.py' });
      expect(ran.result.error?.line).toBeGreaterThanOrEqual(2);
    });

    it("reports an error that happens in a second file under that file's name", () => {
      const ran = run({
        'main.py': 'import tools\ntools.go()\n',
        'tools.py': 'def go():\n    return 1 / 0\n',
      });
      expect(ran.result.error).toMatchObject({
        type: 'ZeroDivisionError',
        file: 'tools.py',
        line: 2,
      });
    });

    it('sys.exit() ends the code quietly', () => {
      const ran = main('import sys\nprint("a")\nsys.exit(0)\nprint("b")', ['assert prints("a")']);
      expect(ran.result.error).toBeNull();
      expect(ran.stdout).toBe('a\n');
      expect(oks(ran)).toEqual([true]);
    });

    it('input() has nobody to ask and ends with an EOFError', () => {
      const ran = main('name = input("Name? ")');
      expect(ran.result.error?.type).toBe('EOFError');
    });

    it('says so when there is no main.py or any python file', () => {
      expect(run({ 'notes.txt': 'hi' }).result.error?.type).toBe('NoEntry');
    });

    it('runs the first .py file when there is no main.py', () => {
      const ran = run({ 'example.py': 'print("ok")' }, ['assert prints("ok")']);
      expect(oks(ran)).toEqual([true]);
    });
  });

  describe('files and output', () => {
    it('the code can import its other files, and each run sees the current text', () => {
      const first = run({
        'main.py': 'import tools\nprint(tools.NAME)',
        'tools.py': 'NAME = "one"',
      });
      expect(first.stdout).toBe('one\n');
      const second = run({
        'main.py': 'import tools\nprint(tools.NAME)',
        'tools.py': 'NAME = "two"',
      });
      expect(second.stdout).toBe('two\n');
    });

    it('files in a folder are written under their path', () => {
      const ran = run({
        'main.py': 'from app import rules\nprint(rules.LIMIT)',
        'app/rules.py': 'LIMIT = 24',
      });
      expect(ran.stdout).toBe('24\n');
    });

    it('a name that climbs out of the folder is ignored', () => {
      const ran = run({ 'main.py': 'print(1)', '../escape.py': 'x = 1' });
      expect(ran.result.error).toBeNull();
      expect(existsSync(join(dir, 'escape.py'))).toBe(false);
    });

    it('stderr goes to the console too, and warnings do not stop the code', () => {
      const ran = main('import sys\nprint("e", file=sys.stderr)\nprint("o")');
      expect(ran.stderr).toBe('e\n');
      expect(ran.stdout).toBe('o\n');
    });

    it('stops echoing after 1000 lines but keeps counting for the tests', () => {
      const ran = main('for i in range(1500):\n    print(i)', ['assert prints("1499")']);
      expect(ran.stdout).toContain('[Output stopped after 1000 lines.]');
      expect(ran.stdout.split('\n').length).toBeLessThan(1010);
      expect(oks(ran)).toEqual([true]);
    });

    it('print(end="") and flush work', () => {
      const ran = main('print("a", end="")\nprint("b", flush=True)');
      expect(ran.stdout).toBe('ab\n');
    });

    it('a last line with no newline is ended, so it cannot reappear in the next run', () => {
      const ran = main('print("a", end="")', ['assert _stdout == "a"']);
      expect(ran.stdout).toBe('a\n');
      expect(oks(ran)).toEqual([true]);
    });

    it("a warning names the learner's file, not a path on the machine", () => {
      const ran = main('print("\\d")');
      expect(ran.stderr).toMatch(/^main\.py:1: SyntaxWarning: /);
      expect(ran.stderr).not.toContain(dir);
    });
  });
});
