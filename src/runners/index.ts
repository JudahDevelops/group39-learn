// The web runner is built (WP 1.5). python, sql and fastapi arrive in later work packages: add a
// case that imports the runner lazily, the way `web` does, so the map never pays for engines
// it does not use.
import type { GetRunner } from './types';

export const getRunner: GetRunner = async (kind) => {
  if (kind === 'web') {
    const { webRunner } = await import('./web/runner');
    return webRunner;
  }
  throw new Error(`The ${kind} runner arrives in a later update.`);
};

export { runPassed } from './outcome';
export type { Files, RunOutput, Runner, TestResult } from './types';
