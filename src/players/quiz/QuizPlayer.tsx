import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '../../components/Html';
import type { QuizQuestion } from '../../content/schema';
import { completeItem } from '../../lib/progress';
import '../../styles/quiz.css';
import { useStore } from '../../store/StoreContext';
import type { PlayerProps } from '../types';
import { drawQuestions, optionKey, resultTitle, shuffledOptions, type QuizOption } from './draw';
import { readLastDraw, writeLastDraw } from './lastDraw';

interface Drawn {
  question: QuizQuestion;
  options: QuizOption[];
}

interface Answer {
  question: QuizQuestion;
  /** The option the learner picked. */
  chosen: QuizOption;
  /** The correct option, shown next to a wrong answer. */
  right: QuizOption;
  correct: boolean;
}

type SaveState = 'saving' | 'saved' | 'error';

/** Draws a new set, avoiding `previousIds`, and remembers it for the next visit. */
function startAttempt(
  blockId: string,
  pool: readonly QuizQuestion[],
  draw: number,
  previousIds: readonly string[] | null,
): Drawn[] {
  const picked = drawQuestions(pool, draw, previousIds);
  writeLastDraw(
    blockId,
    picked.map((q) => q.id),
  );
  return picked.map((question) => ({ question, options: shuffledOptions(question) }));
}

/** Plays a quiz or an exam: one question per screen, then the score and what to review. */
export function QuizPlayer({ block, onExit }: PlayerProps<'quiz' | 'exam'>) {
  const store = useStore();
  const { quiz } = block;
  const blockId = block.meta.id;

  const [attemptNo, setAttemptNo] = useState(1);
  const [drawn, setDrawn] = useState<Drawn[]>(() =>
    startAttempt(blockId, quiz.questions, quiz.draw, readLastDraw(blockId)),
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saving');
  const [gainedXp, setGainedXp] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const total = drawn.length;
  const current = drawn[index];
  const score = answers.filter((a) => a.correct).length;
  const passed = score >= quiz.pass;

  function check() {
    if (selected === null || checked) return;
    const chosen = current.options[selected];
    const right = current.options.find((o) => o.correct) ?? chosen;
    setAnswers((list) => [
      ...list,
      { question: current.question, chosen, right, correct: chosen.correct },
    ]);
    setChecked(true);
  }

  function next() {
    if (!checked) return;
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setChecked(false);
  }

  function tryAgain() {
    const previous = drawn.map((d) => d.question.id);
    setDrawn(startAttempt(blockId, quiz.questions, quiz.draw, previous));
    setAttemptNo((n) => n + 1);
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers([]);
    setFinished(false);
    setGainedXp(0);
  }

  // Save once per attempt, when the score screen opens. A failed save can be retried from the
  // screen; the attempt row is written only once even then.
  const savedFor = useRef<number | null>(null);
  const attemptWritten = useRef<number | null>(null);
  const save = useCallback(async () => {
    setSaveState('saving');
    try {
      if (attemptWritten.current !== attemptNo) {
        const wrongIds = answers.filter((a) => !a.correct).map((a) => a.question.id);
        await store.recordQuizAttempt(blockId, score, total, passed, wrongIds);
        attemptWritten.current = attemptNo;
      }
      if (passed) {
        const reason = block.type === 'exam' ? 'exam' : 'quiz';
        setGainedXp(await completeItem(store, blockId, blockId, [reason]));
      }
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [answers, attemptNo, block.type, blockId, passed, score, store, total]);

  useEffect(() => {
    if (!finished || savedFor.current === attemptNo) return;
    savedFor.current = attemptNo;
    void save();
  }, [finished, attemptNo, save]);

  // Keep the focus where the next thing to read or press is.
  useEffect(() => {
    if (finished) headingRef.current?.focus({ preventScroll: true });
    else questionRef.current?.focus({ preventScroll: true });
  }, [finished, index, attemptNo]);
  useEffect(() => {
    if (checked) sheetRef.current?.focus({ preventScroll: true });
  }, [checked]);

  // Letter keys pick an option; Enter checks or continues unless a button already has the focus.
  // After Check the focus moves to the feedback, so Enter there continues.
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    keyHandler.current = (event) => {
      if (finished || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (!checked && event.key.length === 1) {
        const i = event.key.toUpperCase().charCodeAt(0) - 65;
        if (i >= 0 && i < current.options.length) {
          event.preventDefault();
          setSelected(i);
        }
        return;
      }
      if (event.key === 'Enter' && !target?.closest('button, a')) {
        event.preventDefault();
        if (checked) next();
        else check();
      }
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const wrong = useMemo(() => answers.filter((a) => !a.correct), [answers]);

  if (finished) {
    return (
      <div className="quiz">
        <div className="quiz-column">
          <section className={passed ? 'quiz-band is-pass' : 'quiz-band is-fail'}>
            <h1 ref={headingRef} tabIndex={-1}>
              {resultTitle(score, total, quiz.pass)}
            </h1>
            {passed && saveState === 'saved' && gainedXp > 0 && <p>You earned {gainedXp} XP.</p>}
            {saveState === 'saving' && <p role="status">Saving your score.</p>}
            {saveState === 'error' && (
              <p role="alert" className="quiz-save-error">
                Your score could not be saved. Check your connection, then save it again.{' '}
                <button type="button" className="btn btn-secondary" onClick={() => void save()}>
                  Save again
                </button>
              </p>
            )}
          </section>
          <div className="quiz-actions">
            {passed ? (
              <>
                <button type="button" className="btn btn-primary" onClick={onExit}>
                  Back to the map
                </button>
                <button type="button" className="btn btn-secondary" onClick={tryAgain}>
                  Try again
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primary" onClick={tryAgain}>
                  Try again
                </button>
                <button type="button" className="btn btn-secondary" onClick={onExit}>
                  Back to the map
                </button>
              </>
            )}
          </div>
          {wrong.length > 0 && (
            <section className="quiz-review" aria-labelledby="quiz-review-title">
              <h2 id="quiz-review-title">
                {wrong.length === 1 ? 'The question you missed' : 'The questions you missed'}
              </h2>
              <ol>
                {wrong.map((a) => (
                  <li key={a.question.id} className="quiz-missed">
                    <Html html={a.question.text} className="quiz-missed-question" />
                    <p className="quiz-line is-wrong">
                      <span className="quiz-line-mark" aria-hidden="true">
                        ✗
                      </span>
                      <span>
                        <strong>Your answer:</strong> <Html html={a.chosen.html} as="span" />
                      </span>
                    </p>
                    <p className="quiz-line is-right">
                      <span className="quiz-line-mark" aria-hidden="true">
                        ✓
                      </span>
                      <span>
                        <strong>Correct answer:</strong> <Html html={a.right.html} as="span" />
                      </span>
                    </p>
                    <Html html={a.question.explanation} className="quiz-why" />
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    );
  }

  const isLast = index + 1 >= total;
  const lastCorrect = answers[answers.length - 1]?.correct === true;
  return (
    <div className="quiz">
      <div className="quiz-column">
        <header className="quiz-top">
          <button
            type="button"
            className="quiz-close"
            aria-label="Close and go back to the map"
            onClick={onExit}
          >
            <span aria-hidden="true">✕</span>
          </button>
          <div
            className="quiz-progress"
            role="progressbar"
            aria-label={`${block.meta.title}, question ${index + 1} of ${total}`}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={index + 1}
          >
            {drawn.map((d, i) => (
              <span
                key={d.question.id}
                className={i < index ? 'is-done' : i === index ? 'is-current' : undefined}
              />
            ))}
          </div>
          <p className="quiz-count">
            {index + 1} of {total}
          </p>
        </header>

        <h1 className="sr-only">{block.meta.title}</h1>
        <div className="quiz-body">
          <div ref={questionRef} id="quiz-question" className="quiz-question" tabIndex={-1}>
            <Html html={current.question.text} />
          </div>
          <div role="radiogroup" aria-labelledby="quiz-question" className="quiz-options">
            {current.options.map((option, i) => {
              const picked = selected === i;
              let state = '';
              if (checked && option.correct) state = ' is-right';
              else if (checked && picked) state = ' is-wrong';
              else if (picked) state = ' is-selected';
              return (
                <button
                  key={`${current.question.id}-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={picked}
                  aria-keyshortcuts={optionKey(i)}
                  className={`quiz-option${state}`}
                  onClick={() => {
                    if (!checked) setSelected(i);
                  }}
                >
                  <span className="option-key" aria-hidden="true">
                    {optionKey(i)}
                  </span>
                  <Html html={option.html} as="span" className="option-text" />
                  {checked && option.correct && (
                    <>
                      <span className="option-mark" aria-hidden="true">
                        ✓
                      </span>
                      <span className="sr-only">Correct answer</span>
                    </>
                  )}
                  {checked && picked && !option.correct && (
                    <>
                      <span className="option-mark" aria-hidden="true">
                        ✗
                      </span>
                      <span className="sr-only">Your answer, not correct</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {checked ? (
          <div
            ref={sheetRef}
            className={lastCorrect ? 'quiz-sheet is-right' : 'quiz-sheet is-wrong'}
            role="region"
            aria-labelledby="quiz-sheet-title"
            tabIndex={-1}
          >
            <div className="quiz-sheet-inner">
              <h2 id="quiz-sheet-title">{lastCorrect ? 'Correct' : 'Not quite'}</h2>
              <Html html={current.question.explanation} className="quiz-sheet-body" />
              <button type="button" className="btn btn-primary" onClick={next}>
                {isLast ? 'See your score' : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          <div className="quiz-bar">
            <div className="quiz-bar-inner">
              <button
                type="button"
                className="btn btn-primary"
                disabled={selected === null}
                onClick={check}
              >
                Check
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
