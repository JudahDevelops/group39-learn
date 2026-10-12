/**
 * Quiz mechanics with no React in them, so they are unit-tested (tests/unit/quiz.draw.test.ts).
 * `rand` is injectable and returns a number in [0, 1), like Math.random.
 */
import type { QuizQuestion } from '../../content/schema';

export type Rand = () => number;

/** A new array in random order (Fisher-Yates). */
export function shuffle<T>(items: readonly T[], rand: Rand = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sameSet(ids: readonly string[], other: readonly string[]): boolean {
  if (ids.length !== other.length) return false;
  const set = new Set(other);
  return ids.every((id) => set.has(id));
}

/**
 * Picks `draw` questions at random for one attempt. When the pool is bigger than `draw`, the pick
 * is never exactly the previous attempt's set. When the pool is exactly `draw`, every attempt asks
 * the same questions (in a new order), because there is no other set to draw.
 */
export function drawQuestions<T extends { id: string }>(
  pool: readonly T[],
  draw: number,
  previousIds: readonly string[] | null,
  rand: Rand = Math.random,
): T[] {
  const shuffled = shuffle(pool, rand);
  const picked = shuffled.slice(0, draw);
  const rest = shuffled.slice(draw);
  if (
    previousIds &&
    rest.length > 0 &&
    sameSet(
      picked.map((q) => q.id),
      previousIds,
    )
  ) {
    // Swap one question for one that was left out, so the set differs.
    const out = Math.floor(rand() * picked.length);
    const into = Math.floor(rand() * rest.length);
    picked[out] = rest[into];
  }
  return picked;
}

export interface QuizOption {
  html: string;
  correct: boolean;
}

/** The answer and the distractors together, in random order. */
export function shuffledOptions(question: QuizQuestion, rand: Rand = Math.random): QuizOption[] {
  return shuffle(
    [
      { html: question.answer, correct: true },
      ...question.distractors.map((html) => ({ html, correct: false })),
    ],
    rand,
  );
}

/** The key that picks option `index`: A, B, C ... */
export function optionKey(index: number): string {
  return String.fromCharCode(65 + index);
}

/** The heading of the end screen. */
export function resultTitle(score: number, total: number, pass: number): string {
  return score >= pass
    ? `You passed: ${score} of ${total}`
    : `Not yet: ${score} of ${total}. You need ${pass}.`;
}
