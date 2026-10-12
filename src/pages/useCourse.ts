import { useEffect, useState } from 'react';
import { fetchBlock, fetchCurriculum } from '../content/loader';
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

function workshopSlugs(curriculum: CurriculumIndex): string[] {
  return curriculum.tracks.flatMap((t) =>
    t.chapters.flatMap((c) => c.blocks.filter((b) => b.type === 'workshop').map((b) => b.slug)),
  );
}

/**
 * Loads the curriculum and this learner's progress, and builds the course from them. A workshop's
 * step ids come from its block file, so those files load here too (the loader caches them for the
 * workshop player). Loads once per mount: the map and home are remounted on every visit.
 */
export function useCourse(): CourseState {
  const store = useStore();
  const userId = useCurrentUser()?.id;
  const [state, setState] = useState<CourseState>({ status: 'loading' });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const curriculum = await fetchCurriculum();
      const [workshops, entries] = await Promise.all([
        Promise.all(workshopSlugs(curriculum).map((slug) => fetchBlock(slug))),
        store.listCompleted(userId),
      ]);
      const stepIds = new Map<string, string[]>();
      for (const block of workshops) {
        if (block.type === 'workshop')
          stepIds.set(
            block.meta.id,
            block.steps.map((s) => s.id),
          );
      }
      const course = buildCourse(curriculum, stepIds, new Set(entries.map((e) => e.itemId)));
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
