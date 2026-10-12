import { useState } from 'react';
import { pairMarks } from '../players/lesson/grade';
import { pairOf, pairUp, unpair } from './answers';
import { CheckIcon, CrossIcon } from './Icons';
import { Html, plainText } from './Html';
import { Question } from './Question';
import type { ScreenProps } from './types';

type Side = 'left' | 'right';

/**
 * Two lists to pair up. Tap an item on one side, then an item on the other. A paired item carries the
 * number of its pair; tapping it, or the pair's Undo button below, takes the pair apart.
 */
export function MatchScreen({ screen, answer, onAnswer, checked }: ScreenProps<'match', 'match'>) {
  const [pending, setPending] = useState<{ side: Side; index: number } | null>(null);
  const marks = checked ? pairMarks(answer.pairs) : [];

  function tap(side: Side, index: number) {
    if (checked) return;
    const paired = pairOf(answer.pairs, side, index);
    if (paired !== -1) {
      onAnswer(unpair(answer, paired));
      return;
    }
    if (pending && pending.side !== side) {
      const left = side === 'left' ? index : pending.index;
      const right = side === 'right' ? index : pending.index;
      onAnswer(pairUp(answer, left, right));
      setPending(null);
      return;
    }
    setPending(
      pending && pending.side === side && pending.index === index ? null : { side, index },
    );
  }

  function cell(side: Side, index: number) {
    const html = side === 'left' ? screen.pairs[index].left : screen.pairs[index].right;
    const pairNumber = pairOf(answer.pairs, side, index) + 1;
    const selected = pending?.side === side && pending.index === index;
    return (
      <li key={`${side}-${index}`}>
        <button
          type="button"
          className={`match-cell${selected ? ' match-selected' : ''}${pairNumber ? ' match-paired' : ''}`}
          aria-pressed={selected}
          disabled={checked}
          onClick={() => tap(side, index)}
        >
          {pairNumber > 0 && (
            <span className="match-badge" aria-hidden="true">
              {pairNumber}
            </span>
          )}
          <Html as="span" html={html} className="match-text" />
          {pairNumber > 0 && <span className="sr-only">, pair {pairNumber}. Tap to undo.</span>}
        </button>
      </li>
    );
  }

  return (
    <div className="screen">
      <Question html={screen.prompt} />
      <p className="meta">Tap an item on the left, then its partner on the right.</p>
      <div className="match-grid">
        <ul className="match-col" aria-label="Left side">
          {screen.pairs.map((_, i) => cell('left', i))}
        </ul>
        <ul className="match-col" aria-label="Right side">
          {answer.rightOrder.map((i) => cell('right', i))}
        </ul>
      </div>

      {answer.pairs.length > 0 && (
        <ol className="pair-list" aria-label="Your pairs">
          {answer.pairs.map((pair, position) => {
            const mark = marks[position];
            const leftText = plainText(screen.pairs[pair.left].left);
            return (
              <li key={pair.left} className={`pair-row${mark ? ` pair-${mark}` : ''}`}>
                <span className="match-badge" aria-hidden="true">
                  {position + 1}
                </span>
                <Html as="span" html={screen.pairs[pair.left].left} className="pair-side" />
                <span className="sr-only"> with </span>
                <Html as="span" html={screen.pairs[pair.right].right} className="pair-side" />
                {mark && (
                  <span className="option-mark">
                    {mark === 'right' ? <CheckIcon /> : <CrossIcon />}
                    <span className="sr-only">{mark === 'right' ? 'Correct' : 'Not correct'}</span>
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-text"
                  disabled={checked}
                  aria-label={`Undo pair ${position + 1}: ${leftText}`}
                  onClick={() => onAnswer(unpair(answer, position))}
                >
                  Undo
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
