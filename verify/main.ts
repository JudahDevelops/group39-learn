/**
 * The page scripts/verify-challenges.ts opens in headless Chromium. It exposes one function that
 * checks files against tests with `getRunner`, the same entry point the app uses, so a challenge
 * that verifies here behaves the same for a learner. Built by vite.verify.config.ts, never shipped.
 */
import { getRunner } from '../src/runners';
import { HARNESS_GLOBAL, type CheckFn } from './protocol';

const check: CheckFn = async (kind, files, tests, timeoutMs) => {
  let runner;
  try {
    runner = await getRunner(kind);
  } catch (err) {
    return { built: false, reason: err instanceof Error ? err.message : String(err) };
  }
  const output = await runner.run(
    files,
    tests,
    timeoutMs === undefined ? undefined : { timeoutMs },
  );
  return { built: true, output };
};

(window as unknown as Record<string, CheckFn>)[HARNESS_GLOBAL] = check;
