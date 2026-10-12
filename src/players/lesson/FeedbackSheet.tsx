import { useEffect, useId, useRef, useState } from 'react';
import { CheckIcon, CrossIcon } from '../../screens/Icons';
import { Html } from '../../screens/Html';

/**
 * Replaces the bottom bar after Check. Correct: a title, a one-line note, "Why?" and Continue.
 * Wrong: "Not quite", the note for what the learner chose, and Try again. It slides up in 180 ms
 * (lesson.css), and not at all under reduced motion.
 */
export function FeedbackSheet({
  correct,
  title,
  feedback,
  why,
  onContinue,
  onRetry,
}: {
  correct: boolean;
  title: string;
  /** HTML. */
  feedback?: string;
  /** HTML: the screen's longer explanation, behind the "Why?" button. */
  why?: string;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const [open, setOpen] = useState(false);
  const primary = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const noteId = useId();
  const whyId = useId();

  // Keyboard users arrive on the next action; its description is read out with it.
  useEffect(() => {
    // preventScroll: the sheet is still sliding in, and focusing it would scroll the page.
    primary.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      className={`lesson-sheet ${correct ? 'sheet-right' : 'sheet-wrong'}`}
      aria-labelledby={titleId}
    >
      <div className="lesson-sheet-inner">
        <div className="sheet-head">
          {correct ? <CheckIcon /> : <CrossIcon />}
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
        </div>
        {feedback && <Html id={noteId} html={feedback} className="sheet-note" />}
        {correct && why && (
          <div id={whyId} hidden={!open}>
            <Html html={why} className="sheet-why" />
          </div>
        )}
        <div className="sheet-actions">
          {correct && why && (
            <button
              type="button"
              className="btn btn-secondary"
              aria-expanded={open}
              aria-controls={whyId}
              onClick={() => setOpen((value) => !value)}
            >
              Why?
            </button>
          )}
          <button
            ref={primary}
            type="button"
            className="btn btn-primary"
            aria-describedby={feedback ? `${titleId} ${noteId}` : titleId}
            onClick={correct ? onContinue : onRetry}
          >
            {correct ? 'Continue' : 'Try again'}
          </button>
        </div>
      </div>
    </section>
  );
}
