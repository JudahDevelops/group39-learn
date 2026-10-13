/** The data-flow tracer: picking tiers step by step, counting wrong picks, and the arrows a move crosses (lesson 3.4). */
import { describe, expect, it } from 'vitest';
import {
  gapsCrossed,
  isFinished,
  parseTracerProps,
  pickTier,
  startTracer,
  traceVerdict,
  type TracerState,
} from '../../src/screens/widgets/tracer';

/** F2 as a story, from lesson 3.4. */
const F2 = {
  title: 'F2 Complaint triage',
  tiers: ['Client', 'Logic', 'Data', 'Output'],
  steps: [
    {
      text: 'Amina, in room B-214, types "water dripping from the ceiling onto the socket" into the Student Portal and presses Submit.',
      tier: 'Client',
    },
    {
      text: "Complaint Management checks she's logged in as a student and finds her room from her allocation.",
      tier: 'Logic',
    },
    {
      text: 'The ★ engine reads the description, sets category plumbing and urgency urgent, and a deadline 24 hours away.',
      tier: 'Logic',
    },
    { text: 'The complaint and a history entry are saved in PostgreSQL.', tier: 'Data' },
    {
      text: "The Email Notification Service emails the plumbing unit's maintenance officer.",
      tier: 'Output',
    },
    { text: 'Amina sees "Received. Urgent. Deadline: tomorrow, 10:00."', tier: 'Client' },
  ],
};

describe('parseTracerProps', () => {
  it('turns each step tier name into an index', () => {
    const { title, tiers, steps } = parseTracerProps(F2);
    expect(title).toBe('F2 Complaint triage');
    expect(tiers).toHaveLength(4);
    expect(steps.map((s) => s.tier)).toEqual([0, 1, 1, 2, 3, 0]);
  });

  it.each([
    ['not an object', 'F2'],
    ['no title', { ...F2, title: undefined }],
    ['an empty title', { ...F2, title: ' ' }],
    ['one tier', { ...F2, tiers: ['Client'] }],
    ['repeated tiers', { ...F2, tiers: ['Client', 'Client'] }],
    ['no steps', { ...F2, steps: [] }],
    ['one step', { ...F2, steps: [F2.steps[0]] }],
    ['a step with an unknown tier', { ...F2, steps: [...F2.steps, { text: 'x', tier: 'Cloud' }] }],
    ['a step with no text', { ...F2, steps: [...F2.steps, { tier: 'Data' }] }],
    ['a step that is a string', { ...F2, steps: [...F2.steps, 'x'] }],
  ])('throws for %s', (_what, bad) => {
    expect(() => parseTracerProps(bad)).toThrow();
  });
});

describe('pickTier', () => {
  const { steps } = parseTracerProps(F2);

  it('a right pick moves on to the next step and clears the rejected tiers', () => {
    const wrong = pickTier(startTracer(), steps, 3).state;
    expect(wrong.rejected).toEqual([3]);
    const { state, right } = pickTier(wrong, steps, 0);
    expect(right).toBe(true);
    expect(state.current).toBe(1);
    expect(state.rejected).toEqual([]);
  });

  it('a wrong pick is counted and the step stays open', () => {
    const { state, right } = pickTier(startTracer(), steps, 2);
    expect(right).toBe(false);
    expect(state).toEqual({ current: 0, rejected: [2], wrongPicks: 1, missedSteps: 1 });
  });

  it('counts every wrong pick, but a step is missed once', () => {
    let state: TracerState = startTracer();
    state = pickTier(state, steps, 1).state;
    state = pickTier(state, steps, 2).state;
    state = pickTier(state, steps, 3).state;
    expect(state.wrongPicks).toBe(3);
    expect(state.missedSteps).toBe(1);
    expect(state.current).toBe(0);
    // The right tier still works afterwards.
    expect(pickTier(state, steps, 0).right).toBe(true);
  });

  it('ignores a repeat of a tier that was already wrong for this step', () => {
    const once = pickTier(startTracer(), steps, 1).state;
    const again = pickTier(once, steps, 1);
    expect(again.state).toBe(once);
    expect(again.right).toBe(false);
  });

  it('the first attempt decides: wrong picks on an earlier step stay counted', () => {
    let state: TracerState = startTracer();
    state = pickTier(state, steps, 3).state; // wrong on step 1
    state = pickTier(state, steps, 0).state; // right
    state = pickTier(state, steps, 1).state; // step 2 right first time
    expect(state.current).toBe(2);
    expect(state.wrongPicks).toBe(1);
    expect(state.missedSteps).toBe(1);
  });

  it('picks after the last step change nothing', () => {
    let state: TracerState = startTracer();
    for (const step of steps) state = pickTier(state, steps, step.tier).state;
    expect(isFinished(state, steps)).toBe(true);
    const after = pickTier(state, steps, 0);
    expect(after.state).toBe(state);
    expect(after.right).toBe(false);
  });
});

describe('traceVerdict', () => {
  const { steps } = parseTracerProps(F2);

  it('a walk with no wrong pick is correct', () => {
    let state: TracerState = startTracer();
    for (const step of steps) state = pickTier(state, steps, step.tier).state;
    expect(traceVerdict(state, steps.length)).toEqual({ correct: true, note: '' });
  });

  it('counts the wrong picks and the steps they were on', () => {
    expect(traceVerdict({ current: 6, rejected: [], wrongPicks: 3, missedSteps: 2 }, 6).note).toBe(
      'You picked a wrong tier 3 times, on 2 of 6 steps.',
    );
    expect(traceVerdict({ current: 6, rejected: [], wrongPicks: 1, missedSteps: 1 }, 6).note).toBe(
      'You picked a wrong tier once, on 1 of 6 steps.',
    );
    expect(
      traceVerdict({ current: 6, rejected: [], wrongPicks: 1, missedSteps: 1 }, 6).correct,
    ).toBe(false);
  });
});

describe('gapsCrossed', () => {
  it('a move down crosses the gaps from the old tier to the new one, in order', () => {
    expect(gapsCrossed({ from: 0, to: 1 })).toEqual({ gaps: [0], direction: 'down' });
    expect(gapsCrossed({ from: 0, to: 3 })).toEqual({ gaps: [0, 1, 2], direction: 'down' });
    expect(gapsCrossed({ from: 1, to: 3 })).toEqual({ gaps: [1, 2], direction: 'down' });
  });

  it('a move up crosses them from the bottom, in order', () => {
    expect(gapsCrossed({ from: 3, to: 0 })).toEqual({ gaps: [2, 1, 0], direction: 'up' });
    expect(gapsCrossed({ from: 2, to: 1 })).toEqual({ gaps: [1], direction: 'up' });
  });

  it('staying in a tier crosses nothing', () => {
    expect(gapsCrossed({ from: 1, to: 1 }).gaps).toEqual([]);
  });
});
