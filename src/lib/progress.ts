import type { ProgressStore } from '../store/types';
import { XP_BY_REASON, type XpReason } from './xp';

/**
 * The one way a player marks an item done. It records completion, awards each reason's XP once
 * (the store refuses repeats), and tells listeners such as the top bar to refresh.
 * Returns the XP actually gained this time: 0 when the item was already done.
 */
export async function completeItem(
  store: ProgressStore,
  itemId: string,
  blockId: string,
  reasons: readonly XpReason[],
): Promise<number> {
  await store.markComplete(itemId, blockId);
  let gained = 0;
  for (const reason of reasons) {
    const amount = XP_BY_REASON[reason];
    if (await store.awardXp(itemId, reason, amount)) gained += amount;
  }
  emitProgress();
  return gained;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to "progress changed". Returns the unsubscribe function, so it fits useEffect. */
export function onProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tell every listener that progress or XP changed. completeItem calls it for you. */
export function emitProgress(): void {
  for (const listener of listeners) listener();
}
