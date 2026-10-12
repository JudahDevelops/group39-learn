/**
 * The widget registry: the `## --widget-- <name>` of a lesson screen looks its component up here.
 * Real widgets arrive in WP W1; until then the lesson shows "This interactive part is not available
 * yet." for any name that is not registered.
 *
 * Contract for a widget component:
 * - It receives the lesson's JSON object as `props` (unchecked, so validate what you read) and an
 *   `onResult` callback.
 * - A widget that only lets the learner explore never needs to call `onResult`: Continue is there from
 *   the start.
 * - A widget that scores an answer sets `Widget.scored = true`. The player then hides Continue until the
 *   widget calls `onResult(true)` (the player shows "Correct", with the screen's "Why?") or
 *   `onResult(false, note)` (the player shows "Not quite" with `note`, then remounts the widget on
 *   "Try again"). The first result counts for accuracy, so a widget calls it once per attempt.
 * - `onResult()` with no argument means "finished, nothing to score": it enables Continue.
 */
import type { ComponentType } from 'react';

export interface WidgetProps {
  /** The JSON object from the screen's fenced block. */
  props: Record<string, unknown>;
  /**
   * Report the learner's result. `correct` is omitted when there is nothing to score. `note` is a
   * plain-text sentence shown in the "Not quite" sheet, e.g. "2 of 5 cards are in the right tier."
   */
  onResult: (correct?: boolean, note?: string) => void;
}

export type WidgetComponent = ComponentType<WidgetProps> & {
  /** True when the widget reports a result that the lesson grades. */
  scored?: boolean;
};

/** Widget name (kebab-case, as written in lesson.md) → component. WP W1 adds the real ones here. */
export const widgets: Record<string, WidgetComponent> = {};

export function getWidget(name: string): WidgetComponent | undefined {
  return Object.prototype.hasOwnProperty.call(widgets, name) ? widgets[name] : undefined;
}
