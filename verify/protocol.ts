/** What the harness page and scripts/verify-challenges.ts agree on. Types and one name only, so both sides can import it. */
import type { CodeRunner, TestCase } from '../src/content/schema';
import type { Files, RunOutput } from '../src/runners/types';

/** The property on `window` that holds the check function. */
export const HARNESS_GLOBAL = 'g39Verify';

/** `built: false` means `getRunner(kind)` refused, with its message as `reason`. */
export type CheckReply = { built: true; output: RunOutput } | { built: false; reason: string };

/** Runs `files` against `tests` with the app's own runner for `runner`. An empty `tests` list just runs the code. */
export type CheckFn = (
  runner: CodeRunner,
  files: Files,
  tests: TestCase[],
  timeoutMs?: number,
) => Promise<CheckReply>;
