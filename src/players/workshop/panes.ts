/** Column widths of the wide workshop layout, as percentages that add up to 100. */
export type PaneSizes = [number, number, number];

export const DEFAULT_PANES: PaneSizes = [30, 40, 30];
/** No pane gets narrower than this share of the width. */
export const MIN_PANE = 14;

export type LayoutMode = 'wide' | 'medium' | 'narrow';

/** 1100 px and wider: three panes. 768 to 1099: instructions on top. Below 768: tabs. */
export function layoutModeFor(width: number): LayoutMode {
  if (width >= 1100) return 'wide';
  if (width >= 768) return 'medium';
  return 'narrow';
}

/**
 * Moves one divider by `delta` percentage points. Divider 0 sits between instructions and editor,
 * divider 1 between editor and preview. The pane on the far side of the neighbour keeps its width.
 */
export function resizePanes(sizes: PaneSizes, divider: 0 | 1, delta: number): PaneSizes {
  const [a, b, c] = sizes;
  if (divider === 0) {
    const next = Math.min(Math.max(a + delta, MIN_PANE), a + b - MIN_PANE);
    return [next, a + b - next, c];
  }
  const next = Math.min(Math.max(b + delta, MIN_PANE), b + c - MIN_PANE);
  return [a, next, b + c - next];
}

const STORAGE_KEY = 'g39.workshop.panes';

/** The sizes the learner chose last time, or the default. Never throws. */
export function loadPanes(): PaneSizes {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed.every((n) => typeof n === 'number' && n >= MIN_PANE) &&
      Math.abs(parsed.reduce((sum: number, n: number) => sum + n, 0) - 100) < 0.5
    ) {
      return parsed as PaneSizes;
    }
  } catch {
    // Storage can be blocked; the default layout is fine.
  }
  return DEFAULT_PANES;
}

export function savePanes(sizes: PaneSizes): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  } catch {
    // Not saving is harmless.
  }
}
