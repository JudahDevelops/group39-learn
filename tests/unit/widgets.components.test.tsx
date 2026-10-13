/** The four widgets as components: they render from JSON props, report through onResult, and fail loudly on bad props. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WIDGET_FAILED_TEXT, WidgetScreen } from '../../src/screens/WidgetScreen';
import { DataFlowTracer } from '../../src/screens/widgets/DataFlowTracer';
import { EscalationSlider } from '../../src/screens/widgets/EscalationSlider';
import { RequestResponse } from '../../src/screens/widgets/RequestResponse';
import { TierSorter } from '../../src/screens/widgets/TierSorter';
import { getWidget, widgets } from '../../src/screens/widgets';

afterEach(() => cleanup());

const SORTER = {
  tiers: ['Client', 'Logic', 'Data', 'Output'],
  cards: [
    { text: 'Student Portal', tier: 'Client' },
    { text: 'Room Allocation', tier: 'Logic' },
    { text: 'Complaint history and audit log', tier: 'Data' },
    { text: 'Email Notification Service', tier: 'Output' },
    { text: 'Staff Dashboard', tier: 'Client' },
  ],
};

const TRACER = {
  title: 'F2 Complaint triage',
  tiers: ['Client', 'Logic', 'Data', 'Output'],
  steps: [
    { text: 'Amina presses Submit in the Student Portal.', tier: 'Client' },
    { text: 'Complaint Management finds her room.', tier: 'Logic' },
    { text: 'The engine sets the urgency.', tier: 'Logic' },
    { text: 'The complaint is saved in PostgreSQL.', tier: 'Data' },
    { text: 'The maintenance officer is emailed.', tier: 'Output' },
    { text: 'Amina sees the deadline.', tier: 'Client' },
  ],
};

const EXCHANGE = {
  request: {
    method: 'POST',
    path: '/api/complaints',
    body: { description: 'Water is pouring from the ceiling near the light' },
  },
  response: {
    status: 201,
    statusText: 'Created',
    body: { id: 482, category: 'plumbing', urgency: 'urgent', status: 'Open' },
  },
  stops: [
    { label: 'The browser sends the request.', tier: 'Browser' },
    { label: 'The server applies the rules.', tier: 'Server' },
    { label: 'The database stores the complaint.', tier: 'Database' },
    { label: 'The server builds the response.', tier: 'Server' },
    { label: 'The browser shows the response.', tier: 'Browser' },
  ],
};

const button = (name: string | RegExp) => screen.getByRole('button', { name });

describe('registry', () => {
  it('registers the four widgets, and only the sorter and tracer hold Continue back', () => {
    expect(Object.keys(widgets).sort()).toEqual([
      'data-flow-tracer',
      'escalation-slider',
      'request-response',
      'tier-sorter',
    ]);
    expect(getWidget('tier-sorter')?.scored).toBe(true);
    expect(getWidget('data-flow-tracer')?.scored).toBe(true);
    expect(getWidget('request-response')?.scored).toBeFalsy();
    expect(getWidget('escalation-slider')?.scored).toBeFalsy();
  });
});

describe('TierSorter', () => {
  function place(card: string, tier: string) {
    fireEvent.click(button(card));
    fireEvent.click(button(`Place ${card} in ${tier}`));
  }

  it('Check waits until every card has a tier', () => {
    render(<TierSorter props={SORTER} onResult={vi.fn()} />);
    expect(button('Check')).toBeDisabled();
    place('Student Portal', 'Client');
    place('Room Allocation', 'Logic');
    expect(screen.getByText('2 of 5 placed')).toBeInTheDocument();
    expect(button('Check')).toBeDisabled();
  });

  it('reports "2 of 5 cards are in the right tier." when only two are right', () => {
    const onResult = vi.fn();
    render(<TierSorter props={SORTER} onResult={onResult} />);
    place('Student Portal', 'Client');
    place('Room Allocation', 'Logic');
    place('Complaint history and audit log', 'Output');
    place('Email Notification Service', 'Client');
    place('Staff Dashboard', 'Data');
    fireEvent.click(button('Check'));
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(false, '2 of 5 cards are in the right tier.');
    // The result is final: cards and Check no longer take taps.
    expect(button('Check')).toBeDisabled();
    expect(screen.getAllByText('Wrong tier', { selector: '.sr-only' })).toHaveLength(3);
    expect(screen.getAllByText('Right tier', { selector: '.sr-only' })).toHaveLength(2);
  });

  it('reports correct, with no note, when every card is in its tier', () => {
    const onResult = vi.fn();
    render(<TierSorter props={SORTER} onResult={onResult} />);
    for (const card of SORTER.cards) place(card.text, card.tier);
    fireEvent.click(button('Check'));
    expect(onResult).toHaveBeenCalledWith(true, undefined);
  });

  it('a placed card can be picked up and moved to another tier', () => {
    const onResult = vi.fn();
    render(<TierSorter props={SORTER} onResult={onResult} />);
    for (const card of SORTER.cards) place(card.text, card.tier);
    place('Staff Dashboard', 'Data');
    place('Staff Dashboard', 'Client');
    fireEvent.click(button('Check'));
    expect(onResult).toHaveBeenCalledWith(true, undefined);
  });

  it('works with the keyboard: a picked card sends focus to the tiers, a placed one to the next card', () => {
    render(<TierSorter props={SORTER} onResult={vi.fn()} />);
    fireEvent.click(button('Student Portal'));
    expect(button('Place Student Portal in Client')).toHaveFocus();
    fireEvent.click(button('Place Student Portal in Client'));
    const next = document.activeElement;
    expect(next?.tagName).toBe('BUTTON');
    expect(next).toHaveClass('w-card');
    // Place the rest; focus ends on Check.
    for (const card of SORTER.cards.slice(1)) place(card.text, card.tier);
    expect(button('Check')).toHaveFocus();
  });

  it('shows the placed cards under their tier', () => {
    render(<TierSorter props={SORTER} onResult={vi.fn()} />);
    place('Student Portal', 'Client');
    const buckets = screen
      .getAllByRole('listitem')
      .filter((li) => li.classList.contains('w-bucket'));
    expect(within(buckets[0]).getByRole('button', { name: 'Student Portal' })).toBeInTheDocument();
    expect(within(buckets[1]).queryByRole('button', { name: 'Student Portal' })).toBeNull();
  });
});

describe('DataFlowTracer', () => {
  const tier = (name: string) => button(new RegExp(`^${name}( |$)`));
  const lit = (container: HTMLElement) => container.querySelectorAll('.w-link-lit');

  function walk(picks: string[]) {
    for (const name of picks) fireEvent.click(tier(name));
  }

  it('shows one step at a time and moves on after the right tier', () => {
    render(<DataFlowTracer props={TRACER} onResult={vi.fn()} />);
    expect(screen.getByText('F2 Complaint triage')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    expect(screen.getByText(TRACER.steps[0].text)).toBeInTheDocument();
    expect(screen.queryByText(TRACER.steps[1].text)).toBeNull();
    fireEvent.click(tier('Client'));
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    expect(screen.getByText(TRACER.steps[1].text)).toBeInTheDocument();
  });

  it('a wrong tier is marked and explained, and the step stays open', () => {
    const onResult = vi.fn();
    render(<DataFlowTracer props={TRACER} onResult={onResult} />);
    fireEvent.click(tier('Data'));
    expect(
      screen.getByText('Data is not right for this step. Pick another tier.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    expect(tier('Data')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(tier('Client'));
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('lights the arrows a move crosses, in the direction of the move', () => {
    const { container } = render(<DataFlowTracer props={TRACER} onResult={vi.fn()} />);
    walk(['Client']);
    expect(lit(container)).toHaveLength(0);
    walk(['Logic']);
    expect(lit(container)).toHaveLength(1);
    expect(container.querySelectorAll('.w-dot-down')).toHaveLength(1);
    walk(['Logic']); // stays in the logic tier
    expect(lit(container)).toHaveLength(0);
    walk(['Data', 'Output']);
    expect(lit(container)).toHaveLength(1);
    walk(['Client']); // Output back up to Client crosses three gaps
    expect(lit(container)).toHaveLength(3);
    expect(container.querySelectorAll('.w-dot-up')).toHaveLength(3);
  });

  it('reports correct after a clean walk, only when Check is pressed', () => {
    const onResult = vi.fn();
    render(<DataFlowTracer props={TRACER} onResult={onResult} />);
    walk(['Client', 'Logic', 'Logic', 'Data', 'Output', 'Client']);
    expect(onResult).not.toHaveBeenCalled();
    expect(
      screen.getByText('That is the whole flow. Press Check to see how you did.'),
    ).toBeInTheDocument();
    expect(button('Check')).toHaveFocus();
    fireEvent.click(button('Check'));
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true, undefined);
    expect(button('Check')).toBeDisabled();
  });

  it('counts wrong picks: one slip makes the result not quite, with a note', () => {
    const onResult = vi.fn();
    render(<DataFlowTracer props={TRACER} onResult={onResult} />);
    walk(['Output', 'Client', 'Logic', 'Logic', 'Data', 'Output', 'Client']);
    fireEvent.click(button('Check'));
    expect(onResult).toHaveBeenCalledWith(false, 'You picked a wrong tier once, on 1 of 6 steps.');
  });

  it('lists the steps already placed, with their tiers', () => {
    render(<DataFlowTracer props={TRACER} onResult={vi.fn()} />);
    walk(['Client', 'Logic']);
    const trace = screen.getByRole('region', { name: 'Your trace' });
    const items = within(trace).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(TRACER.steps[0].text);
    expect(items[0]).toHaveTextContent('Client');
    expect(items[1]).toHaveTextContent('Logic');
  });
});

describe('RequestResponse', () => {
  it('steps forward and back through the stops, and never reports a result', () => {
    const onResult = vi.fn();
    render(<RequestResponse props={EXCHANGE} onResult={onResult} />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('The browser sends the request.')).toBeInTheDocument();
    expect(button('Back')).toBeDisabled();
    fireEvent.click(button('Next'));
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(button('Back')).toBeEnabled();
    fireEvent.click(button('Back'));
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    for (let i = 0; i < 4; i += 1) fireEvent.click(button('Next'));
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
    expect(button('Next')).toBeDisabled();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('shows the request in the code style from the start and the response once it is built', () => {
    render(<RequestResponse props={EXCHANGE} onResult={vi.fn()} />);
    const request = screen.getByLabelText('Request');
    expect(request.tagName).toBe('PRE');
    expect(request).toHaveTextContent('POST /api/complaints');
    expect(request).toHaveTextContent(
      '"description": "Water is pouring from the ceiling near the light"',
    );
    expect(screen.queryByLabelText('Response')).toBeNull();
    expect(
      screen.getByText('The response appears once the server has built it.'),
    ).toBeInTheDocument();

    fireEvent.click(button('Next'));
    fireEvent.click(button('Next')); // the database: still the request
    expect(screen.queryByLabelText('Response')).toBeNull();
    fireEvent.click(button('Next')); // the server builds the response
    const response = screen.getByLabelText('Response');
    expect(response).toHaveTextContent('201 Created');
    expect(response).toHaveTextContent('"category": "plumbing"');
    fireEvent.click(button('Back'));
    expect(screen.queryByLabelText('Response')).toBeNull();
  });

  it('marks the box the request is in, and lights the arrow it just crossed', () => {
    const { container } = render(<RequestResponse props={EXCHANGE} onResult={vi.fn()} />);
    const here = () => container.querySelector('[aria-current="step"]');
    expect(here()).toHaveTextContent('Browser');
    expect(container.querySelectorAll('.w-link-lit')).toHaveLength(0);
    fireEvent.click(button('Next'));
    expect(here()).toHaveTextContent('Server');
    expect(container.querySelectorAll('.w-dot-down')).toHaveLength(1);
    fireEvent.click(button('Next'));
    fireEvent.click(button('Next'));
    expect(here()).toHaveTextContent('Server');
    expect(container.querySelectorAll('.w-dot-up')).toHaveLength(1);
  });
});

describe('EscalationSlider', () => {
  const slider = () => screen.getByRole('slider');
  const setTime = (hours: number) =>
    fireEvent.change(slider(), { target: { value: String(hours) } });

  it('the explorer shows t, L and who has been emailed as the slider moves', () => {
    const onResult = vi.fn();
    render(<EscalationSlider props={{ deadlineHours: 24, maxHours: 72 }} onResult={onResult} />);
    expect(screen.getByText('Urgent: d = 24 hours, 2d = 48 hours')).toBeInTheDocument();
    expect(screen.getByText('t = 0 hours')).toBeInTheDocument();
    expect(screen.getByText('L = 0')).toBeInTheDocument();
    expect(screen.getByText('Nobody')).toBeInTheDocument();

    setTime(30);
    expect(screen.getByText('t = 30 hours')).toBeInTheDocument();
    expect(screen.getByText('L = 1')).toBeInTheDocument();
    expect(screen.getByText('Hall warden')).toBeInTheDocument();
    expect(screen.getByText('Overdue. The hall warden is emailed.')).toBeInTheDocument();

    setTime(48);
    expect(screen.getByText('L = 2')).toBeInTheDocument();
    expect(screen.getByText('Hall warden and Student Affairs')).toBeInTheDocument();

    // No task, no Check, and nothing is reported.
    expect(screen.queryByRole('button', { name: 'Check' })).toBeNull();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('puts the 7-day deadline in days', () => {
    render(<EscalationSlider props={{ deadlineHours: 168, maxHours: 400 }} onResult={vi.fn()} />);
    expect(
      screen.getByText('Low: d = 7 days (168 hours), 2d = 14 days (336 hours)'),
    ).toBeInTheDocument();
  });

  it('the slider moves one hour at a time, and two buttons nudge it by one hour', () => {
    render(<EscalationSlider props={{ deadlineHours: 24, maxHours: 72 }} onResult={vi.fn()} />);
    expect(slider()).toHaveAttribute('step', '1');
    expect(slider()).toHaveAttribute('max', '72');
    expect(button('1 hour earlier')).toBeDisabled();
    fireEvent.click(button('1 hour later'));
    fireEvent.click(button('1 hour later'));
    expect(screen.getByText('t = 2 hours')).toBeInTheDocument();
    fireEvent.click(button('1 hour earlier'));
    expect(screen.getByText('t = 1 hour')).toBeInTheDocument();
    setTime(72);
    expect(button('1 hour later')).toBeDisabled();
  });

  it('gives the slider a spoken value with the level and who is emailed', () => {
    render(<EscalationSlider props={{ deadlineHours: 24, maxHours: 72 }} onResult={vi.fn()} />);
    setTime(30);
    expect(slider()).toHaveAttribute('aria-valuetext', '30 hours, level 1. Emailed: hall warden.');
  });

  describe('scored mode', () => {
    const scored = { deadlineHours: 72, maxHours: 216, target: 1 };

    it('asks for the first moment the hall warden is emailed', () => {
      render(<EscalationSlider props={scored} onResult={vi.fn()} />);
      expect(
        screen.getByText('Move the slider to the first moment the hall warden is emailed.'),
      ).toBeInTheDocument();
    });

    it('is correct on exactly d, and then locks', () => {
      const onResult = vi.fn();
      render(<EscalationSlider props={scored} onResult={onResult} />);
      setTime(72);
      fireEvent.click(button('Check'));
      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(true, undefined);
      expect(slider()).toBeDisabled();
      expect(button('Check')).toBeDisabled();
    });

    it('is wrong one hour either side, with a note', () => {
      const onResult = vi.fn();
      const { unmount } = render(<EscalationSlider props={scored} onResult={onResult} />);
      setTime(71);
      fireEvent.click(button('Check'));
      expect(onResult).toHaveBeenLastCalledWith(
        false,
        'You stopped at 71 hours, when nobody has been emailed yet. That is before the hall warden is first emailed.',
      );
      unmount();
      render(<EscalationSlider props={scored} onResult={onResult} />);
      setTime(73);
      fireEvent.click(button('Check'));
      expect(onResult.mock.lastCall?.[0]).toBe(false);
    });

    it('asks for Student Affairs when the target is 2', () => {
      const onResult = vi.fn();
      render(<EscalationSlider props={{ ...scored, target: 2 }} onResult={onResult} />);
      expect(
        screen.getByText('Move the slider to the first moment Student Affairs is emailed.'),
      ).toBeInTheDocument();
      setTime(144);
      fireEvent.click(button('Check'));
      expect(onResult).toHaveBeenCalledWith(true, undefined);
    });
  });
});

describe('bad props', () => {
  it.each(['escalation-slider', 'tier-sorter', 'data-flow-tracer', 'request-response'])(
    '%s with props it cannot read shows the failure text and lets the lesson go on',
    (name) => {
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const onResult = vi.fn();
      render(
        <WidgetScreen
          screen={{ type: 'widget', name, props: {} }}
          attempt={0}
          onResult={onResult}
        />,
      );
      expect(screen.getByText(WIDGET_FAILED_TEXT)).toBeInTheDocument();
      // The boundary reports "finished, nothing to score", which enables Continue.
      expect(onResult).toHaveBeenCalledWith();
      quiet.mockRestore();
    },
  );
});
