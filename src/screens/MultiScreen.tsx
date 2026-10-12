import { useId } from 'react';
import { OptionList } from './OptionList';
import { Question } from './Question';
import { pickOption } from './answers';
import type { ScreenProps } from './types';

export function MultiScreen({ screen, answer, onAnswer, checked }: ScreenProps<'multi', 'multi'>) {
  const questionId = useId();
  return (
    <div className="screen">
      <Question id={questionId} html={screen.question} />
      <p className="meta">Select all that apply.</p>
      <OptionList
        options={screen.options}
        mode="multi"
        selected={answer.selected}
        checked={checked}
        labelledBy={questionId}
        onPick={(i) => {
          const next = pickOption(answer, i, screen.options.length);
          if (next.kind === 'multi') onAnswer(next);
        }}
      />
    </div>
  );
}
