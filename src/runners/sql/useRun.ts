import { useCallback, useEffect, useRef, useState } from 'react';
import { getRunner } from '..';
import type { Files } from '../types';
import { viewOf, type ResultsView } from './view';

export interface SqlRun {
  view: ResultsView | null;
  running: boolean;
  /** Runs the files with no tests and shows the rows of the last statement that returns rows. */
  run(files: Files): Promise<void>;
}

/** Runs SQL for a Try it box or the finished-project demo, with no tests. */
export function useSqlRun(): SqlRun {
  const [view, setView] = useState<ResultsView | null>(null);
  const [running, setRunning] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (files: Files) => {
    if (busy.current) return;
    busy.current = true;
    setRunning(true);
    let result: ResultsView;
    try {
      const engine = await getRunner('sql');
      result = viewOf(await engine.run(files, []));
    } catch (err) {
      result = {
        table: null,
        empty: false,
        error: err instanceof Error ? err.message : 'Your query could not run.',
      };
    }
    busy.current = false;
    if (!mounted.current) return;
    setView(result);
    setRunning(false);
  }, []);

  return { view, running, run };
}
