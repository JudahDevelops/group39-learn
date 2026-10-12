import { describe, expect, it } from 'vitest';
import type { BlockSummary, BlockType, CurriculumIndex } from '../../src/content/schema';
import {
  blockMetaLine,
  blockPath,
  buildCourse,
  firstIncompleteItem,
  heroActionLabel,
  heroFor,
} from '../../src/pages/course';
import { newlyDone } from '../../src/pages/seenDone';

function summary(slug: string, type: BlockType, extra: Partial<BlockSummary> = {}): BlockSummary {
  return {
    id: `id-${slug}`,
    slug,
    type,
    title: `Title of ${slug}`,
    runner: 'web',
    estMinutes: 5,
    itemCount: 1,
    roomCode: 'B1-01',
    ...extra,
  };
}

const STEPS = new Map([['id-shop', ['s1', 's2', 's3']]]);

/** Track B listed before A on purpose: the course puts A first. */
const CURRICULUM: CurriculumIndex = {
  tracks: [
    {
      id: 'B',
      title: 'Build',
      chapters: [
        {
          id: 'B1',
          title: 'HTML',
          blocks: [summary('shop', 'workshop', { itemCount: 3 }), summary('quiz', 'quiz')],
        },
      ],
    },
    {
      id: 'A',
      title: 'Understand',
      chapters: [
        {
          id: 'A0',
          title: 'Start',
          blocks: [summary('intro', 'lesson'), summary('rev', 'review')],
        },
      ],
    },
  ],
};

describe('firstIncompleteItem', () => {
  it('is the first id not completed, in order', () => {
    expect(firstIncompleteItem(['a', 'b', 'c'], new Set(['a']))).toBe('b');
    expect(firstIncompleteItem(['a', 'b', 'c'], new Set(['b', 'c']))).toBe('a');
  });

  it('is undefined when every item is complete', () => {
    expect(firstIncompleteItem(['a', 'b'], new Set(['a', 'b']))).toBeUndefined();
  });
});

describe('buildCourse', () => {
  it('orders tracks A, B, then Z', () => {
    const withZ: CurriculumIndex = {
      tracks: [
        {
          id: 'Z',
          title: 'Fixtures',
          fixture: true,
          chapters: [{ id: 'Z1', title: 'One', blocks: [summary('z', 'lesson')] }],
        },
        ...CURRICULUM.tracks,
      ],
    };
    const course = buildCourse(withZ, STEPS, new Set());
    expect(course.tracks.map((t) => t.id)).toEqual(['A', 'B', 'Z']);
    expect(course.blocks.map((b) => b.summary.slug)).toEqual(['intro', 'rev', 'shop', 'quiz', 'z']);
  });

  it('marks a non-workshop done when its block id is complete', () => {
    const course = buildCourse(CURRICULUM, STEPS, new Set(['id-intro']));
    const intro = course.blocks.find((b) => b.summary.slug === 'intro')!;
    expect(intro.done).toBe(true);
    expect(intro.openItemId).toBe('id-intro');
    expect(intro.openStep).toBeNull();
  });

  it('marks a workshop done only when every step is complete', () => {
    const partial = buildCourse(CURRICULUM, STEPS, new Set(['s1', 's2']));
    const shop = partial.blocks.find((b) => b.summary.slug === 'shop')!;
    expect(shop.done).toBe(false);
    expect(shop.inProgress).toBe(true);
    expect(shop.doneItems).toBe(2);
    expect(shop.openItemId).toBe('s3');
    expect(shop.openStep).toBe(3);

    const all = buildCourse(CURRICULUM, STEPS, new Set(['s1', 's2', 's3']));
    const done = all.blocks.find((b) => b.summary.slug === 'shop')!;
    expect(done.done).toBe(true);
    expect(done.inProgress).toBe(false);
    // Finished: a door reopens the workshop from the start.
    expect(done.openItemId).toBe('s1');
  });

  it('opens the first incomplete step even when a later step is done', () => {
    const course = buildCourse(CURRICULUM, STEPS, new Set(['s2']));
    const shop = course.blocks.find((b) => b.summary.slug === 'shop')!;
    expect(shop.openItemId).toBe('s1');
    expect(shop.openStep).toBe(1);
  });

  it('a block id does not complete a workshop', () => {
    const course = buildCourse(CURRICULUM, STEPS, new Set(['id-shop']));
    expect(course.blocks.find((b) => b.summary.slug === 'shop')!.done).toBe(false);
  });

  it('refuses a workshop whose steps were not loaded', () => {
    expect(() => buildCourse(CURRICULUM, new Map(), new Set())).toThrow(/steps of workshop "shop"/);
  });

  it('counts done blocks per chapter and per track', () => {
    const course = buildCourse(CURRICULUM, STEPS, new Set(['id-intro', 's1', 's2', 's3']));
    const [a, b] = course.tracks;
    expect([a.done, a.total]).toEqual([1, 2]);
    expect([b.done, b.total]).toEqual([1, 2]);
    expect([a.chapters[0].done, a.chapters[0].total]).toEqual([1, 2]);
  });
});

describe('next up', () => {
  it('is the first block in course order that is not done', () => {
    expect(buildCourse(CURRICULUM, STEPS, new Set()).nextUp?.summary.slug).toBe('intro');
    expect(buildCourse(CURRICULUM, STEPS, new Set(['id-intro'])).nextUp?.summary.slug).toBe('rev');
    // Later blocks being done does not matter: nothing is locked, and the first gap is next.
    expect(buildCourse(CURRICULUM, STEPS, new Set(['id-rev'])).nextUp?.summary.slug).toBe('intro');
  });

  it('moves to the workshop after Track A, then to the first gap in it', () => {
    const done = new Set(['id-intro', 'id-rev', 's1']);
    const next = buildCourse(CURRICULUM, STEPS, done).nextUp!;
    expect(next.summary.slug).toBe('shop');
    expect(blockPath(next)).toBe('/learn/shop/s2');
  });

  it('is null when everything is done', () => {
    const all = new Set(['id-intro', 'id-rev', 's1', 's2', 's3', 'id-quiz']);
    expect(buildCourse(CURRICULUM, STEPS, all).nextUp).toBeNull();
  });

  it('skips optional blocks and leaves them out of the counts', () => {
    const curriculum: CurriculumIndex = {
      tracks: [
        {
          id: 'A',
          title: 'A',
          chapters: [
            {
              id: 'A0',
              title: 'A',
              blocks: [summary('extra', 'lesson', { optional: true }), summary('core', 'lesson')],
            },
          ],
        },
      ],
    };
    const course = buildCourse(curriculum, new Map(), new Set());
    expect(course.nextUp?.summary.slug).toBe('core');
    expect([course.tracks[0].done, course.tracks[0].total]).toEqual([0, 1]);
  });
});

describe('hero', () => {
  const courseAt = (done: string[]) => buildCourse(CURRICULUM, STEPS, new Set(done));

  it('says "Start this <type>" for a block that has not been started', () => {
    expect(heroFor(courseAt([]), null)?.label).toBe('Start this lesson');
    expect(heroFor(courseAt(['id-intro', 'id-rev']), null)?.label).toBe('Start this workshop');
  });

  it('says "Continue with step N" for a workshop in progress', () => {
    const hero = heroFor(courseAt(['id-intro', 'id-rev', 's1', 's2']), null)!;
    expect(hero.label).toBe('Continue with step 3');
    expect(hero.allDone).toBe(false);
  });

  it('says "Review it again" on the last finished block when everything is done', () => {
    const all = courseAt(['id-intro', 'id-rev', 's1', 's2', 's3', 'id-quiz']);
    const hero = heroFor(all, 'id-rev')!;
    expect(hero.label).toBe('Review it again');
    expect(hero.allDone).toBe(true);
    expect(hero.block.summary.slug).toBe('rev');
    // Unknown last block: the course's final block.
    expect(heroFor(all, null)?.block.summary.slug).toBe('quiz');
  });

  it('has no hero for an empty course', () => {
    expect(heroFor(buildCourse({ tracks: [] }, new Map(), new Set()), null)).toBeNull();
  });

  it('heroActionLabel names the type', () => {
    const quiz = courseAt([]).blocks.find((b) => b.summary.slug === 'quiz')!;
    expect(heroActionLabel(quiz, false)).toBe('Start this quiz');
  });
});

describe('blockMetaLine', () => {
  it('is the type, a comma and the size, in plain words', () => {
    expect(blockMetaLine(summary('a', 'workshop', { itemCount: 3 }))).toBe('Workshop, 3 steps');
    expect(blockMetaLine(summary('a', 'workshop', { itemCount: 1 }))).toBe('Workshop, 1 step');
    expect(blockMetaLine(summary('a', 'lesson', { itemCount: 9 }))).toBe('Lesson, 9 screens');
    expect(blockMetaLine(summary('a', 'quiz', { itemCount: 4 }))).toBe('Quiz, 4 questions');
    expect(blockMetaLine(summary('a', 'exam', { itemCount: 15 }))).toBe('Exam, 15 questions');
    expect(blockMetaLine(summary('a', 'lab', { itemCount: 8 }))).toBe('Lab, 8 user stories');
    expect(blockMetaLine(summary('a', 'project', { itemCount: 1 }))).toBe('Project, 1 user story');
    expect(blockMetaLine(summary('a', 'review', { estMinutes: 3 }))).toBe('Review, 3 min read');
  });
});

describe('newlyDone', () => {
  it('lists blocks done now that were not done at the last visit', () => {
    expect(newlyDone(['a'], ['a', 'b', 'c'])).toEqual(['b', 'c']);
  });

  it('is empty with no earlier visit, or nothing new', () => {
    expect(newlyDone(null, ['a', 'b'])).toEqual([]);
    expect(newlyDone(['a', 'b'], ['a', 'b'])).toEqual([]);
  });
});
