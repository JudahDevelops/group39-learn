import { useCallback, useEffect, useRef, useState } from 'react';
import { getRunner } from '..';
import type { Files } from '../types';
import { viewOf, type AppView } from './view';

export interface FastapiRun {
  view: AppView | null;
  running: boolean;
  /** Loads the app from the files, with no tests, and shows that it started or why it did not. */
  run(files: Files): Promise<void>;
}

/** Runs the app for a Try it box or the finished-project demo, with no tests. */
export function useFastapiRun(): FastapiRun {
  const [view, setView] = useState<AppView | null>(null);
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
    let result: AppView;
    try {
      const engine = await getRunner('fastapi');
      result = viewOf(await engine.run(files, []));
    } catch (err) {
      result = {
        state: 'error',
        routes: [],
        error: err instanceof Error ? err.message : 'Your app could not run.',
        logs: [],
      };
    }
    busy.current = false;
    if (!mounted.current) return;
    setView(result);
    setRunning(false);
  }, []);

  return { view, running, run };
}
