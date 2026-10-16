import { useState, type ReactNode } from 'react';
import { Modal } from './Modal';

interface CheckActionsProps {
  checking: boolean;
  onCheck: () => void;
  onReset: () => void;
  /** Shown when the preview does not refresh while typing (the page runs JavaScript). */
  onRun?: () => void;
  resetLabel?: string;
  confirmText?: string;
  /** A line under the buttons, such as Python's download note on a phone. */
  note?: ReactNode;
}

/** "Check your code", the Ctrl+Enter hint, and Reset with a confirm. */
export function CheckActions({
  checking,
  onCheck,
  onReset,
  onRun,
  resetLabel = 'Reset step',
  confirmText = 'Reset this step to its starting code?',
  note,
}: CheckActionsProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="wk-actions">
      <button
        type="button"
        className="btn btn-primary"
        onClick={onCheck}
        disabled={checking}
        aria-busy={checking}
      >
        Check your code
      </button>
      <span className="wk-keyhint">Ctrl+Enter</span>
      {onRun && (
        <button type="button" className="btn btn-secondary" onClick={onRun}>
          Run
        </button>
      )}
      <button type="button" className="btn btn-text wk-reset" onClick={() => setConfirming(true)}>
        <span className="wk-reset-icon" aria-hidden="true">
          ⟲
        </span>
        {resetLabel}
      </button>
      {note}
      {confirming && (
        <Modal title={resetLabel} role="alertdialog" onClose={() => setConfirming(false)}>
          <p className="wk-text">{confirmText}</p>
          <div className="wk-help-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setConfirming(false);
                onReset();
              }}
            >
              {resetLabel}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
