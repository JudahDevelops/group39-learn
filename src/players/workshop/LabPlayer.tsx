// PLACEHOLDER: WP 1.5 replaces this. Keep the export name and props.
import type { PlayerProps } from '../types';

export function LabPlayer({ block }: PlayerProps<'lab'>) {
  return <p>Lab player for {block.meta.title} is not built yet.</p>;
}
