import { CrossIcon } from '../../screens/Icons';

/** Combo shows from this many correct answers in a row. */
export const COMBO_FROM = 3;

/**
 * The top row of the player: close, one segment per screen (done = door, current = key, the rest = rule)
 * and the combo counter on the right.
 */
export function ProgressBar({
  total,
  current,
  combo,
  onExit,
}: {
  total: number;
  /** 0-based index of the current screen, or `total` once the lesson is done. */
  current: number;
  combo: number;
  onExit: () => void;
}) {
  return (
    <div className="lesson-top">
      <button
        type="button"
        className="icon-btn lesson-exit"
        aria-label="Exit lesson"
        onClick={onExit}
      >
        <CrossIcon />
      </button>
      <div
        className="lesson-segments"
        role="progressbar"
        aria-label="Lesson progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(current, total)}
        aria-valuetext={current >= total ? 'Lesson done' : `Screen ${current + 1} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`lesson-segment ${i < current ? 'is-done' : i === current ? 'is-current' : ''}`}
          />
        ))}
      </div>
      <span className="lesson-combo" role="status">
        {combo >= COMBO_FROM ? `${combo} in a row` : ''}
      </span>
    </div>
  );
}
