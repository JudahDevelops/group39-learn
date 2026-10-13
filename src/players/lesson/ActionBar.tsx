import { useEffect, useRef } from 'react';

/** What the sticky bottom bar offers on the current screen (when no feedback sheet is showing). */
export type BarMode =
  | { kind: 'check'; label: string; disabled: boolean }
  | { kind: 'continue'; disabled: boolean }
  | { kind: 'reveal' }
  | { kind: 'rate' }
  /** Nothing to press: a widget with its own Check holds the bar back until it reports a result. */
  | { kind: 'none' };

export function ActionBar({
  mode,
  onCheck,
  onContinue,
  onReveal,
}: {
  mode: BarMode;
  onCheck: () => void;
  onContinue: () => void;
  onReveal: () => void;
}) {
  const gotIt = useRef<HTMLButtonElement>(null);
  const rating = mode.kind === 'rate';

  // After "Show answer" the button is gone; keep the keyboard on the next step.
  useEffect(() => {
    if (rating) gotIt.current?.focus({ preventScroll: true });
  }, [rating]);

  if (mode.kind === 'none') return null;

  return (
    <div className="lesson-bar">
      <div className="lesson-bar-inner">
        {mode.kind === 'check' && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={mode.disabled}
            onClick={onCheck}
          >
            {mode.label}
          </button>
        )}
        {mode.kind === 'continue' && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={mode.disabled}
            onClick={onContinue}
          >
            Continue
          </button>
        )}
        {mode.kind === 'reveal' && (
          <button type="button" className="btn btn-primary" onClick={onReveal}>
            Show answer
          </button>
        )}
        {mode.kind === 'rate' && (
          <>
            {/* How the learner rates themselves is not graded and earns nothing. */}
            <button type="button" className="btn btn-secondary" onClick={onContinue}>
              Missed
            </button>
            <button type="button" className="btn btn-secondary" onClick={onContinue}>
              Shaky
            </button>
            <button ref={gotIt} type="button" className="btn btn-primary" onClick={onContinue}>
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}
