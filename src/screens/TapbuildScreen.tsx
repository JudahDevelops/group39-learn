import { Fragment } from 'react';
import { BLANK } from '../content/schema';
import { slotMarks } from '../players/lesson/grade';
import { clearTokens, placeToken, removeSlot, undoToken } from './answers';
import { CheckIcon, CrossIcon } from './Icons';
import { Question } from './Question';
import type { ScreenProps } from './types';

/**
 * A code template with blanks and a bank of tokens. Tapping a token fills the next blank, tapping a
 * filled blank hands its token back. Undo takes back the last token placed and Clear takes them all.
 */
export function TapbuildScreen({
  screen,
  answer,
  onAnswer,
  checked,
}: ScreenProps<'tapbuild', 'tapbuild'>) {
  const parts = screen.template.contents.split(BLANK);
  const marks = checked ? slotMarks(screen, answer.slots) : [];
  const nothingPlaced = answer.order.length === 0;

  return (
    <div className="screen">
      <Question html={screen.prompt} />
      <div
        className="tb-template"
        role="group"
        aria-label={`Code with ${answer.slots.length === 1 ? 'a blank' : 'blanks'}`}
      >
        {parts.map((text, i) => (
          <Fragment key={i}>
            <span>{text}</span>
            {i < answer.slots.length && (
              <TapSlot
                blank={i}
                token={answer.slots[i] === null ? null : screen.tokens[answer.slots[i] as number]}
                mark={marks[i] ?? null}
                disabled={checked}
                onTap={() => onAnswer(removeSlot(answer, i))}
              />
            )}
          </Fragment>
        ))}
      </div>

      <div className="tb-bank" role="group" aria-label="Tokens">
        {screen.tokens.map((token, i) => {
          const used = answer.slots.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={used ? 'tb-token tb-token-used' : 'tb-token'}
              disabled={used || checked}
              aria-label={used ? `${token}, already placed` : undefined}
              onClick={() => onAnswer(placeToken(answer, i))}
            >
              {token}
            </button>
          );
        })}
      </div>

      <div className="tb-actions">
        <button
          type="button"
          className="btn btn-text"
          disabled={nothingPlaced || checked}
          onClick={() => onAnswer(undoToken(answer))}
        >
          Undo
        </button>
        <button
          type="button"
          className="btn btn-text"
          disabled={nothingPlaced || checked}
          onClick={() => onAnswer(clearTokens(answer))}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function TapSlot({
  blank,
  token,
  mark,
  disabled,
  onTap,
}: {
  blank: number;
  token: string | null;
  mark: 'right' | 'wrong' | null;
  disabled: boolean;
  onTap: () => void;
}) {
  const filled = token !== null;
  const name = filled
    ? `Blank ${blank + 1}, ${token}. Tap to take it back.`
    : `Blank ${blank + 1}, empty`;
  const state = mark ? ` tb-slot-${mark}` : '';
  return (
    <button
      type="button"
      className={`tb-slot${filled ? ' tb-slot-filled' : ''}${state}`}
      aria-label={name}
      disabled={disabled || !filled}
      onClick={onTap}
    >
      {mark === 'right' && <CheckIcon size={16} />}
      {mark === 'wrong' && <CrossIcon size={16} />}
      <span>{filled ? token : ''}</span>
    </button>
  );
}
