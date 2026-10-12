import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Option, Screen } from '../../src/content/schema';
import { LessonPlayer } from '../../src/players/lesson/LessonPlayer';
import { RUNNER_MISSING_TEXT } from '../../src/screens/TypeinScreen';
import type { BlockOf } from '../../src/players/types';
import type { GetRunner, RunOutput, Runner } from '../../src/runners/types';
import { LocalStore } from '../../src/store/LocalStore';
import { StoreProvider } from '../../src/store/StoreContext';

const BLOCK_ID = 'tst00001';

const option = (html: string, correct: boolean): Option => ({
  html,
  correct,
  feedback: correct ? `Yes, ${html}.` : `No, ${html} is not it.`,
});

/** A question whose right answer is always A. */
const mcq = (name: string): Screen => ({
  type: 'mcq',
  question: `<p>Question ${name}</p>`,
  options: [option('right', true), option('wrong', false), option('also wrong', false)],
  why: `<p>Because ${name}.</p>`,
});

const typein: Screen = {
  type: 'typein',
  prompt: '<p>Add a paragraph.</p>',
  seed: [
    {
      name: 'index.html',
      lang: 'html',
      contents: '<body>\n\n</body>',
      editable: { start: 1, end: 2 },
    },
  ],
  solutions: [{ name: 'index.html', lang: 'html', contents: '<body>\n<p>Hi</p>\n</body>' }],
  tests: [{ text: 'Your page needs a <code>p</code> element.', code: 'assert.exists(1)' }],
  why: '<p>A paragraph is a p element.</p>',
};

function lessonBlock(screens: Screen[], runner: 'web' | 'none' = 'web'): BlockOf<'lesson'> {
  return {
    type: 'lesson',
    roomCode: 'Z1-01',
    meta: {
      id: BLOCK_ID,
      slug: 'test-lesson',
      type: 'lesson',
      title: 'Test lesson',
      runner,
      estMinutes: 5,
    },
    lesson: { id: BLOCK_ID, screens },
  };
}

let store: LocalStore;

beforeEach(async () => {
  localStorage.clear();
  store = new LocalStore();
  await store.signIn('ada@example.com', 'pw');
});

afterEach(() => cleanup());

function renderLesson(
  screens: Screen[],
  options: { getRunner?: GetRunner; onExit?: () => void; runner?: 'web' | 'none' } = {},
) {
  const onExit = options.onExit ?? vi.fn();
  render(
    <StoreProvider store={store}>
      <LessonPlayer
        block={lessonBlock(screens, options.runner)}
        itemId={BLOCK_ID}
        onExit={onExit}
        onNavigate={() => undefined}
        getRunner={options.getRunner}
      />
    </StoreProvider>,
  );
  return { onExit };
}

const click = (name: string | RegExp, role: 'button' | 'radio' = 'button') =>
  fireEvent.click(screen.getByRole(role, { name }));

async function pickAndCheck(optionName: string) {
  click(optionName, 'radio');
  click('Check');
  // The feedback sheet has replaced the bottom bar once Continue or Try again is on screen.
  await screen.findByRole('button', { name: /^(Continue|Try again)$/ });
}

describe('choice screens', () => {
  it('Check stays disabled until an option is picked', async () => {
    renderLesson([mcq('1')]);
    const check = await screen.findByRole('button', { name: 'Check' });
    expect(check).toBeDisabled();
    click('wrong', 'radio');
    expect(check).toBeEnabled();
  });

  it('a wrong answer shows that option’s note and Try again clears the pick', async () => {
    renderLesson([mcq('1')]);
    await screen.findByText('Question 1');
    await pickAndCheck('wrong');
    expect(screen.getByRole('heading', { name: 'Not quite' })).toBeInTheDocument();
    expect(screen.getByText('No, wrong is not it.')).toBeInTheDocument();
    // The chosen row is marked wrong with a hidden label, not by colour alone.
    expect(screen.getByRole('radio', { name: 'wrong' })).toHaveAccessibleDescription('Not correct');
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();

    click('Try again');
    expect(screen.getByRole('radio', { name: 'wrong' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();

    await pickAndCheck('right');
    expect(screen.getByRole('heading', { name: 'Correct' })).toBeInTheDocument();
    expect(screen.getByText('Yes, right.')).toBeInTheDocument();
  });

  it('“Why?” opens the longer explanation', async () => {
    renderLesson([mcq('1')]);
    await screen.findByText('Question 1');
    await pickAndCheck('right');
    const why = screen.getByRole('button', { name: 'Why?' });
    expect(why).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Because 1.')).not.toBeVisible();
    fireEvent.click(why);
    expect(why).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Because 1.')).toBeVisible();
  });

  it('rotates the correct titles', async () => {
    renderLesson([mcq('1'), mcq('2'), mcq('3'), mcq('4')]);
    const titles: string[] = [];
    for (const n of ['1', '2', '3']) {
      await screen.findByText(`Question ${n}`);
      await pickAndCheck('right');
      titles.push(
        screen.getByRole('heading', { name: /^(Correct|That's it|Spot on)$/ }).textContent ?? '',
      );
      click('Continue');
    }
    expect(titles).toEqual(['Correct', "That's it", 'Spot on']);
  });
});

describe('combo counter', () => {
  it('shows from three in a row, and a wrong answer resets it without comment', async () => {
    renderLesson([mcq('1'), mcq('2'), mcq('3'), mcq('4'), mcq('5'), mcq('6')]);
    for (const n of ['1', '2']) {
      await screen.findByText(`Question ${n}`);
      await pickAndCheck('right');
      click('Continue');
      expect(screen.queryByText(/in a row/)).toBeNull();
    }
    await screen.findByText('Question 3');
    await pickAndCheck('right');
    expect(screen.getByText('3 in a row')).toBeInTheDocument();
    click('Continue');

    await screen.findByText('Question 4');
    await pickAndCheck('wrong');
    expect(screen.queryByText(/in a row/)).toBeNull();
    click('Try again');
    await pickAndCheck('right');
    // Right again, but the run starts over from one.
    expect(screen.queryByText(/in a row/)).toBeNull();
    click('Continue');

    for (const n of ['5', '6']) {
      await screen.findByText(`Question ${n}`);
      await pickAndCheck('right');
      click('Continue');
    }
    // Not shown on the end card: the count is 3 here.
    expect(screen.getByText('3 in a row')).toBeInTheDocument();
  });
});

describe('keyboard', () => {
  it('letters and digits pick options, and Enter checks and continues', async () => {
    renderLesson([mcq('1'), mcq('2')]);
    await screen.findByText('Question 1');
    fireEvent.keyDown(document.body, { key: 'b' });
    expect(screen.getByRole('radio', { name: 'wrong' })).toBeChecked();
    fireEvent.keyDown(document.body, { key: '1' });
    expect(screen.getByRole('radio', { name: 'right' })).toBeChecked();
    fireEvent.keyDown(document.body, { key: 'Enter' });
    await screen.findByRole('heading', { name: 'Correct' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    await screen.findByText('Question 2');
    // A key for an option that is not there does nothing.
    fireEvent.keyDown(document.body, { key: 'f' });
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  });

  it('Enter on a wrong answer is Try again', async () => {
    renderLesson([mcq('1')]);
    await screen.findByText('Question 1');
    fireEvent.keyDown(document.body, { key: 'c' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    await screen.findByRole('heading', { name: 'Not quite' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  });

  it('Enter is left alone while a button has focus, so one press does not act twice', async () => {
    renderLesson([mcq('1')]);
    await screen.findByText('Question 1');
    click('right', 'radio');
    const check = screen.getByRole('button', { name: 'Check' });
    fireEvent.keyDown(check, { key: 'Enter' });
    expect(screen.queryByRole('heading', { name: 'Correct' })).toBeNull();
  });
});

describe('typein with a fake runner', () => {
  const failing: RunOutput = {
    results: [{ ok: false, message: 'Your page needs a <code>p</code> element.' }],
    firstFailure: 0,
    logs: [],
  };
  const passing: RunOutput = {
    results: [{ ok: true, message: 'Your page needs a <code>p</code> element.' }],
    firstFailure: null,
    logs: [],
  };

  /** Fails unless the learner’s code contains a p element. */
  function fakeRunner() {
    const calls: Record<string, string>[] = [];
    const runner: Runner = {
      run: async (files) => {
        calls.push(files);
        return files['index.html'].includes('<p>') ? passing : failing;
      },
    };
    const getRunner = vi.fn<GetRunner>(async () => runner);
    return { calls, getRunner };
  }

  const type = (text: string) =>
    fireEvent.change(screen.getByRole('textbox', { name: 'Your code' }), {
      target: { value: text },
    });

  it('checks through the runner: not quite with the failing test’s message, then correct', async () => {
    const { calls, getRunner } = fakeRunner();
    renderLesson([typein], { getRunner });

    const check = await screen.findByRole('button', { name: 'Check your code' });
    await waitFor(() => expect(document.querySelector('[data-runner="ready"]')).not.toBeNull());
    expect(getRunner).toHaveBeenCalledWith('web');
    // Nothing typed yet.
    expect(check).toBeDisabled();

    type('Hello');
    expect(check).toBeEnabled();
    fireEvent.click(check);

    await screen.findByRole('heading', { name: 'Not quite' });
    // The message is HTML from the content build, so its code tag renders.
    const sheet = screen.getByRole('region', { name: 'Not quite' });
    expect(within(sheet).getByText('p', { selector: 'code' })).toBeInTheDocument();
    expect(sheet).toHaveTextContent('Your page needs a p element.');
    // The runner got the whole file with the learner’s lines in the editable region.
    expect(calls[0]).toEqual({ 'index.html': '<body>\nHello\n</body>' });
    // The text is still there to fix.
    click('Try again');
    expect(screen.getByRole('textbox', { name: 'Your code' })).toHaveValue('Hello');

    type('<p>Hi</p>');
    fireEvent.click(screen.getByRole('button', { name: 'Check your code' }));
    await screen.findByRole('heading', { name: 'Correct' });
    expect(calls).toHaveLength(2);

    click('Continue');
    await screen.findByRole('heading', { name: 'Lesson done' });
    // Wrong on the first try: 0 of 1.
    expect(screen.getByText('0% accuracy, 0 of 1 right on the first try')).toBeInTheDocument();
  });

  it('Ctrl+Enter checks from inside the code box, and plain Enter does not', async () => {
    const { getRunner } = fakeRunner();
    renderLesson([typein], { getRunner });
    await waitFor(() => expect(document.querySelector('[data-runner="ready"]')).not.toBeNull());
    type('<p>Hi</p>');
    const box = screen.getByRole('textbox', { name: 'Your code' });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(screen.queryByRole('heading', { name: 'Correct' })).toBeNull();
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    await screen.findByRole('heading', { name: 'Correct' });
  });

  it('reports a runner error as plain text', async () => {
    const getRunner: GetRunner = async () => ({
      run: async () => ({
        results: [],
        firstFailure: null,
        logs: [],
        error: 'SyntaxError: <oops>',
      }),
    });
    renderLesson([typein], { getRunner });
    await waitFor(() => expect(document.querySelector('[data-runner="ready"]')).not.toBeNull());
    type('<p');
    fireEvent.click(screen.getByRole('button', { name: 'Check your code' }));
    await screen.findByRole('heading', { name: 'Not quite' });
    expect(screen.getByText('Your code could not run: SyntaxError: <oops>')).toBeInTheDocument();
  });

  it('while the runner is missing, says so and lets the learner continue, ungraded', async () => {
    const getRunner: GetRunner = async () => {
      throw new Error('The web runner is not built yet.');
    };
    renderLesson([typein, mcq('1')], { getRunner });

    expect(await screen.findByText(RUNNER_MISSING_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check your code' })).toBeNull();
    click('Continue');

    await screen.findByText('Question 1');
    await pickAndCheck('right');
    click('Continue');
    await screen.findByRole('heading', { name: 'Lesson done' });
    // Only the question counts: the exercise that could not be checked is not graded.
    expect(screen.getByText('100% accuracy, 1 of 1 right on the first try')).toBeInTheDocument();
  });

  it('treats a block with no runner as missing', async () => {
    const getRunner = vi.fn<GetRunner>();
    renderLesson([typein], { getRunner, runner: 'none' });
    expect(await screen.findByText(RUNNER_MISSING_TEXT)).toBeInTheDocument();
    expect(getRunner).not.toHaveBeenCalled();
  });
});

describe('ungraded screens', () => {
  it('flashcards show the answer, then rate it, with no sheet and no XP effect', async () => {
    renderLesson([
      {
        type: 'flashcard',
        question: '<p>Name the parts.</p>',
        answer: '<p>Open, content, close.</p>',
      },
    ]);
    await screen.findByText('Name the parts.');
    expect(screen.queryByText('Open, content, close.')).toBeNull();
    click('Show answer');
    expect(screen.getByText('Open, content, close.')).toBeInTheDocument();
    for (const name of ['Missed', 'Shaky', 'Got it']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    click('Got it');
    await screen.findByRole('heading', { name: 'Lesson done' });
    // Nothing was graded, so there is no accuracy line and no perfect bonus.
    expect(screen.queryByText(/accuracy/)).toBeNull();
    await screen.findByText('10 XP earned');
  });

  it('an unregistered widget says it is not available, and Continue is there', async () => {
    renderLesson([
      {
        type: 'widget',
        name: 'no-such-widget',
        props: {},
        prompt: '<p>Slide it.</p>',
        why: '<p>Because.</p>',
      },
    ]);
    expect(
      await screen.findByText('This interactive part is not available yet.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('a checklist item with a check ticks only once the pasted output matches', async () => {
    renderLesson([
      {
        type: 'checklist',
        items: [
          {
            html: 'Install Python',
            check: { command: 'python --version', pattern: '^Python 3\\.1[1-3]', hint: 'Too old.' },
          },
          { html: 'Make a folder' },
        ],
      },
    ]);
    const next = await screen.findByRole('button', { name: 'Continue' });
    expect(next).toBeDisabled();

    const python = screen.getByRole('checkbox', { name: 'Install Python' });
    fireEvent.click(python);
    expect(python).not.toBeChecked();
    expect(screen.getByRole('alert')).toHaveTextContent('Too old.');

    fireEvent.change(screen.getByLabelText('Paste what it prints'), {
      target: { value: 'Python 3.12.4' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(python);
    expect(python).toBeChecked();
    expect(next).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Make a folder' }));
    expect(next).toBeEnabled();
  });
});

describe('end card', () => {
  async function playPerfect(screens: Screen[]) {
    for (const [i, s] of screens.entries()) {
      if (s.type !== 'mcq') throw new Error('test setup: mcq only');
      await screen.findByText(`Question ${i + 1}`);
      await pickAndCheck('right');
      click('Continue');
    }
  }

  it('awards XP once, and a repeat says it was done earlier instead of 0 XP', async () => {
    const screens = [mcq('1'), mcq('2')];

    // First run: one wrong answer first, so 10 XP and no bonus.
    const first = renderLesson(screens);
    await screen.findByText('Question 1');
    await pickAndCheck('wrong');
    click('Try again');
    await pickAndCheck('right');
    click('Continue');
    await screen.findByText('Question 2');
    await pickAndCheck('right');
    click('Continue');

    await screen.findByRole('heading', { name: 'Lesson done' });
    expect(screen.getByText('2 screens')).toBeInTheDocument();
    expect(await screen.findByText('10 XP earned')).toBeInTheDocument();
    expect(screen.getByText('50% accuracy, 1 of 2 right on the first try')).toBeInTheDocument();
    click('Continue');
    expect(first.onExit).toHaveBeenCalledTimes(1);
    cleanup();

    // Second run, another wrong answer: nothing new to award.
    renderLesson(screens);
    await screen.findByText('Question 1');
    await pickAndCheck('wrong');
    click('Try again');
    await pickAndCheck('right');
    click('Continue');
    await screen.findByText('Question 2');
    await pickAndCheck('right');
    click('Continue');
    expect(await screen.findByText('Already done earlier')).toBeInTheDocument();
    expect(screen.queryByText(/0 XP/)).toBeNull();
    cleanup();

    // A perfect run now earns only the bonus that is still unclaimed.
    renderLesson(screens);
    await playPerfect(screens);
    expect(await screen.findByText('5 XP earned')).toBeInTheDocument();
    expect(screen.getByText('100% accuracy, 2 of 2 right on the first try')).toBeInTheDocument();
  });

  it('a perfect first run earns the lesson and the bonus together', async () => {
    const screens = [mcq('1')];
    renderLesson(screens);
    await playPerfect(screens);
    expect(await screen.findByText('15 XP earned')).toBeInTheDocument();
  });

  it('records the pulse rating and comment, then leaves', async () => {
    const record = vi.spyOn(store, 'recordLessonFeedback');
    const { onExit } = renderLesson([mcq('1')]);
    await playPerfect([mcq('1')]);
    await screen.findByText('15 XP earned');

    // The comment box appears once a rating is chosen.
    expect(screen.queryByLabelText(/Anything to add/)).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Too hard' }));
    fireEvent.change(screen.getByLabelText(/Anything to add/), {
      target: { value: '  Slow start  ' },
    });
    click('Continue');
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
    expect(record).toHaveBeenCalledWith(BLOCK_ID, 'too_hard', 'Slow start');
  });

  it('leaves without recording anything when no rating was chosen', async () => {
    const record = vi.spyOn(store, 'recordLessonFeedback');
    const { onExit } = renderLesson([mcq('1')]);
    await playPerfect([mcq('1')]);
    await screen.findByText('15 XP earned');
    click('Continue');
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
    expect(record).not.toHaveBeenCalled();
  });

  it('never traps the learner: a failed feedback save is reported once, then Continue leaves', async () => {
    vi.spyOn(store, 'recordLessonFeedback').mockRejectedValue(new Error('offline'));
    const { onExit } = renderLesson([mcq('1')]);
    await playPerfect([mcq('1')]);
    await screen.findByText('15 XP earned');
    fireEvent.click(screen.getByRole('radio', { name: 'Just right' }));
    click('Continue');
    await screen.findByText(/Your feedback could not be saved/);
    expect(onExit).not.toHaveBeenCalled();
    click('Continue');
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
  });

  it('the close button leaves at once', async () => {
    const { onExit } = renderLesson([mcq('1')]);
    await screen.findByText('Question 1');
    click('Exit lesson');
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
