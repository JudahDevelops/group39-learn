/**
 * Turns parsed content into the list of things `npm run verify:challenges` runs. Pure: no files, no
 * browser, so it is unit-tested directly (tests/unit/verify.plan.test.ts).
 */
import type { CodeRunner, TestCase } from '../../src/content/schema';
import type { ParsedBlock } from '../../src/content/validate';
import type { Files } from '../../src/runners/types';

interface CheckBase {
  /** The content file, e.g. `content/blocks/student-profile/03.md`. */
  file: string;
  /** Where in the file, for lessons and reviews: `screen 5 (typein)`. */
  where?: string;
  runner: CodeRunner;
}

/** A workshop step, a lab or a lesson `typein` screen: the seed must fail a test, the solution must pass them all. */
export interface ChallengeCheck extends CheckBase {
  type: 'challenge';
  tests: TestCase[];
  seed: Files;
  solution: Files;
}

/** A `::: tryit` block: running the code must not raise an uncaught error. */
export interface TryitCheck extends CheckBase {
  type: 'tryit';
  files: Files;
}

export type Check = ChallengeCheck | TryitCheck;

export function filesOf(list: readonly { name: string; contents: string }[]): Files {
  return Object.fromEntries(list.map((f) => [f.name, f.contents]));
}

export interface PlanOptions {
  /** How content paths are written in messages: the `--content` folder as given, `content` by default. */
  root: string;
  /** Only this block (slug). */
  block?: string;
}

export function planChecks(
  blocks: ReadonlyMap<string, ParsedBlock>,
  options: PlanOptions,
): Check[] {
  const checks: Check[] = [];
  for (const [slug, block] of blocks) {
    if (options.block !== undefined && slug !== options.block) continue;
    const dir = `${options.root}/blocks/${slug}`;
    switch (block.type) {
      case 'workshop':
        for (const step of block.steps) {
          checks.push({
            type: 'challenge',
            file: `${dir}/${String(step.step).padStart(2, '0')}.md`,
            runner: step.runner,
            tests: step.tests,
            seed: filesOf(step.seed),
            solution: filesOf(step.solutions),
          });
        }
        break;
      case 'lab':
        checks.push({
          type: 'challenge',
          file: `${dir}/lab.md`,
          runner: block.lab.runner,
          tests: block.lab.tests,
          seed: filesOf(block.lab.seed),
          solution: filesOf(block.lab.solutions),
        });
        break;
      case 'lesson':
        block.lesson.screens.forEach((screen, i) => {
          if (screen.type === 'typein' && block.meta.runner !== 'none') {
            checks.push({
              type: 'challenge',
              file: `${dir}/lesson.md`,
              where: `screen ${i + 1} (typein)`,
              runner: block.meta.runner,
              tests: screen.tests,
              seed: filesOf(screen.seed),
              solution: filesOf(screen.solutions),
            });
          } else if (screen.type === 'concept' && screen.tryit) {
            checks.push({
              type: 'tryit',
              file: `${dir}/lesson.md`,
              where: `screen ${i + 1} (try it)`,
              runner: screen.tryit.runner,
              files: filesOf(screen.tryit.files),
            });
          }
        });
        break;
      case 'review': {
        let n = 0;
        for (const segment of block.review.body) {
          if (segment.type !== 'tryit') continue;
          n++;
          checks.push({
            type: 'tryit',
            file: `${dir}/review.md`,
            where: `try it ${n}`,
            runner: segment.tryit.runner,
            files: filesOf(segment.tryit.files),
          });
        }
        break;
      }
      default:
        break; // quizzes, exams and projects hold no code
    }
  }
  return checks;
}
