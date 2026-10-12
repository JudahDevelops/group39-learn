import { useId } from 'react';
import type { Option } from '../content/schema';
import { letterFor, optionMark } from '../players/lesson/grade';
import { CheckIcon, CrossIcon } from './Icons';
import { Html } from './Html';

/**
 * The option rows of mcq, predict, spotbug and multi. Each row is a real radio button or checkbox, so
 * arrow keys, Space and screen readers work. The letters A, B, C and D (or 1, 2, 3, 4) pick rows too;
 * the lesson player listens for those keys.
 */
export function OptionList({
  options,
  mode,
  selected,
  checked,
  onPick,
  labelledBy,
}: {
  options: readonly Option[];
  mode: 'single' | 'multi';
  selected: readonly number[];
  checked: boolean;
  onPick: (index: number) => void;
  labelledBy: string;
}) {
  const group = useId();
  return (
    <div
      role={mode === 'single' ? 'radiogroup' : 'group'}
      aria-labelledby={labelledBy}
      className="options"
    >
      {options.map((option, i) => {
        const picked = selected.includes(i);
        const mark = optionMark(option, picked, checked);
        const markId = `${group}-mark-${i}`;
        const state = mark ? ` option-${mark}` : picked ? ' option-picked' : '';
        return (
          <label key={i} className={`option${state}`}>
            <input
              type={mode === 'single' ? 'radio' : 'checkbox'}
              name={group}
              checked={picked}
              disabled={checked}
              aria-keyshortcuts={`${letterFor(i)} ${i + 1}`}
              aria-describedby={mark ? markId : undefined}
              onChange={() => onPick(i)}
            />
            <span className="option-key" aria-hidden="true">
              {letterFor(i)}
            </span>
            <Html as="span" html={option.html} className="option-text" />
            {mark && (
              // Hidden from the name computation; the radio reads it as its description instead.
              <span id={markId} className="option-mark" aria-hidden="true">
                {mark === 'right' ? <CheckIcon /> : <CrossIcon />}
                <span className="sr-only">{mark === 'right' ? 'Correct' : 'Not correct'}</span>
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
