import { ChoiceScreen } from './ChoiceScreen';
import type { ScreenProps } from './types';

/** "What will it show?" The code comes first, then the question. */
export function PredictScreen({
  screen,
  answer,
  onAnswer,
  checked,
}: ScreenProps<'predict', 'choice'>) {
  return (
    <ChoiceScreen
      question={screen.question}
      code={screen.code}
      options={screen.options}
      answer={answer}
      onAnswer={onAnswer}
      checked={checked}
    />
  );
}
