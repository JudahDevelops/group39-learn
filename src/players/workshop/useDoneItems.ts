import { useEffect, useState } from 'react';
import { onProgress } from '../../lib/progress';
import { useCurrentUser, useStore } from '../../store/StoreContext';

/** The ids of the items the signed-in learner has completed. Refreshes when progress changes. */
export function useDoneItems(): Set<string> {
  const store = useStore();
  const user = useCurrentUser();
  const [done, setDone] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = () => {
      store.listCompleted(user.id).then(
        (list) => {
          if (!cancelled) setDone(new Set(list.map((entry) => entry.itemId)));
        },
        () => {
          // The bar just shows fewer green segments.
        },
      );
    };
    load();
    const stop = onProgress(load);
    return () => {
      cancelled = true;
      stop();
    };
  }, [store, user]);

  return done;
}
