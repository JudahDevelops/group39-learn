import { describe, expect, it } from 'vitest';
import type { Option, Screen } from '../../src/content/schema';
import {
  CORRECT_TITLES,
  MULTI_MISSED,
  accuracyOf,
  accuracyPercent,
  buildTypeinFiles,
  canCheck,
  checklistDone,
  correctTitle,
  escapeHtml,
  gradeAnswer,
  gradeChoice,
  gradeMatch,
  gradeMulti,
  gradeOrder,
  gradeTapbuild,
  gradeTypein,
  initialAnswer,
  isGradedType,
  itemTicked,
  letterFor,
  lockedLines,
  matchesPattern,
  optionMark,
  orderMarks,
  pairMarks,
  regionText,
  retryAnswer,
  shuffledIndices,
  slotMarks,
  xpReasons,
} from '../../src/players/lesson/grade';
import type { Runner } from '../../src/runners/types';
import type { ScreenOf } from '../../src/screens/types';

const option = (html: string, correct: boolean, feedback = `note for ${html}`): Option => ({
  html,
  correct,
  feedback,
});

/** A small seeded generator, so shuffles are the same on every run. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const tapbuild: ScreenOf<'tapbuild'> = {
  type: 'tapbuild',
  prompt: '<p>Build it.</p>',
  template: { lang: 'html', contents: '___Notice___' },
  tokens: ['<h1>', '</h1>', '<p>', '<\\h1>'],
  answer: ['<h1>', '</h1>'],
  why: '<p>why</p>',
};

const typein: ScreenOf<'typein'> = {
  type: 'typein',
  prompt: '<p>Add a paragraph.</p>',
  seed: [
    {
      name: 'index.html',
      lang: 'html',
      contents: '<body>\n\n</body>',
      editable: { start: 1, end: 2 },
    },
    { name: 'styles.css', lang: 'css', contents: 'p { color: red; }' },
  ],
  solutions: [
    { name: 'index.html', lang: 'html', contents: '<body>\n  <p>Hi</p>\n</body>' },
    { name: 'styles.css', lang: 'css', contents: 'p { color: red; }' },
  ],
  tests: [
    { text: 'Your page needs a <code>p</code> element.', code: 'assert.exists(1)' },
    { text: 'The <code>p</code> needs text.', code: 'assert.ok(1)' },
  ],
  why: '<p>why</p>',
};

describe('gradeChoice', () => {
  const options = [option('a', true), option('b', false), option('c', false)];

  it('is right only for the correct option, and returns that option’s note', () => {
    expect(gradeChoice(options, 0)).toEqual({ correct: true, feedback: 'note for a' });
    expect(gradeChoice(options, 1)).toEqual({ correct: false, feedback: 'note for b' });
  });

  it('is wrong with no note before a pick, or for an index that does not exist', () => {
    expect(gradeChoice(options, null)).toEqual({ correct: false });
    expect(gradeChoice(options, 9)).toEqual({ correct: false });
  });
});

describe('gradeMulti', () => {
  const options = [option('a', true), option('b', false), option('c', true), option('d', false)];

  it('is right only when exactly the right set is chosen, in any order', () => {
    expect(gradeMulti(options, [0, 2]).correct).toBe(true);
    expect(gradeMulti(options, [2, 0]).correct).toBe(true);
  });

  it('is wrong for a subset, and says some answers are missing', () => {
    expect(gradeMulti(options, [0])).toEqual({ correct: false, feedback: MULTI_MISSED });
    expect(gradeMulti(options, [])).toEqual({ correct: false, feedback: MULTI_MISSED });
  });

  it('is wrong for a superset, and gives the wrong option’s note', () => {
    expect(gradeMulti(options, [0, 1, 2])).toEqual({ correct: false, feedback: 'note for b' });
  });

  it('gives the first wrong pick’s note when wrong picks and misses are mixed', () => {
    expect(gradeMulti(options, [1, 3])).toEqual({ correct: false, feedback: 'note for b' });
  });
});

describe('optionMark', () => {
  it('shows nothing before Check or on options that were not picked', () => {
    expect(optionMark(option('a', true), true, false)).toBeNull();
    expect(optionMark(option('a', true), false, true)).toBeNull();
  });

  it('marks picked options right or wrong after Check', () => {
    expect(optionMark(option('a', true), true, true)).toBe('right');
    expect(optionMark(option('b', false), true, true)).toBe('wrong');
  });
});

describe('gradeTapbuild', () => {
  it('is graded by sequence', () => {
    expect(gradeTapbuild(tapbuild, [0, 1]).correct).toBe(true);
    expect(gradeTapbuild(tapbuild, [1, 0]).correct).toBe(false);
  });

  it('says how many blanks are right', () => {
    expect(gradeTapbuild(tapbuild, [0, 2]).feedback).toBe(
      '1 of 2 blanks is right. Tap a filled blank to take its token back.',
    );
    expect(gradeTapbuild(tapbuild, [3, 2]).feedback).toBe(
      'None of the blanks are right yet. Tap a filled blank to take its token back.',
    );
  });

  it('is wrong while a blank is empty', () => {
    expect(gradeTapbuild(tapbuild, [0, null]).correct).toBe(false);
  });

  it('treats duplicate tokens as interchangeable', () => {
    const twice: ScreenOf<'tapbuild'> = {
      ...tapbuild,
      template: { lang: 'js', contents: '___ + ___' },
      tokens: ['x', 'x', 'y'],
      answer: ['x', 'x'],
    };
    expect(gradeTapbuild(twice, [1, 0]).correct).toBe(true);
    expect(gradeTapbuild(twice, [2, 0]).correct).toBe(false);
  });

  it('marks each blank', () => {
    expect(slotMarks(tapbuild, [0, 2])).toEqual(['right', 'wrong']);
    expect(slotMarks(tapbuild, [null, 1])).toEqual([null, 'right']);
  });

  it('talks about one blank in the singular', () => {
    const one: ScreenOf<'tapbuild'> = {
      ...tapbuild,
      template: { lang: 'html', contents: '<p>___</p>' },
      answer: ['<p>'],
    };
    expect(gradeTapbuild(one, [1]).feedback).toMatch(/^That token does not fit the blank\./);
  });
});

describe('gradeOrder', () => {
  it('is right only in the original order', () => {
    expect(gradeOrder([0, 1, 2]).correct).toBe(true);
    expect(gradeOrder([1, 0, 2]).correct).toBe(false);
  });

  it('says how many items sit in the right place', () => {
    expect(gradeOrder([0, 2, 1]).feedback).toBe('1 of 3 items is in the right place.');
    expect(gradeOrder([1, 0, 2]).feedback).toBe('1 of 3 items is in the right place.');
    expect(gradeOrder([2, 1, 0]).feedback).toBe('1 of 3 items is in the right place.');
    expect(gradeOrder([1, 2, 0]).feedback).toBe('0 of 3 items are in the right place.');
  });

  it('marks each position', () => {
    expect(orderMarks([0, 2, 1])).toEqual(['right', 'wrong', 'wrong']);
  });
});

describe('gradeMatch', () => {
  const pair = (left: number, right: number) => ({ left, right });

  it('is right when every left item has its own right-hand text', () => {
    expect(gradeMatch(3, [pair(0, 0), pair(2, 2), pair(1, 1)]).correct).toBe(true);
  });

  it('is wrong with a swapped pair, and counts the right ones', () => {
    const verdict = gradeMatch(3, [pair(0, 0), pair(1, 2), pair(2, 1)]);
    expect(verdict.correct).toBe(false);
    expect(verdict.feedback).toBe('1 of 3 pairs is right. Undo a pair to change it.');
  });

  it('is wrong while pairs are missing', () => {
    expect(gradeMatch(3, [pair(0, 0), pair(1, 1)]).correct).toBe(false);
  });

  it('marks each pair', () => {
    expect(pairMarks([pair(0, 0), pair(1, 2)])).toEqual(['right', 'wrong']);
  });
});

describe('checklist', () => {
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

  it('matches pasted output line by line (the m flag), including Windows line endings', () => {
    expect(matchesPattern('^Python 3\\.1[1-3]', 'Python 3.12.4')).toBe(true);
    expect(matchesPattern('^Python 3\\.1[1-3]', 'warning: x\r\nPython 3.11.9\r\n')).toBe(true);
    expect(matchesPattern('^Python 3\\.1[1-3]', 'Python 3.9.1')).toBe(false);
    expect(matchesPattern('^Python 3\\.1[1-3]', 'I have Python 3.12 installed')).toBe(false);
    expect(matchesPattern('^Python 3\\.1[1-3]', '')).toBe(false);
  });

  it('treats an invalid pattern as no match', () => {
    expect(matchesPattern('(', 'anything')).toBe(false);
  });

  it('counts an item as ticked only if its box is ticked and its output still matches', () => {
    expect(itemTicked(screen.items[1], true, '')).toBe(true);
    expect(itemTicked(screen.items[1], false, '')).toBe(false);
    expect(itemTicked(screen.items[0], true, 'Python 3.12.0')).toBe(true);
    expect(itemTicked(screen.items[0], true, 'Python 3.8.0')).toBe(false);
  });

  it('is done when every item is ticked', () => {
    const answer = (ticked: boolean[], output: string[]) => ({
      kind: 'checklist' as const,
      ticked,
      output,
      tried: [false, false],
    });
    expect(checklistDone(screen, answer([true, true], ['Python 3.12.1', '']))).toBe(true);
    expect(checklistDone(screen, answer([true, true], ['Python 3.8', '']))).toBe(false);
    expect(checklistDone(screen, answer([true, false], ['Python 3.12.1', '']))).toBe(false);
  });
});

describe('typein files', () => {
  it('reads the editable region and the locked lines around it', () => {
    expect(regionText(typein)).toBe('');
    expect(lockedLines(typein)).toEqual({ before: '<body>', after: '</body>' });
  });

  it('puts the learner’s text into the region and keeps every other file as it is', () => {
    expect(buildTypeinFiles(typein, '  <p>Hi</p>')).toEqual({
      'index.html': '<body>\n  <p>Hi</p>\n</body>',
      'styles.css': 'p { color: red; }',
    });
  });

  it('keeps several lines of the learner’s text', () => {
    expect(buildTypeinFiles(typein, 'a\nb')['index.html']).toBe('<body>\na\nb\n</body>');
  });

  it('starts with the seed’s own region text', () => {
    const seeded: ScreenOf<'typein'> = {
      ...typein,
      seed: [
        {
          name: 'main.py',
          lang: 'python',
          contents: 'print(1)\n# your code\nprint(3)',
          editable: { start: 1, end: 2 },
        },
      ],
    };
    expect(regionText(seeded)).toBe('# your code');
  });
});

describe('gradeTypein', () => {
  const runnerThat = (output: Awaited<ReturnType<Runner['run']>>): Runner => ({
    run: async () => output,
  });

  it('is right when no test fails', async () => {
    const verdict = await gradeTypein(
      typein,
      '<p>Hi</p>',
      runnerThat({ results: [{ ok: true, message: 'm' }], firstFailure: null, logs: [] }),
    );
    expect(verdict).toEqual({ correct: true });
  });

  it('gives the first failing test’s message', async () => {
    const verdict = await gradeTypein(
      typein,
      '',
      runnerThat({
        results: [
          { ok: true, message: 'first' },
          { ok: false, message: 'second fails' },
        ],
        firstFailure: 1,
        logs: [],
      }),
    );
    expect(verdict).toEqual({ correct: false, feedback: 'second fails' });
  });

  it('falls back to the screen’s own test text if the runner sent no message', async () => {
    const verdict = await gradeTypein(
      typein,
      '',
      runnerThat({ results: [], firstFailure: 0, logs: [] }),
    );
    expect(verdict.feedback).toBe('Your page needs a <code>p</code> element.');
  });

  it('reports a runner error as plain text, escaped', async () => {
    const verdict = await gradeTypein(
      typein,
      '<<',
      runnerThat({ results: [], firstFailure: null, logs: [], error: 'Unexpected token <' }),
    );
    expect(verdict.correct).toBe(false);
    expect(verdict.feedback).toBe('Your code could not run: Unexpected token &lt;');
  });

  it('survives a runner that throws', async () => {
    const verdict = await gradeTypein(typein, 'x', {
      run: async () => {
        throw new Error('frame gone');
      },
    });
    expect(verdict).toEqual({
      correct: false,
      feedback: 'Your code could not be checked: frame gone',
    });
  });

  it('hands the runner the built files, the tests and a timeout', async () => {
    const seen: unknown[] = [];
    await gradeTypein(typein, '  <p>Hi</p>', {
      run: async (files, tests, options) => {
        seen.push(files, tests, options);
        return { results: [], firstFailure: null, logs: [] };
      },
    });
    expect(seen[0]).toEqual({
      'index.html': '<body>\n  <p>Hi</p>\n</body>',
      'styles.css': 'p { color: red; }',
    });
    expect(seen[1]).toBe(typein.tests);
    expect(seen[2]).toEqual({ timeoutMs: 5000 });
  });
});

describe('shuffledIndices', () => {
  it('is a permutation and never the identity', () => {
    for (let seed = 1; seed < 200; seed += 1) {
      for (const n of [2, 3, 5]) {
        const out = shuffledIndices(n, seeded(seed));
        expect([...out].sort()).toEqual(Array.from({ length: n }, (_, i) => i));
        expect(out).not.toEqual(Array.from({ length: n }, (_, i) => i));
      }
    }
  });

  it('forces a change when the generator would leave the list as it was', () => {
    // rng() = 0.999… always picks the last slot for itself, which keeps the identity.
    expect(shuffledIndices(3, () => 0.999)).not.toEqual([0, 1, 2]);
  });

  it('leaves one item alone and handles none', () => {
    expect(shuffledIndices(1)).toEqual([0]);
    expect(shuffledIndices(0)).toEqual([]);
  });
});

describe('initialAnswer, canCheck and retryAnswer', () => {
  const screens: Record<string, Screen> = {
    mcq: {
      type: 'mcq',
      question: '<p>q</p>',
      options: [option('a', true), option('b', false)],
      why: '<p>w</p>',
    },
    multi: {
      type: 'multi',
      question: '<p>q</p>',
      options: [option('a', true), option('b', false)],
      why: '<p>w</p>',
    },
    tapbuild,
    typein,
    order: { type: 'order', prompt: '<p>p</p>', items: ['a', 'b', 'c'], why: '<p>w</p>' },
    match: {
      type: 'match',
      prompt: '<p>p</p>',
      pairs: [
        { left: 'a', right: 'A' },
        { left: 'b', right: 'B' },
      ],
      why: '<p>w</p>',
    },
    concept: { type: 'concept', body: '<p>b</p>' },
    flashcard: { type: 'flashcard', question: '<p>q</p>', answer: '<p>a</p>' },
    checklist: { type: 'checklist', items: [{ html: 'one' }, { html: 'two' }] },
  };

  it('starts every screen empty, and an order or match screen shuffled', () => {
    expect(initialAnswer(screens.mcq)).toEqual({ kind: 'choice', selected: null });
    expect(initialAnswer(screens.multi)).toEqual({ kind: 'multi', selected: [] });
    expect(initialAnswer(screens.tapbuild)).toEqual({
      kind: 'tapbuild',
      slots: [null, null],
      order: [],
    });
    expect(initialAnswer(screens.typein)).toEqual({ kind: 'typein', text: '' });
    expect(initialAnswer(screens.concept)).toEqual({ kind: 'none' });
    expect(initialAnswer(screens.flashcard)).toEqual({ kind: 'flashcard', revealed: false });
    expect(initialAnswer(screens.checklist)).toEqual({
      kind: 'checklist',
      ticked: [false, false],
      output: ['', ''],
      tried: [false, false],
    });
    const order = initialAnswer(screens.order, seeded(7));
    expect(order.kind === 'order' && order.sequence).not.toEqual([0, 1, 2]);
    const match = initialAnswer(screens.match, seeded(7));
    expect(match).toEqual({ kind: 'match', rightOrder: [1, 0], pairs: [] });
  });

  it('allows Check only once there is something to check', () => {
    expect(canCheck(screens.mcq, { kind: 'choice', selected: null })).toBe(false);
    expect(canCheck(screens.mcq, { kind: 'choice', selected: 1 })).toBe(true);
    expect(canCheck(screens.multi, { kind: 'multi', selected: [] })).toBe(false);
    expect(canCheck(screens.multi, { kind: 'multi', selected: [0] })).toBe(true);
    expect(canCheck(tapbuild, { kind: 'tapbuild', slots: [0, null], order: [0] })).toBe(false);
    expect(canCheck(tapbuild, { kind: 'tapbuild', slots: [0, 1], order: [0, 1] })).toBe(true);
    expect(canCheck(typein, { kind: 'typein', text: '  \n' })).toBe(false);
    expect(canCheck(typein, { kind: 'typein', text: '<p>' })).toBe(true);
    expect(canCheck(screens.order, { kind: 'order', sequence: [1, 0, 2] })).toBe(true);
    expect(canCheck(screens.match, { kind: 'match', rightOrder: [1, 0], pairs: [] })).toBe(false);
    expect(
      canCheck(screens.match, {
        kind: 'match',
        rightOrder: [1, 0],
        pairs: [
          { left: 0, right: 0 },
          { left: 1, right: 1 },
        ],
      }),
    ).toBe(true);
    // Ungraded screens never offer Check.
    expect(canCheck(screens.concept, { kind: 'none' })).toBe(false);
    expect(canCheck(screens.flashcard, { kind: 'flashcard', revealed: true })).toBe(false);
  });

  it('clears a single-choice pick on Try again and keeps all other work', () => {
    expect(retryAnswer({ kind: 'choice', selected: 2 })).toEqual({
      kind: 'choice',
      selected: null,
    });
    const multi = { kind: 'multi' as const, selected: [0, 1] };
    expect(retryAnswer(multi)).toBe(multi);
    const typed = { kind: 'typein' as const, text: 'abc' };
    expect(retryAnswer(typed)).toBe(typed);
  });

  it('grades through one entry point, and leaves typein and ungraded screens to the player', () => {
    expect(gradeAnswer(screens.mcq, { kind: 'choice', selected: 0 })?.correct).toBe(true);
    expect(gradeAnswer(screens.multi, { kind: 'multi', selected: [1] })?.correct).toBe(false);
    expect(gradeAnswer(tapbuild, { kind: 'tapbuild', slots: [0, 1], order: [0, 1] })?.correct).toBe(
      true,
    );
    expect(gradeAnswer(screens.order, { kind: 'order', sequence: [0, 1, 2] })?.correct).toBe(true);
    expect(gradeAnswer(typein, { kind: 'typein', text: 'x' })).toBeNull();
    expect(gradeAnswer(screens.concept, { kind: 'none' })).toBeNull();
    // An answer of the wrong kind is never graded.
    expect(gradeAnswer(screens.mcq, { kind: 'none' })).toBeNull();
  });

  it('knows which screen types are always graded', () => {
    for (const type of [
      'mcq',
      'multi',
      'tapbuild',
      'typein',
      'predict',
      'spotbug',
      'order',
      'match',
    ]) {
      expect(isGradedType(type as Screen['type'])).toBe(true);
    }
    for (const type of ['concept', 'flashcard', 'checklist', 'widget']) {
      expect(isGradedType(type as Screen['type'])).toBe(false);
    }
  });
});

describe('accuracy and XP', () => {
  it('is graded screens right on the first try divided by graded screens', () => {
    const accuracy = accuracyOf([
      { graded: true, firstTry: true },
      { graded: true, firstTry: false },
      { graded: false, firstTry: false },
      { graded: true, firstTry: true },
      { graded: true, firstTry: true },
    ]);
    expect(accuracy).toEqual({ graded: 4, right: 3, ratio: 0.75 });
    expect(accuracyPercent(accuracy)).toBe(75);
  });

  it('ignores the first-try flag on ungraded screens', () => {
    expect(accuracyOf([{ graded: false, firstTry: true }]).ratio).toBeNull();
  });

  it('has no accuracy when nothing was graded, and that is never perfect', () => {
    const none = accuracyOf([]);
    expect(none).toEqual({ graded: 0, right: 0, ratio: null });
    expect(accuracyPercent(none)).toBeNull();
    expect(xpReasons(none.ratio)).toEqual(['lesson']);
  });

  it('adds the perfect bonus only at exactly 100%', () => {
    expect(xpReasons(1)).toEqual(['lesson', 'lesson_perfect']);
    expect(xpReasons(14 / 15)).toEqual(['lesson']);
    expect(xpReasons(0)).toEqual(['lesson']);
  });
});

describe('copy helpers', () => {
  it('rotates the correct titles', () => {
    expect(CORRECT_TITLES).toEqual(['Correct', "That's it", 'Spot on']);
    expect([0, 1, 2, 3, 4].map(correctTitle)).toEqual([
      'Correct',
      "That's it",
      'Spot on',
      'Correct',
      "That's it",
    ]);
    expect(correctTitle(-1)).toBe('Spot on');
  });

  it('gives option letters and escapes HTML', () => {
    expect([0, 1, 2, 3].map(letterFor)).toEqual(['A', 'B', 'C', 'D']);
    expect(escapeHtml('<b a="1">&</b>')).toBe('&lt;b a=&quot;1&quot;&gt;&amp;&lt;/b&gt;');
  });
});
