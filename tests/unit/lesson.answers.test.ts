import { describe, expect, it } from 'vitest';
import {
  clearTokens,
  leaveOutput,
  moveItem,
  pairOf,
  pairUp,
  pickOption,
  placeToken,
  removeSlot,
  setOutput,
  toggleItem,
  undoToken,
  unpair,
} from '../../src/screens/answers';
import type { AnswerOf, ScreenOf } from '../../src/screens/types';

describe('pickOption', () => {
  it('selects one option on a single-choice screen, replacing the last pick', () => {
    const first = pickOption({ kind: 'choice', selected: null }, 2, 4);
    expect(first).toEqual({ kind: 'choice', selected: 2 });
    expect(pickOption(first, 0, 4)).toEqual({ kind: 'choice', selected: 0 });
  });

  it('toggles options on a multi screen and keeps them in order', () => {
    let answer = pickOption({ kind: 'multi', selected: [] }, 2, 4);
    answer = pickOption(answer, 0, 4);
    expect(answer).toEqual({ kind: 'multi', selected: [0, 2] });
    expect(pickOption(answer, 2, 4)).toEqual({ kind: 'multi', selected: [0] });
  });

  it('ignores a key for an option that does not exist, and other answers', () => {
    const answer = { kind: 'choice' as const, selected: 1 };
    expect(pickOption(answer, 3, 3)).toBe(answer);
    expect(pickOption(answer, -1, 3)).toBe(answer);
    const none = { kind: 'none' as const };
    expect(pickOption(none, 0, 3)).toBe(none);
  });
});

describe('tapbuild edits', () => {
  const empty: AnswerOf<'tapbuild'> = { kind: 'tapbuild', slots: [null, null, null], order: [] };

  it('fills the next empty blank with each tapped token', () => {
    let answer = placeToken(empty, 4);
    answer = placeToken(answer, 1);
    expect(answer.slots).toEqual([4, 1, null]);
    expect(answer.order).toEqual([0, 1]);
  });

  it('ignores a token that is already placed and a tap when every blank is full', () => {
    const answer = placeToken(empty, 4);
    expect(placeToken(answer, 4)).toBe(answer);
    const full = placeToken(placeToken(placeToken(empty, 0), 1), 2);
    expect(placeToken(full, 3)).toBe(full);
  });

  it('hands a token back when its blank is tapped, and the next token goes there', () => {
    let answer = placeToken(placeToken(placeToken(empty, 0), 1), 2);
    answer = removeSlot(answer, 0);
    expect(answer.slots).toEqual([null, 1, 2]);
    answer = placeToken(answer, 5);
    expect(answer.slots).toEqual([5, 1, 2]);
  });

  it('does nothing when an empty blank is tapped', () => {
    expect(removeSlot(empty, 1)).toBe(empty);
  });

  it('undoes the most recent placement, not the rightmost blank', () => {
    let answer = placeToken(placeToken(placeToken(empty, 0), 1), 2);
    answer = removeSlot(answer, 0); // slots [null, 1, 2]
    answer = placeToken(answer, 7); // slots [7, 1, 2], the newest is blank 0
    answer = undoToken(answer);
    expect(answer.slots).toEqual([null, 1, 2]);
    expect(undoToken(empty)).toBe(empty);
  });

  it('clears every blank', () => {
    const answer = clearTokens(placeToken(placeToken(empty, 0), 1));
    expect(answer).toEqual(empty);
  });
});

describe('moveItem', () => {
  const answer: AnswerOf<'order'> = { kind: 'order', sequence: [2, 0, 1] };

  it('swaps an item with its neighbour', () => {
    expect(moveItem(answer, 1, -1).sequence).toEqual([0, 2, 1]);
    expect(moveItem(answer, 1, 1).sequence).toEqual([2, 1, 0]);
  });

  it('does nothing past either end', () => {
    expect(moveItem(answer, 0, -1)).toBe(answer);
    expect(moveItem(answer, 2, 1)).toBe(answer);
  });
});

describe('match edits', () => {
  const empty: AnswerOf<'match'> = { kind: 'match', rightOrder: [2, 0, 1], pairs: [] };

  it('pairs a left item with a right-hand text', () => {
    const answer = pairUp(empty, 0, 2);
    expect(answer.pairs).toEqual([{ left: 0, right: 2 }]);
    expect(pairOf(answer.pairs, 'left', 0)).toBe(0);
    expect(pairOf(answer.pairs, 'right', 2)).toBe(0);
    expect(pairOf(answer.pairs, 'right', 1)).toBe(-1);
  });

  it('will not pair an item twice', () => {
    const answer = pairUp(empty, 0, 2);
    expect(pairUp(answer, 0, 1)).toBe(answer);
    expect(pairUp(answer, 1, 2)).toBe(answer);
  });

  it('undoes a pair by its position', () => {
    const answer = pairUp(pairUp(empty, 0, 2), 1, 0);
    expect(unpair(answer, 0).pairs).toEqual([{ left: 1, right: 0 }]);
    expect(unpair(answer, 5)).toBe(answer);
  });
});

describe('checklist edits', () => {
  const screen: ScreenOf<'checklist'> = {
    type: 'checklist',
    items: [
      {
        html: 'Install Python',
        check: { command: 'python --version', pattern: '^Python 3\\.1[1-3]', hint: 'Too old.' },
      },
      { html: 'Make a folder' },
    ],
  };
  const start: AnswerOf<'checklist'> = {
    kind: 'checklist',
    ticked: [false, false],
    output: ['', ''],
    tried: [false, false],
  };

  it('ticks a plain item straight away, and unticks it', () => {
    const ticked = toggleItem(screen, start, 1);
    expect(ticked.ticked).toEqual([false, true]);
    expect(toggleItem(screen, ticked, 1).ticked).toEqual([false, false]);
  });

  it('will not tick a checked item until its output matches, and marks it as tried', () => {
    const tried = toggleItem(screen, start, 0);
    expect(tried.ticked).toEqual([false, false]);
    expect(tried.tried).toEqual([true, false]);

    const wrong = toggleItem(screen, setOutput(start, 0, 'Python 3.9.1'), 0);
    expect(wrong.ticked[0]).toBe(false);
    expect(wrong.tried[0]).toBe(true);

    const right = toggleItem(screen, setOutput(start, 0, 'Python 3.12.4'), 0);
    expect(right.ticked[0]).toBe(true);
  });

  it('counts leaving a filled paste box as trying, and an empty one as nothing', () => {
    expect(leaveOutput(setOutput(start, 0, 'x'), 0).tried[0]).toBe(true);
    expect(leaveOutput(start, 0)).toBe(start);
    expect(leaveOutput(setOutput(start, 0, '  \n'), 0).tried[0]).toBe(false);
  });
});
