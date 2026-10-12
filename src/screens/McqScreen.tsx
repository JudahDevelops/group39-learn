import { ChoiceScreen } from './ChoiceScreen';
import type { ScreenProps } from './types';

export function McqScreen({ screen, answer, onAnswer, checked }: ScreenProps<'mcq', 'choice'>) {
  return (
    <ChoiceScreen
      question={screen.question}
      options={screen.options}
      answer={answer}
      onAnswer={onAnswer}
      checked={checked}
    />
  );
}
