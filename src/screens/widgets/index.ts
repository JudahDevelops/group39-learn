/**
 * The widget registry: the `## --widget-- <name>` of a lesson screen looks its component up here. The
 * lesson shows "This interactive part is not available yet." for any name that is not registered.
 *
 * Registered: escalation-slider (3.5), tier-sorter (3.2 and 3.3), data-flow-tracer (3.4) and
 * request-response (3.1). docs/content-format.md lists their props. The scoring and parsing of each lives
 * in a plain .ts file next to it (escalation.ts, sorter.ts, tracer.ts, exchange.ts), with unit tests.
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
 *   The flag belongs to the component, not to a lesson's props, so a widget that is scored only in some
 *   lessons (escalation-slider with a `target`) leaves it unset: it still reports through `onResult`,
 *   and the sheet appears, but Continue is not held back.
 * - `onResult()` with no argument means "finished, nothing to score": it enables Continue.
 */
import type { ComponentType } from 'react';
import { DataFlowTracer } from './DataFlowTracer';
import { EscalationSlider } from './EscalationSlider';
import { RequestResponse } from './RequestResponse';
import { TierSorter } from './TierSorter';

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

/** Widget name (kebab-case, as written in lesson.md) → component. */
export const widgets: Record<string, WidgetComponent> = {
  'escalation-slider': EscalationSlider,
  'tier-sorter': TierSorter,
  'data-flow-tracer': DataFlowTracer,
  'request-response': RequestResponse,
};

export function getWidget(name: string): WidgetComponent | undefined {
  return Object.prototype.hasOwnProperty.call(widgets, name) ? widgets[name] : undefined;
}
