import type { RunOutput } from '../../runners/types';
import { Html } from './Html';

interface SlipProps {
  output: RunOutput;
  passed: boolean;
  /** "Step 3 of 25 done", or "Lab done". */
  doneText: string;
  onContinue: () => void;
  /** Hide the failing-test message (a lab lists every test instead). A runner error still shows. */
  hideTestFailure?: boolean;
}

/**
 * The correction slip (docs/design.md): a paper block with a red rule that shows the first
 * failing message, and a green block with "Your code passes." and Continue once everything passes.
 * The wrapper is always in the page so a screen reader hears the change.
 */
export function CorrectionSlip({
  output,
  passed,
  doneText,
  onContinue,
  hideTestFailure,
}: SlipProps) {
  let body = null;
  if (passed) {
    body = (
      <div className="wk-slip wk-slip-pass">
        <p className="wk-slip-title">Your code passes.</p>
        <p className="wk-slip-meta">{doneText}</p>
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    );
  } else if (output.error) {
    body = (
      <div className="wk-slip wk-slip-fail">
        <span className="wk-sr-only">Not passing yet. </span>
        <p className="wk-slip-text">{output.error}</p>
      </div>
    );
  } else if (!hideTestFailure && output.firstFailure !== null) {
    const failing = output.results[output.firstFailure];
    if (failing) {
      body = (
        <div className="wk-slip wk-slip-fail">
          <span className="wk-sr-only">Not passing yet. </span>
          <Html html={failing.message} className="wk-slip-text" />
        </div>
      );
    }
  }
  return (
    <div className="wk-slip-region" role="status" aria-live="polite">
      {body}
    </div>
  );
}

/** The lab's full test list: every test with a ✓ or ✗ as well as a colour. */
export function TestList({ output }: { output: RunOutput }) {
  if (output.results.length === 0) return null;
  const passing = output.results.filter((r) => r.ok).length;
  return (
    <section className="wk-results" aria-label="Test results">
      <h2 className="wk-subhead">Tests</h2>
      <p className="wk-results-count">
        {passing} of {output.results.length} tests pass
      </p>
      <ul className="wk-tests">
        {output.results.map((result, i) => (
          <li key={i} className={result.ok ? 'wk-test wk-test-ok' : 'wk-test wk-test-fail'}>
            <span className="wk-test-icon" aria-hidden="true">
              {result.ok ? '✓' : '✗'}
            </span>
            <span className="wk-sr-only">{result.ok ? 'Passing: ' : 'Failing: '}</span>
            <Html html={result.message} as="span" className="wk-test-text" />
          </li>
        ))}
      </ul>
    </section>
  );
}
