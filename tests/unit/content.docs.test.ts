/** Keeps docs/content-format.md honest: every example marked `<!-- example:NAME -->` is parsed with the real parsers. */
import { describe, expect, it } from 'vitest';
import {
  parseLab,
  parseLesson,
  parseProject,
  parseQuiz,
  parseReview,
  parseStep,
} from '../../src/content/parse';
import { BlockMetaSchema, CurriculumSchema, SCREEN_TYPES } from '../../src/content/schema';

const docs = import.meta.glob<string>('../../docs/content-format.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const doc = Object.values(docs)[0];

function examples(): Map<string, string> {
  const found = new Map<string, string>();
  const re = /<!-- example:([\w:-]+) -->\n(`{4,})\w*\n([\s\S]*?)\n\2/g;
  for (const m of doc.matchAll(re)) found.set(m[1], m[3]);
  return found;
}

const ctx = {
  file: 'docs/content-format.md',
  blockId: 'abcd1234',
  runner: 'web' as const,
  demo: 'index.html',
};

describe('docs/content-format.md examples', () => {
  const all = examples();

  it('has an example for every block type, screen type and json file', () => {
    const expected = [
      'curriculum',
      'meta',
      'step',
      'lab',
      'quiz',
      'review',
      'project',
      ...SCREEN_TYPES.map((t) => `screen:${t}`),
    ];
    expect([...all.keys()].sort()).toEqual(expected.sort());
  });

  it('curriculum.json and meta.json examples satisfy their schemas', () => {
    expect(CurriculumSchema.safeParse(JSON.parse(all.get('curriculum')!)).success).toBe(true);
    expect(BlockMetaSchema.safeParse(JSON.parse(all.get('meta')!)).success).toBe(true);
  });

  it('the step, lab, quiz, review and project examples parse cleanly', () => {
    expect(parseStep(all.get('step')!, 'content/blocks/x/01.md').issues).toEqual([]);
    expect(parseLab(all.get('lab')!, ctx).issues).toEqual([]);
    expect(parseQuiz(all.get('quiz')!, { ...ctx, runner: 'none' }).issues).toEqual([]);
    expect(parseReview(all.get('review')!, { ...ctx, runner: 'none' }).issues).toEqual([]);
    expect(parseProject(all.get('project')!, { ...ctx, runner: 'none' }).issues).toEqual([]);
  });

  for (const type of SCREEN_TYPES) {
    it(`the ${type} screen example parses cleanly as a screen of that type`, () => {
      const r = parseLesson(all.get(`screen:${type}`)!, ctx);
      expect(r.issues).toEqual([]);
      expect(r.value?.screens).toHaveLength(1);
      expect(r.value?.screens[0].type).toBe(type);
    });
  }
});
