import { ChecklistScreen } from './ChecklistScreen';
import { ConceptScreen } from './ConceptScreen';
import { FlashcardScreen } from './FlashcardScreen';
import { MatchScreen } from './MatchScreen';
import { McqScreen } from './McqScreen';
import { MultiScreen } from './MultiScreen';
import { OrderScreen } from './OrderScreen';
import { PredictScreen } from './PredictScreen';
import { SpotbugScreen } from './SpotbugScreen';
import { TapbuildScreen } from './TapbuildScreen';
import { TypeinScreen, type RunnerStatus } from './TypeinScreen';
import { WidgetScreen } from './WidgetScreen';
import type { Screen } from '../content/schema';
import type { Answer } from './types';

/** Picks the component for a screen's type. An answer of the wrong kind (it can only be mid-switch) renders nothing. */
export function ScreenView({
  screen,
  answer,
  onAnswer,
  checked,
  runnerStatus,
  attempt,
  onWidgetResult,
}: {
  screen: Screen;
  answer: Answer;
  onAnswer: (next: Answer) => void;
  checked: boolean;
  runnerStatus: RunnerStatus;
  /** Counts "Try again" presses, so a widget remounts. */
  attempt: number;
  onWidgetResult: (correct?: boolean, note?: string) => void;
}) {
  switch (screen.type) {
    case 'concept':
      return <ConceptScreen screen={screen} />;
    case 'mcq':
      return answer.kind === 'choice' ? (
        <McqScreen screen={screen} answer={answer} onAnswer={onAnswer} checked={checked} />
      ) : null;
    case 'predict':
      return answer.kind === 'choice' ? (
        <PredictScreen screen={screen} answer={answer} onAnswer={onAnswer} checked={checked} />
      ) : null;
    case 'spotbug':
      return answer.kind === 'choice' ? (
        <SpotbugScreen screen={screen} answer={answer} onAnswer={onAnswer} checked={checked} />
      ) : null;
    case 'multi':
      return answer.kind === 'multi' ? (
        <MultiScreen screen={screen} answer={answer} onAnswer={onAnswer} checked={checked} />
      ) : null;
    case 'tapbuild':
      return answer.kind === 'tapbuild' ? (
        <TapbuildScreen screen={screen} answer={answer} onAnswer={onAnswer} checked={checked} />
      ) : null;
    case 'typein':
      return answer.kind === 'typein' ? (
        <TypeinScreen
          screen={screen}
          answer={answer}
          onAnswer={onAnswer}
          checked={checked}
          runnerStatus={runnerStatus}
        />
      ) : null;
    case 'order':
      return answer.kind === 'order' ? (
        <OrderScreen screen={screen} answer={answer} onAnswer={onAnswer} checked={checked} />
      ) : null;
    case 'match':
      return answer.kind === 'match' ? (
        <MatchScreen screen={screen} answer={answer} onAnswer={onAnswer} checked={checked} />
      ) : null;
    case 'widget':
      return <WidgetScreen screen={screen} attempt={attempt} onResult={onWidgetResult} />;
    case 'flashcard':
      return answer.kind === 'flashcard' ? (
        <FlashcardScreen screen={screen} revealed={answer.revealed} />
      ) : null;
    case 'checklist':
      return answer.kind === 'checklist' ? (
        <ChecklistScreen screen={screen} answer={answer} onAnswer={onAnswer} />
      ) : null;
  }
}
