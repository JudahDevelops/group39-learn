/** Turns a loaded content tree into the JSON served from public/content. Pure, so it is unit-tested. */
import type { Block, Curriculum, CurriculumIndex } from './schema';
import { withRoomCode, type ParsedBlock } from './validate';

/** Chapter id + "-" + 2-digit (1-based) position in the chapter, e.g. "B1-04". */
export function roomCode(chapterId: string, position: number): string {
  return `${chapterId}-${String(position).padStart(2, '0')}`;
}

/** What the map shows as the size of a block. */
export function itemCount(block: ParsedBlock): number {
  switch (block.type) {
    case 'lesson':
      return block.lesson.screens.length;
    case 'workshop':
      return block.steps.length;
    case 'lab':
      return block.lab.userStories.length;
    case 'quiz':
    case 'exam':
      return block.quiz.draw;
    case 'project':
      return block.project.userStories.length;
    case 'review':
      return 1;
  }
}

export interface BuildOutput {
  curriculum: CurriculumIndex;
  blocks: Map<string, Block>;
}

/**
 * Fixture tracks (`fixture: true`) are dropped unless `includeFixtures` is set; their blocks go with them.
 * Every curriculum slug must exist in `parsed` (validate first).
 */
export function buildOutput(
  curriculum: Curriculum,
  parsed: Map<string, ParsedBlock>,
  options: { includeFixtures: boolean },
): BuildOutput {
  const blocks = new Map<string, Block>();
  const tracks: CurriculumIndex['tracks'] = [];
  for (const track of curriculum.tracks) {
    if (track.fixture && !options.includeFixtures) continue;
    const chapters: CurriculumIndex['tracks'][number]['chapters'] = [];
    for (const chapter of track.chapters) {
      const entries = chapter.blocks.map((slug, i) => {
        const block = parsed.get(slug);
        if (!block) throw new Error(`block "${slug}" is in the curriculum but was not parsed`);
        const code = roomCode(chapter.id, i + 1);
        blocks.set(slug, withRoomCode(block, code));
        const { meta } = block;
        return {
          id: meta.id,
          slug: meta.slug,
          type: meta.type,
          title: meta.title,
          runner: meta.runner,
          estMinutes: meta.estMinutes,
          itemCount: itemCount(block),
          roomCode: code,
          ...(meta.optional ? { optional: true } : {}),
        };
      });
      chapters.push({ id: chapter.id, title: chapter.title, blocks: entries });
    }
    tracks.push({
      id: track.id,
      title: track.title,
      ...(track.fixture ? { fixture: true } : {}),
      chapters,
    });
  }
  return { curriculum: { tracks }, blocks };
}
