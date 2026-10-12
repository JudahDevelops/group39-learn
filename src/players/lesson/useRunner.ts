import { useEffect, useState } from 'react';
import type { Runner as BlockRunner } from '../../content/schema';
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
