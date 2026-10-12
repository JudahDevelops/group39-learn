import { CheckIcon } from '../../screens/Icons';
import type { LessonFeedbackRating } from '../../store/types';
import { accuracyPercent, type Accuracy } from './grade';

export type SaveState =
  { status: 'saving' } | { status: 'done'; gained: number } | { status: 'error' };

export const RATINGS: readonly { value: LessonFeedbackRating; label: string }[] = [
  { value: 'too_easy', label: 'Too easy' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_hard', label: 'Too hard' },
  { value: 'confusing', label: 'Confusing' },
];

/** The XP line: what was actually gained, which is nothing on a repeat. */
export function xpLine(save: SaveState): string {
  if (save.status === 'saving') return 'Saving your progress';
  if (save.status === 'error') return 'Your progress could not be saved';
  return save.gained > 0 ? `${save.gained} XP earned` : 'Already done earlier';
}

export function accuracyLine(accuracy: Accuracy): string | null {
  const percent = accuracyPercent(accuracy);
  if (percent === null) return null;
  return `${percent}% accuracy, ${accuracy.right} of ${accuracy.graded} right on the first try`;
}

/** "Lesson done", three plain lines and the one-tap pulse. Continue lives in the player's bottom bar. */
export function EndCard({
  screens,
  accuracy,
  save,
  onSaveAgain,
  rating,
  onRating,
  comment,
  onComment,
  feedbackError,
}: {
  screens: number;
  accuracy: Accuracy;
  save: SaveState;
  onSaveAgain: () => void;
  rating: LessonFeedbackRating | null;
  onRating: (rating: LessonFeedbackRating) => void;
  comment: string;
  onComment: (comment: string) => void;
  feedbackError: boolean;
}) {
  const accuracyText = accuracyLine(accuracy);
  return (
    <div className="screen end-card">
      <h2 className="end-title">Lesson done</h2>
      <ul className="end-lines">
        <li>{screens === 1 ? '1 screen' : `${screens} screens`}</li>
        <li>
          {xpLine(save)}
          {save.status === 'error' && (
            <>
              {'. '}
              <button type="button" className="btn btn-text" onClick={onSaveAgain}>
                Save again
              </button>
            </>
          )}
        </li>
        {accuracyText && <li>{accuracyText}</li>}
      </ul>

      <fieldset className="pulse">
        <legend className="question">How did this lesson feel?</legend>
        <div className="pulse-options">
          {RATINGS.map((option) => (
            <label
              key={option.value}
              className={`pulse-option${rating === option.value ? ' is-picked' : ''}`}
            >
              <input
                type="radio"
                name="lesson-feel"
                value={option.value}
                checked={rating === option.value}
                onChange={() => onRating(option.value)}
              />
              {rating === option.value && <CheckIcon size={16} />}
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {rating && (
          <div className="field">
            <label htmlFor="lesson-comment">Anything to add? (optional)</label>
            <textarea
              id="lesson-comment"
              className="text-input"
              rows={3}
              value={comment}
              onChange={(event) => onComment(event.target.value)}
            />
          </div>
        )}
        {feedbackError && (
          <p className="form-error" role="alert">
            Your feedback could not be saved. Press Continue to leave anyway.
          </p>
        )}
      </fieldset>
    </div>
  );
}
