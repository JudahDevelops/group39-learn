import { describe, expect, it } from 'vitest';
import { protectLoops } from '../../src/runners/web/loops';
import { buildPreviewDocument } from '../../src/runners/web/assemble';
import { createWebRunner } from '../../src/runners/web/runner';
import { jsdomHost } from './runner.helpers';

const calls = (code: string) => code.match(/__g39lp\("[^"]+"\);/g) ?? [];

/** Runs protected code with a guard that just counts, and returns what the code printed. */
function run(source: string): { out: unknown[]; guarded: number } {
  const out: unknown[] = [];
  let guarded = 0;
  new Function('__g39lp', 'out', protectLoops(source, 't.js'))(() => guarded++, out);
  return { out, guarded };
}

describe('protectLoops: what it changes', () => {
  it('puts a call at the start of a block body', () => {
    expect(protectLoops('while (a) { b(); }', 's.js')).toBe('while (a) {__g39lp("s.js:0"); b(); }');
    expect(protectLoops('do { b(); } while (a)', 's.js')).toBe(
      'do {__g39lp("s.js:0"); b(); } while (a)',
    );
    expect(protectLoops('for (;;) { break }', 's.js')).toBe('for (;;) {__g39lp("s.js:0"); break }');
    expect(protectLoops('for (let i = 0; i < 3; i++) { x(i); }', 's.js')).toContain(
      '{__g39lp("s.js:0");',
    );
  });

  it('gives a loop without braces some', () => {
    expect(protectLoops('while (a) b();', 's.js')).toBe('while (a) {__g39lp("s.js:0");b();}');
    expect(protectLoops('for (;;) i++', 's.js')).toBe('for (;;) {__g39lp("s.js:0");i++}');
    expect(protectLoops('while (a) ;', 's.js')).toBe('while (a) {__g39lp("s.js:0");;}');
  });

  it('guards nested loops, each with its own id', () => {
    const code = protectLoops('while (a) { for (;;) { b(); } }', 's.js');
    expect(calls(code)).toEqual(['__g39lp("s.js:0");', '__g39lp("s.js:1");']);
    const braceless = protectLoops('while (a) while (b) c();', 's.js');
    expect(calls(braceless)).toHaveLength(2);
    expect(() => new Function('__g39lp', braceless)).not.toThrow();
  });

  it('leaves for...of, for...in, code with no loop and code that does not parse alone', () => {
    const forOf = 'for (const a of list) { x(a); }';
    expect(protectLoops(forOf, 's.js')).toBe(forOf);
    expect(protectLoops('for (const k in o) { x(k); }', 's.js')).toBe(
      'for (const k in o) { x(k); }',
    );
    expect(protectLoops('const total = 1 + 2;', 's.js')).toBe('const total = 1 + 2;');
    const broken = 'while (a) { b(';
    expect(protectLoops(broken, 's.js')).toBe(broken);
  });

  it('does not touch the word while in strings and comments', () => {
    const code = 'const s = "while (x) {}"; // for (;;) { }\n/* do { } while (y) */';
    expect(protectLoops(code, 's.js')).toBe(code);
  });

  it('keeps every line where it was', () => {
    const source = 'let i = 0;\nwhile (i < 3)\n  i++;\nfor (;;) {\n  break;\n}\n';
    const lines = (text: string) => text.split('\n').length;
    expect(lines(protectLoops(source, 's.js'))).toBe(lines(source));
  });
});

describe('protectLoops: the code still does the same thing', () => {
  it('while, do and for loops, with and without braces', () => {
    const { out, guarded } = run(`
      let i = 0; while (i < 3) { out.push('w' + i); i++; }
      let j = 0; do { out.push('d' + j); j++; } while (j < 2);
      for (let k = 0; k < 2; k++) out.push('f' + k);
      let n = 0; for (;;) { if (++n > 2) break; }
      out.push(n);
    `);
    expect(out).toEqual(['w0', 'w1', 'w2', 'd0', 'd1', 'f0', 'f1', 3]);
    expect(guarded).toBe(3 + 2 + 2 + 3);
  });

  it('continue still reaches the next iteration, and a labelled break still works', () => {
    const { out } = run(`
      let i = 0;
      while (i < 5) { i++; if (i % 2) continue; out.push(i); }
      outer: for (let a = 0; ; a++) { for (let b = 0; ; b++) { if (b > 1) break; if (a > 1) break outer; out.push('' + a + b); } }
    `);
    expect(out).toEqual([2, 4, '00', '01', '10', '11']);
  });

  it('let in a for loop is still new on each pass', () => {
    const { out } = run(`
      const fns = [];
      for (let i = 0; i < 3; i++) fns.push(() => i);
      out.push(fns.map((f) => f()).join(','));
    `);
    expect(out).toEqual(['0,1,2']);
  });
});

describe('loop protection in the page', () => {
  const page = (script: string) =>
    `<!DOCTYPE html><html><head><title>t</title></head><body><script>${script}</script></body></html>`;

  it('is applied to inline scripts and to script files, not to other script types', () => {
    const doc = buildPreviewDocument({
      'index.html':
        '<!DOCTYPE html><html><head></head><body>' +
        '<script>while (a) { b(); }</script>' +
        '<script type="application/json">{"while": "(x) { }"}</script>' +
        '<script src="script.js"></script></body></html>',
      'script.js': 'while (c) { d(); }',
    });
    expect(doc).toContain('while (a) {__g39lp("index.html#1:0"); b(); }');
    expect(doc).toContain('{"while": "(x) { }"}');
    expect(doc).toContain('while (c) {__g39lp("script.js:0"); d(); }');
  });

  it('stops a loop that never ends and says so in plain words', async () => {
    const runner = createWebRunner(jsdomHost);
    const started = Date.now();
    const out = await runner.run({ 'index.html': page('while (true) {}') }, [
      { text: 'Fine.', code: 'assert.isTrue(true);' },
    ]);
    expect(Date.now() - started).toBeLessThan(5000);
    expect(out.error).toMatch(/^Your loop ran for more than 1\.5 seconds, so it was stopped/);
    expect(out.results).toEqual([]);
    expect(out.logs[0]).toBe(out.error);
  });

  it('stops a loop with no braces in a script file', async () => {
    const runner = createWebRunner(jsdomHost);
    const out = await runner.run(
      {
        'index.html':
          '<!DOCTYPE html><html><head><script src="script.js"></script></head><body></body></html>',
        'script.js': 'let n = 0;\nfor (;;) n++;\n',
      },
      [{ text: 'Fine.', code: 'assert.isTrue(true);' }],
    );
    expect(out.error).toMatch(/Your loop ran for more than/);
  });

  it('lets a busy but finite loop finish', async () => {
    const runner = createWebRunner(jsdomHost);
    const out = await runner.run(
      {
        'index.html': page(
          'var total = 0; for (var i = 0; i < 20000; i++) { total += i; } window.total = total;',
        ),
      },
      [{ text: 'Added up.', code: 'assert.equal(window.total, 199990000);' }],
    );
    expect(out.error).toBeUndefined();
    expect(out.results[0]?.ok).toBe(true);
  });
});
