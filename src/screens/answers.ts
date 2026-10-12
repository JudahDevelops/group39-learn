/**
 * Pure edits to a screen's answer: what each tap, key press or paste turns the answer into. Screens and
 * the player's keyboard shortcuts both call these, and tests cover them without rendering anything.
 */
import type { ScreenOf, Answer, AnswerOf, MatchPair } from './types';
import { matchesPattern } from '../players/lesson/grade';

/** Choose option `index` (single choice) or toggle it (multi). Other answers come back unchanged. */
export function pickOption(answer: Answer, index: number, optionCount: number): Answer {
  if (index < 0 || index >= optionCount) return answer;
  if (answer.kind === 'choice') return { kind: 'choice', selected: index };
  if (answer.kind === 'multi') {
    const selected = answer.selected.includes(index)
      ? answer.selected.filter((i) => i !== index)
      : [...answer.selected, index].sort((a, b) => a - b);
    return { kind: 'multi', selected };
  }
  return answer;
}

// tapbuild -------------------------------------------------------------------

/** Tapping a token fills the next empty blank. Does nothing if the token is used or every blank is full. */
export function placeToken(answer: AnswerOf<'tapbuild'>, token: number): AnswerOf<'tapbuild'> {
  if (answer.slots.includes(token)) return answer;
  const blank = answer.slots.indexOf(null);
  if (blank === -1) return answer;
  const slots = answer.slots.slice();
  slots[blank] = token;
  return { kind: 'tapbuild', slots, order: [...answer.order, blank] };
}

/** Tapping a filled blank returns its token to the bank. */
export function removeSlot(answer: AnswerOf<'tapbuild'>, blank: number): AnswerOf<'tapbuild'> {
  if (answer.slots[blank] === null || answer.slots[blank] === undefined) return answer;
  const slots = answer.slots.slice();
  slots[blank] = null;
  return { kind: 'tapbuild', slots, order: answer.order.filter((b) => b !== blank) };
}

/** Undo takes back the token placed most recently. */
export function undoToken(answer: AnswerOf<'tapbuild'>): AnswerOf<'tapbuild'> {
  const last = answer.order[answer.order.length - 1];
  return last === undefined ? answer : removeSlot(answer, last);
}

export function clearTokens(answer: AnswerOf<'tapbuild'>): AnswerOf<'tapbuild'> {
  return { kind: 'tapbuild', slots: answer.slots.map(() => null), order: [] };
}

// order ----------------------------------------------------------------------

/** Move the item at `position` one place up (-1) or down (+1). Moving past either end changes nothing. */
export function moveItem(
  answer: AnswerOf<'order'>,
  position: number,
  direction: -1 | 1,
): AnswerOf<'order'> {
  const target = position + direction;
  if (target < 0 || target >= answer.sequence.length) return answer;
  const sequence = answer.sequence.slice();
  [sequence[position], sequence[target]] = [sequence[target], sequence[position]];
  return { kind: 'order', sequence };
}

// match ----------------------------------------------------------------------

export function pairOf(pairs: readonly MatchPair[], side: 'left' | 'right', index: number) {
  return pairs.findIndex((pair) => pair[side] === index);
}

/** Pair a left item with a right-hand text. Either one being paired already leaves the answer unchanged. */
export function pairUp(answer: AnswerOf<'match'>, left: number, right: number): AnswerOf<'match'> {
  if (pairOf(answer.pairs, 'left', left) !== -1 || pairOf(answer.pairs, 'right', right) !== -1) {
    return answer;
  }
  return { ...answer, pairs: [...answer.pairs, { left, right }] };
}

/** Undo the pair at `position` in the pairs list. */
export function unpair(answer: AnswerOf<'match'>, position: number): AnswerOf<'match'> {
  if (position < 0 || position >= answer.pairs.length) return answer;
  return { ...answer, pairs: answer.pairs.filter((_, i) => i !== position) };
}

// checklist ------------------------------------------------------------------

function withAt<T>(list: readonly T[], index: number, value: T): T[] {
  const copy = list.slice();
  copy[index] = value;
  return copy;
}

/**
 * Tick or untick item `i`. An item with a check only ticks once the pasted output matches; otherwise
 * it stays unticked and is marked as tried, which makes its hint appear.
 */
export function toggleItem(
  screen: ScreenOf<'checklist'>,
  answer: AnswerOf<'checklist'>,
  i: number,
): AnswerOf<'checklist'> {
  const item = screen.items[i];
  if (!item) return answer;
  if (answer.ticked[i]) return { ...answer, ticked: withAt(answer.ticked, i, false) };
  if (item.check && !matchesPattern(item.check.pattern, answer.output[i])) {
    return { ...answer, tried: withAt(answer.tried, i, true) };
  }
  return { ...answer, ticked: withAt(answer.ticked, i, true) };
}

export function setOutput(
  answer: AnswerOf<'checklist'>,
  i: number,
  text: string,
): AnswerOf<'checklist'> {
  return { ...answer, output: withAt(answer.output, i, text) };
}

/** Leaving the paste box with something in it counts as trying, so a wrong paste shows the hint. */
export function leaveOutput(answer: AnswerOf<'checklist'>, i: number): AnswerOf<'checklist'> {
  if (answer.output[i].trim() === '' || answer.tried[i]) return answer;
  return { ...answer, tried: withAt(answer.tried, i, true) };
}
