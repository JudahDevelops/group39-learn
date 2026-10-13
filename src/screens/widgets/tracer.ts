/**
 * Logic for the data-flow tracer (lesson 3.4, flows F1 to F4): the learner walks through a flow one step
 * at a time and picks the tier that handles each step. A wrong pick is counted and the step stays open
 * until the right tier is picked. The first attempt decides the result: the flow is "Correct" only when
 * no pick was wrong. All pure.
 */
import { asList, asObject, asText, asTextList, plural } from './props';

export interface TracerStep {
  text: string;
  /** Index into `tiers` of the tier that handles this step. */
  tier: number;
}

export interface TracerProps {
  title: string;
  tiers: string[];
  steps: TracerStep[];
}

/** Reads the props of the `data-flow-tracer` widget, or throws. A step names its tier by the tier's name. */
export function parseTracerProps(raw: unknown): TracerProps {
  const props = asObject(raw, 'props');
  const title = asText(props.title, 'title');
  const tiers = asTextList(props.tiers, 'tiers', { min: 2, max: 6 });
  const steps = asList(props.steps, 'steps', { min: 2, max: 20 }).map((item, i): TracerStep => {
    const step = asObject(item, `steps[${i}]`);
    const text = asText(step.text, `steps[${i}].text`);
    const name = asText(step.tier, `steps[${i}].tier`);
    const tier = tiers.indexOf(name);
    if (tier === -1) throw new Error(`steps[${i}].tier "${name}" is not one of the tiers`);
    return { text, tier };
  });
  return { title, tiers, steps };
}

export interface TracerState {
  /** The step waiting for a pick. Equals the number of steps once the flow is finished. */
  current: number;
  /** Tiers picked wrongly for the current step. They stay unavailable until the step is solved. */
  rejected: number[];
  /** Every wrong pick so far. */
  wrongPicks: number;
  /** Steps that took more than one pick. */
  missedSteps: number;
}

export function startTracer(): TracerState {
  return { current: 0, rejected: [], wrongPicks: 0, missedSteps: 0 };
}

export function isFinished(state: TracerState, steps: readonly TracerStep[]): boolean {
  return state.current >= steps.length;
}

export interface PickResult {
  state: TracerState;
  right: boolean;
}

/** Pick `tier` for the current step. A repeat of a rejected tier, or a pick after the end, changes nothing. */
export function pickTier(
  state: TracerState,
  steps: readonly TracerStep[],
  tier: number,
): PickResult {
  if (isFinished(state, steps) || state.rejected.includes(tier)) return { state, right: false };
  if (tier === steps[state.current].tier) {
    return { state: { ...state, current: state.current + 1, rejected: [] }, right: true };
  }
  return {
    state: {
      ...state,
      rejected: [...state.rejected, tier],
      wrongPicks: state.wrongPicks + 1,
      // The first wrong pick on a step is the one that makes it a missed step.
      missedSteps: state.missedSteps + (state.rejected.length === 0 ? 1 : 0),
    },
    right: false,
  };
}

export interface TraceVerdict {
  correct: boolean;
  /** Shown in the "Not quite" sheet. Empty when correct. */
  note: string;
}

/** "You picked a wrong tier 3 times, on 2 of 7 steps." */
export function traceVerdict(state: TracerState, stepCount: number): TraceVerdict {
  if (state.wrongPicks === 0) return { correct: true, note: '' };
  const times = state.wrongPicks === 1 ? 'once' : `${state.wrongPicks} times`;
  return {
    correct: false,
    note: `You picked a wrong tier ${times}, on ${state.missedSteps} of ${plural(stepCount, 'step')}.`,
  };
}

export type Direction = 'down' | 'up';

export interface Move {
  from: number;
  to: number;
}

/**
 * The gaps between neighbouring tiers that a move crosses, in the order the flow passes them. Gap `g` sits
 * between tier `g` and tier `g + 1`. A move within one tier crosses none.
 */
export function gapsCrossed(move: Move): { gaps: number[]; direction: Direction } {
  const { from, to } = move;
  if (from === to) return { gaps: [], direction: 'down' };
  if (to > from) {
    return { gaps: Array.from({ length: to - from }, (_, i) => from + i), direction: 'down' };
  }
  return { gaps: Array.from({ length: from - to }, (_, i) => from - 1 - i), direction: 'up' };
}
