import type { Block } from '../content/schema';

/** A built block narrowed to one type, e.g. BlockOf<'lesson'>. */
export type BlockOf<T extends Block['type']> = Extract<Block, { type: T }>;

/** Props every player receives from the item page (src/pages/ItemPlayer.tsx). */
export interface PlayerProps<T extends Block['type']> {
  block: BlockOf<T>;
  /** The item being played: a step id for workshops, the block id for every other type. */
  itemId: string;
  /** Leave the player and go back to the map. */
  onExit: () => void;
  /** Open another item of the same block, e.g. the next workshop step. */
  onNavigate: (itemId: string) => void;
}
