/**
 * Runs the planned checks through a `CheckFn` (the headless-browser harness in production, a fake
 * in tests) and writes the report. No files and no browser in here.
 */
import type { CheckFn, CheckReply } from '../../verify/protocol';
import { runPassed } from '../../src/runners/outcome';
import type { Files, RunOutput } from '../../src/runners/types';
import type { TestCase } from '../../src/content/schema';
import type { Check } from './verify-plan';

export type Status = 'passed' | 'failed' | 'skipped';

export interface Outcome {
  check: Check;
  status: Status;
  /** The failure lines (one per problem) or the skip line. Empty when the check passed. */
  lines: string[];
}

/** How many checks run at once in the one page. Each gets its own frame. */
export const CONCURRENCY = 4;

/** `getRunner` says this for a runner that is not written yet (src/runners/index.ts). */
const NOT_BUILT = /runner arrives in a later update/i;

// ---------------------------------------------------------------------------
// Text

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** A test message is HTML. For the terminal: `<code>` becomes backticks, other tags go, entities decode. */
export function plainText(html: string): string {
  return html
    .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
      if (name[0] === '#') {
        const code =
          name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
        return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
      }
      return ENTITIES[name.toLowerCase()] ?? whole;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function oneLine(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ---------------------------------------------------------------------------
// One check

type Ran =
  { kind: 'ran'; output: RunOutput } | { kind: 'skipped' } | { kind: 'broken'; message: string };

async function runOnce(check: Check, run: CheckFn, files: Files, tests: TestCase[]): Promise<Ran> {
  let reply: CheckReply;
  try {
    reply = await run(check.runner, files, tests);
  } catch (err) {
    return { kind: 'broken', message: `the check could not run: ${errorText(err)}` };
  }
  if (reply.built) return { kind: 'ran', output: reply.output };
  if (NOT_BUILT.test(reply.reason)) return { kind: 'skipped' };
  return { kind: 'broken', message: `the ${check.runner} runner could not start: ${reply.reason}` };
}

/** What a failing solution run says, or null when it passed. */
function solutionProblem(output: RunOutput): string | null {
  if (output.error) return `the solution could not run: ${plainText(output.error)}`;
  if (output.results.length === 0) return 'the solution ran no tests';
  if (output.firstFailure === null) return null;
  const result = output.results[output.firstFailure];
  const detail = result?.detail ? ` (${oneLine(result.detail)})` : '';
  return `the solution fails test ${output.firstFailure + 1}: ${plainText(result?.message ?? '')}${detail}`;
}

/** First uncaught error the page logged while running, without the "Uncaught " prefix. */
function uncaughtError(output: RunOutput): string | null {
  const line = output.logs.find((l) => /^Uncaught\b/.test(l));
  return line ? oneLine(line.replace(/^Uncaught\s*/, '')) : null;
}

export function describeSkip(check: Check): string {
  const place = check.where ? `${check.file}, ${check.where}` : check.file;
  return `skipped: ${check.runner} runner not built yet (${place})`;
}

export async function verifyCheck(check: Check, run: CheckFn): Promise<Outcome> {
  const prefix = `${check.file}: ${check.where ? `${check.where}: ` : ''}`;
  const problems: string[] = [];

  if (check.type === 'tryit') {
    const ran = await runOnce(check, run, check.files, []);
    if (ran.kind === 'skipped') return { check, status: 'skipped', lines: [describeSkip(check)] };
    if (ran.kind === 'broken') problems.push(ran.message);
    else if (ran.output.error)
      problems.push(`running the code fails: ${plainText(ran.output.error)}`);
    else {
      const uncaught = uncaughtError(ran.output);
      if (uncaught) problems.push(`running the code raises an uncaught error: ${uncaught}`);
    }
  } else {
    const seed = await runOnce(check, run, check.seed, check.tests);
    if (seed.kind === 'skipped') return { check, status: 'skipped', lines: [describeSkip(check)] };
    // A seed that cannot run (a syntax error, say) does not pass either, so only a clean pass is a problem.
    if (seed.kind === 'broken') problems.push(seed.message);
    else if (runPassed(seed.output)) problems.push('the seed already passes every test');

    const solution = await runOnce(check, run, check.solution, check.tests);
    if (solution.kind === 'skipped')
      return { check, status: 'skipped', lines: [describeSkip(check)] };
    if (solution.kind === 'broken') problems.push(solution.message);
    else {
      const problem = solutionProblem(solution.output);
      if (problem) problems.push(problem);
    }
  }

  return {
    check,
    status: problems.length ? 'failed' : 'passed',
    lines: problems.map((p) => `${prefix}${p}`),
  };
}

/** Runs every check, a few at a time, and returns the outcomes in the order of `checks`. */
export async function runChecks(
  checks: readonly Check[],
  run: CheckFn,
  concurrency: number = CONCURRENCY,
): Promise<Outcome[]> {
  const outcomes: Outcome[] = new Array<Outcome>(checks.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next++;
      const check = checks[i];
      if (!check) return;
      outcomes[i] = await verifyCheck(check, run);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, checks.length) }, worker));
  return outcomes;
}

// ---------------------------------------------------------------------------
// Report

export interface Summary {
  /** Checks that ran (a step, lab, typein screen or try-it block each count once). */
  checked: number;
  /** Checks with at least one problem. A check with two problems has two lines but counts once. */
  failed: number;
  skipped: number;
}

export function summarize(outcomes: readonly Outcome[]): Summary {
  const skipped = outcomes.filter((o) => o.status === 'skipped').length;
  return {
    checked: outcomes.length - skipped,
    failed: outcomes.filter((o) => o.status === 'failed').length,
    skipped,
  };
}

export function summaryLine(s: Summary): string {
  return `${s.checked} checked, ${s.failed} failed, ${s.skipped} skipped`;
}

/** Everything the command prints, and the exit code: 1 on any failure, or on a skip with `--strict`. */
export function report(
  outcomes: readonly Outcome[],
  options: { strict: boolean },
): { lines: string[]; exitCode: 0 | 1 } {
  const summary = summarize(outcomes);
  const lines = outcomes.flatMap((o) => o.lines);
  if (options.strict && summary.skipped > 0) {
    lines.push(
      `--strict: ${summary.skipped} skipped check${summary.skipped === 1 ? '' : 's'} count as failures`,
    );
  }
  lines.push(summaryLine(summary));
  const failed = summary.failed > 0 || (options.strict && summary.skipped > 0);
  return { lines, exitCode: failed ? 1 : 0 };
}
