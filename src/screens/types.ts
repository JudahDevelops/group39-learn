import type { Screen, ScreenType } from '../content/schema';

/** One lesson screen narrowed to its type, e.g. ScreenOf<'mcq'>. */
export type ScreenOf<T extends ScreenType> = Extract<Screen, { type: T }>;

export interface MatchPair {
  /** Index into `pairs` (the left-hand item). */
  left: number;
  /** Index into `pairs` of the item whose right-hand text was chosen. Correct when it equals `left`. */
  right: number;
}

/**
 * What the learner has done on the current screen. The player owns it, the screen edits it through
 * `onAnswer`, and the pure functions in players/lesson/grade.ts turn it into a verdict.
 */
export type Answer =
  | { kind: 'none' }
  /** mcq, predict, spotbug: index into `options`, or null before a pick. */
  | { kind: 'choice'; selected: number | null }
  /** multi: indices into `options`, ascending. */
  | { kind: 'multi'; selected: number[] }
  /** tapbuild: `slots[blank]` is an index into `tokens` (null while empty); `order` lists the filled blanks, oldest first (for undo). */
  | { kind: 'tapbuild'; slots: (number | null)[]; order: number[] }
  /** typein: the text of the editable region. */
  | { kind: 'typein'; text: string }
  /** order: `sequence[position]` is the index of the item (in the correct order) shown at that position. */
  | { kind: 'order'; sequence: number[] }
  /** match: `rightOrder` is the shuffled display order of the right-hand sides. */
  | { kind: 'match'; rightOrder: number[]; pairs: MatchPair[] }
  | { kind: 'flashcard'; revealed: boolean }
  /** checklist: one entry per item. `tried` is set once the learner tries to tick or leaves the box. */
  | { kind: 'checklist'; ticked: boolean[]; output: string[]; tried: boolean[] };

export type AnswerOf<K extends Answer['kind']> = Extract<Answer, { kind: K }>;

/** Props shared by every screen that edits an answer. */
export interface ScreenProps<T extends ScreenType, K extends Answer['kind']> {
  screen: ScreenOf<T>;
  answer: AnswerOf<K>;
  onAnswer: (next: AnswerOf<K>) => void;
  /** True once Check has run. The screen shows its marks and stops taking input until Try again. */
  checked: boolean;
}
