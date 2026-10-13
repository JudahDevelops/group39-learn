/** The tier sorter's props, placement edits and scoring (lessons 3.2 and 3.3). */
import { describe, expect, it } from 'vitest';
import {
  allPlaced,
  emptyPlacement,
  parseSorterProps,
  placeCard,
  scorePlacement,
  sorterNote,
  type SorterCard,
} from '../../src/screens/widgets/sorter';

const TIERS = ['Client', 'Logic', 'Data', 'Output'];
const CARDS = [
  { text: 'Student Portal', tier: 'Client' },
  { text: 'Room Allocation', tier: 'Logic' },
  { text: 'Complaint history and audit log', tier: 'Data' },
  { text: 'Email Notification Service', tier: 'Output' },
  { text: 'Staff Dashboard', tier: 'Client' },
];

describe('parseSorterProps', () => {
  it('turns each card tier name into an index', () => {
    const { tiers, cards } = parseSorterProps({ tiers: TIERS, cards: CARDS });
    expect(tiers).toEqual(TIERS);
    expect(cards.map((c) => c.tier)).toEqual([0, 1, 2, 3, 0]);
    expect(cards[0].text).toBe('Student Portal');
  });

  it.each([
    ['not an object', null],
    ['no tiers', { cards: CARDS }],
    ['one tier', { tiers: ['Client'], cards: CARDS }],
    ['a repeated tier', { tiers: ['Client', 'Client'], cards: CARDS }],
    ['an empty tier name', { tiers: ['Client', ''], cards: CARDS }],
    ['no cards', { tiers: TIERS }],
    ['one card', { tiers: TIERS, cards: [CARDS[0]] }],
    [
      'a card with a tier that is not listed',
      { tiers: TIERS, cards: [...CARDS, { text: 'x', tier: 'Cloud' }] },
    ],
    ['a card with no text', { tiers: TIERS, cards: [...CARDS, { tier: 'Data' }] }],
    ['a card that is not an object', { tiers: TIERS, cards: [...CARDS, 'Reporting'] }],
    ['a tier given as a number', { tiers: TIERS, cards: [...CARDS, { text: 'x', tier: 1 }] }],
    ['two cards with the same text', { tiers: TIERS, cards: [CARDS[0], CARDS[0]] }],
  ])('throws for %s', (_what, bad) => {
    expect(() => parseSorterProps(bad)).toThrow();
  });
});

describe('placement', () => {
  it('starts empty and is complete once every card has a tier', () => {
    let placement = emptyPlacement(3);
    expect(placement).toEqual([null, null, null]);
    expect(allPlaced(placement)).toBe(false);
    placement = placeCard(placement, 0, 1, 4);
    placement = placeCard(placement, 1, 0, 4);
    expect(allPlaced(placement)).toBe(false);
    placement = placeCard(placement, 2, 3, 4);
    expect(placement).toEqual([1, 0, 3]);
    expect(allPlaced(placement)).toBe(true);
  });

  it('moves a card that is placed again, and leaves the old array alone', () => {
    const before = placeCard(emptyPlacement(2), 0, 1, 4);
    const after = placeCard(before, 0, 2, 4);
    expect(before).toEqual([1, null]);
    expect(after).toEqual([2, null]);
  });

  it('ignores a card or tier that does not exist, and a move to the same tier', () => {
    const placement = placeCard(emptyPlacement(2), 0, 1, 4);
    expect(placeCard(placement, 5, 1, 4)).toBe(placement);
    expect(placeCard(placement, -1, 1, 4)).toBe(placement);
    expect(placeCard(placement, 0, 4, 4)).toBe(placement);
    expect(placeCard(placement, 0, -1, 4)).toBe(placement);
    expect(placeCard(placement, 0, 1, 4)).toBe(placement);
  });
});

describe('scorePlacement', () => {
  const cards: SorterCard[] = parseSorterProps({ tiers: TIERS, cards: CARDS }).cards;

  it('is correct only when every card is in its own tier', () => {
    const result = scorePlacement(cards, [0, 1, 2, 3, 0]);
    expect(result.correct).toBe(true);
    expect(result.right).toBe(5);
    expect(result.marks).toEqual([true, true, true, true, true]);
    expect(result.note).toBe('5 of 5 cards are in the right tier.');
  });

  it('counts the cards in the right tier and marks each one', () => {
    const result = scorePlacement(cards, [0, 1, 0, 0, 3]);
    expect(result.correct).toBe(false);
    expect(result.right).toBe(2);
    expect(result.total).toBe(5);
    expect(result.marks).toEqual([true, true, false, false, false]);
    expect(result.note).toBe('2 of 5 cards are in the right tier.');
  });

  it('counts a card that is not placed as wrong', () => {
    const result = scorePlacement(cards, [0, null, null, null, null]);
    expect(result.right).toBe(1);
    expect(result.marks).toEqual([true, false, false, false, false]);
  });
});

describe('sorterNote', () => {
  it('agrees in number', () => {
    expect(sorterNote(2, 5)).toBe('2 of 5 cards are in the right tier.');
    expect(sorterNote(1, 5)).toBe('1 of 5 cards is in the right tier.');
    expect(sorterNote(0, 5)).toBe('0 of 5 cards are in the right tier.');
    expect(sorterNote(0, 1)).toBe('0 of 1 card is in the right tier.');
  });
});
