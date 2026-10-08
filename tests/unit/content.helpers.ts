/** Shared inline content for the content tests. Nothing here is read from content/. */
import type { ContentFiles } from '../../src/content/validate';

/** Replace `from` with `to` and fail loudly if `from` is not there (so a stale test cannot pass by accident). */
export function mutate(source: string, from: string, to: string): string {
  if (!source.includes(from)) throw new Error(`test setup: "${from}" not found in source`);
  return source.replace(from, to);
}

export const IDS = {
  lesson: 'aaaa0001',
  shop: 'aaaa0002',
  step1: 'bbbb0001',
  step2: 'bbbb0002',
  lab: 'aaaa0003',
  quiz: 'aaaa0004',
  exam: 'aaaa0005',
  review: 'aaaa0006',
  project: 'aaaa0007',
};

export function meta(o: Record<string, unknown>): string {
  return JSON.stringify({ estMinutes: 5, ...o }, null, 2);
}

export const CURRICULUM = JSON.stringify(
  {
    tracks: [
      {
        id: 'B',
        title: 'Build',
        chapters: [
          {
            id: 'B1',
            title: 'HTML',
            blocks: ['lesson-a', 'shop-a', 'lab-a', 'quiz-a', 'exam-a', 'review-a', 'project-a'],
          },
        ],
      },
    ],
  },
  null,
  2,
);

export const LESSON = `# --screen-- concept

A page is made of elements.

# --screen-- mcq

## --question--

Which element is the main heading?

## --options--

- [x] \`h1\`
  > Yes.
- [ ] \`p\`
  > No. That is a paragraph.

## --why--

Headings use h1.
`;

export function stepMd(
  id: string,
  n: number,
  extra: { tests?: string; seed?: string; solutions?: string } = {},
): string {
  const seed =
    extra.seed ??
    `<body>
--editable-region--

--editable-region--
</body>`;
  const solutions = extra.solutions ?? `<body>\n  <h1>Hi</h1>\n</body>`;
  const tests =
    extra.tests ??
    `Your page should have an \`h1\` element.

\`\`\`js
assert.exists(document.querySelector('h1'));
\`\`\``;
  return `---
id: ${id}
title: Step ${n}
runner: web
---

# --description--

Add an \`h1\` element.

# --hints--

${tests}

# --seed--

## --seed-contents--

\`\`\`html file=index.html
${seed}
\`\`\`

# --solutions--

\`\`\`html file=index.html
${solutions}
\`\`\`

# --help--

## --hint--

An element has an opening and a closing tag.
`;
}

export const LAB = `# --description--

Build a notice page.

# --user-stories--

1. Your page has an \`h1\` element.

# --hints--

Your page should have an \`h1\` element.

\`\`\`js
assert.exists(document.querySelector('h1'));
\`\`\`

# --seed--

## --seed-contents--

\`\`\`html file=index.html
<body></body>
\`\`\`

# --solutions--

\`\`\`html file=index.html
<body><h1>Hi</h1></body>
\`\`\`

# --help--

## --hint--

Add the element named in the user story.
`;

export function quizMd(draw: number, pass: number, texts: string[]): string {
  const questions = texts
    .map(
      (t) => `## --question--

### --text--

${t}

### --distractors--

- Wrong one
- Wrong two

### --answer--

Right

### --explanation--

Because.
`,
    )
    .join('\n');
  return `---\ndraw: ${draw}\npass: ${pass}\n---\n\n${questions}`;
}

export const REVIEW = `## Summary

Elements have tags.
`;

export const PROJECT = `---
ciJob: lab-setup
---

# --user-stories--

1. You have a repository.

# --instructions--

Push to main.
`;

/** A tree that validates with no issues. Tests copy it and break one thing. */
export function baseTree(): ContentFiles {
  return {
    'curriculum.json': CURRICULUM,
    'blocks/lesson-a/meta.json': meta({
      id: IDS.lesson,
      slug: 'lesson-a',
      type: 'lesson',
      title: 'A lesson',
      runner: 'web',
    }),
    'blocks/lesson-a/lesson.md': LESSON,
    'blocks/shop-a/meta.json': meta({
      id: IDS.shop,
      slug: 'shop-a',
      type: 'workshop',
      title: 'A workshop',
      runner: 'web',
    }),
    'blocks/shop-a/01.md': stepMd(IDS.step1, 1),
    'blocks/shop-a/02.md': stepMd(IDS.step2, 2),
    'blocks/lab-a/meta.json': meta({
      id: IDS.lab,
      slug: 'lab-a',
      type: 'lab',
      title: 'A lab',
      runner: 'web',
      demo: 'index.html',
    }),
    'blocks/lab-a/lab.md': LAB,
    'blocks/quiz-a/meta.json': meta({
      id: IDS.quiz,
      slug: 'quiz-a',
      type: 'quiz',
      title: 'A quiz',
      runner: 'none',
    }),
    'blocks/quiz-a/quiz.md': quizMd(2, 2, [
      'First question?',
      'Second question?',
      'Third question?',
    ]),
    'blocks/exam-a/meta.json': meta({
      id: IDS.exam,
      slug: 'exam-a',
      type: 'exam',
      title: 'An exam',
      runner: 'none',
    }),
    'blocks/exam-a/quiz.md': quizMd(5, 4, [
      'Exam one?',
      'Exam two?',
      'Exam three?',
      'Exam four?',
      'Exam five?',
    ]),
    'blocks/review-a/meta.json': meta({
      id: IDS.review,
      slug: 'review-a',
      type: 'review',
      title: 'A review',
      runner: 'none',
    }),
    'blocks/review-a/review.md': REVIEW,
    'blocks/project-a/meta.json': meta({
      id: IDS.project,
      slug: 'project-a',
      type: 'project',
      title: 'A project',
      runner: 'none',
    }),
    'blocks/project-a/project.md': PROJECT,
  };
}
