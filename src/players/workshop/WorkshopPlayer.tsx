// PLACEHOLDER: WP 1.5 replaces this. Keep the export name and props.
import type { PlayerProps } from '../types';

export function WorkshopPlayer({ block }: PlayerProps<'workshop'>) {
  return <p>Workshop player for {block.meta.title} is not built yet.</p>;
}
