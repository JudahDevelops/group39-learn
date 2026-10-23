import { describe, expect, it } from 'vitest';
import type { Block, BlockSummary, BlockType, CurriculumIndex } from '../../src/content/schema';
import {
  buildComments,
  buildProgressGrid,
  buildProjects,
  buildQuizScores,
  buildRatings,
  failingTestMessage,
  findStuck,
  formatLagosDate,
  formatLagosDateTime,
  lastActiveLabel,
  listMembers,
  repoLabel,
  safeWebUrl,
  STUCK_AFTER,
} from '../../src/pages/admin/aggregate';
import type { AdminData } from '../../src/store/types';

function summary(slug: string, type: BlockType, extra: Partial<BlockSummary> = {}): BlockSummary {
  return {
    id: `id-${slug}`,
    slug,
    type,
    title: `Title of ${slug}`,
    runner: 'web',
    estMinutes: 5,
    itemCount: 1,
    roomCode: 'B1-01',
    ...extra,
  };
}

/** Track B is listed before A and the fixtures come first on purpose: the dashboard orders by course. */
const CURRICULUM: CurriculumIndex = {
  tracks: [
    {
      id: 'Z',
      title: 'Fixtures',
      fixture: true,
      chapters: [
        {
          id: 'Z1',
          title: 'Fixture chapter',
          blocks: [summary('fix-quiz', 'quiz'), summary('fix-project', 'project')],
        },
      ],
    },
    {
      id: 'B',
      title: 'Build',
      chapters: [
        {
          id: 'B1',
          title: 'HTML',
          blocks: [
            summary('shop', 'workshop', { itemCount: 3, stepIds: ['s1', 's2', 's3'] }),
            summary('lab', 'lab'),
            summary('ship', 'project', { title: 'Ship it', roomCode: 'B1-03' }),
            summary('b-quiz', 'quiz', { title: 'HTML quiz', roomCode: 'B1-04' }),
          ],
        },
      ],
    },
    {
      id: 'A',
      title: 'Understand',
      chapters: [
        {
          id: 'A0',
          title: 'Start',
          blocks: [
            summary('intro', 'lesson'),
            summary('extra', 'lesson', { optional: true }),
            summary('rev', 'review'),
          ],
        },
        {
          id: 'A1',
          title: 'Research',
          blocks: [
            summary('a-quiz', 'quiz', { title: 'Research quiz', roomCode: 'A1-01' }),
            summary('a-exam', 'exam', { title: 'Track A exam', roomCode: 'A1-02' }),
          ],
        },
      ],
    },
  ],
};

const ADA = { id: 'u-ada', displayName: 'Ada Okafor' };
const BOLA = { id: 'u-bola', displayName: 'bola Yusuf' };
const NEW_MEMBER = { id: 'u-new', displayName: '' };

function data(overrides: Partial<AdminData> = {}): AdminData {
  return {
    profiles: [ADA, BOLA],
    progress: [],
    xpEvents: [],
    attempts: [],
    quizAttempts: [],
    lessonFeedback: [],
    projectSubmissions: [],
    ...overrides,
  };
}

const NOW = new Date('2026-10-23T10:00:00Z'); // 11:00 in Lagos

describe('listMembers', () => {
  it('sorts by name ignoring case, with members who have no name last', () => {
    const names = listMembers([NEW_MEMBER, BOLA, ADA]).map((m) => m.name);
    expect(names).toEqual(['Ada Okafor', 'bola Yusuf', 'Unnamed member']);
  });
});

describe('lastActiveLabel', () => {
  it('counts Lagos calendar days, not 24-hour spans', () => {
    // 00:30 in Lagos on 23 Oct.
    const justAfterMidnight = new Date('2026-10-22T23:30:00Z');
    expect(lastActiveLabel('2026-10-22T23:10:00Z', justAfterMidnight)).toBe('Today');
    // 23:00 in Lagos on 22 Oct, only 90 minutes earlier, is already yesterday.
    expect(lastActiveLabel('2026-10-22T22:00:00Z', justAfterMidnight)).toBe('Yesterday');
  });

  it('says Today, Yesterday, then N days ago', () => {
    expect(lastActiveLabel('2026-10-23T08:00:00Z', NOW)).toBe('Today');
    expect(lastActiveLabel('2026-10-22T09:00:00Z', NOW)).toBe('Yesterday');
    expect(lastActiveLabel('2026-10-20T12:00:00Z', NOW)).toBe('3 days ago');
    expect(lastActiveLabel('2026-09-23T12:00:00Z', NOW)).toBe('30 days ago');
  });

  it('treats a time ahead of the clock as today, and no activity as Never', () => {
    expect(lastActiveLabel('2026-10-24T09:00:00Z', NOW)).toBe('Today');
    expect(lastActiveLabel(null, NOW)).toBe('Never');
    expect(lastActiveLabel('not a date', NOW)).toBe('Never');
  });
});

describe('formatLagosDate', () => {
  it('uses Lagos time, which is an hour ahead of UTC', () => {
    expect(formatLagosDate('2026-10-22T23:30:00Z')).toBe('23 Oct 2026');
    expect(formatLagosDateTime('2026-10-22T23:30:00Z')).toBe('23 Oct 2026, 00:30');
    expect(formatLagosDateTime('2026-10-23T13:05:00Z')).toBe('23 Oct 2026, 14:05');
  });

  it('is empty for something that is not a date', () => {
    expect(formatLagosDate('nope')).toBe('');
    expect(formatLagosDateTime('')).toBe('');
  });
});

describe('buildProgressGrid', () => {
  it('has one column per module of tracks A and B in course order, and never the fixtures', () => {
    const grid = buildProgressGrid(CURRICULUM, data(), NOW);
    expect(grid.modules.map((m) => m.id)).toEqual(['A0', 'A1', 'B1']);
    expect(grid.modules.map((m) => m.trackId)).toEqual(['A', 'A', 'B']);
    expect(grid.modules[0]).toEqual({ id: 'A0', title: 'Start', trackId: 'A' });
    for (const row of grid.rows)
      expect(row.cells.map((c) => c.moduleId)).toEqual(['A0', 'A1', 'B1']);
  });

  it('lists members by name', () => {
    const grid = buildProgressGrid(CURRICULUM, data({ profiles: [BOLA, NEW_MEMBER, ADA] }), NOW);
    expect(grid.rows.map((r) => r.name)).toEqual(['Ada Okafor', 'bola Yusuf', 'Unnamed member']);
  });

  it('is 0% for a member with no progress', () => {
    const grid = buildProgressGrid(CURRICULUM, data(), NOW);
    expect(grid.rows[0].cells.map((c) => c.percent)).toEqual([0, 0, 0]);
  });

  it('counts blocks by the map rule: optional blocks are left out', () => {
    const progress = [{ userId: ADA.id, itemId: 'id-intro', completedAt: '2026-10-23T08:00:00Z' }];
    const a0 = buildProgressGrid(CURRICULUM, data({ progress }), NOW).rows[0].cells[0];
    // A0 counts intro and rev (extra is optional), so one block of two.
    expect(a0).toMatchObject({ done: 1, total: 2, percent: 50 });

    const bothCounted = [
      ...progress,
      { userId: ADA.id, itemId: 'id-rev', completedAt: '2026-10-23T08:00:00Z' },
    ];
    const done = buildProgressGrid(CURRICULUM, data({ progress: bothCounted }), NOW).rows[0]
      .cells[0];
    expect(done).toMatchObject({ done: 2, total: 2, percent: 100 });
  });

  it('counts a workshop only when every step is done', () => {
    const step = (itemId: string) => ({
      userId: ADA.id,
      itemId,
      completedAt: '2026-10-23T08:00:00Z',
    });
    const partial = buildProgressGrid(CURRICULUM, data({ progress: [step('s1'), step('s2')] }), NOW)
      .rows[0].cells[2];
    expect(partial).toMatchObject({ done: 0, total: 4, percent: 0 });

    const whole = buildProgressGrid(
      CURRICULUM,
      data({ progress: [step('s1'), step('s2'), step('s3')] }),
      NOW,
    ).rows[0].cells[2];
    // B1 counts four blocks: the workshop, the lab, the project and the quiz.
    expect(whole).toMatchObject({ done: 1, total: 4, percent: 25 });
  });

  it('rounds down, so only a finished module reads 100%', () => {
    const lessons: CurriculumIndex = {
      tracks: [
        {
          id: 'A',
          title: 'A',
          chapters: [
            {
              id: 'A0',
              title: 'Three lessons',
              blocks: [summary('l1', 'lesson'), summary('l2', 'lesson'), summary('l3', 'lesson')],
            },
          ],
        },
      ],
    };
    const done = (...ids: string[]) =>
      ids.map((itemId) => ({ userId: ADA.id, itemId, completedAt: '2026-10-23T08:00:00Z' }));
    const percent = (progress: ReturnType<typeof done>) =>
      buildProgressGrid(lessons, data({ progress }), NOW).rows[0].cells[0].percent;
    expect(percent(done('id-l1'))).toBe(33);
    expect(percent(done('id-l1', 'id-l2'))).toBe(66);
    expect(percent(done('id-l1', 'id-l2', 'id-l3'))).toBe(100);
  });

  it("keeps each member's progress apart", () => {
    const progress = [{ userId: BOLA.id, itemId: 'id-intro', completedAt: '2026-10-23T08:00:00Z' }];
    const grid = buildProgressGrid(CURRICULUM, data({ progress }), NOW);
    expect(grid.rows.find((r) => r.name === 'Ada Okafor')?.cells[0].percent).toBe(0);
    expect(grid.rows.find((r) => r.name === 'bola Yusuf')?.cells[0].percent).toBe(50);
  });

  it('takes the last active time from progress, XP, attempts and quiz attempts', () => {
    const grid = buildProgressGrid(
      CURRICULUM,
      data({
        progress: [{ userId: ADA.id, itemId: 'x', completedAt: '2026-10-19T09:00:00Z' }],
        xpEvents: [{ userId: ADA.id, createdAt: '2026-10-20T09:00:00Z' }],
        attempts: [
          {
            userId: ADA.id,
            itemId: 's1',
            passed: false,
            failedTestIndex: 0,
            createdAt: '2026-10-22T08:00:00Z',
          },
        ],
        quizAttempts: [
          {
            userId: ADA.id,
            quizId: 'id-b-quiz',
            score: 1,
            total: 2,
            passed: false,
            createdAt: '2026-10-21T08:00:00Z',
          },
        ],
      }),
      NOW,
    );
    const ada = grid.rows[0];
    expect(ada.lastActive).toBe('2026-10-22T08:00:00.000Z');
    expect(ada.lastActiveLabel).toBe('Yesterday');
    const bola = grid.rows[1];
    expect(bola.lastActive).toBeNull();
    expect(bola.lastActiveLabel).toBe('Never');
  });

  it('compares times, not strings, so database timestamps with offsets order correctly', () => {
    const grid = buildProgressGrid(
      CURRICULUM,
      data({
        xpEvents: [
          { userId: ADA.id, createdAt: '2026-10-23T09:30:00+00:00' },
          { userId: ADA.id, createdAt: '2026-10-23T09:00:00.123456+00:00' },
        ],
      }),
      NOW,
    );
    expect(grid.rows[0].lastActive).toBe('2026-10-23T09:30:00.000Z');
  });
});

describe('buildQuizScores', () => {
  const attempt = (
    userId: string,
    quizId: string,
    score: number,
    total: number,
    passed: boolean,
  ) => ({
    userId,
    quizId,
    score,
    total,
    passed,
    createdAt: '2026-10-23T08:00:00Z',
  });

  it('gives the best score, the number of attempts and whether the quiz was passed', () => {
    const rows = buildQuizScores(
      CURRICULUM,
      data({
        quizAttempts: [
          attempt(ADA.id, 'id-b-quiz', 9, 15, false),
          attempt(ADA.id, 'id-b-quiz', 13, 15, true),
          attempt(ADA.id, 'id-b-quiz', 11, 15, false),
        ],
      }),
    );
    expect(rows).toEqual([
      {
        userId: ADA.id,
        name: 'Ada Okafor',
        quizId: 'id-b-quiz',
        title: 'HTML quiz',
        roomCode: 'B1-04',
        bestScore: 13,
        bestTotal: 15,
        attempts: 3,
        passed: true,
      },
    ]);
  });

  it('is not passed when no attempt reached the pass mark', () => {
    const rows = buildQuizScores(
      CURRICULUM,
      data({ quizAttempts: [attempt(ADA.id, 'id-a-quiz', 5, 15, false)] }),
    );
    expect(rows[0]).toMatchObject({ bestScore: 5, bestTotal: 15, attempts: 1, passed: false });
  });

  it('picks the best by fraction when the number of questions differs', () => {
    const rows = buildQuizScores(
      CURRICULUM,
      data({
        quizAttempts: [
          attempt(ADA.id, 'id-a-quiz', 8, 10, false),
          attempt(ADA.id, 'id-a-quiz', 9, 15, false),
        ],
      }),
    );
    expect(rows[0]).toMatchObject({ bestScore: 8, bestTotal: 10 });
  });

  it('lists quizzes in course order, then members by name, for quizzes and exams alike', () => {
    const rows = buildQuizScores(
      CURRICULUM,
      data({
        quizAttempts: [
          attempt(BOLA.id, 'id-b-quiz', 10, 15, false),
          attempt(ADA.id, 'id-a-exam', 20, 25, true),
          attempt(BOLA.id, 'id-a-quiz', 12, 15, true),
          attempt(ADA.id, 'id-b-quiz', 13, 15, true),
          attempt(ADA.id, 'id-a-quiz', 14, 15, true),
        ],
      }),
    );
    expect(rows.map((r) => `${r.title}/${r.name}`)).toEqual([
      'Research quiz/Ada Okafor',
      'Research quiz/bola Yusuf',
      'Track A exam/Ada Okafor',
      'HTML quiz/Ada Okafor',
      'HTML quiz/bola Yusuf',
    ]);
  });

  it('leaves out quizzes nobody has tried, and ids that are not in the course', () => {
    expect(buildQuizScores(CURRICULUM, data())).toEqual([]);
    expect(
      buildQuizScores(CURRICULUM, data({ quizAttempts: [attempt(ADA.id, 'gone', 1, 2, false)] })),
    ).toEqual([]);
  });
});

describe('findStuck', () => {
  let tick = 0;
  /** Attempts are one minute apart in the order given, unless `at` is set. */
  const attempt = (
    userId: string,
    itemId: string,
    passed: boolean,
    failedTestIndex: number | null = null,
    at?: string,
  ) => ({
    userId,
    itemId,
    passed,
    failedTestIndex,
    createdAt: at ?? new Date(Date.UTC(2026, 9, 23, 8, tick++)).toISOString(),
  });
  const fails = (userId: string, itemId: string, indexes: (number | null)[]) =>
    indexes.map((i) => attempt(userId, itemId, false, i));

  it('needs at least five failed checks', () => {
    expect(STUCK_AFTER).toBe(5);
    expect(findStuck(CURRICULUM, data({ attempts: fails(ADA.id, 's1', [0, 0, 0, 0]) }))).toEqual(
      [],
    );
    const stuck = findStuck(CURRICULUM, data({ attempts: fails(ADA.id, 's1', [0, 0, 0, 0, 0]) }));
    expect(stuck).toHaveLength(1);
    expect(stuck[0]).toMatchObject({
      userId: ADA.id,
      name: 'Ada Okafor',
      itemId: 's1',
      slug: 'shop',
      blockTitle: 'Title of shop',
      step: 1,
      failed: 5,
      testIndex: 0,
    });
  });

  it('is not stuck when a pass comes after the failures', () => {
    const attempts = [...fails(ADA.id, 's1', [0, 0, 0, 0, 0]), attempt(ADA.id, 's1', true)];
    expect(findStuck(CURRICULUM, data({ attempts }))).toEqual([]);
  });

  it('counts only the failures after the last pass', () => {
    const attempts = [
      ...fails(ADA.id, 's2', [0, 0, 0]),
      attempt(ADA.id, 's2', true),
      ...fails(ADA.id, 's2', [1, 1]),
    ];
    expect(findStuck(CURRICULUM, data({ attempts }))).toEqual([]);

    const again = [...attempts, ...fails(ADA.id, 's2', [1, 1, 2])];
    const stuck = findStuck(CURRICULUM, data({ attempts: again }));
    expect(stuck).toHaveLength(1);
    expect(stuck[0]).toMatchObject({ failed: 5, testIndex: 1, step: 2 });
  });

  it('reports the most common failing test, with a tie going to the lowest index', () => {
    const common = findStuck(
      CURRICULUM,
      data({ attempts: fails(ADA.id, 's1', [2, 1, 2, 0, 2, 1]) }),
    );
    expect(common[0]).toMatchObject({ failed: 6, testIndex: 2 });

    const tied = findStuck(CURRICULUM, data({ attempts: fails(ADA.id, 's1', [3, 1, 3, 1, 2]) }));
    expect(tied[0].testIndex).toBe(1);
  });

  it('ignores failures that name no test, and has no test when none do', () => {
    const some = findStuck(
      CURRICULUM,
      data({ attempts: fails(ADA.id, 's1', [null, null, null, 4, 4]) }),
    );
    expect(some[0]).toMatchObject({ failed: 5, testIndex: 4 });
    const none = findStuck(
      CURRICULUM,
      data({ attempts: fails(ADA.id, 's1', [null, null, null, null, null]) }),
    );
    expect(none[0]).toMatchObject({ failed: 5, testIndex: null });
  });

  it('puts checks in time order, whatever order the rows arrive in', () => {
    const attempts = [
      attempt(ADA.id, 's1', true, null, '2026-10-23T09:00:00Z'), // the pass is the latest
      ...[1, 2, 3, 4, 5].map((m) => attempt(ADA.id, 's1', false, 0, `2026-10-23T08:0${m}:00Z`)),
    ];
    expect(findStuck(CURRICULUM, data({ attempts }))).toEqual([]);

    const failingLast = [
      attempt(ADA.id, 's1', true, null, '2026-10-23T07:00:00Z'), // an old pass
      ...[1, 2, 3, 4, 5].map((m) => attempt(ADA.id, 's1', false, 0, `2026-10-23T08:0${m}:00Z`)),
    ];
    expect(findStuck(CURRICULUM, data({ attempts: failingLast }))).toHaveLength(1);
  });

  it('keeps stored order when checks share a time', () => {
    const at = '2026-10-23T08:00:00Z';
    const attempts = [
      ...[0, 1, 2, 3, 4].map((i) => attempt(ADA.id, 's1', false, i, at)),
      attempt(ADA.id, 's1', true, null, at),
    ];
    expect(findStuck(CURRICULUM, data({ attempts }))).toEqual([]);
  });

  it('works per member and per step, most failed first', () => {
    const attempts = [
      ...fails(BOLA.id, 's1', [0, 0, 0, 0, 0]),
      ...fails(ADA.id, 's1', [0, 0, 0, 0, 0, 0, 0]),
      ...fails(ADA.id, 's3', [0, 0, 0, 0, 0]),
      ...fails(BOLA.id, 's3', [0, 0]), // not enough
      attempt(ADA.id, 's2', true), // a pass on a different step changes nothing
    ];
    const stuck = findStuck(CURRICULUM, data({ attempts }));
    expect(stuck.map((s) => `${s.name}/${s.itemId}/${s.failed}`)).toEqual([
      'Ada Okafor/s1/7',
      'Ada Okafor/s3/5',
      'bola Yusuf/s1/5',
    ]);
  });

  it('covers a lab by its block id, and skips steps that are not in the course', () => {
    const attempts = [
      ...fails(ADA.id, 'id-lab', [0, 0, 0, 0, 0]),
      ...fails(ADA.id, 'removed-step', [0, 0, 0, 0, 0]),
    ];
    const stuck = findStuck(CURRICULUM, data({ attempts }));
    expect(stuck).toHaveLength(1);
    expect(stuck[0]).toMatchObject({ itemId: 'id-lab', slug: 'lab', step: null });
  });

  it('records the time of the latest failed check', () => {
    const attempts = fails(ADA.id, 's1', [0, 0, 0, 0, 0]);
    const stuck = findStuck(CURRICULUM, data({ attempts }));
    expect(stuck[0].lastFailedAt).toBe(attempts[4].createdAt);
  });
});

describe('failingTestMessage', () => {
  const workshop = {
    type: 'workshop',
    steps: [
      { id: 's1', tests: [{ text: 'first <code>a</code>' }, { text: 'second' }] },
      { id: 's2', tests: [{ text: 'other step' }] },
    ],
  } as unknown as Block;
  const lab = {
    type: 'lab',
    lab: { tests: [{ text: 'lab one' }, { text: 'lab two' }] },
  } as unknown as Block;
  const quiz = { type: 'quiz' } as unknown as Block;

  it('reads the message of the step and test', () => {
    expect(failingTestMessage(workshop, 's1', 0)).toBe('first <code>a</code>');
    expect(failingTestMessage(workshop, 's1', 1)).toBe('second');
    expect(failingTestMessage(workshop, 's2', 0)).toBe('other step');
  });

  it('reads a lab test by its index', () => {
    expect(failingTestMessage(lab, 'id-lab', 1)).toBe('lab two');
  });

  it('is null when there is nothing to show', () => {
    expect(failingTestMessage(workshop, 's1', null)).toBeNull();
    expect(failingTestMessage(workshop, 's1', 5)).toBeNull();
    expect(failingTestMessage(workshop, 'nope', 0)).toBeNull();
    expect(failingTestMessage(lab, 'id-lab', 9)).toBeNull();
    expect(failingTestMessage(quiz, 'x', 0)).toBeNull();
  });
});

describe('lesson feedback', () => {
  const feedback = (
    userId: string,
    blockId: string,
    rating: 'too_easy' | 'just_right' | 'too_hard' | 'confusing',
    comment: string | null,
    createdAt: string,
  ) => ({ userId, blockId, rating, comment, createdAt });

  const rows = [
    feedback(ADA.id, 'id-intro', 'confusing', 'The second screen lost me', '2026-10-21T08:00:00Z'),
    feedback(BOLA.id, 'id-intro', 'just_right', null, '2026-10-22T08:00:00Z'),
    feedback(BOLA.id, 'id-rev', 'too_easy', '  Too slow  ', '2026-10-23T08:00:00Z'),
    feedback(ADA.id, 'id-intro', 'confusing', '   ', '2026-10-23T09:00:00Z'),
    feedback(
      ADA.id,
      'id-gone',
      'confusing',
      'About a lesson that was removed',
      '2026-10-23T09:30:00Z',
    ),
  ];

  it('counts each rating per block, in course order', () => {
    const ratings = buildRatings(CURRICULUM, data({ lessonFeedback: rows }));
    expect(ratings.map((r) => r.title)).toEqual(['Title of intro', 'Title of rev']);
    expect(ratings[0].counts).toEqual({ too_easy: 0, just_right: 1, too_hard: 0, confusing: 2 });
    expect(ratings[0].total).toBe(3);
    expect(ratings[1].counts).toEqual({ too_easy: 1, just_right: 0, too_hard: 0, confusing: 0 });
  });

  it('lists comments newest first with the name and date, and leaves out empty ones', () => {
    const comments = buildComments(CURRICULUM, data({ lessonFeedback: rows }));
    expect(comments.map((c) => c.comment)).toEqual(['Too slow', 'The second screen lost me']);
    expect(comments[0]).toMatchObject({
      name: 'bola Yusuf',
      title: 'Title of rev',
      rating: 'too_easy',
      createdAt: '2026-10-23T08:00:00Z',
    });
    expect(comments[1].name).toBe('Ada Okafor');
  });

  it('puts a later stored row first when two comments share a time', () => {
    const at = '2026-10-23T08:00:00Z';
    const comments = buildComments(
      CURRICULUM,
      data({
        lessonFeedback: [
          feedback(ADA.id, 'id-intro', 'just_right', 'first', at),
          feedback(BOLA.id, 'id-intro', 'just_right', 'second', at),
        ],
      }),
    );
    expect(comments.map((c) => c.comment)).toEqual(['second', 'first']);
  });

  it('is empty when there is no feedback', () => {
    expect(buildRatings(CURRICULUM, data())).toEqual([]);
    expect(buildComments(CURRICULUM, data())).toEqual([]);
  });
});

describe('buildProjects', () => {
  const submission = (userId: string, projectId: string, passed: boolean, repoUrl: string) => ({
    userId,
    projectId,
    repoUrl,
    passed,
    checkedAt: '2026-10-22T12:00:00Z',
  });

  it('has a row for every member and project block, in course order', () => {
    const rows = buildProjects(CURRICULUM, data());
    // B1's project comes before the fixture project (track Z is last in course order).
    expect(rows.map((r) => `${r.title}/${r.name}`)).toEqual([
      'Ship it/Ada Okafor',
      'Ship it/bola Yusuf',
      'Title of fix-project/Ada Okafor',
      'Title of fix-project/bola Yusuf',
    ]);
    expect(rows.every((r) => r.status === 'not_submitted')).toBe(true);
    expect(rows[0]).toMatchObject({ repoUrl: null, checkedAt: null, roomCode: 'B1-03' });
  });

  it('reads passed and failing from the submission', () => {
    const rows = buildProjects(
      CURRICULUM,
      data({
        projectSubmissions: [
          submission(ADA.id, 'id-ship', true, 'https://github.com/ada/ihms'),
          submission(BOLA.id, 'id-ship', false, 'https://github.com/bola/ihms'),
        ],
      }),
    );
    expect(rows[0]).toMatchObject({
      status: 'passed',
      repoUrl: 'https://github.com/ada/ihms',
      checkedAt: '2026-10-22T12:00:00Z',
    });
    expect(rows[1]).toMatchObject({ status: 'failing', repoUrl: 'https://github.com/bola/ihms' });
    expect(rows[2].status).toBe('not_submitted');
  });

  it('is empty when the course has no project', () => {
    const noProjects: CurriculumIndex = {
      tracks: [
        {
          id: 'A',
          title: 'A',
          chapters: [{ id: 'A0', title: 'Start', blocks: [summary('intro', 'lesson')] }],
        },
      ],
    };
    expect(buildProjects(noProjects, data())).toEqual([]);
  });
});

describe('repo links', () => {
  it('links web addresses only', () => {
    expect(safeWebUrl('https://github.com/ada/ihms')).toBe('https://github.com/ada/ihms');
    expect(safeWebUrl('  http://example.com/x ')).toBe('http://example.com/x');
    expect(safeWebUrl('javascript:alert(1)')).toBeNull();
    expect(safeWebUrl('data:text/html,<b>x</b>')).toBeNull();
    expect(safeWebUrl('git@github.com:ada/ihms.git')).toBeNull();
    expect(safeWebUrl('not a url')).toBeNull();
  });

  it('shows owner/repo for GitHub and the plain text for anything else', () => {
    expect(repoLabel('https://github.com/ada/ihms')).toBe('ada/ihms');
    expect(repoLabel('https://github.com/ada/ihms.git')).toBe('ada/ihms');
    expect(repoLabel('https://github.com/ada/ihms/')).toBe('ada/ihms');
    expect(repoLabel('https://gitlab.com/ada/ihms')).toBe('gitlab.com/ada/ihms');
    expect(repoLabel('javascript:alert(1)')).toBe('javascript:alert(1)');
  });
});
