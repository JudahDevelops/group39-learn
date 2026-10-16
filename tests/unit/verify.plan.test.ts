/**
 * The logic behind `npm run verify:challenges`: what gets checked, and how failures read. A fake
 * CheckFn stands in for the browser, so this runs anywhere. The real thing is tests/unit/verify.cli.test.ts.
 */
import { describe, expect, it } from 'vitest';
import type { CheckFn, CheckReply } from '../../verify/protocol';
import { loadContent, type ContentFiles } from '../../src/content/validate';
import type { RunOutput } from '../../src/runners/types';
import { planChecks, type Check } from '../../scripts/lib/verify-plan';
import {
  plainText,
  report,
  runChecks,
  summarize,
  summaryLine,
  verifyCheck,
} from '../../scripts/lib/verify-run';

// ---------------------------------------------------------------------------
// The fixture blocks, as the real content loader sees them

// The python fixtures (Z3) are left out: this test pins the plan for the web fixtures, and the python
// runner has its own end-to-end check (tests/e2e/python.spec.ts).
const raw = import.meta.glob<string>(
  ['../../content/blocks/fixture-*/*.{md,json}', '!../../content/blocks/fixture-python*/*'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
);
const files: ContentFiles = Object.fromEntries(
  Object.entries(raw).map(([path, text]) => [path.replace('../../content/', ''), text]),
);
const slugs = [...new Set(Object.keys(files).map((f) => f.split('/')[1]))].sort();
files['curriculum.json'] = JSON.stringify({
  tracks: [
    {
      id: 'Z',
      title: 'Fixtures',
      fixture: true,
      chapters: [{ id: 'Z1', title: 'Fixtures', blocks: slugs }],
    },
  ],
});
const loaded = loadContent(files);

describe('planChecks', () => {
  it('starts from fixtures that validate', () => {
    expect(loaded.issues).toEqual([]);
  });

  it('lists every step, lab, typein screen and try-it block, and nothing else', () => {
    const checks = planChecks(loaded.blocks, { root: 'content' });
    expect(checks.map((c) => [c.type, c.file, c.where])).toEqual([
      ['challenge', 'content/blocks/fixture-lab/lab.md', undefined],
      ['tryit', 'content/blocks/fixture-lesson/lesson.md', 'screen 2 (try it)'],
      ['challenge', 'content/blocks/fixture-lesson/lesson.md', 'screen 6 (typein)'],
      ['tryit', 'content/blocks/fixture-review/review.md', 'try it 1'],
      ['challenge', 'content/blocks/fixture-workshop/01.md', undefined],
      ['challenge', 'content/blocks/fixture-workshop/02.md', undefined],
      ['challenge', 'content/blocks/fixture-workshop/03.md', undefined],
    ]);
  });

  it('gives a challenge its seed, its solution and its tests', () => {
    const step = planChecks(loaded.blocks, { root: 'content', block: 'fixture-workshop' })[1];
    if (step?.type !== 'challenge') throw new Error('expected a challenge');
    expect(Object.keys(step.seed)).toEqual(['index.html']);
    expect(step.seed['index.html']).not.toContain('--editable-region--');
    expect(step.solution['index.html']).toContain('<p>Water will be off');
    expect(step.tests).toHaveLength(3);
  });

  it('checks one block with --block, and writes paths under the given root', () => {
    const checks = planChecks(loaded.blocks, { root: 'my/content', block: 'fixture-lab' });
    expect(checks.map((c) => c.file)).toEqual(['my/content/blocks/fixture-lab/lab.md']);
    expect(planChecks(loaded.blocks, { root: 'content', block: 'fixture-quiz' })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Reading outcomes (fake runner)

const pass = (n = 2): RunOutput => ({
  results: Array.from({ length: n }, (_, i) => ({ ok: true, message: `Test ${i + 1}.` })),
  firstFailure: null,
  logs: [],
});

function failing(at: number, message: string, detail?: string): RunOutput {
  const out = pass(3);
  out.results[at] = { ok: false, message, ...(detail ? { detail } : {}) };
  out.firstFailure = at;
  return out;
}

const step: Check = {
  type: 'challenge',
  file: 'content/blocks/x/03.md',
  runner: 'web',
  tests: [{ text: 'a', code: '1' }],
  seed: { 'index.html': 'SEED' },
  solution: { 'index.html': 'SOLUTION' },
};

/** Answers by what the page says: the seed and the solution get their own canned outputs. */
function fake(byContents: Record<string, CheckReply>): CheckFn {
  return async (_runner, input) => {
    const reply = byContents[input['index.html'] ?? ''];
    if (!reply) throw new Error('unexpected files');
    return reply;
  };
}

const built = (output: RunOutput): CheckReply => ({ built: true, output });

describe('verifyCheck on a step', () => {
  it('passes when the seed fails a test and the solution passes them all', async () => {
    const run = fake({ SEED: built(failing(0, 'Add an h1.')), SOLUTION: built(pass(3)) });
    expect(await verifyCheck(step, run)).toMatchObject({ status: 'passed', lines: [] });
  });

  it('reports a seed that already passes', async () => {
    const run = fake({ SEED: built(pass(3)), SOLUTION: built(pass(3)) });
    const outcome = await verifyCheck(step, run);
    expect(outcome.status).toBe('failed');
    expect(outcome.lines).toEqual(['content/blocks/x/03.md: the seed already passes every test']);
  });

  it('counts a seed that cannot run as not passing', async () => {
    const broken: RunOutput = { results: [], firstFailure: null, logs: [], error: 'syntax error' };
    const run = fake({ SEED: built(broken), SOLUTION: built(pass(3)) });
    expect((await verifyCheck(step, run)).status).toBe('passed');
  });

  it('names the first failing test of a solution, in plain text, with the assertion detail', async () => {
    const run = fake({
      SEED: built(failing(0, 'x')),
      SOLUTION: built(
        failing(1, 'Your <code>p</code> element &amp; its text.', 'expected 0 to equal 1'),
      ),
    });
    const outcome = await verifyCheck(step, run);
    expect(outcome.lines).toEqual([
      'content/blocks/x/03.md: the solution fails test 2: Your `p` element & its text. (expected 0 to equal 1)',
    ]);
  });

  it('reports a solution that cannot run', async () => {
    const broken: RunOutput = {
      results: [],
      firstFailure: null,
      logs: [],
      error: 'Your code took too long.',
    };
    const run = fake({ SEED: built(failing(0, 'x')), SOLUTION: built(broken) });
    expect((await verifyCheck(step, run)).lines).toEqual([
      'content/blocks/x/03.md: the solution could not run: Your code took too long.',
    ]);
  });

  it('reports both problems when the seed passes and the solution fails', async () => {
    const run = fake({ SEED: built(pass(3)), SOLUTION: built(failing(2, 'Third.')) });
    expect((await verifyCheck(step, run)).lines).toEqual([
      'content/blocks/x/03.md: the seed already passes every test',
      'content/blocks/x/03.md: the solution fails test 3: Third.',
    ]);
  });

  it('puts the place in a lesson before the message', async () => {
    const screen: Check = { ...step, where: 'screen 5 (typein)' };
    const run = fake({ SEED: built(pass(3)), SOLUTION: built(pass(3)) });
    expect((await verifyCheck(screen, run)).lines[0]).toBe(
      'content/blocks/x/03.md: screen 5 (typein): the seed already passes every test',
    );
  });

  it('fails, not skips, when a runner is broken rather than missing', async () => {
    const run: CheckFn = async () => ({
      built: false,
      reason: 'Failed to fetch dynamically imported module',
    });
    const outcome = await verifyCheck(step, run);
    expect(outcome.status).toBe('failed');
    expect(outcome.lines[0]).toContain('the web runner could not start: Failed to fetch');
  });

  it('reports a runner that throws', async () => {
    const run: CheckFn = async () => {
      throw new Error('the browser stopped answering');
    };
    const outcome = await verifyCheck(step, run);
    expect(outcome.status).toBe('failed');
    expect(outcome.lines[0]).toContain('the check could not run: the browser stopped answering');
  });
});

describe('verifyCheck on a try-it block', () => {
  const tryit: Check = {
    type: 'tryit',
    file: 'content/blocks/x/review.md',
    where: 'try it 2',
    runner: 'web',
    files: { 'index.html': 'TRYIT' },
  };

  it('passes a page that runs quietly, and ignores console output', async () => {
    const out: RunOutput = {
      results: [],
      firstFailure: null,
      logs: ['hello', 'Error: logged on purpose'],
    };
    expect((await verifyCheck(tryit, fake({ TRYIT: built(out) }))).status).toBe('passed');
  });

  it('reports an uncaught error', async () => {
    const out: RunOutput = {
      results: [],
      firstFailure: null,
      logs: ['hi', 'Uncaught TypeError: foo is not a function'],
    };
    expect((await verifyCheck(tryit, fake({ TRYIT: built(out) }))).lines).toEqual([
      'content/blocks/x/review.md: try it 2: running the code raises an uncaught error: TypeError: foo is not a function',
    ]);
  });

  it('reports a script that does not run at all', async () => {
    const out: RunOutput = {
      results: [],
      firstFailure: null,
      logs: [],
      error: 'Your JavaScript has a syntax error.',
    };
    expect((await verifyCheck(tryit, fake({ TRYIT: built(out) }))).lines[0]).toContain(
      'running the code fails: Your JavaScript has a syntax error.',
    );
  });
});

describe('runners that are not built', () => {
  const notBuilt: CheckReply = {
    built: false,
    reason: 'The python runner arrives in a later update.',
  };
  const python: Check = { ...step, runner: 'python' };

  it('are skipped, with a line saying which runner and where', async () => {
    const outcome = await verifyCheck(python, fake({ SEED: notBuilt, SOLUTION: notBuilt }));
    expect(outcome).toMatchObject({ status: 'skipped' });
    expect(outcome.lines).toEqual([
      'skipped: python runner not built yet (content/blocks/x/03.md)',
    ]);
  });

  it('exit 0 normally and 1 with --strict', async () => {
    const outcomes = [await verifyCheck(python, fake({ SEED: notBuilt }))];
    expect(report(outcomes, { strict: false })).toEqual({
      lines: [
        'skipped: python runner not built yet (content/blocks/x/03.md)',
        '0 checked, 0 failed, 1 skipped',
      ],
      exitCode: 0,
    });
    const strict = report(outcomes, { strict: true });
    expect(strict.exitCode).toBe(1);
    expect(strict.lines.at(-1)).toBe('0 checked, 0 failed, 1 skipped');
  });
});

describe('the report', () => {
  it('counts checks, not lines, and ends with the summary line', async () => {
    const good = fake({ SEED: built(failing(0, 'x')), SOLUTION: built(pass(3)) });
    const bad = fake({ SEED: built(pass(3)), SOLUTION: built(failing(2, 'Third.')) });
    const outcomes = [await verifyCheck(step, good), await verifyCheck(step, bad)];
    expect(summarize(outcomes)).toEqual({ checked: 2, failed: 1, skipped: 0 });
    const result = report(outcomes, { strict: false });
    expect(result.exitCode).toBe(1);
    expect(result.lines).toHaveLength(3); // two problems, then the summary
    expect(result.lines.at(-1)).toBe('2 checked, 1 failed, 0 skipped');
    expect(summaryLine({ checked: 0, failed: 0, skipped: 0 })).toBe(
      '0 checked, 0 failed, 0 skipped',
    );
  });

  it('keeps the order of the checks while running several at once', async () => {
    const checks: Check[] = Array.from({ length: 9 }, (_, i) => ({
      ...step,
      file: `content/blocks/x/0${i + 1}.md`,
    }));
    let running = 0;
    let peak = 0;
    const run: CheckFn = async (_r, input) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
      return input['index.html'] === 'SEED' ? built(failing(0, 'x')) : built(pass(3));
    };
    const outcomes = await runChecks(checks, run, 3);
    expect(outcomes.map((o) => o.check.file)).toEqual(checks.map((c) => c.file));
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(3);
  });
});

describe('plainText', () => {
  it('turns a test message into one line of text', () => {
    expect(
      plainText('Your <code>h1</code>\n  has <em>the</em> text &lt;b&gt; &#39;x&#39; &#x41;.'),
    ).toBe("Your `h1` has the text <b> 'x' A.");
  });
});
