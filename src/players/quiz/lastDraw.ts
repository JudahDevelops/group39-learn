/**
 * The question ids of a quiz's latest draw, kept for this browser tab so a retake after leaving the
 * quiz still avoids the same set. sessionStorage can throw (private mode, blocked storage); then
 * the retake is simply drawn without that check.
 */
const key = (blockId: string) => `g39.quizLastDraw.${blockId}`;

export function readLastDraw(blockId: string): string[] | null {
  try {
    const raw = window.sessionStorage.getItem(key(blockId));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

export function writeLastDraw(blockId: string, ids: readonly string[]): void {
  try {
    window.sessionStorage.setItem(key(blockId), JSON.stringify(ids));
  } catch {
    // Nothing to do: the next draw just has nothing to avoid.
  }
}
