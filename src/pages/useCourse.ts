import { useEffect, useState } from 'react';
import { fetchCurriculum } from '../content/loader';
import type { CurriculumIndex } from '../content/schema';
import { useCurrentUser, useStore } from '../store/StoreContext';
import type { ProgressEntry } from '../store/types';
import { buildCourse, type Course } from './course';

export type CourseState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; course: Course; entries: ProgressEntry[] };

/** The id of the block finished most recently, or null when nothing is finished. */
export function lastFinishedBlockId(entries: readonly ProgressEntry[]): string | null {
  let latest: ProgressEntry | null = null;
  for (const entry of entries) {
    if (!latest || entry.completedAt > latest.completedAt) latest = entry;
  }
  return latest?.blockId ?? null;
}

/** Workshop block id → its step ids, read from the curriculum summary. */
function workshopStepIds(curriculum: CurriculumIndex): Map<string, string[]> {
  const stepIds = new Map<string, string[]>();
  for (const track of curriculum.tracks)
    for (const chapter of track.chapters)
      for (const block of chapter.blocks)
        if (block.type === 'workshop' && block.stepIds) stepIds.set(block.id, block.stepIds);
  return stepIds;
}

/**
 * Loads the curriculum and this learner's progress, and builds the course from them. Workshop step
 * ids come with the curriculum summary. Loads once per mount: the map and home are remounted on
 * every visit.
 */
export function useCourse(): CourseState {
  const store = useStore();
  const userId = useCurrentUser()?.id;
  const [state, setState] = useState<CourseState>({ status: 'loading' });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [curriculum, entries] = await Promise.all([
        fetchCurriculum(),
        store.listCompleted(userId),
      ]);
      const course = buildCourse(
        curriculum,
        workshopStepIds(curriculum),
        new Set(entries.map((e) => e.itemId)),
      );
      if (!cancelled) setState({ status: 'ready', course, entries });
    })().catch(() => {
      if (!cancelled) setState({ status: 'error' });
    });
    return () => {
      cancelled = true;
    };
  }, [store, userId]);

  return state;
}
