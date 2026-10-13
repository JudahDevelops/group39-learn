import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { completeItem } from '../../lib/progress';
import { getRunner as defaultGetRunner } from '../../runners';
import type { GetRunner } from '../../runners/types';
import { pickOption } from '../../screens/answers';
import { ScreenView } from '../../screens/ScreenView';
import type { Answer } from '../../screens/types';
import { isScored } from '../../screens/widgets';
import { useStore } from '../../store/StoreContext';
import type { LessonFeedbackRating } from '../../store/types';
import '../../styles/lesson.css';
import type { PlayerProps } from '../types';
import { ActionBar, type BarMode } from './ActionBar';
import { EndCard, type SaveState } from './EndCard';
import { FeedbackSheet } from './FeedbackSheet';
import {
  accuracyOf,
  canCheck,
  checklistDone,
  correctTitle,
  escapeHtml,
  gradeAnswer,
  gradeTypein,
  initialAnswer,
  retryAnswer,
  xpReasons,
  type Accuracy,
  type Outcome,
  type Verdict,
} from './grade';
import { ProgressBar } from './ProgressBar';
import { useRunner } from './useRunner';

type Phase = 'answering' | 'checking' | 'right' | 'wrong';

interface Sheet {
  correct: boolean;
  title: string;
  /** HTML. */
  feedback?: string;
}

/** `getRunner` is for tests, which pass a fake. The app uses the real one. */
export interface LessonPlayerProps extends PlayerProps<'lesson'> {
  getRunner?: GetRunner;
}

/** Letters A to F and digits 1 to 6 pick the option at that position. */
function optionIndexForKey(key: string): number {
  if (/^[a-f]$/i.test(key)) return key.toLowerCase().charCodeAt(0) - 97;
  if (/^[1-6]$/.test(key)) return Number(key) - 1;
  return -1;
}

/**
 * One screen at a time in a 640 px column: close, segmented progress and combo on top, the screen in the
 * middle, and a sticky bar at the bottom that holds Check or Continue. After Check the feedback sheet
 * takes the bar's place. Accuracy counts graded screens right on the first try; the end card awards XP
 * through completeItem and asks how the lesson felt.
 */
export function LessonPlayer({ block, onExit, getRunner = defaultGetRunner }: LessonPlayerProps) {
  const store = useStore();
  const screens = block.lesson.screens;

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>(() => initialAnswer(screens[0]));
  const [phase, setPhase] = useState<Phase>('answering');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  /** Counts "Try again" presses on this screen, so a widget starts fresh. */
  const [attempt, setAttempt] = useState(0);
  const [widgetDone, setWidgetDone] = useState(false);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  /** Whether the first Check on this screen was right. Null until the screen has been graded. */
  const [firstTry, setFirstTry] = useState<boolean | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  const [done, setDone] = useState<Accuracy | null>(null);
  const [save, setSave] = useState<SaveState>({ status: 'saving' });
  const [rating, setRating] = useState<LessonFeedbackRating | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackError, setFeedbackError] = useState(false);

  const phaseRef = useRef<Phase>('answering');
  const feedbackSent = useRef(false);
  const leaving = useRef(false);
  const section = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const movedOn = useRef(false);

  const screen = screens[index];
  const runner = useRunner(screen.type === 'typein' ? block.meta.runner : null, getRunner);

  function setPhaseNow(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  // A new screen starts at the top, with focus on it so screen readers read it out.
  useEffect(() => {
    if (!movedOn.current) {
      movedOn.current = true;
      return;
    }
    section.current?.focus({ preventScroll: true });
    top.current?.scrollIntoView?.({ block: 'start' });
  }, [index, done]);

  // --- grading ------------------------------------------------------------------------------

  function resolve(verdict: Verdict) {
    phaseRef.current = verdict.correct ? 'right' : 'wrong';
    setPhase(phaseRef.current);
    setSheet({
      correct: verdict.correct,
      title: verdict.correct ? correctTitle(correctCount) : 'Not quite',
      feedback: verdict.feedback,
    });
    setFirstTry((previous) => previous ?? verdict.correct);
    setCombo((count) => (verdict.correct ? count + 1 : 0));
    if (verdict.correct) setCorrectCount((count) => count + 1);
  }

  async function check() {
    if (phaseRef.current !== 'answering' || !canCheck(screen, answer)) return;
    setPhaseNow('checking');
    let verdict: Verdict | null = null;
    if (screen.type === 'typein') {
      if (answer.kind === 'typein' && runner.runner) {
        verdict = await gradeTypein(screen, answer.text, runner.runner);
      }
    } else {
      verdict = gradeAnswer(screen, answer);
    }
    if (verdict) resolve(verdict);
    else setPhaseNow('answering');
  }

  function retry() {
    setAnswer(retryAnswer(answer));
    setSheet(null);
    setAttempt((count) => count + 1);
    setWidgetDone(false);
    setPhaseNow('answering');
  }

  /** A widget reports in: nothing to score, or right or wrong with an optional plain-text note. */
  function onWidgetResult(correct?: boolean, note?: string) {
    if (phaseRef.current !== 'answering') return;
    if (correct === undefined) {
      setWidgetDone(true);
      return;
    }
    resolve({ correct, feedback: note ? escapeHtml(note) : undefined });
  }

  // --- moving on -------------------------------------------------------------------------------

  function advance() {
    const all = [...outcomes, { graded: firstTry !== null, firstTry: firstTry === true }];
    setOutcomes(all);
    if (index + 1 >= screens.length) {
      const accuracy = accuracyOf(all);
      setDone(accuracy);
      setSheet(null);
      setPhaseNow('answering');
      void saveProgress(accuracy);
      return;
    }
    const next = screens[index + 1];
    setIndex(index + 1);
    setAnswer(initialAnswer(next));
    setSheet(null);
    setAttempt(0);
    setWidgetDone(false);
    setFirstTry(null);
    setPhaseNow('answering');
  }

  async function saveProgress(accuracy: Accuracy) {
    setSave({ status: 'saving' });
    try {
      const gained = await completeItem(
        store,
        block.meta.id,
        block.meta.id,
        xpReasons(accuracy.ratio),
      );
      setSave({ status: 'done', gained });
    } catch {
      setSave({ status: 'error' });
    }
  }

  async function leave() {
    if (leaving.current) return;
    leaving.current = true;
    if (rating && !feedbackSent.current) {
      try {
        await store.recordLessonFeedback(block.meta.id, rating, comment.trim() || undefined);
        feedbackSent.current = true;
      } catch {
        // Say so once. A second Continue leaves anyway: feedback must never trap the learner.
        if (!feedbackError) {
          setFeedbackError(true);
          leaving.current = false;
          return;
        }
      }
    }
    onExit();
  }

  function reveal() {
    setAnswer({ kind: 'flashcard', revealed: true });
  }

  // --- what the bottom bar offers -------------------------------------------------------------

  function barMode(): BarMode {
    switch (screen.type) {
      case 'concept':
        return { kind: 'continue', disabled: false };
      case 'flashcard':
        return answer.kind === 'flashcard' && answer.revealed
          ? { kind: 'rate' }
          : { kind: 'reveal' };
      case 'checklist':
        return {
          kind: 'continue',
          disabled: !(answer.kind === 'checklist' && checklistDone(screen, answer)),
        };
      case 'widget': {
        // A scored widget has its own Check and reports a result: the feedback sheet then takes the bar's
        // place. Until then no Continue competes with it.
        if (isScored(screen.name, screen.props) && !widgetDone) return { kind: 'none' };
        return { kind: 'continue', disabled: false };
      }
      case 'typein':
        // Without a runner nothing can be checked, so the learner may carry on.
        if (runner.status === 'missing') return { kind: 'continue', disabled: false };
        return {
          kind: 'check',
          label: 'Check your code',
          disabled: phase === 'checking' || runner.status !== 'ready' || !canCheck(screen, answer),
        };
      default:
        return {
          kind: 'check',
          label: 'Check',
          disabled: phase === 'checking' || !canCheck(screen, answer),
        };
    }
  }

  /** What Enter does right now, or null when it should do nothing. */
  function primaryAction(): (() => void) | null {
    if (done) return save.status === 'saving' ? null : () => void leave();
    if (phase === 'checking') return null;
    if (phase === 'right') return advance;
    if (phase === 'wrong') return retry;
    const mode = barMode();
    switch (mode.kind) {
      case 'check':
        return mode.disabled ? null : () => void check();
      case 'continue':
        return mode.disabled ? null : advance;
      case 'reveal':
        return reveal;
      case 'rate':
      case 'none':
        return null;
    }
  }

  // --- keyboard ---------------------------------------------------------------------------------

  // Subscribed on every render so the handler always sees the current state. A layout effect, so a
  // key pressed right after the screen appears is never lost to a still-pending passive effect.
  useLayoutEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.altKey) return;
      const element = event.target instanceof HTMLElement ? event.target : null;
      const tag = element?.tagName;
      const inputType = element instanceof HTMLInputElement ? element.type : '';
      const typing =
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (tag === 'INPUT' && inputType !== 'checkbox' && inputType !== 'radio') ||
        element?.isContentEditable === true;
      const modified = event.ctrlKey || event.metaKey;

      if (event.key === 'Enter') {
        // Plain Enter types a new line in a code box; Ctrl+Enter (or Cmd+Enter) checks.
        if (typing ? !modified : modified || event.shiftKey) return;
        // A focused button or link does its own thing on Enter.
        if (!typing && (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) return;
        const action = primaryAction();
        if (!action) return;
        event.preventDefault();
        action();
        return;
      }

      if (typing || modified || phase !== 'answering') return;
      if (
        screen.type === 'mcq' ||
        screen.type === 'predict' ||
        screen.type === 'spotbug' ||
        screen.type === 'multi'
      ) {
        const option = optionIndexForKey(event.key);
        if (option < 0) return;
        const next = pickOption(answer, option, screen.options.length);
        if (next !== answer) {
          event.preventDefault();
          setAnswer(next);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // --- render ---------------------------------------------------------------------------------------

  const checked = phase === 'right' || phase === 'wrong';
  const why = 'why' in screen ? screen.why : undefined;

  return (
    <div className="lesson">
      <h1 className="sr-only">{block.meta.title}</h1>
      <div ref={top} className="lesson-top-anchor">
        <ProgressBar
          total={screens.length}
          current={done ? screens.length : index}
          combo={combo}
          onExit={onExit}
        />
      </div>
      <section
        ref={section}
        className="lesson-main"
        tabIndex={-1}
        aria-label={done ? 'Lesson done' : `Screen ${index + 1} of ${screens.length}`}
      >
        {done ? (
          <EndCard
            screens={screens.length}
            accuracy={done}
            save={save}
            onSaveAgain={() => void saveProgress(done)}
            rating={rating}
            onRating={setRating}
            comment={comment}
            onComment={setComment}
            feedbackError={feedbackError}
          />
        ) : (
          <ScreenView
            key={index}
            screen={screen}
            answer={answer}
            onAnswer={setAnswer}
            checked={checked}
            runnerStatus={runner.status}
            attempt={attempt}
            onWidgetResult={onWidgetResult}
          />
        )}
      </section>

      {done ? (
        <ActionBar
          mode={{ kind: 'continue', disabled: save.status === 'saving' }}
          onCheck={() => undefined}
          onContinue={() => void leave()}
          onReveal={() => undefined}
        />
      ) : sheet ? (
        <FeedbackSheet
          correct={sheet.correct}
          title={sheet.title}
          feedback={sheet.feedback}
          why={why}
          onContinue={advance}
          onRetry={retry}
        />
      ) : (
        <ActionBar
          mode={barMode()}
          onCheck={() => void check()}
          onContinue={advance}
          onReveal={reveal}
        />
      )}
    </div>
  );
}
