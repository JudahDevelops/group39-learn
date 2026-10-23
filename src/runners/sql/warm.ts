import { sqlStatus } from './status';

/**
 * Starts PostgreSQL in the background, but only on a device that has already downloaded it, so the
 * "needs about N MB, once" note is always read before the first download starts.
 */
export function warmIfCached(): void {
  if (sqlStatus.get().firstTime) return;
  void import('./runner').then(
    (m) => m.sqlRunner.warm(),
    () => undefined,
  );
}
