/** How the lesson player treats widget screens: a scored widget holds Continue back and keeps `why` for after the result. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Screen } from '../../src/content/schema';
import { LessonPlayer } from '../../src/players/lesson/LessonPlayer';
import type { BlockOf } from '../../src/players/types';
import { LocalStore } from '../../src/store/LocalStore';
import { StoreProvider } from '../../src/store/StoreContext';

const SORTER = {
  tiers: ['Client', 'Logic'],
  cards: [
    { text: 'Student Portal', tier: 'Client' },
    { text: 'Room Allocation', tier: 'Logic' },
  ],
};

const widget = (name: string, props: Record<string, unknown>, why?: string): Screen => ({
  type: 'widget',
  name,
  props,
  prompt: '<p>Try it.</p>',
  why: why ? `<p>${why}</p>` : undefined,
});

function lesson(screens: Screen[]): BlockOf<'lesson'> {
  return {
    type: 'lesson',
    roomCode: 'Z2-01',
    meta: {
      id: 'tst00002',
      slug: 'test-widgets',
      type: 'lesson',
      title: 'Test widgets',
      runner: 'none',
      estMinutes: 5,
    },
    lesson: { id: 'tst00002', screens },
  };
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

async function renderLesson(screens: Screen[]) {
  const store = new LocalStore();
  await store.signIn('ada@example.com', 'pw');
  render(
    <StoreProvider store={store}>
      <LessonPlayer
        block={lesson(screens)}
        itemId="tst00002"
        onExit={vi.fn()}
        onNavigate={() => undefined}
      />
    </StoreProvider>,
  );
}

const button = (name: string) => screen.queryByRole('button', { name });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('scored widget (tier-sorter)', () => {
  it('shows no Continue until a result, and keeps why for after it', async () => {
    await renderLesson([widget('tier-sorter', SORTER, 'Because tiers.')]);
    await screen.findByRole('button', { name: 'Check' });
    expect(button('Continue')).toBeNull();
    expect(screen.queryByText('Because tiers.')).toBeNull();

    // Wrong first: the sheet offers Try again, and still no Continue.
    click('Student Portal');
    click('Place Student Portal in Logic');
    click('Room Allocation');
    click('Place Room Allocation in Client');
    click('Check');
    expect(await screen.findByRole('heading', { name: 'Not quite' })).toBeInTheDocument();
    expect(screen.getByText('0 of 2 cards are in the right tier.')).toBeInTheDocument();
    expect(button('Continue')).toBeNull();
    click('Try again');
    expect(button('Continue')).toBeNull();
    expect(screen.queryByText('Because tiers.')).toBeNull();

    // Then right: the sheet has Continue and the Why? button.
    click('Student Portal');
    click('Place Student Portal in Client');
    click('Room Allocation');
    click('Place Room Allocation in Logic');
    click('Check');
    await screen.findByRole('heading', { name: /^(Correct|That's it|Spot on)$/ });
    expect(button('Continue')).toBeInTheDocument();
    click('Why?');
    expect(screen.getByText('Because tiers.')).toBeVisible();
  });

  it('props it cannot read still let the learner go on', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderLesson([widget('tier-sorter', {})]);
    expect(await screen.findByText('This interactive part could not load.')).toBeInTheDocument();
    expect(button('Continue')).toBeEnabled();
    quiet.mockRestore();
  });
});

describe('escalation-slider', () => {
  const explorer = { deadlineHours: 72, maxHours: 216 };

  it('as an explorer it has Continue from the start and shows why under it', async () => {
    await renderLesson([widget('escalation-slider', explorer, 'Because levels.')]);
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(screen.getByText('Because levels.')).toBeVisible();
    expect(button('Check')).toBeNull();
  });

  it('with a target it is scored: no Continue, no why, then Not quite and Correct', async () => {
    await renderLesson([
      widget('escalation-slider', { ...explorer, target: 1 }, 'Because levels.'),
    ]);
    const slider = await screen.findByRole('slider');
    expect(button('Continue')).toBeNull();
    expect(screen.queryByText('Because levels.')).toBeNull();

    fireEvent.change(slider, { target: { value: '60' } });
    click('Check');
    expect(await screen.findByRole('heading', { name: 'Not quite' })).toBeInTheDocument();
    expect(button('Continue')).toBeNull();
    click('Try again');

    fireEvent.change(await screen.findByRole('slider'), { target: { value: '72' } });
    click('Check');
    await screen.findByRole('heading', { name: /^(Correct|That's it|Spot on)$/ });
    expect(button('Continue')).toBeInTheDocument();
    click('Why?');
    expect(screen.getByText('Because levels.')).toBeVisible();
  });
});

describe('unscored widget (request-response)', () => {
  it('has Continue from the start', async () => {
    await renderLesson([
      widget('request-response', {
        request: { method: 'GET', path: '/api/rooms' },
        response: { status: 200, statusText: 'OK', body: { rooms: 3 } },
        stops: [
          { label: 'Send', tier: 'Browser' },
          { label: 'Build', tier: 'Server' },
          { label: 'Show', tier: 'Browser' },
        ],
      }),
    ]);
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeEnabled();
  });
});
