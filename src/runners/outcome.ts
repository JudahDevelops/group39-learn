import type { RunOutput } from './types';

/** True when the code ran and every test passed. A run that could not start (`error`) never passes. */
export function runPassed(output: RunOutput): boolean {
  return !output.error && output.results.length > 0 && output.firstFailure === null;
}
