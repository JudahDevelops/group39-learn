/**
 * Reads the built course from the running site (/content/..., which `pretest:e2e` builds with the
 * fixture track), so the specs can say what a door or the home hero should show without copying
 * titles and ids by hand. Also seeds progress straight into LocalStore's localStorage, for states
 * that would take many clicks to reach.
 *
 * Specs import `test` and `expect` from here and ask for the `course` fixture.
 */
import { expect, test as base, type APIRequestContext, type Page } from '@playwright/test';

/** LocalStore's one user. */
const USER_ID = 'local-dev-user';

export interface BuiltSummary {
  id: string;
  slug: string;
  type: string;
  title: string;
  roomCode: string;
  itemCount: number;
  estMinutes: number;
  optional?: boolean;
}

interface BuiltCurriculum {
  tracks: { id: string; chapters: { id: string; title: string; blocks: BuiltSummary[] }[] }[];
}

export interface BuiltQuiz {
  draw: number;
  pass: number;
  questions: {
    id: string;
    text: string;
    distractors: string[];
    answer: string;
    explanation: string;
  }[];
}

export interface Entry {
  userId: string;
  itemId: string;
  blockId: string;
  completedAt: string;
}

const TRACK_RANK: Record<string, number> = { A: 0, B: 1, Z: 2 };

export class BuiltCourse {
  private constructor(
    private readonly blocks: (BuiltSummary & { trackId: string })[],
    private readonly steps: Map<string, string[]>,
    private readonly quizzes: Map<string, BuiltQuiz>,
    private readonly tracks: BuiltCurriculum['tracks'],
    /** Workshop step id -> the failure message (HTML) of each of its tests. */
    private readonly testMessages: Map<string, string[]>,
  ) {}

  /** Fetches the curriculum, then the step ids of every workshop and the questions of every quiz. */
  static async load(request: APIRequestContext): Promise<BuiltCourse> {
    const getJson = async <T>(path: string): Promise<T> => {
      const response = await request.get(`/content/${path}`);
      expect(response.ok(), `GET /content/${path}`).toBe(true);
      return (await response.json()) as T;
    };
    const curriculum = await getJson<BuiltCurriculum>('curriculum.json');
    const tracks = [...curriculum.tracks].sort((a, b) => TRACK_RANK[a.id] - TRACK_RANK[b.id]);
    const blocks = tracks.flatMap((track) =>
      track.chapters.flatMap((chapter) =>
        chapter.blocks.map((block) => ({ ...block, trackId: track.id })),
      ),
    );
    const steps = new Map<string, string[]>();
    const quizzes = new Map<string, BuiltQuiz>();
    const testMessages = new Map<string, string[]>();
    await Promise.all(
      blocks.map(async (block) => {
        if (block.type === 'workshop') {
          const built = await getJson<{ steps: { id: string; tests: { text: string }[] }[] }>(
            `blocks/${block.slug}.json`,
          );
          steps.set(
            block.slug,
            built.steps.map((s) => s.id),
          );
          for (const step of built.steps) {
            testMessages.set(
              step.id,
              step.tests.map((t) => t.text),
            );
          }
        } else if (block.type === 'quiz' || block.type === 'exam') {
          const built = await getJson<{ quiz: BuiltQuiz }>(`blocks/${block.slug}.json`);
          quizzes.set(block.slug, built.quiz);
        }
      }),
    );
    return new BuiltCourse(blocks, steps, quizzes, tracks, testMessages);
  }

  /** Every block in course order (A, B, then Z). */
  order(): (BuiltSummary & { trackId: string })[] {
    return this.blocks;
  }

  /** The slugs of every block in a track (e.g. "Z" for the fixtures), in course order. */
  slugsOf(trackId: string): string[] {
    return this.blocks.filter((b) => b.trackId === trackId).map((b) => b.slug);
  }

  /**
   * The "n of m done" texts the map shows, one per track and per chapter, each with how many times it
   * appears. `done` lists the slugs of blocks that are finished. Optional blocks do not count.
   */
  doneLabels(done: readonly string[] = []): Map<string, number> {
    const finished = new Set(done);
    const labels = new Map<string, number>();
    const add = (blocks: BuiltSummary[]) => {
      const counted = blocks.filter((b) => !b.optional);
      const text = `${counted.filter((b) => finished.has(b.slug)).length} of ${counted.length} done`;
      labels.set(text, (labels.get(text) ?? 0) + 1);
    };
    for (const track of this.tracks) {
      add(track.chapters.flatMap((chapter) => chapter.blocks));
      for (const chapter of track.chapters) add(chapter.blocks);
    }
    return labels;
  }

  summary(slug: string): BuiltSummary {
    const found = this.blocks.find((b) => b.slug === slug);
    if (!found) throw new Error(`no built block "${slug}"; run INCLUDE_FIXTURES=1 npm run content`);
    return found;
  }

  /** The item ids of a block: its step ids for a workshop, otherwise its own id. */
  itemIds(slug: string): string[] {
    return this.steps.get(slug) ?? [this.summary(slug).id];
  }

  /** The modules (chapters) of tracks A and B in course order, which the admin grid shows. */
  modules(): { id: string; title: string; blocks: BuiltSummary[] }[] {
    return this.tracks
      .filter((track) => track.id !== 'Z')
      .flatMap((track) =>
        track.chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          blocks: chapter.blocks,
        })),
      );
  }

  /** The failure message (HTML) of test `testIndex` of a workshop step. */
  testMessage(stepId: string, testIndex: number): string {
    const message = this.testMessages.get(stepId)?.[testIndex];
    if (message === undefined) throw new Error(`step ${stepId} has no test ${testIndex}`);
    return message;
  }

  /** How many tests a workshop step has. */
  testCount(stepId: string): number {
    return this.testMessages.get(stepId)?.length ?? 0;
  }

  quiz(slug: string): BuiltQuiz {
    const found = this.quizzes.get(slug);
    if (!found) throw new Error(`"${slug}" is not a built quiz or exam`);
    return found;
  }

  /** Completed-progress rows for a block: all its items, or only the first `count` of them. */
  doneEntries(slug: string, count?: number): Entry[] {
    const blockId = this.summary(slug).id;
    return this.itemIds(slug)
      .slice(0, count)
      .map((itemId) => ({
        userId: USER_ID,
        itemId,
        blockId,
        completedAt: new Date().toISOString(),
      }));
  }

  /** Rows that finish every block outside the fixture track, so the first fixture is next up. */
  realCourseEntries(): Entry[] {
    return this.blocks.filter((b) => b.trackId !== 'Z').flatMap((b) => this.doneEntries(b.slug));
  }
}

let loaded: Promise<BuiltCourse> | null = null;

export const test = base.extend<{ course: BuiltCourse }>({
  // The build does not change during a run, so each worker loads it once.
  course: async ({ request }, provide) => {
    loaded ??= BuiltCourse.load(request);
    await provide(await loaded);
  },
});

export { expect };

/** Text of build-time HTML as the learner reads it (tags removed, entities decoded). */
export function plain(html: string): string {
  const named: Record<string, string> = {
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    amp: '&',
  };
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&(lt|gt|quot|apos|amp);/g, (_, name: string) => named[name])
    .replace(/\s+/g, ' ')
    .trim();
}

/** Expects the map to show exactly the "n of m done" texts that the built course implies. */
export async function expectDoneLabels(
  page: Page,
  course: BuiltCourse,
  done: readonly string[] = [],
): Promise<void> {
  for (const [text, times] of course.doneLabels(done)) {
    await expect(page.getByText(text, { exact: true }), text).toHaveCount(times);
  }
}

/** Writes progress rows into localStorage. Load a page afterwards: the app reads them on load. */
export async function seedProgress(page: Page, entries: Entry[]): Promise<void> {
  await page.evaluate((rows) => {
    const key = 'g39.progress';
    const old = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown[];
    window.localStorage.setItem(key, JSON.stringify([...old, ...rows]));
  }, entries);
}

/** Writes one XP event (now) for the signed-in person. */
export async function seedXp(page: Page, amount: number, reason: string): Promise<void> {
  await page.evaluate(
    ({ userId, amount: xp, reason: why }) => {
      const key = 'g39.xpEvents';
      const old = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown[];
      const event = {
        userId,
        itemId: 'seeded-item',
        reason: why,
        amount: xp,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(key, JSON.stringify([...old, event]));
    },
    { userId: USER_ID, amount, reason },
  );
}

/** Appends rows to one of LocalStore's lists. Load a page afterwards: the app reads them on load. */
async function appendRows(page: Page, key: string, rows: object[]): Promise<void> {
  await page.evaluate(
    ({ storageKey, added }) => {
      const old = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as unknown[];
      window.localStorage.setItem(storageKey, JSON.stringify([...old, ...added]));
    },
    { storageKey: key, added: rows },
  );
}

/**
 * Writes checks of a workshop step (or lab) for the signed-in person, one minute apart and ending
 * now. A failed check names the test that failed first (`failedTestIndex`, 0-based).
 */
export async function seedAttempts(
  page: Page,
  itemId: string,
  attempts: ({ passed: true } | { passed: false; failedTestIndex: number | null })[],
): Promise<void> {
  const end = Date.now();
  await appendRows(
    page,
    'g39.attempts',
    attempts.map((attempt, i) => ({
      userId: USER_ID,
      itemId,
      passed: attempt.passed,
      failedTestIndex: attempt.passed ? null : attempt.failedTestIndex,
      createdAt: new Date(end - (attempts.length - i) * 60_000).toISOString(),
    })),
  );
}

/** Writes one quiz attempt (now) for the signed-in person. */
export async function seedQuizAttempt(
  page: Page,
  quizId: string,
  score: number,
  total: number,
  passed: boolean,
): Promise<void> {
  await appendRows(page, 'g39.quizAttempts', [
    {
      userId: USER_ID,
      quizId,
      score,
      total,
      passed,
      wrongIds: [],
      createdAt: new Date().toISOString(),
    },
  ]);
}

/** Writes one lesson feedback row for the signed-in person. */
export async function seedFeedback(
  page: Page,
  blockId: string,
  rating: 'too_easy' | 'just_right' | 'too_hard' | 'confusing',
  comment: string | null,
  createdAt: string,
): Promise<void> {
  await appendRows(page, 'g39.lessonFeedback', [
    { userId: USER_ID, blockId, rating, comment, createdAt },
  ]);
}

/** Writes one project submission (checked now) for the signed-in person. */
export async function seedProjectSubmission(
  page: Page,
  projectId: string,
  repoUrl: string,
  passed: boolean,
): Promise<void> {
  await appendRows(page, 'g39.projectSubmissions', [
    {
      userId: USER_ID,
      projectId,
      repoUrl,
      runUrl: null,
      jobs: null,
      passed,
      checkedAt: new Date().toISOString(),
    },
  ]);
}

/**
 * Makes the signed-in person an admin, the way Judah does it in the database: the stored profile
 * gets role "admin", then the page reloads so the app reads it. Seed other rows before calling
 * this, because the reload is what makes the app read them too.
 */
export async function makeAdmin(page: Page): Promise<void> {
  await page.evaluate(() => {
    const key = 'g39.profile';
    const profile = JSON.parse(window.localStorage.getItem(key) ?? 'null') as object | null;
    if (!profile) throw new Error('Sign in before making the user an admin.');
    window.localStorage.setItem(key, JSON.stringify({ ...profile, role: 'admin' }));
  });
  await page.reload();
}
