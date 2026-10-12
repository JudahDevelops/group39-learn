// PLACEHOLDER: WP 1.4 replaces this. Keep the export name and props.
import type { PlayerProps } from '../types';

export function LessonPlayer({ block }: PlayerProps<'lesson'>) {
  return <p>Lesson player for {block.meta.title} is not built yet.</p>;
}
