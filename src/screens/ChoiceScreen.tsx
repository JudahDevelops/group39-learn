import { useId } from 'react';
import type { Option } from '../content/schema';
import { CodeBlock } from './CodeBlock';
import { OptionList } from './OptionList';
import { Question } from './Question';
import { pickOption } from './answers';
import type { Answer, AnswerOf } from './types';

/** What mcq, predict and spotbug have in common: an optional code listing, a question and one pick. */
export function ChoiceScreen({
  question,
  code,
  options,
  answer,
  onAnswer,
  checked,
}: {
  question: string;
  code?: { contents: string; name?: string };
  options: readonly Option[];
  answer: AnswerOf<'choice'>;
  onAnswer: (next: AnswerOf<'choice'>) => void;
  checked: boolean;
}) {
  const questionId = useId();
  const selected = answer.selected === null ? [] : [answer.selected];
  return (
    <div className="screen">
      {code && <CodeBlock contents={code.contents} name={code.name} />}
      <Question id={questionId} html={question} />
      <OptionList
        options={options}
        mode="single"
        selected={selected}
        checked={checked}
        labelledBy={questionId}
        onPick={(i) => {
          const next: Answer = pickOption(answer, i, options.length);
          if (next.kind === 'choice') onAnswer(next);
        }}
      />
    </div>
  );
}
