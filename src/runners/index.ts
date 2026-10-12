// PLACEHOLDER: WP 1.5 replaces this with the real web runner; later WPs add python, sql, fastapi.
// Keep the exported names and the contract in ./types.ts.
import type { GetRunner } from './types';

export const getRunner: GetRunner = async (kind) => {
  throw new Error(`The ${kind} runner is not built yet.`);
};
