/** The fixture content in content/ (track Z) must validate and cover every block and screen type. */
import { describe, expect, it } from 'vitest';
import { SCREEN_TYPES } from '../../src/content/schema';
import { formatIssues, loadContent, type ContentFiles } from '../../src/content/validate';

describe('content/ fixtures', () => {
  const raw = import.meta.glob<string>('../../content/**/*.{md,json}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  const files: ContentFiles = Object.fromEntries(
    Object.entries(raw).map(([path, text]) => [path.replace('../../content/', ''), text]),
  );
  const result = loadContent(files);
  // Only chapter Z1 holds the one-of-each fixtures; real chapters and Z2 (widgets) sit alongside.
  const z1 = result.curriculum?.tracks
    .find((t) => t.id === 'Z')
    ?.chapters.find((c) => c.id === 'Z1');
  const fixtures = (z1?.blocks ?? []).map((slug) => {
    const block = result.blocks.get(slug);
    if (!block) throw new Error(`fixture block "${slug}" did not load`);
    return block;
  });

  it('validates with no issues', () => {
    expect(formatIssues(result.issues)).toBe('');
  });

  it('has one fixture block of each type in track Z, chapter Z1', () => {
    const types = fixtures.map((b) => b.type).sort();
    expect(types).toEqual(['lab', 'lesson', 'project', 'quiz', 'review', 'workshop']);
    expect(result.curriculum?.tracks.find((t) => t.id === 'Z')?.fixture).toBe(true);
  });

  it('the fixture lesson uses every screen type', () => {
    const lesson = fixtures.find((b) => b.type === 'lesson');
    if (lesson?.type !== 'lesson') throw new Error('no fixture lesson');
    const used = new Set(lesson.lesson.screens.map((s) => s.type));
    expect([...used].sort()).toEqual([...SCREEN_TYPES].sort());
    const concepts = lesson.lesson.screens.filter((s) => s.type === 'concept');
    expect(concepts.some((c) => c.type === 'concept' && c.code)).toBe(true);
    expect(concepts.some((c) => c.type === 'concept' && c.tryit)).toBe(true);
    expect(concepts.some((c) => c.type === 'concept' && c.callout)).toBe(true);
  });

  it('the fixture workshop, lab and quiz have the agreed shape', () => {
    const blocks = fixtures;
    const workshop = blocks.find((b) => b.type === 'workshop');
    const lab = blocks.find((b) => b.type === 'lab');
    const quiz = blocks.find((b) => b.type === 'quiz');
    if (workshop?.type !== 'workshop' || lab?.type !== 'lab' || quiz?.type !== 'quiz')
      throw new Error('missing fixtures');
    expect(workshop.meta.runner).toBe('web');
    expect(workshop.steps.map((s) => s.step)).toEqual([1, 2, 3]);
    expect(
      workshop.steps.map((s) => s.solutions[0].contents.match(/<(h1|p|button)>/g)?.length),
    ).toEqual([1, 2, 3]);
    expect(lab.lab.userStories).toHaveLength(4);
    expect(lab.lab.demo).toBe('index.html');
    expect(quiz.quiz.questions).toHaveLength(6);
    expect([quiz.quiz.draw, quiz.quiz.pass]).toEqual([4, 3]);
  });
});
