import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '../../src/content/schema';
import {
  drawQuestions,
  optionKey,
  resultTitle,
  shuffle,
  shuffledOptions,
} from '../../src/players/quiz/draw';

/** A small deterministic generator (mulberry32), so a failing seed can be replayed. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pool = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `q${i}` }));
const ids = (list: { id: string }[]) => list.map((q) => q.id);

describe('shuffle', () => {
  it('keeps every item and does not change the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seeded(1));
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('drawQuestions', () => {
  it('draws `draw` different questions from the pool', () => {
    for (let seed = 0; seed < 50; seed++) {
      const out = drawQuestions(pool(10), 4, null, seeded(seed));
      expect(out).toHaveLength(4);
      expect(new Set(ids(out)).size).toBe(4);
      expect(ids(out).every((id) => /^q\d$/.test(id))).toBe(true);
    }
  });

  it("never repeats the previous attempt's exact set when the pool is bigger than the draw", () => {
    for (let seed = 0; seed < 300; seed++) {
      const rand = seeded(seed);
      const first = drawQuestions(pool(5), 4, null, rand);
      const second = drawQuestions(pool(5), 4, ids(first), rand);
      expect(ids(second).slice().sort()).not.toEqual(ids(first).slice().sort());
      expect(second).toHaveLength(4);
      expect(new Set(ids(second)).size).toBe(4);
    }
  });

  it('with a pool of draw + 1 there are only 5 possible sets, and each attempt differs', () => {
    let previous: string[] | null = null;
    const rand = seeded(7);
    for (let attempt = 0; attempt < 40; attempt++) {
      const out = ids(drawQuestions(pool(4 + 1), 4, previous, rand));
      if (previous) expect(out.slice().sort()).not.toEqual(previous.slice().sort());
      previous = out;
    }
  });

  it('asks every question when the pool is exactly the draw', () => {
    const first = ids(drawQuestions(pool(4), 4, null, seeded(3)));
    const again = ids(drawQuestions(pool(4), 4, first, seeded(4)));
    expect(first.slice().sort()).toEqual(['q0', 'q1', 'q2', 'q3']);
    expect(again.slice().sort()).toEqual(['q0', 'q1', 'q2', 'q3']);
  });
});

describe('shuffledOptions', () => {
  const question: QuizQuestion = {
    id: 'abcdef12',
    text: '<p>Q</p>',
    distractors: ['<code>b</code>', 'c', 'd'],
    answer: 'a',
    explanation: '<p>Because.</p>',
  };

  it('holds the answer once, marked correct, plus every distractor', () => {
    for (let seed = 0; seed < 20; seed++) {
      const options = shuffledOptions(question, seeded(seed));
      expect(options).toHaveLength(4);
      expect(options.filter((o) => o.correct).map((o) => o.html)).toEqual(['a']);
      expect(options.map((o) => o.html).sort()).toEqual(['<code>b</code>', 'a', 'c', 'd']);
    }
  });

  it('puts the answer in different places', () => {
    const places = new Set<number>();
    for (let seed = 0; seed < 60; seed++) {
      places.add(shuffledOptions(question, seeded(seed)).findIndex((o) => o.correct));
    }
    expect(places.size).toBeGreaterThan(1);
  });
});

describe('optionKey', () => {
  it('is A, B, C, D', () => {
    expect([0, 1, 2, 3].map(optionKey)).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('resultTitle', () => {
  it('says what the learner scored, and what is still needed on a fail', () => {
    expect(resultTitle(13, 15, 12)).toBe('You passed: 13 of 15');
    expect(resultTitle(12, 15, 12)).toBe('You passed: 12 of 15');
    expect(resultTitle(10, 15, 12)).toBe('Not yet: 10 of 15. You need 12.');
  });
});
