import { describe, expect, it } from 'vitest';
import { questionId } from '../../src/content/ids';
import { markdownInline, markdownToHtml } from '../../src/content/markdown';
import {
  parseLab,
  parseLesson,
  parseProject,
  parseQuiz,
  parseReview,
  parseStep,
} from '../../src/content/parse';
import { mutate, quizMd, stepMd } from './content.helpers';

const ctx = (runner: 'web' | 'python' | 'none' = 'web', demo?: string) => ({
  file: 'content/blocks/x/file.md',
  blockId: 'blk00001',
  runner,
  demo,
});

describe('markdown', () => {
  it('renders GFM tables and passes trusted raw HTML through', () => {
    const html = markdownToHtml('| a | b |\n|---|---|\n| 1 | 2 |\n\n<kbd>Ctrl</kbd>');
    expect(html).toContain('<table>');
    expect(html).toContain('<kbd>Ctrl</kbd>');
  });

  it('escapes tags written in backticks', () => {
    expect(markdownInline('Use `<h1>` here')).toBe('Use <code>&#x3C;h1></code> here');
  });

  it('drops the wrapping paragraph only for a single paragraph', () => {
    expect(markdownInline('one **two**')).toBe('one <strong>two</strong>');
    expect(markdownInline('one\n\ntwo')).toBe('<p>one</p>\n<p>two</p>');
  });
});

describe('parseStep', () => {
  const source = stepMd('abcd1234', 3);

  it('parses frontmatter, sections and the step number from the file name', () => {
    const r = parseStep(source, 'content/blocks/shop/03.md');
    expect(r.issues).toEqual([]);
    expect(r.value).toMatchObject({
      id: 'abcd1234',
      step: 3,
      title: 'Step 3',
      runner: 'web',
      description: '<p>Add an <code>h1</code> element.</p>',
    });
    expect(r.value?.tests).toEqual([
      {
        text: 'Your page should have an <code>h1</code> element.',
        code: "assert.exists(document.querySelector('h1'));",
      },
    ]);
    expect(r.value?.help).toEqual(['<p>An element has an opening and a closing tag.</p>']);
  });

  it('strips editable-region markers and records a half-open 0-based range', () => {
    const seed = [
      '<body>',
      '<p>keep</p>',
      '--editable-region--',
      '',
      '<b>x</b>',
      '--editable-region--',
      '</body>',
    ].join('\n');
    const r = parseStep(stepMd('abcd1234', 1, { seed }), 'x/01.md');
    expect(r.issues).toEqual([]);
    const file = r.value!.seed[0];
    expect(file.contents).toBe('<body>\n<p>keep</p>\n\n<b>x</b>\n</body>');
    expect(file.editable).toEqual({ start: 2, end: 4 });
    expect(file.contents.split('\n').slice(2, 4)).toEqual(['', '<b>x</b>']);
    expect(r.value!.solutions[0].editable).toBeUndefined();
  });

  it('keeps multiple files and their names', () => {
    const seed =
      '<body></body>\n```\n\n```css file=styles.css\n--editable-region--\n\n--editable-region--';
    const solutions = '<body></body>\n```\n\n```css file=styles.css\nbody { margin: 0; }';
    const r = parseStep(stepMd('abcd1234', 1, { seed, solutions }), 'x/01.md');
    expect(r.issues).toEqual([]);
    expect(r.value!.seed.map((f) => f.name)).toEqual(['index.html', 'styles.css']);
    expect(r.value!.seed[1].editable).toEqual({ start: 0, end: 1 });
  });

  it('does not treat a marker inside a code fence as a section', () => {
    const src = mutate(source, 'Add an `h1` element.', 'Example:\n\n````md\n# --seed--\n````\n');
    const r = parseStep(src, 'x/01.md');
    expect(r.issues).toEqual([]);
    expect(r.value?.description).toContain('# --seed--');
  });

  it('reports a test fence in the wrong language with its line', () => {
    const src = mutate(source, '```js\nassert', '```py\nassert');
    const r = parseStep(src, 'x/01.md');
    expect(r.value).toBeUndefined();
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0]).toMatchObject({ file: 'x/01.md', line: 15 });
    expect(r.issues[0].message).toMatch(/must use ```js/);
  });

  it('reports bad file names, unknown sections and missing sections', () => {
    expect(parseStep(source, 'x/intro.md').issues[0].message).toMatch(/named with their number/);
    const unknown = parseStep(
      mutate(source, '# --help--', '# --extras--\n\nx\n\n# --help--'),
      'x/01.md',
    );
    expect(unknown.issues[0].message).toMatch(/unknown section "--extras--"/);
    const missing = parseStep(mutate(source, '# --solutions--', '# --solution--'), 'x/01.md');
    expect(missing.issues.map((i) => i.message).join('\n')).toMatch(
      /missing section "--solutions--"/,
    );
  });

  it('reports invalid YAML frontmatter on the right line', () => {
    const r = parseStep(mutate(source, 'title: Step 3', 'title: [oops'), 'x/03.md');
    expect(r.issues[0].message).toMatch(/invalid YAML/);
    expect(r.issues[0].line).toBeGreaterThanOrEqual(2);
  });

  it('reports a fence without file= and an unclosed fence', () => {
    const noFile = parseStep(
      mutate(source, '```html file=index.html\n<body>\n--editable', '```html\n<body>\n--editable'),
      'x/01.md',
    );
    expect(noFile.issues[0].message).toMatch(/needs a file name/);
    const unclosed = parseStep(
      source.replace(/\n```\n\n# --solutions--/, '\n\n# --solutions--'),
      'x/01.md',
    );
    expect(unclosed.issues[0].message).toMatch(/code fence is never closed/);
  });

  it('reports an unmatched editable marker', () => {
    const seed = '<body>\n--editable-region--\n\n</body>';
    const r = parseStep(stepMd('abcd1234', 1, { seed }), 'x/01.md');
    expect(r.issues[0].message).toMatch(/exactly twice/);
  });
});

describe('parseLab', () => {
  const lab = `# --description--

Build it.

# --user-stories--

1. Your page has an \`h1\`.
2. Your page has a
   \`button\`.

# --hints--

Your page should have an \`h1\`.

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
<body><h1>x</h1><button>y</button></body>
\`\`\`

# --help--

## --hint--

Think about elements.
`;

  it('parses user stories (with continuation lines), the demo and the block id', () => {
    const r = parseLab(lab, ctx('web', 'index.html'));
    expect(r.issues).toEqual([]);
    expect(r.value).toMatchObject({ id: 'blk00001', runner: 'web', demo: 'index.html' });
    expect(r.value?.userStories).toEqual([
      'Your page has an <code>h1</code>.',
      'Your page has a\n<code>button</code>.',
    ]);
    expect(r.value?.seed[0].editable).toBeUndefined();
  });

  it('rejects frontmatter and a runner of none', () => {
    expect(parseLab(`---\nid: x\n---\n${lab}`, ctx('web', 'index.html')).issues[0].message).toMatch(
      /no frontmatter/,
    );
    expect(parseLab(lab, ctx('none')).issues[0].message).toMatch(/needs a runner/);
  });

  it('requires the demo to be one of the solution files', () => {
    const r = parseLab(lab, ctx('web', 'missing.html'));
    expect(r.issues[0].message).toMatch(/demo "missing.html" is not a file/);
  });
});

const ALL_SCREENS = `# --screen-- concept

Elements have **tags**.

::: tryit web
\`\`\`html file=index.html
<h1>Hi</h1>
\`\`\`
:::

## --code--

\`\`\`html file=index.html
<p>Hi</p>
\`\`\`

## --callout-- warning

Mind the slash.

# --screen-- mcq

## --question--

Pick the heading.

## --options--

- [x] \`h1\`
  > Right.
- [ ] \`p\`
  > Wrong:
  > it is a paragraph.

## --why--

Because.

# --screen-- multi

## --question--

Pick closers.

## --options--

- [x] \`</p>\`
  > Yes.
- [x] \`</h1>\`
  > Yes.
- [ ] \`<p>\`
  > No.

## --why--

Slash.

# --screen-- tapbuild

## --prompt--

Build it.

## --template--

\`\`\`html
___Hi___
\`\`\`

## --tokens--

- \`<h1>\`
- \`</h1>\`
- \`<\\h1>\`

## --answer--

- \`<h1>\`
- \`</h1>\`

## --why--

Tags.

# --screen-- typein

## --prompt--

Add a p.

## --seed-contents--

\`\`\`html file=index.html
<body>
--editable-region--

--editable-region--
</body>
\`\`\`

## --tests--

Needs a p.

\`\`\`js
assert.exists(document.querySelector('p'));
\`\`\`

## --solutions--

\`\`\`html file=index.html
<body><p>x</p></body>
\`\`\`

## --why--

Paragraph.

# --screen-- predict

## --code--

\`\`\`html file=index.html
<p>a</p><p>b</p>
\`\`\`

## --question--

How many?

## --options--

- [x] 2
  > Yes.
- [ ] 1
  > No.

## --why--

Two elements.

# --screen-- spotbug

## --code--

\`\`\`html file=index.html
<h1>Hi
\`\`\`

## --question--

What is wrong?

## --options--

- [x] No closing tag
  > Yes.
- [ ] Nothing
  > No.

## --why--

Needs close.

# --screen-- order

## --prompt--

Order them.

## --items--

- first
- second
- third

## --why--

Order.

# --screen-- match

## --prompt--

Match.

## --pairs--

- \`h1\`
  - Heading
- \`p\`
  - Paragraph

## --why--

Jobs.

# --screen-- widget

## --widget-- escalation-slider

\`\`\`json
{ "deadlineHours": 24 }
\`\`\`

# --screen-- flashcard

## --question--

Three parts?

## --answer--

Open, content, close.

# --screen-- checklist

## --items--

- Install Python.
  - command: \`python --version\`
  - pattern: \`^Python 3\\.1[1-3]\`
  - hint: Too old.
- Make a folder.
`;

describe('parseLesson', () => {
  it('parses every screen type', () => {
    const r = parseLesson(ALL_SCREENS, ctx());
    expect(r.issues).toEqual([]);
    const screens = r.value!.screens;
    expect(screens.map((s) => s.type)).toEqual([
      'concept',
      'mcq',
      'multi',
      'tapbuild',
      'typein',
      'predict',
      'spotbug',
      'order',
      'match',
      'widget',
      'flashcard',
      'checklist',
    ]);
    expect(r.value!.id).toBe('blk00001');
  });

  it('concept: body, code, tryit and callout', () => {
    const [concept] = parseLesson(ALL_SCREENS, ctx()).value!.screens;
    expect(concept).toMatchObject({
      type: 'concept',
      body: '<p>Elements have <strong>tags</strong>.</p>',
      code: { lang: 'html', name: 'index.html', contents: '<p>Hi</p>' },
      tryit: {
        runner: 'web',
        files: [{ name: 'index.html', lang: 'html', contents: '<h1>Hi</h1>' }],
      },
      callout: { kind: 'warning', html: '<p>Mind the slash.</p>' },
    });
  });

  it('mcq and multi: correct flags and feedback', () => {
    const screens = parseLesson(ALL_SCREENS, ctx()).value!.screens;
    const mcq = screens[1];
    const multi = screens[2];
    if (mcq.type !== 'mcq' || multi.type !== 'multi') throw new Error('unexpected screen types');
    expect(mcq.options.map((o) => o.correct)).toEqual([true, false]);
    expect(mcq.options[0]).toEqual({ html: '<code>h1</code>', correct: true, feedback: 'Right.' });
    expect(mcq.options[1].feedback).toBe('Wrong:\nit is a paragraph.');
    expect(multi.options.filter((o) => o.correct)).toHaveLength(2);
  });

  it('tapbuild: unwraps backticked tokens', () => {
    const tap = parseLesson(ALL_SCREENS, ctx()).value!.screens[3];
    expect(tap).toMatchObject({
      type: 'tapbuild',
      template: { lang: 'html', contents: '___Hi___' },
      tokens: ['<h1>', '</h1>', '<\\h1>'],
      answer: ['<h1>', '</h1>'],
    });
  });

  it('typein, predict, spotbug', () => {
    const screens = parseLesson(ALL_SCREENS, ctx()).value!.screens;
    const typein = screens[4];
    if (typein.type !== 'typein') throw new Error('expected typein');
    expect(typein.seed[0].editable).toEqual({ start: 1, end: 2 });
    expect(typein.tests[0].code).toBe("assert.exists(document.querySelector('p'));");
    expect(typein.solutions[0].contents).toBe('<body><p>x</p></body>');
    expect(screens[5]).toMatchObject({
      type: 'predict',
      code: { lang: 'html', contents: '<p>a</p><p>b</p>' },
    });
    expect(screens[6]).toMatchObject({ type: 'spotbug' });
  });

  it('order, match, widget, flashcard, checklist', () => {
    const screens = parseLesson(ALL_SCREENS, ctx()).value!.screens;
    expect(screens[7]).toMatchObject({ items: ['first', 'second', 'third'] });
    expect(screens[8]).toMatchObject({
      pairs: [
        { left: '<code>h1</code>', right: 'Heading' },
        { left: '<code>p</code>', right: 'Paragraph' },
      ],
    });
    expect(screens[9]).toEqual({
      type: 'widget',
      name: 'escalation-slider',
      props: { deadlineHours: 24 },
    });
    expect(screens[10]).toMatchObject({
      type: 'flashcard',
      answer: '<p>Open, content, close.</p>',
    });
    expect(screens[11]).toMatchObject({
      type: 'checklist',
      items: [
        {
          html: 'Install Python.',
          check: { command: 'python --version', pattern: '^Python 3\\.1[1-3]', hint: 'Too old.' },
        },
        { html: 'Make a folder.' },
      ],
    });
  });

  it('reports unknown screen types, missing subsections and stray text', () => {
    expect(parseLesson('# --screen-- poll\n\nx', ctx()).issues[0].message).toMatch(
      /unknown screen type "poll"/,
    );
    const noWhy = parseLesson(ALL_SCREENS.replace('## --why--\n\nBecause.\n', ''), ctx());
    expect(noWhy.issues[0].message).toMatch(/missing section "--why--" in a mcq screen/);
    const stray = parseLesson(
      '# --screen-- flashcard\n\nstray text\n\n## --question--\n\nq\n\n## --answer--\n\na',
      ctx(),
    );
    expect(stray.issues[0]).toMatchObject({ line: 3 });
    expect(stray.issues[0].message).toMatch(/text before the first section marker/);
  });

  it('reports bad options and bad widget props with lines', () => {
    const noFeedback = parseLesson(
      '# --screen-- mcq\n\n## --question--\n\nq\n\n## --options--\n\n- [x] a\n- [ ] b\n  > no\n\n## --why--\n\nw',
      ctx(),
    );
    expect(noFeedback.issues[0]).toMatchObject({ line: 9 });
    expect(noFeedback.issues[0].message).toMatch(/missing its feedback/);
    const badJson = parseLesson(
      '# --screen-- widget\n\n## --widget-- x-y\n\n```json\n{ nope }\n```\n',
      ctx(),
    );
    expect(badJson.issues[0].message).toMatch(/not valid JSON/);
  });

  it('typein needs a runner', () => {
    const r = parseLesson(ALL_SCREENS, ctx('none'));
    expect(r.issues.map((i) => i.message).join('\n')).toMatch(/typein screen needs a runner/);
  });

  it('maps schema errors to the screen section line', () => {
    const r = parseLesson(ALL_SCREENS.replace('- [x] `h1`', '- [ ] `h1`'), ctx());
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0].message).toMatch(
      /screens\.1\.options: mcq needs exactly one correct option/,
    );
    expect(ALL_SCREENS.split('\n')[r.issues[0].line - 1]).toBe('## --options--');
  });
});

describe('parseQuiz', () => {
  it('parses draw, pass and questions, with ids derived from the text', () => {
    const r = parseQuiz(quizMd(1, 1, ['What is `h1`?']), ctx('none'));
    expect(r.issues).toEqual([]);
    const q = r.value!.questions[0];
    expect(r.value).toMatchObject({ id: 'blk00001', draw: 1, pass: 1 });
    expect(q).toMatchObject({
      text: '<p>What is <code>h1</code>?</p>',
      distractors: ['Wrong one', 'Wrong two'],
      answer: 'Right',
      explanation: '<p>Because.</p>',
    });
    expect(q.id).toBe(questionId('What is `h1`?'));
    expect(q.id).toMatch(/^[0-9a-f]{8}$/);
  });

  it('gives the same id when only whitespace changes, and a new id when the words change', () => {
    expect(questionId('What  is\n  `h1`?')).toBe(questionId('What is `h1`?'));
    expect(questionId('What is `h2`?')).not.toBe(questionId('What is `h1`?'));
  });

  it('reports a missing frontmatter key on its line', () => {
    const r = parseQuiz(quizMd(1, 1, ['q?']).replace('pass: 1\n', ''), ctx('none'));
    expect(r.issues[0].message).toMatch(/frontmatter pass/);
  });

  it('reports a question with a missing section', () => {
    const r = parseQuiz(
      quizMd(1, 1, ['q?']).replace('### --explanation--\n\nBecause.\n', ''),
      ctx('none'),
    );
    expect(r.issues[0].message).toMatch(/missing section "--explanation--" in a question/);
  });
});

describe('parseReview and parseProject', () => {
  it('keeps html and tryit segments in reading order', () => {
    const r = parseReview(
      'Intro\n\n::: tryit web\n```html file=index.html\n<h1>x</h1>\n```\n:::\n\n### After\n\nDone',
      ctx('none'),
    );
    expect(r.issues).toEqual([]);
    expect(r.value!.body.map((s) => s.type)).toEqual(['html', 'tryit', 'html']);
    expect(r.value!.body[2]).toMatchObject({ html: expect.stringContaining('<h3>After</h3>') });
  });

  it('rejects markers in a review and an unclosed tryit', () => {
    expect(parseReview('# --description--\n\nx', ctx('none')).issues[0].message).toMatch(
      /plain markdown/,
    );
    expect(
      parseReview('::: tryit web\n```html file=a.html\nx\n```\n', ctx('none')).issues[0].message,
    ).toMatch(/never closed/);
  });

  it('parses a project', () => {
    const r = parseProject(
      '---\nciJob: lab-setup\n---\n\n# --user-stories--\n\n1. One.\n2. Two.\n\n# --instructions--\n\nDo it.\n',
      ctx('none'),
    );
    expect(r.issues).toEqual([]);
    expect(r.value).toMatchObject({
      ciJob: 'lab-setup',
      userStories: ['One.', 'Two.'],
      instructions: '<p>Do it.</p>',
    });
  });

  it('flags a ciJob that is not lab-<name>', () => {
    const r = parseProject(
      '---\nciJob: setup\n---\n\n# --user-stories--\n\n1. One.\n\n# --instructions--\n\nDo it.\n',
      ctx('none'),
    );
    expect(r.issues[0].message).toMatch(/ciJob: must look like "lab-setup"/);
  });
});
