import { useCallback, useEffect, useRef, useState } from 'react';
import { getRunner } from '..';
import type { Files } from '../types';
import type { ConsoleOutput } from './Console';

export interface PythonRun {
  output: ConsoleOutput | null;
  running: boolean;
  /** Runs the files with no tests and shows what they print. */
  run(files: Files): Promise<void>;
}

/** Runs Python code for a Try it box or the finished-project demo, with no tests. */
export function usePythonRun(): PythonRun {
  const [output, setOutput] = useState<ConsoleOutput | null>(null);
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
    let result: ConsoleOutput;
    try {
      const engine = await getRunner('python');
      const out = await engine.run(files, []);
      result = { lines: out.logs, error: out.error ?? null };
    } catch (err) {
      result = {
        lines: [],
        error: err instanceof Error ? err.message : 'Your code could not run.',
      };
    }
    busy.current = false;
    if (!mounted.current) return;
    setOutput(result);
    setRunning(false);
  }, []);

  return { output, running, run };
}
