/**
 * Remembers, for this browser tab, which blocks were done the last time the learner saw the map, so
 * the map can celebrate the ones that became done since. sessionStorage can throw (private mode,
 * blocked storage), and then the celebration simply does not happen.
 */
const KEY = 'g39.mapSeenDone';

/** Block ids done at the last visit, or null when there was no earlier visit in this tab. */
export function readSeenDone(): string[] | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

export function writeSeenDone(ids: readonly string[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Nothing to do: the next visit just has no earlier visit to compare with.
  }
}

/** Remember the done blocks only when there is no earlier record, so the map still sees the change. */
export function writeSeenDoneIfMissing(ids: readonly string[]): void {
  if (readSeenDone() === null) writeSeenDone(ids);
}

/** Blocks done now that were not done at the last visit. With no earlier visit, none. */
export function newlyDone(
  previous: readonly string[] | null,
  current: readonly string[],
): string[] {
  if (previous === null) return [];
  const before = new Set(previous);
  return current.filter((id) => !before.has(id));
}
