/**
 * Scoring and editing for the tier sorter (lessons 3.2 and 3.3): every card belongs to one tier, the
 * learner places each card in a tier, and Check says how many are in the right one. All pure, so the
 * unit tests cover it without rendering anything.
 */
import { asList, asObject, asText, asTextList, plural } from './props';

export interface SorterCard {
  text: string;
  /** Index into `tiers` of the tier this card belongs to. */
  tier: number;
}

export interface SorterProps {
  tiers: string[];
  cards: SorterCard[];
}

/** `placement[card]` is the tier the learner put the card in, or null while it is unplaced. */
export type Placement = (number | null)[];

/** Reads the props of the `tier-sorter` widget, or throws. A card names its tier by the tier's name. */
export function parseSorterProps(raw: unknown): SorterProps {
  const props = asObject(raw, 'props');
  const tiers = asTextList(props.tiers, 'tiers', { min: 2, max: 6 });
  const cards = asList(props.cards, 'cards', { min: 2, max: 20 }).map((item, i): SorterCard => {
    const card = asObject(item, `cards[${i}]`);
    const text = asText(card.text, `cards[${i}].text`);
    const name = asText(card.tier, `cards[${i}].tier`);
    const tier = tiers.indexOf(name);
    if (tier === -1) throw new Error(`cards[${i}].tier "${name}" is not one of the tiers`);
    return { text, tier };
  });
  if (new Set(cards.map((c) => c.text)).size !== cards.length) {
    throw new Error('cards must not repeat a text');
  }
  return { tiers, cards };
}

export function emptyPlacement(cardCount: number): Placement {
  return Array.from({ length: cardCount }, () => null);
}

/** Put `card` in `tier`, moving it if it was somewhere else. Out-of-range numbers change nothing. */
export function placeCard(
  placement: Placement,
  card: number,
  tier: number,
  tierCount: number,
): Placement {
  if (card < 0 || card >= placement.length || tier < 0 || tier >= tierCount) return placement;
  if (placement[card] === tier) return placement;
  const next = placement.slice();
  next[card] = tier;
  return next;
}

export function allPlaced(placement: Placement): boolean {
  return placement.every((tier) => tier !== null);
}

export interface SortResult {
  /** Per card: true when it is in the right tier. */
  marks: boolean[];
  right: number;
  total: number;
  correct: boolean;
  note: string;
}

/** "2 of 5 cards are in the right tier." */
export function sorterNote(right: number, total: number): string {
  const verb = right === 1 || total === 1 ? 'is' : 'are';
  return `${right} of ${plural(total, 'card')} ${verb} in the right tier.`;
}

export function scorePlacement(cards: readonly SorterCard[], placement: Placement): SortResult {
  const marks = cards.map((card, i) => placement[i] === card.tier);
  const right = marks.filter(Boolean).length;
  const total = cards.length;
  return { marks, right, total, correct: right === total, note: sorterNote(right, total) };
}
