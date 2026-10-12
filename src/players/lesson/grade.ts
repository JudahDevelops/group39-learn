/**
 * Pure grading for the lesson player: no React, no DOM, no store. Everything a screen needs to start
 * (`initialAnswer`), to decide whether Check is available (`canCheck`), to be graded (`gradeAnswer`,
 * `gradeTypein`) and to be tried again (`retryAnswer`) lives here, so each rule can be unit-tested.
 */
import type { Option, Screen } from '../../content/schema';
import type { Files, Runner } from '../../runners/types';
import type { XpReason } from '../../lib/xp';
import type { Answer, AnswerOf, MatchPair, ScreenOf } from '../../screens/types';

/** What grading says. `feedback` is HTML: the chosen option's note, or the first failing test's message. */
export interface Verdict {
  correct: boolean;
  feedback?: string;
}

/** Screen types the player always grades. Widgets are graded only if they report a result. */
export const GRADED_TYPES = [
  'mcq',
  'multi',
  'tapbuild',
  'typein',
  'predict',
  'spotbug',
  'order',
  'match',
] as const;

export function isGradedType(type: Screen['type']): boolean {
  return (GRADED_TYPES as readonly string[]).includes(type);
}

// ---------------------------------------------------------------------------
// Copy

/** Short correct titles, rotated so the sheet does not repeat itself. */
export const CORRECT_TITLES = ['Correct', "That's it", 'Spot on'] as const;

/** The title for the nth correct sheet of a lesson run (0-based). */
export function correctTitle(n: number): string {
  return CORRECT_TITLES[
    ((n % CORRECT_TITLES.length) + CORRECT_TITLES.length) % CORRECT_TITLES.length
  ];
}

export const MULTI_MISSED = 'Not every correct answer is selected yet.';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** "A" for 0, "B" for 1 and so on: the key that selects an option. */
export function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

// ---------------------------------------------------------------------------
// Shuffling

/**
 * A random permutation of 0..n-1 that is never the identity (for n of 2 or more), so an order or match
 * screen never opens already solved. `rng` returns a number in [0, 1); pass a seeded one in tests.
 */
export function shuffledIndices(n: number, rng: () => number = Math.random): number[] {
  const out = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (n > 1 && out.every((value, i) => value === i)) [out[0], out[1]] = [out[1], out[0]];
  return out;
}

// ---------------------------------------------------------------------------
// Typein: the editable region and the files the runner gets

function editableFile(screen: ScreenOf<'typein'>) {
  const file = screen.seed.find((f) => f.editable);
  if (!file || !file.editable) throw new Error('A typein screen needs an editable region.');
  return { file, range: file.editable };
}

/** The seed's editable lines, as the starting text of the code field. */
export function regionText(screen: ScreenOf<'typein'>): string {
  const { file, range } = editableFile(screen);
  return file.contents.split('\n').slice(range.start, range.end).join('\n');
}

/** The lines of the editable file that stay locked: `before` the region and `after` it. */
export function lockedLines(screen: ScreenOf<'typein'>): { before: string; after: string } {
  const { file, range } = editableFile(screen);
  const lines = file.contents.split('\n');
  return {
    before: lines.slice(0, range.start).join('\n'),
    after: lines.slice(range.end).join('\n'),
  };
}

/** Every seed file, with the learner's text in place of the editable region. */
export function buildTypeinFiles(screen: ScreenOf<'typein'>, text: string): Files {
  const files: Files = {};
  for (const file of screen.seed) {
    if (!file.editable) {
      files[file.name] = file.contents;
      continue;
    }
    const lines = file.contents.split('\n');
    files[file.name] = [
      ...lines.slice(0, file.editable.start),
      text,
      ...lines.slice(file.editable.end),
    ].join('\n');
  }
  return files;
}

/** Plain-text reason why a typein run failed, from the runner's first failing test. */
export async function gradeTypein(
  screen: ScreenOf<'typein'>,
  text: string,
  runner: Runner,
  options: { timeoutMs?: number } = { timeoutMs: 5000 },
): Promise<Verdict> {
  let output;
  try {
    output = await runner.run(buildTypeinFiles(screen, text), screen.tests, options);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { correct: false, feedback: escapeHtml(`Your code could not be checked: ${reason}`) };
  }
  if (output.error) {
    return { correct: false, feedback: escapeHtml(`Your code could not run: ${output.error}`) };
  }
  if (output.firstFailure === null) return { correct: true };
  const failed = output.results[output.firstFailure];
  return {
    correct: false,
    feedback: failed?.message ?? screen.tests[output.firstFailure]?.text ?? 'A test did not pass.',
  };
}

// ---------------------------------------------------------------------------
// Starting answers, Check availability, Try again

export function initialAnswer(screen: Screen, rng: () => number = Math.random): Answer {
  switch (screen.type) {
    case 'concept':
    case 'widget':
      return { kind: 'none' };
    case 'mcq':
    case 'predict':
    case 'spotbug':
      return { kind: 'choice', selected: null };
    case 'multi':
      return { kind: 'multi', selected: [] };
    case 'tapbuild': {
      const blanks = screen.answer.length;
      return { kind: 'tapbuild', slots: Array<number | null>(blanks).fill(null), order: [] };
    }
    case 'typein':
      return { kind: 'typein', text: regionText(screen) };
    case 'order':
      return { kind: 'order', sequence: shuffledIndices(screen.items.length, rng) };
    case 'match':
      return {
        kind: 'match',
        rightOrder: shuffledIndices(screen.pairs.length, rng),
        pairs: [],
      };
    case 'flashcard':
      return { kind: 'flashcard', revealed: false };
    case 'checklist':
      return {
        kind: 'checklist',
        ticked: screen.items.map(() => false),
        output: screen.items.map(() => ''),
        tried: screen.items.map(() => false),
      };
  }
}

/** Can Check run? Only for the screen types that are graded by the player. */
export function canCheck(screen: Screen, answer: Answer): boolean {
  switch (screen.type) {
    case 'mcq':
    case 'predict':
    case 'spotbug':
      return answer.kind === 'choice' && answer.selected !== null;
    case 'multi':
      return answer.kind === 'multi' && answer.selected.length > 0;
    case 'tapbuild':
      return answer.kind === 'tapbuild' && answer.slots.every((slot) => slot !== null);
    case 'typein':
      return answer.kind === 'typein' && answer.text.trim() !== '';
    case 'order':
      return answer.kind === 'order';
    case 'match':
      return answer.kind === 'match' && answer.pairs.length === screen.pairs.length;
    default:
      return false;
  }
}

/**
 * The answer after "Try again". Single-choice screens clear the pick so the learner chooses again;
 * every other screen keeps the work so far, so the learner can fix the part that is wrong.
 */
export function retryAnswer(answer: Answer): Answer {
  return answer.kind === 'choice' ? { kind: 'choice', selected: null } : answer;
}

// ---------------------------------------------------------------------------
// mcq, predict, spotbug, multi

export type Mark = 'right' | 'wrong';

/** The mark an option row shows after Check: nothing for options that were not picked. */
export function optionMark(option: Option, picked: boolean, checked: boolean): Mark | null {
  if (!checked || !picked) return null;
  return option.correct ? 'right' : 'wrong';
}

export function gradeChoice(options: readonly Option[], selected: number | null): Verdict {
  const option = selected === null ? undefined : options[selected];
  if (!option) return { correct: false };
  return { correct: option.correct, feedback: option.feedback };
}

/** Correct only when exactly the right set is chosen. */
export function gradeMulti(options: readonly Option[], selected: readonly number[]): Verdict {
  const picked = new Set(selected);
  const wrongPick = options.findIndex((option, i) => picked.has(i) && !option.correct);
  const missed = options.some((option, i) => option.correct && !picked.has(i));
  if (wrongPick === -1 && !missed) return { correct: true };
  if (wrongPick !== -1) return { correct: false, feedback: options[wrongPick].feedback };
  return { correct: false, feedback: MULTI_MISSED };
}

// ---------------------------------------------------------------------------
// tapbuild

/** Per blank: is the token in it the one the answer wants? (null while the blank is empty.) */
export function slotMarks(
  screen: ScreenOf<'tapbuild'>,
  slots: readonly (number | null)[],
): (Mark | null)[] {
  return slots.map((slot, i) =>
    slot === null ? null : screen.tokens[slot] === screen.answer[i] ? 'right' : 'wrong',
  );
}

/** Graded by sequence: every blank holds the answer's token, in order. Duplicate tokens are interchangeable. */
export function gradeTapbuild(
  screen: ScreenOf<'tapbuild'>,
  slots: readonly (number | null)[],
): Verdict {
  const marks = slotMarks(screen, slots);
  if (marks.length === screen.answer.length && marks.every((mark) => mark === 'right')) {
    return { correct: true };
  }
  const right = marks.filter((mark) => mark === 'right').length;
  const total = screen.answer.length;
  const take = 'Tap a filled blank to take its token back.';
  const lead =
    total === 1
      ? 'That token does not fit the blank.'
      : right === 0
        ? 'None of the blanks are right yet.'
        : `${right} of ${total} blanks ${right === 1 ? 'is' : 'are'} right.`;
  return { correct: false, feedback: `${lead} ${take}` };
}

// ---------------------------------------------------------------------------
// order

/** Per position: is the item shown there the one that belongs there? */
export function orderMarks(sequence: readonly number[]): Mark[] {
  return sequence.map((item, position) => (item === position ? 'right' : 'wrong'));
}

export function gradeOrder(sequence: readonly number[]): Verdict {
  const marks = orderMarks(sequence);
  if (marks.every((mark) => mark === 'right')) return { correct: true };
  const right = marks.filter((mark) => mark === 'right').length;
  return {
    correct: false,
    feedback: `${right} of ${marks.length} items ${right === 1 ? 'is' : 'are'} in the right place.`,
  };
}

// ---------------------------------------------------------------------------
// match

export function pairMarks(pairs: readonly MatchPair[]): Mark[] {
  return pairs.map((pair) => (pair.left === pair.right ? 'right' : 'wrong'));
}

/** Right when every left item is paired once, with its own right-hand text. */
export function gradeMatch(total: number, pairs: readonly MatchPair[]): Verdict {
  const marks = pairMarks(pairs);
  const lefts = new Set(pairs.map((pair) => pair.left));
  if (pairs.length === total && lefts.size === total && marks.every((mark) => mark === 'right')) {
    return { correct: true };
  }
  const right = marks.filter((mark) => mark === 'right').length;
  return {
    correct: false,
    feedback: `${right} of ${total} pairs ${right === 1 ? 'is' : 'are'} right. Undo a pair to change it.`,
  };
}

// ---------------------------------------------------------------------------
// checklist

/** Does pasted output satisfy a checklist item's pattern? Lines are matched one by one (`m` flag). */
export function matchesPattern(pattern: string, output: string): boolean {
  try {
    return new RegExp(pattern, 'm').test(output);
  } catch {
    return false;
  }
}

/** An item counts as ticked only if its box is ticked and, when it has a check, the output still matches. */
export function itemTicked(
  item: ScreenOf<'checklist'>['items'][number],
  ticked: boolean,
  output: string,
): boolean {
  if (!ticked) return false;
  return item.check ? matchesPattern(item.check.pattern, output) : true;
}

export function checklistDone(
  screen: ScreenOf<'checklist'>,
  answer: AnswerOf<'checklist'>,
): boolean {
  return screen.items.every((item, i) => itemTicked(item, answer.ticked[i], answer.output[i]));
}

// ---------------------------------------------------------------------------
// One entry point for every screen that grades without a runner

/** Verdict for a checkable screen, or null for screens the player does not grade here (typein needs a runner). */
export function gradeAnswer(screen: Screen, answer: Answer): Verdict | null {
  switch (screen.type) {
    case 'mcq':
    case 'predict':
    case 'spotbug':
      return answer.kind === 'choice' ? gradeChoice(screen.options, answer.selected) : null;
    case 'multi':
      return answer.kind === 'multi' ? gradeMulti(screen.options, answer.selected) : null;
    case 'tapbuild':
      return answer.kind === 'tapbuild' ? gradeTapbuild(screen, answer.slots) : null;
    case 'order':
      return answer.kind === 'order' ? gradeOrder(answer.sequence) : null;
    case 'match':
      return answer.kind === 'match' ? gradeMatch(screen.pairs.length, answer.pairs) : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Accuracy and XP

/** What happened on one screen. `firstTry` is only meaningful when `graded`. */
export interface Outcome {
  graded: boolean;
  firstTry: boolean;
}

export interface Accuracy {
  graded: number;
  right: number;
  /** right / graded, or null when nothing was graded. */
  ratio: number | null;
}

/** Accuracy = graded screens right on the first try ÷ graded screens. */
export function accuracyOf(outcomes: readonly Outcome[]): Accuracy {
  const graded = outcomes.filter((outcome) => outcome.graded);
  const right = graded.filter((outcome) => outcome.firstTry).length;
  return {
    graded: graded.length,
    right,
    ratio: graded.length === 0 ? null : right / graded.length,
  };
}

/** A perfect lesson earns the bonus on top of the base XP. A lesson with nothing graded cannot be perfect. */
export function xpReasons(ratio: number | null): XpReason[] {
  return ratio === 1 ? ['lesson', 'lesson_perfect'] : ['lesson'];
}

export function accuracyPercent(accuracy: Accuracy): number | null {
  return accuracy.ratio === null ? null : Math.round(accuracy.ratio * 100);
}
