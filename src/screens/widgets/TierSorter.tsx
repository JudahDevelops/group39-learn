import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { shuffle } from '../../players/quiz/draw';
import '../../styles/widgets.css';
import { CheckIcon, CrossIcon } from '../Icons';
import type { WidgetProps } from './index';
import {
  allPlaced,
  emptyPlacement,
  parseSorterProps,
  placeCard,
  scorePlacement,
  type SortResult,
} from './sorter';

/** A click made with the keyboard (Enter or Space) has no pointer position, so `detail` is 0. */
const byKeyboard = (event: MouseEvent) => event.detail === 0;

/**
 * Tap a card, then tap the tier it belongs to. Cards can be moved again until Check. Everything is a
 * button, so Tab, Enter and Space do the whole job. After a card is picked by keyboard, focus moves to the
 * tiers; after it is placed, focus goes to the next card, or to Check when none is left.
 */
export function TierSorter({ props, onResult }: WidgetProps) {
  const { tiers, cards } = useMemo(() => parseSorterProps(props), [props]);
  // A fresh order for every mount, so the cards do not arrive grouped by tier.
  const order = useMemo(() => shuffle(cards.map((_, i) => i)), [cards]);

  const [placement, setPlacement] = useState(() => emptyPlacement(cards.length));
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<SortResult | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const tierButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const cardButtons = useRef<Map<number, HTMLButtonElement>>(new Map());
  const checkButton = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<'tiers' | 'cards' | null>(null);

  const checked = result !== null;
  const unplaced = order.filter((card) => placement[card] === null);
  const placedCount = cards.length - unplaced.length;

  useEffect(() => {
    const want = focusNext.current;
    if (!want) return;
    focusNext.current = null;
    if (want === 'tiers') {
      tierButtons.current[0]?.focus();
      return;
    }
    const next = order.find((card) => placement[card] === null);
    (next === undefined ? checkButton.current : cardButtons.current.get(next))?.focus();
  }, [selected, placement, order]);

  function pickCard(card: number, event: MouseEvent) {
    if (checked) return;
    if (selected === card) {
      setSelected(null);
      return;
    }
    setSelected(card);
    setAnnouncement(`${cards[card].text} selected. Now choose its tier.`);
    if (byKeyboard(event)) focusNext.current = 'tiers';
  }

  function pickTier(tier: number, event: MouseEvent) {
    if (checked || selected === null) return;
    const card = selected;
    setPlacement(placeCard(placement, card, tier, tiers.length));
    setSelected(null);
    setAnnouncement(`${cards[card].text} placed in ${tiers[tier]}.`);
    if (byKeyboard(event)) focusNext.current = 'cards';
  }

  function check() {
    if (checked || !allPlaced(placement)) return;
    const scored = scorePlacement(cards, placement);
    setResult(scored);
    setSelected(null);
    onResult(scored.correct, scored.correct ? undefined : scored.note);
  }

  function cardButton(card: number) {
    const mark = result ? result.marks[card] : null;
    return (
      <li key={card}>
        <button
          type="button"
          ref={(element) => {
            if (element) cardButtons.current.set(card, element);
            else cardButtons.current.delete(card);
          }}
          className={`w-card${selected === card ? ' w-card-selected' : ''}${
            mark === null ? '' : mark ? ' w-card-right' : ' w-card-wrong'
          }`}
          aria-pressed={selected === card}
          disabled={checked}
          onClick={(event) => pickCard(card, event)}
        >
          <span className="w-card-text">{cards[card].text}</span>
          {mark !== null && (
            <span className="w-mark">
              {mark ? <CheckIcon /> : <CrossIcon />}
              <span className="sr-only">{mark ? 'Right tier' : 'Wrong tier'}</span>
            </span>
          )}
        </button>
      </li>
    );
  }

  return (
    <div className="w-sorter">
      <p className="meta">Tap a card, then tap the tier it belongs to.</p>

      <section className="w-group" aria-labelledby="w-sorter-cards">
        <h3 id="w-sorter-cards" className="w-heading">
          Cards to place
        </h3>
        {unplaced.length > 0 ? (
          <ul className="w-list">{unplaced.map(cardButton)}</ul>
        ) : (
          <p className="meta">Every card is in a tier.</p>
        )}
      </section>

      <ul className="w-list w-tiers">
        {tiers.map((tier, t) => {
          const here = order.filter((card) => placement[card] === t);
          return (
            <li key={tier} className="w-bucket">
              <button
                type="button"
                ref={(element) => {
                  tierButtons.current[t] = element;
                }}
                className="w-bucket-head"
                disabled={checked || selected === null}
                aria-label={selected === null ? tier : `Place ${cards[selected].text} in ${tier}`}
                onClick={(event) => pickTier(t, event)}
              >
                <span className="w-tier-name">{tier}</span>
                <span className="w-hint" aria-hidden="true">
                  {selected === null ? '' : 'Place here'}
                </span>
              </button>
              {here.length > 0 && <ul className="w-list w-placed">{here.map(cardButton)}</ul>}
            </li>
          );
        })}
      </ul>

      <p className="sr-only" role="status">
        {announcement}
      </p>

      <div className="w-actions">
        <p className="meta w-count">
          {placedCount} of {cards.length} placed
        </p>
        <button
          ref={checkButton}
          type="button"
          className="btn btn-primary"
          disabled={checked || !allPlaced(placement)}
          onClick={check}
        >
          Check
        </button>
      </div>
    </div>
  );
}

TierSorter.scored = true;
