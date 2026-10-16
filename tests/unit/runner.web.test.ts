import { describe, expect, it } from 'vitest';
import { runPassed } from '../../src/runners/outcome';
import { chaiAsFunctionBody } from '../../src/runners/web/harness';
import { buildPreviewDocument } from '../../src/runners/web/assemble';
import { createWebRunner, plainSyntaxProblem, syntaxErrorText } from '../../src/runners/web/runner';
import { jsdomHost, silentHost } from './runner.helpers';

const runner = createWebRunner(jsdomHost);

const page = (body: string, head = '') =>
  `<!DOCTYPE html><html><head><title>t</title>${head}</head><body>${body}</body></html>`;

const test = (text: string, code: string) => ({ text, code });

describe('web runner: results', () => {
  it('passes when every test passes', async () => {
    const out = await runner.run({ 'index.html': page('<h1>Hall Notice</h1>') }, [
      test('Needs an h1.', "assert.lengthOf(document.querySelectorAll('h1'), 1);"),
      test(
        'Needs the text.',
        "assert.equal(document.querySelector('h1').textContent, 'Hall Notice');",
      ),
    ]);
    expect(out.error).toBeUndefined();
    expect(out.firstFailure).toBeNull();
    expect(out.results.map((r) => r.ok)).toEqual([true, true]);
    expect(runPassed(out)).toBe(true);
  });

  it('runs every test and reports the first failure, with the test message', async () => {
    const out = await runner.run({ 'index.html': page('<h1>Hello</h1>') }, [
      test('Needs an h1.', "assert.exists(document.querySelector('h1'));"),
      test(
        'Needs the text `Hall Notice`.',
        "assert.equal(document.querySelector('h1').textContent, 'Hall Notice');",
      ),
      test('Needs a button.', "assert.exists(document.querySelector('button'));"),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true, false, false]);
    expect(out.firstFailure).toBe(1);
    expect(out.results[1]?.message).toBe('Needs the text `Hall Notice`.');
    expect(out.results[1]?.detail).toMatch(/expected 'Hello' to equal 'Hall Notice'/);
    expect(runPassed(out)).toBe(false);
  });

  it('a test that throws something other than an assertion fails instead of breaking the run', async () => {
    const out = await runner.run({ 'index.html': page('') }, [
      test('Reads a missing element.', "document.querySelector('h1').textContent;"),
      test('Still runs.', 'assert.isTrue(true);'),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([false, true]);
    expect(out.firstFailure).toBe(0);
  });

  it('a test body with a syntax error fails that test', async () => {
    const out = await runner.run({ 'index.html': page('') }, [
      test('Broken test.', 'assert.isTrue('),
    ]);
    expect(out.results[0]?.ok).toBe(false);
  });

  it('supports async tests', async () => {
    const out = await runner.run({ 'index.html': page('') }, [
      test('Waits.', 'await new Promise((r) => setTimeout(r, 20)); assert.isTrue(true);'),
      test('Rejects.', 'await Promise.reject(new Error("no"));'),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true, false]);
  });
});

describe('web runner: what a test can use', () => {
  it('gives tests code, files, assert, document and window', async () => {
    const files = { 'index.html': page('<p>Hi</p>'), 'styles.css': 'p { color: red; }' };
    const out = await runner.run(files, [
      test(
        'code is the page.',
        "assert.include(code, '<p>Hi</p>'); assert.notInclude(code, 'color: red');",
      ),
      test('files has every file.', "assert.equal(files['styles.css'], 'p { color: red; }');"),
      test('window is the page window.', 'assert.strictEqual(window.document, document);'),
      test('The CSS is applied to the page.', "assert.exists(document.querySelector('style'));"),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true, true, true, true]);
  });

  it('code is all the files joined when there is no HTML', async () => {
    const out = await runner.run(
      { 'script.js': 'var answer = 42;', 'extra.js': 'var other = 1;' },
      [
        test(
          'Has both.',
          "assert.include(code, 'answer = 42'); assert.include(code, 'other = 1');",
        ),
        test('Ran the script.', 'assert.equal(window.answer, 42);'),
      ],
    );
    expect(out.results.map((r) => r.ok)).toEqual([true, true]);
  });

  it('runs the learner script before the tests, with defer honoured', async () => {
    const files = {
      'index.html': page('<h1 id="t"></h1>', '<script src="script.js" defer></script>'),
      'script.js': "document.getElementById('t').textContent = 'set by script';",
    };
    const out = await runner.run(files, [
      test(
        'The script ran.',
        "assert.equal(document.getElementById('t').textContent, 'set by script');",
      ),
    ]);
    expect(out.error).toBeUndefined();
    expect(out.results[0]?.ok).toBe(true);
  });

  it('chai assert is not left on the learner window', async () => {
    const out = await runner.run({ 'index.html': page('') }, [
      test('No leak.', 'assert.isUndefined(window.chai); assert.isUndefined(window.assert);'),
    ]);
    expect(out.results[0]?.ok).toBe(true);
  });
});

describe('web runner: logs and errors', () => {
  it('captures console output and uncaught errors from the learner code', async () => {
    const files = {
      'index.html': page(
        '',
        '<script>console.log("hello", 2, {a: 1}); console.error("bad"); nope();</script>',
      ),
    };
    const out = await runner.run(files, [test('Fine.', 'assert.isTrue(true);')]);
    expect(out.logs).toContain('hello 2 {"a":1}');
    expect(out.logs).toContain('Error: bad');
    expect(out.logs.some((l) => l.startsWith('Uncaught ReferenceError'))).toBe(true);
    // A runtime error in the page does not stop the tests.
    expect(out.results[0]?.ok).toBe(true);
  });

  it('reports a syntax error in plain words', async () => {
    const files = {
      'index.html': page('<h1>x</h1>', '<script src="script.js"></script>'),
      'script.js': 'let a = 1;\nfunction broken( {\n',
    };
    const out = await runner.run(files, [test('Fine.', 'assert.isTrue(true);')]);
    expect(out.results).toEqual([]);
    expect(out.firstFailure).toBeNull();
    expect(out.error).toMatch(/^Your JavaScript has a syntax error/);
    expect(out.error).not.toMatch(/Uncaught|SyntaxError/);
    expect(runPassed(out)).toBe(false);
  });

  it('names the file and line when the error is in an inlined script', () => {
    // Browsers report the line in the whole page; the marker comment maps it back to the file.
    const doc = buildPreviewDocument(
      {
        'index.html': page('', '<script src="script.js"></script>'),
        'script.js': 'let a = 1;\nlet b = ;\n',
      },
      { inject: '<script>var x;\n\nvar y;</script>' },
    );
    const markerLine = doc.split('\n').findIndex((l) => l.includes('g39:script.js')) + 1;
    const text = syntaxErrorText({ message: "Unexpected token ';'", line: markerLine + 1 }, doc);
    expect(text).toMatch(/syntax error on line 2 of script\.js: the character ; is not expected/);
  });

  it('reports a syntax error inside the page without a line', async () => {
    const files = { 'index.html': page('', '<script>var x = ;</script>') };
    const out = await runner.run(files, [test('Fine.', 'assert.isTrue(true);')]);
    expect(out.error).toMatch(/^Your JavaScript has a syntax error:/);
  });

  it('times out when the frame never answers', async () => {
    const stuck = createWebRunner(silentHost);
    const out = await stuck.run({ 'index.html': page('') }, [test('x', 'assert.isTrue(true);')], {
      timeoutMs: 30,
    });
    expect(out.error).toMatch(/took too long/);
    expect(out.results).toEqual([]);
    expect(runPassed(out)).toBe(false);
  });

  it('cleans up the frame after a result and after a timeout', async () => {
    let disposed = 0;
    const counting = createWebRunner({
      open(srcdoc, onMessage) {
        const inner = jsdomHost.open(srcdoc, onMessage);
        return {
          dispose() {
            disposed++;
            inner.dispose();
          },
        };
      },
    });
    await counting.run({ 'index.html': page('') }, [test('x', 'assert.isTrue(true);')]);
    expect(disposed).toBe(1);
    const stuck = createWebRunner({
      open: () => ({
        dispose() {
          disposed++;
        },
      }),
    });
    await stuck.run({ 'index.html': page('') }, [test('x', 'assert.isTrue(true);')], {
      timeoutMs: 20,
    });
    expect(disposed).toBe(2);
  });

  it('turns a host that cannot start into a plain error', async () => {
    const broken = createWebRunner({
      open() {
        throw new Error('no frames here');
      },
    });
    const out = await broken.run({ 'index.html': page('') }, [test('x', 'assert.isTrue(true);')]);
    expect(out.error).toMatch(/could not start: no frames here/);
  });

  it('ignores messages with the wrong nonce', async () => {
    const forged = createWebRunner({
      open(_srcdoc, onMessage) {
        onMessage({ g39: 'not-the-nonce', kind: 'done', logs: [], results: [{ ok: true }] });
        return { dispose() {} };
      },
    });
    const out = await forged.run({ 'index.html': page('') }, [test('x', 'assert.isTrue(false);')], {
      timeoutMs: 30,
    });
    expect(out.error).toMatch(/took too long/);
  });
});

describe('plainSyntaxProblem', () => {
  it('rewrites common engine messages', () => {
    expect(plainSyntaxProblem('Unexpected end of input')).toMatch(/closed/);
    expect(plainSyntaxProblem("Unexpected token '}'")).toMatch(/character } is not expected/);
    expect(plainSyntaxProblem('missing ) after argument list')).toMatch(/closing \)/);
    expect(plainSyntaxProblem('Unexpected identifier')).toMatch(/wrong place/);
  });
  it('lowercases and keeps anything it does not know', () => {
    expect(plainSyntaxProblem('Something odd')).toBe('something odd');
  });
});

describe('chai bundle', () => {
  it('becomes a function body that returns assert', () => {
    const chai = new Function(chaiAsFunctionBody())() as { assert: (v: unknown) => void };
    expect(typeof chai.assert).toBe('function');
    expect(() => chai.assert(false)).toThrow();
  });
  it('refuses a bundle whose shape changed', () => {
    expect(() => chaiAsFunctionBody('var a = 1;')).toThrow(/no trailing export/);
  });
});

describe('web runner: fetch reads the project files', () => {
  const complaints = JSON.stringify([{ id: 482, category: 'plumbing', status: 'Open' }]);
  const script = `
    async function load() {
      const response = await fetch(PATH);
      if (!response.ok) { document.querySelector('#error').textContent = 'HTTP ' + response.status; return; }
      const list = await response.json();
      document.querySelector('#list').textContent = list.map((c) => c.id + ' ' + c.category).join(', ');
    }
    load();`;
  const wait = 'await new Promise((r) => setTimeout(r, 50));';
  const files = (path: string) => ({
    'index.html': page('<p id="list"></p><p id="error"></p><script src="script.js"></script>'),
    'script.js': script.replace('PATH', JSON.stringify(path)),
    'complaints.json': complaints,
  });

  it('answers a relative URL with the file, as JSON', async () => {
    const out = await runner.run(files('complaints.json'), [
      test(
        'Lists the complaint.',
        `${wait} assert.equal(document.querySelector('#list').textContent, '482 plumbing');`,
      ),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true]);
  });

  it('accepts ./ and a query string', async () => {
    const out = await runner.run(files('./complaints.json?v=2'), [
      test(
        'Lists the complaint.',
        `${wait} assert.equal(document.querySelector('#list').textContent, '482 plumbing');`,
      ),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true]);
  });

  it('gives a 404 for a file that is not in the project', async () => {
    const out = await runner.run(files('rooms.json'), [
      test(
        'Shows the error.',
        `${wait} assert.equal(document.querySelector('#error').textContent, 'HTTP 404');`,
      ),
    ]);
    expect(out.results.map((r) => r.ok)).toEqual([true]);
  });
});
