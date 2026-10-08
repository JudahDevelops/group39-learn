import { describe, expect, it } from 'vitest';
import { buildOutput, itemCount, roomCode } from '../../src/content/build';
import { BlockSchema, CurriculumIndexSchema } from '../../src/content/schema';
import { loadContent } from '../../src/content/validate';
import { baseTree } from './content.helpers';

function load(curriculum?: object) {
  const tree = baseTree();
  if (curriculum) tree['curriculum.json'] = JSON.stringify(curriculum);
  const result = loadContent(tree);
  expect(result.issues).toEqual([]);
  return { curriculum: result.curriculum!, blocks: result.blocks };
}

describe('roomCode', () => {
  it('is the chapter id and a 1-based, 2-digit position', () => {
    expect(roomCode('B1', 4)).toBe('B1-04');
    expect(roomCode('A0', 1)).toBe('A0-01');
    expect(roomCode('B10', 12)).toBe('B10-12');
  });
});

describe('buildOutput', () => {
  it('writes id, slug, type, title, estMinutes, itemCount and roomCode for every block, in curriculum order', () => {
    const { curriculum, blocks } = load();
    const out = buildOutput(curriculum, blocks, { includeFixtures: false });
    const entries = out.curriculum.tracks[0].chapters[0].blocks;
    expect(entries.map((b) => [b.slug, b.roomCode, b.itemCount])).toEqual([
      ['lesson-a', 'B1-01', 2], // two screens
      ['shop-a', 'B1-02', 2], // two steps
      ['lab-a', 'B1-03', 1], // one user story
      ['quiz-a', 'B1-04', 2], // draw
      ['exam-a', 'B1-05', 5], // draw
      ['review-a', 'B1-06', 1],
      ['project-a', 'B1-07', 1], // one user story
    ]);
    expect(entries[0]).toEqual({
      id: 'aaaa0001',
      slug: 'lesson-a',
      type: 'lesson',
      title: 'A lesson',
      runner: 'web',
      estMinutes: 5,
      itemCount: 2,
      roomCode: 'B1-01',
    });
  });

  it('produces JSON that satisfies the output schemas', () => {
    const { curriculum, blocks } = load();
    const out = buildOutput(curriculum, blocks, { includeFixtures: false });
    expect(() =>
      CurriculumIndexSchema.parse(JSON.parse(JSON.stringify(out.curriculum))),
    ).not.toThrow();
    expect(out.blocks.size).toBe(7);
    for (const block of out.blocks.values()) {
      expect(() => BlockSchema.parse(JSON.parse(JSON.stringify(block)))).not.toThrow();
    }
    expect(out.blocks.get('exam-a')?.type).toBe('exam');
    expect(out.blocks.get('shop-a')).toMatchObject({ type: 'workshop', roomCode: 'B1-02' });
  });

  it('drops fixture tracks and their blocks unless fixtures are included', () => {
    const { curriculum, blocks } = load({
      tracks: [
        {
          id: 'B',
          title: 'Build',
          chapters: [
            {
              id: 'B1',
              title: 'HTML',
              blocks: ['lesson-a', 'shop-a', 'lab-a', 'quiz-a', 'exam-a'],
            },
          ],
        },
        {
          id: 'Z',
          title: 'Fixtures',
          fixture: true,
          chapters: [{ id: 'Z1', title: 'x', blocks: ['review-a', 'project-a'] }],
        },
      ],
    });
    const without = buildOutput(curriculum, blocks, { includeFixtures: false });
    expect(without.curriculum.tracks.map((t) => t.id)).toEqual(['B']);
    expect([...without.blocks.keys()].sort()).toEqual([
      'exam-a',
      'lab-a',
      'lesson-a',
      'quiz-a',
      'shop-a',
    ]);

    const withFixtures = buildOutput(curriculum, blocks, { includeFixtures: true });
    expect(withFixtures.curriculum.tracks.map((t) => [t.id, t.fixture])).toEqual([
      ['B', undefined],
      ['Z', true],
    ]);
    expect(withFixtures.blocks.get('review-a')?.roomCode).toBe('Z1-01');
    expect(withFixtures.blocks.get('project-a')?.roomCode).toBe('Z1-02');
  });

  it('is empty when the only track is a fixture track', () => {
    const tree = Object.fromEntries(
      Object.entries(baseTree()).filter(([key]) => key.startsWith('blocks/review-a/')),
    );
    tree['curriculum.json'] = JSON.stringify({
      tracks: [
        {
          id: 'Z',
          title: 'Fixtures',
          fixture: true,
          chapters: [{ id: 'Z1', title: 'x', blocks: ['review-a'] }],
        },
      ],
    });
    const result = loadContent(tree);
    expect(result.issues).toEqual([]);
    const out = buildOutput(result.curriculum!, result.blocks, { includeFixtures: false });
    expect(out.curriculum.tracks).toEqual([]);
    expect(out.blocks.size).toBe(0);
  });

  it('carries optional only when set', () => {
    const tree = baseTree();
    tree['blocks/review-a/meta.json'] = tree['blocks/review-a/meta.json'].replace(
      '"runner"',
      '"optional": true,\n  "runner"',
    );
    const result = loadContent(tree);
    const out = buildOutput(result.curriculum!, result.blocks, { includeFixtures: false });
    const entries = out.curriculum.tracks[0].chapters[0].blocks;
    expect(entries.find((b) => b.slug === 'review-a')?.optional).toBe(true);
    expect('optional' in entries[0]).toBe(false);
  });
});

describe('itemCount', () => {
  it('counts what the map shows for each block type', () => {
    const { blocks } = load();
    const counts = Object.fromEntries([...blocks].map(([slug, b]) => [slug, itemCount(b)]));
    expect(counts).toEqual({
      'lesson-a': 2,
      'shop-a': 2,
      'lab-a': 1,
      'quiz-a': 2,
      'exam-a': 5,
      'review-a': 1,
      'project-a': 1,
    });
  });
});
