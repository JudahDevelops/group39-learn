import { useEffect, useRef, useState } from 'react';
import { orderMarks } from '../players/lesson/grade';
import { moveItem } from './answers';
import { CheckIcon, CrossIcon, DownIcon, UpIcon } from './Icons';
import { Html, plainText } from './Html';
import { Question } from './Question';
import type { ScreenProps } from './types';

type Direction = 'up' | 'down';

/**
 * A shuffled list the learner puts in order with an up and a down button on each row. The buttons
 * are the keyboard route (Tab, then Enter or Space), and focus follows the row that moved.
 */
export function OrderScreen({ screen, answer, onAnswer, checked }: ScreenProps<'order', 'order'>) {
  const list = useRef<HTMLOListElement>(null);
  const moved = useRef<{ item: number; direction: Direction } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const marks = checked ? orderMarks(answer.sequence) : [];
  const count = answer.sequence.length;

  // Moving a row re-inserts it in the DOM, which can drop focus. Put it back on the same row.
  useEffect(() => {
    const target = moved.current;
    if (!target || !list.current) return;
    moved.current = null;
    const find = (direction: Direction) =>
      list.current?.querySelector<HTMLButtonElement>(
        `button[data-item="${target.item}"][data-direction="${direction}"]:not(:disabled)`,
      );
    (find(target.direction) ?? find(target.direction === 'up' ? 'down' : 'up'))?.focus();
  }, [answer.sequence]);

  function move(position: number, direction: Direction) {
    const item = answer.sequence[position];
    const next = moveItem(answer, position, direction === 'up' ? -1 : 1);
    if (next === answer) return;
    moved.current = { item, direction };
    setAnnouncement(
      `${plainText(screen.items[item])} moved to position ${position + (direction === 'up' ? 0 : 2)} of ${count}.`,
    );
    onAnswer(next);
  }

  return (
    <div className="screen">
      <Question html={screen.prompt} />
      <ol className="order-list" ref={list}>
        {answer.sequence.map((item, position) => {
          const mark = marks[position];
          const name = plainText(screen.items[item]);
          return (
            <li key={item} className={`order-row${mark ? ` order-${mark}` : ''}`}>
              <span className="option-key" aria-hidden="true">
                {position + 1}
              </span>
              <Html as="span" html={screen.items[item]} className="order-text" />
              {mark && (
                <span className="option-mark">
                  {mark === 'right' ? <CheckIcon /> : <CrossIcon />}
                  <span className="sr-only">
                    {mark === 'right' ? 'Right place' : 'Wrong place'}
                  </span>
                </span>
              )}
              <span className="order-moves">
                <button
                  type="button"
                  className="icon-btn"
                  data-item={item}
                  data-direction="up"
                  aria-label={`Move up: ${name}`}
                  disabled={checked || position === 0}
                  onClick={() => move(position, 'up')}
                >
                  <UpIcon />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  data-item={item}
                  data-direction="down"
                  aria-label={`Move down: ${name}`}
                  disabled={checked || position === count - 1}
                  onClick={() => move(position, 'down')}
                >
                  <DownIcon />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
