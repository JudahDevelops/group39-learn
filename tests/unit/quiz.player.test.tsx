import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlockOf } from '../../src/players/types';
import { QuizPlayer } from '../../src/players/quiz/QuizPlayer';
import { StoreProvider } from '../../src/store/StoreContext';
import { LocalStore } from '../../src/store/LocalStore';
import type { QuizAttempt } from '../../src/store/types';

type QuizBlock = BlockOf<'quiz'> | BlockOf<'exam'>;

const QUESTIONS = ['One', 'Two', 'Three'].map((word, i) => ({
  id: `qqqq000${i}`,
  text: `<p>Question ${word}?</p>`,
  distractors: [`wrong ${word} 1`, `wrong ${word} 2`, `wrong ${word} 3`],
  answer: `right ${word}`,
  explanation: `<p>Because of ${word}.</p>`,
}));

function block(type: 'quiz' | 'exam', pass = 2): QuizBlock {
  return {
    type,
    roomCode: 'B1-01',
    meta: { id: 'blk00001', slug: 'a-quiz', type, title: 'A quiz', runner: 'none', estMinutes: 5 },
    quiz: { id: 'blk00001', draw: 2, pass, questions: QUESTIONS },
  };
}

let store: LocalStore;
const onExit = vi.fn();

async function open(b: QuizBlock) {
  render(
    <StoreProvider store={store}>
      <QuizPlayer block={b} itemId={b.meta.id} onExit={onExit} onNavigate={() => undefined} />
    </StoreProvider>,
  );
  await screen.findByRole('radiogroup');
}

/** The word in the question on screen: "One", "Two" or "Three". */
function currentWord(): string {
  const text = document.getElementById('quiz-question')?.textContent ?? '';
  return /Question (\w+)\?/.exec(text)![1];
}

function pick(correct: boolean) {
  const word = currentWord();
  const name = correct ? `right ${word}` : `wrong ${word} 1`;
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(name) }));
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
}

function playAll(answers: boolean[]) {
  answers.forEach((correct, i) => {
    pick(correct);
    fireEvent.click(
      screen.getByRole('button', {
        name: i === answers.length - 1 ? 'See your score' : 'Continue',
      }),
    );
  });
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  onExit.mockClear();
  store = new LocalStore();
  await store.init();
  await store.signIn('ada@example.com', 'pw');
});

afterEach(cleanup);

describe('QuizPlayer', () => {
  it('shows one question at a time with shuffled, lettered options', async () => {
    await open(block('quiz'));
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(4);
    expect(options.map((o) => o.getAttribute('aria-keyshortcuts'))).toEqual(['A', 'B', 'C', 'D']);
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  });

  it('A to D keys pick an option, then Check shows the explanation', async () => {
    await open(block('quiz'));
    fireEvent.keyDown(window, { key: 'b' });
    const options = screen.getAllByRole('radio');
    expect(options[1]).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(window, { key: 'Enter' });
    const sheet = screen.getByRole('region');
    expect(within(sheet).getByRole('heading').textContent).toMatch(/^(Correct|Not quite)$/);
    expect(sheet.textContent).toMatch(/Because of/);
  });

  it('passes: saves the attempt and completes the block with 30 XP', async () => {
    await open(block('quiz'));
    playAll([true, true]);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'You passed: 2 of 2' }),
    ).toBeVisible();
    expect(await screen.findByText('You earned 30 XP.')).toBeVisible();
    const user = store.getCurrentUser()!;
    const attempts = JSON.parse(localStorage.getItem('g39.quizAttempts')!) as QuizAttempt[];
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      quizId: 'blk00001',
      score: 2,
      total: 2,
      passed: true,
      wrongIds: [],
    });
    expect((await store.listCompleted(user.id)).map((p) => [p.itemId, p.blockId])).toEqual([
      ['blk00001', 'blk00001'],
    ]);
    expect((await store.listXpEvents(user.id)).map((e) => [e.reason, e.amount])).toEqual([
      ['quiz', 30],
    ]);
  });

  it('an exam pass earns 100 XP', async () => {
    await open(block('exam'));
    playAll([true, true]);
    expect(await screen.findByText('You earned 100 XP.')).toBeVisible();
  });

  it('fails: says what is needed, lists the wrong questions, and does not complete the block', async () => {
    await open(block('quiz'));
    playAll([true, false]);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Not yet: 1 of 2. You need 2.' }),
    ).toBeVisible();
    const review = screen
      .getByRole('heading', { name: 'The question you missed' })
      .closest('section')!;
    expect(within(review).getAllByRole('listitem')).toHaveLength(1);
    expect(review.textContent).toMatch(/Because of/);
    expect(review.textContent).toMatch(/Your answer:\s*wrong/);
    expect(review.textContent).toMatch(/Correct answer:\s*right/);

    const user = store.getCurrentUser()!;
    const attempts = JSON.parse(localStorage.getItem('g39.quizAttempts')!) as QuizAttempt[];
    expect(attempts[0]).toMatchObject({ score: 1, total: 2, passed: false });
    expect(attempts[0].wrongIds).toHaveLength(1);
    expect(await store.listCompleted(user.id)).toEqual([]);
    expect(await store.listXpEvents(user.id)).toEqual([]);
  });

  it('Try again starts a new draw that is not the same two questions', async () => {
    await open(block('quiz'));
    const firstSet = new Set<string>();
    firstSet.add(currentWord());
    pick(false);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    firstSet.add(currentWord());
    pick(false);
    fireEvent.click(screen.getByRole('button', { name: 'See your score' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    await screen.findByRole('radiogroup');
    const secondSet = new Set<string>([currentWord()]);
    pick(true);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    secondSet.add(currentWord());
    expect([...secondSet].sort()).not.toEqual([...firstSet].sort());
  });

  it('Back to the map leaves the player', async () => {
    await open(block('quiz'));
    playAll([true, true]);
    fireEvent.click(await screen.findByRole('button', { name: 'Back to the map' }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
