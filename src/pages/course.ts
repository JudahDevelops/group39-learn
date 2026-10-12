/**
 * The course as the map and home see it: the curriculum plus what this learner has finished.
 * Pure functions only, so the "done", "next up" and "which item to open" rules are unit-tested
 * (tests/unit/map.course.test.ts).
 *
 * Items: a workshop has one item per step (the step ids); every other block has one item, its own id.
 */
import type { BlockSummary, BlockType, CurriculumIndex, TrackId } from '../content/schema';

/** Course order of the tracks. Z is fixture content and only exists in dev and test builds. */
const TRACK_RANK: Record<TrackId, number> = { A: 0, B: 1, Z: 2 };

export interface CourseBlock {
  summary: BlockSummary;
  trackId: TrackId;
  chapterId: string;
  /** Step ids for a workshop, otherwise [block id]. */
  itemIds: readonly string[];
  doneItems: number;
  /** Every item is complete. */
  done: boolean;
  /** A workshop with some steps done and some left. */
  inProgress: boolean;
  /** The item a door opens: the first incomplete step for a workshop, otherwise the block id. */
  openItemId: string;
  /** 1-based number of `openItemId` within a workshop; null for every other type. */
  openStep: number | null;
}

export interface CourseChapter {
  id: string;
  title: string;
  blocks: CourseBlock[];
  /** Counts leave out optional blocks. */
  done: number;
  total: number;
}

export interface CourseTrack {
  id: TrackId;
  title: string;
  chapters: CourseChapter[];
  done: number;
  total: number;
}

export interface Course {
  /** In course order: A, B, then Z when present. */
  tracks: CourseTrack[];
  /** Every block in course order. */
  blocks: CourseBlock[];
  /** The first block that is not done (optional blocks are skipped); null when all are done. */
  nextUp: CourseBlock | null;
}

/** The first item that is not complete, or undefined when all are. */
export function firstIncompleteItem(
  itemIds: readonly string[],
  completed: ReadonlySet<string>,
): string | undefined {
  return itemIds.find((id) => !completed.has(id));
}

/**
 * `stepIds` maps a workshop's block id to its step ids, in step order. `completed` holds the ids of
 * every item the learner has finished (step ids and block ids together).
 */
export function buildCourse(
  curriculum: CurriculumIndex,
  stepIds: ReadonlyMap<string, readonly string[]>,
  completed: ReadonlySet<string>,
): Course {
  const tracks: CourseTrack[] = [...curriculum.tracks]
    .sort((a, b) => TRACK_RANK[a.id] - TRACK_RANK[b.id])
    .map((track) => {
      const chapters: CourseChapter[] = track.chapters.map((chapter) => {
        const blocks = chapter.blocks.map((summary): CourseBlock => {
          let itemIds: readonly string[] = [summary.id];
          if (summary.type === 'workshop') {
            const steps = stepIds.get(summary.id);
            if (!steps || steps.length === 0) {
              throw new Error(`The steps of workshop "${summary.slug}" were not loaded.`);
            }
            itemIds = steps;
          }
          const doneItems = itemIds.filter((id) => completed.has(id)).length;
          const done = doneItems === itemIds.length;
          const openItemId = firstIncompleteItem(itemIds, completed) ?? itemIds[0];
          return {
            summary,
            trackId: track.id,
            chapterId: chapter.id,
            itemIds,
            doneItems,
            done,
            inProgress: summary.type === 'workshop' && doneItems > 0 && !done,
            openItemId,
            openStep: summary.type === 'workshop' ? itemIds.indexOf(openItemId) + 1 : null,
          };
        });
        const counted = blocks.filter((b) => !b.summary.optional);
        return {
          id: chapter.id,
          title: chapter.title,
          blocks,
          done: counted.filter((b) => b.done).length,
          total: counted.length,
        };
      });
      return {
        id: track.id,
        title: track.title,
        chapters,
        done: chapters.reduce((sum, c) => sum + c.done, 0),
        total: chapters.reduce((sum, c) => sum + c.total, 0),
      };
    });

  const blocks = tracks.flatMap((t) => t.chapters.flatMap((c) => c.blocks));
  return { tracks, blocks, nextUp: blocks.find((b) => !b.done && !b.summary.optional) ?? null };
}

const TYPE_LABEL: Record<BlockType, string> = {
  lesson: 'Lesson',
  workshop: 'Workshop',
  lab: 'Lab',
  review: 'Review',
  quiz: 'Quiz',
  project: 'Project',
  exam: 'Exam',
};

function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** The plain line under a door: "Workshop, 20 steps", "Lesson, 9 screens", "Quiz, 4 questions". */
export function blockMetaLine(summary: BlockSummary): string {
  const label = TYPE_LABEL[summary.type];
  switch (summary.type) {
    case 'lesson':
      return `${label}, ${count(summary.itemCount, 'screen')}`;
    case 'workshop':
      return `${label}, ${count(summary.itemCount, 'step')}`;
    case 'lab':
    case 'project':
      return `${label}, ${count(summary.itemCount, 'user story', 'user stories')}`;
    case 'quiz':
    case 'exam':
      return `${label}, ${count(summary.itemCount, 'question')}`;
    case 'review':
      return `${label}, ${summary.estMinutes} min read`;
  }
}

/** The button under the home hero. */
export function heroActionLabel(block: CourseBlock, allDone: boolean): string {
  if (allDone) return 'Review it again';
  if (block.inProgress && block.openStep !== null) return `Continue with step ${block.openStep}`;
  return `Start this ${block.summary.type}`;
}

/**
 * The block the home hero shows. Normally the next-up block. When everything is done it is the
 * block finished most recently (`lastDoneId`), or the last block of the course if that is unknown.
 */
export function heroFor(
  course: Course,
  lastDoneId: string | null,
): { block: CourseBlock; label: string; allDone: boolean } | null {
  if (course.nextUp) {
    return { block: course.nextUp, label: heroActionLabel(course.nextUp, false), allDone: false };
  }
  const block =
    course.blocks.find((b) => b.summary.id === lastDoneId) ??
    course.blocks[course.blocks.length - 1];
  return block ? { block, label: heroActionLabel(block, true), allDone: true } : null;
}

/** The URL a door opens. */
export function blockPath(block: CourseBlock): string {
  return `/learn/${block.summary.slug}/${block.openItemId}`;
}
