import { useEffect, useState } from 'react';
import { fetchCurriculum } from '../../content/loader';
import type { CurriculumIndex } from '../../content/schema';
import { useStore } from '../../store/StoreContext';
import type { AdminData } from '../../store/types';

export type AdminState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; curriculum: CurriculumIndex; data: AdminData; now: Date };

/** Loads the curriculum and every member's rows once, when the dashboard opens. */
export function useAdminData(): AdminState {
  const store = useStore();
  const [state, setState] = useState<AdminState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCurriculum(), store.getAdminData()]).then(
      ([curriculum, data]) => {
        if (!cancelled) setState({ status: 'ready', curriculum, data, now: new Date() });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [store]);

  return state;
}
