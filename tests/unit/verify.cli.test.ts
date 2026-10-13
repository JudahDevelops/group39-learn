/**
 * `npm run verify:challenges` end to end: the real command, the real harness page, headless Chromium.
 * It copies the fixture blocks into a temp content folder (never into content/), then breaks the
 * copy two ways: a solution that fails a test, and a seed that already passes. Both must be
 * reported and the command must exit 1.
 *
 * Needs Chromium: PW_CHROMIUM_PATH, or Playwright's own install. Without one the suite is skipped
 * on a developer machine and fails in CI (where CI is set), so CI cannot pass by skipping it.
 */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const browserPath = process.env.PW_CHROMIUM_PATH || chromium.executablePath();
const hasBrowser = existsSync(browserPath);

/** Replace `from` with `to`, failing loudly when `from` is not there, so a changed fixture cannot make a test pass by accident. */
function mutate(source: string, from: string, to: string): string {
  if (!source.includes(from)) throw new Error(`fixture changed: "${from}" not found`);
  return source.replace(from, to);
}

interface Ran {
  code: number | null;
  stdout: string;
  stderr: string;
}

function verify(contentDir: string, ...args: string[]): Promise<Ran> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', 'scripts/verify-challenges.ts', '--content', contentDir, ...args],
      { cwd: ROOT, env: process.env },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function problemLines(ran: Ran): string[] {
  return ran.stdout.split('\n').filter((line) => /\.md: /.test(line));
}

describe.skipIf(!hasBrowser && !process.env.CI)('npm run verify:challenges', () => {
  let tmp = '';
  let broken = '';

  beforeAll(() => {
    if (!hasBrowser) throw new Error(`no Chromium at ${browserPath}; set PW_CHROMIUM_PATH`);
    tmp = mkdtempSync(join(tmpdir(), 'g39-verify-'));
    broken = join(tmp, 'broken');
    // A fixed list, so fixtures other work adds to content/ cannot change what this test sees.
    const fixtures = ['fixture-workshop', 'fixture-lab', 'fixture-lesson', 'fixture-review'];
    const curriculum = JSON.stringify({
      tracks: [
        {
          id: 'Z',
          title: 'Fixtures',
          fixture: true,
          chapters: [{ id: 'Z1', title: 'Fixtures', blocks: fixtures }],
        },
      ],
    });
    mkdirSync(join(broken, 'blocks'), { recursive: true });
    writeFileSync(join(broken, 'curriculum.json'), curriculum);
    for (const slug of fixtures) {
      cpSync(join(ROOT, 'content', 'blocks', slug), join(broken, 'blocks', slug), {
        recursive: true,
      });
    }

    // Mistake 1: step 2's solution has the wrong words in the paragraph, so test 3 fails.
    const step2 = join(broken, 'blocks', 'fixture-workshop', '02.md');
    const [before, after] = readFileSync(step2, 'utf8').split('# --solutions--');
    writeFileSync(
      step2,
      `${before}# --solutions--${mutate(
        after ?? '',
        '<p>Water will be off in Hall A from 9 am to 12 pm on Friday.</p>',
        '<p>Water will be off in Hall B.</p>',
      )}`,
    );

    // Mistake 2: step 3's seed already holds the button, so it passes before the learner types.
    const step3 = join(broken, 'blocks', 'fixture-workshop', '03.md');
    writeFileSync(
      step3,
      mutate(
        readFileSync(step3, 'utf8'),
        '--editable-region--\n\n--editable-region--',
        '--editable-region--\n    <button>Got it</button>\n--editable-region--',
      ),
    );
  });

  afterAll(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  });

  it('reports a failing solution and a seed that already passes, and exits 1', async () => {
    // Two runs at once: the whole broken copy, then the broken copy limited to the lab.
    const [bad, oneBlock] = await Promise.all([
      verify(broken),
      verify(broken, '--block', 'fixture-lab'),
    ]);

    // Exactly the two mistakes, so every other check in the copy passed.
    const lines = problemLines(bad);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(
      /blocks\/fixture-workshop\/02\.md: the solution fails test 3: Your `p` element should have the text/,
    );
    expect(lines[1]).toMatch(
      /blocks\/fixture-workshop\/03\.md: the seed already passes every test$/,
    );
    expect(bad.stdout.trim().split('\n').at(-1)).toMatch(/^\d+ checked, 2 failed, 0 skipped$/);
    expect(bad.code).toBe(1);

    // --block leaves the broken workshop alone and checks only the lab.
    expect(oneBlock.stdout.trim()).toBe('1 checked, 0 failed, 0 skipped');
    expect(oneBlock.code).toBe(0);
  }, 120_000);

  it('exits 2 with a message for a missing content folder and for an unknown block', async () => {
    const [invalid, missing] = await Promise.all([
      verify(join(tmp, 'nowhere')),
      verify(broken, '--block', 'no-such-block'),
    ]);
    expect(invalid.code).toBe(2);
    expect(invalid.stderr).toContain('content folder not found');
    expect(missing.code).toBe(2);
    expect(missing.stderr).toContain('no block called "no-such-block"');
  }, 120_000);
});
