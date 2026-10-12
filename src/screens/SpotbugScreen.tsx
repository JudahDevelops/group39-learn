import { ChoiceScreen } from './ChoiceScreen';
import type { ScreenProps } from './types';

/** "What is wrong with this code?" The code comes first, then the question. */
export function SpotbugScreen({
  screen,
  answer,
  onAnswer,
  checked,
}: ScreenProps<'spotbug', 'choice'>) {
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
