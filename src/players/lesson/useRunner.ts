import { useEffect, useState } from 'react';
import type { Runner as BlockRunner } from '../../content/schema';
import { mountFastapiNotice } from '../../runners/fastapi/floating';
import { warmIfCached as warmFastapiIfCached } from '../../runners/fastapi/warm';
import { mountPythonNotice } from '../../runners/python/floating';
import { warmIfCached as warmPythonIfCached } from '../../runners/python/warm';
import { mountSqlNotice } from '../../runners/sql/floating';
import { warmIfCached as warmSqlIfCached } from '../../runners/sql/warm';
import type { GetRunner, Runner } from '../../runners/types';
import type { RunnerStatus } from '../../screens/TypeinScreen';

export interface RunnerState {
  status: RunnerStatus;
  runner: Runner | null;
}

/**
 * Loads the code runner a typein screen needs. Pass `null` when the current screen needs none.
 * `getRunner` failing (the runner is not built yet, or could not load) reports "missing", and the
 * lesson lets the learner carry on without a check.
 */
export function useRunner(kind: BlockRunner | null, getRunner: GetRunner): RunnerState {
  const [state, setState] = useState<RunnerState>({ status: 'checking', runner: null });

  // A lesson's typein screen has no place for the "needs about N MB, once" note of Python,
  // PostgreSQL or the FastAPI runner, so it is put above the bottom bar while an exercise that needs
  // one is on screen.
  useEffect(() => {
    if (kind !== 'python' && kind !== 'sql' && kind !== 'fastapi') return;
    const remove =
      kind === 'python'
        ? mountPythonNotice()
        : kind === 'sql'
          ? mountSqlNotice()
          : mountFastapiNotice();
    if (kind === 'python') warmPythonIfCached();
    else if (kind === 'sql') warmSqlIfCached();
    else warmFastapiIfCached();
    return remove;
  }, [kind]);

  useEffect(() => {
    if (kind === null) return;
    if (kind === 'none') {
      setState({ status: 'missing', runner: null });
      return;
    }
    let cancelled = false;
    setState({ status: 'checking', runner: null });
    // `then` also catches a getRunner that throws instead of rejecting.
    Promise.resolve()
      .then(() => getRunner(kind))
      .then(
        (runner) => {
          if (!cancelled) setState({ status: 'ready', runner });
        },
        () => {
          if (!cancelled) setState({ status: 'missing', runner: null });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [kind, getRunner]);

  return state;
}
