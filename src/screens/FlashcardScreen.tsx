import { Html } from './Html';
import { Question } from './Question';
import type { ScreenOf } from './types';

/** The question, and the model answer once the learner has asked for it (the buttons live in the bottom bar). */
export function FlashcardScreen({
  screen,
  revealed,
}: {
  screen: ScreenOf<'flashcard'>;
  revealed: boolean;
}) {
  return (
    <div className="screen">
      <Question html={screen.question} />
      {revealed && (
        <div className="flash-answer" role="region" aria-label="Answer">
          <Html html={screen.answer} className="reading" />
        </div>
      )}
    </div>
  );
}
