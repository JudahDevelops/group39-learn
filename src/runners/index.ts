// The web, python and sql runners are built (WP 1.5, WP 2.1, WP 3.1). fastapi arrives in a later
// work package: add a case that imports the runner lazily, the way `web` does, so the map never pays
// for engines it does not use.
import type { GetRunner } from './types';

export const getRunner: GetRunner = async (kind) => {
  if (kind === 'web') {
    const { webRunner } = await import('./web/runner');
    return webRunner;
  }
  if (kind === 'python') {
    const { pythonRunner } = await import('./python/runner');
    return pythonRunner;
  }
  if (kind === 'sql') {
    const { sqlRunner } = await import('./sql/runner');
    return sqlRunner;
  }
  throw new Error(`The ${kind} runner arrives in a later update.`);
};

export { runPassed } from './outcome';
export type { Files, RunOutput, Runner, TestResult } from './types';
