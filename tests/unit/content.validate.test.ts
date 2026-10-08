import { describe, expect, it } from 'vitest';
import { formatIssues, loadContent, type ContentFiles } from '../../src/content/validate';
import {
  IDS,
  LAB,
  LESSON,
  PROJECT,
  REVIEW,
  baseTree,
  meta,
  mutate,
  quizMd,
  stepMd,
} from './content.helpers';

/** Load a tree and return the formatted issues. */
function check(files: ContentFiles): string[] {
  return formatIssues(loadContent(files).issues).split('\n').filter(Boolean);
}

function broken(edit: (tree: ContentFiles) => void): string[] {
  const tree = baseTree();
  edit(tree);
  return check(tree);
}

function expectOne(issues: string[], pattern: RegExp) {
  expect(
    issues.filter((i) => pattern.test(i)),
    issues.join('\n'),
  ).toHaveLength(1);
}

describe('validation: baseline', () => {
  it('accepts a valid tree with one block of each type', () => {
    expect(check(baseTree())).toEqual([]);
    expect(loadContent(baseTree()).blocks.size).toBe(7);
  });

  it('formats issues as file:line: message', () => {
    const issues = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = LESSON.replace('- [x] `h1`', '- [ ] `h1`');
    });
    expect(issues[0]).toMatch(/^content\/blocks\/lesson-a\/lesson\.md:\d+: screens\.1\.options: /);
  });
});

describe('validation: ids unique across all content', () => {
  it('flags a step id reused from another step', () => {
    const issues = broken((t) => {
      t['blocks/shop-a/02.md'] = stepMd(IDS.step1, 2);
    });
    expectOne(issues, /02\.md:\d+: id "bbbb0001".*already used by step 1 of "shop-a"/);
  });

  it('flags a block id reused as a step id', () => {
    const issues = broken((t) => {
      t['blocks/shop-a/02.md'] = stepMd(IDS.lesson, 2);
    });
    expectOne(issues, /id "aaaa0001".*already used by block "lesson-a"/);
  });

  it('flags two questions with the same text', () => {
    const issues = broken((t) => {
      t['blocks/quiz-a/quiz.md'] = quizMd(2, 2, ['Same?', 'Same?', 'Other?']);
    });
    expectOne(issues, /quiz\.md:\d+: id "[0-9a-f]{8}".*already used by question 1/);
  });

  it('flags two blocks with one id', () => {
    const issues = broken((t) => {
      t['blocks/review-a/meta.json'] = meta({
        id: IDS.lesson,
        slug: 'review-a',
        type: 'review',
        title: 'R',
        runner: 'none',
      });
    });
    expectOne(issues, /review-a\/meta\.json:\d+: id "aaaa0001"/);
  });
});

describe('validation: lesson screens', () => {
  const mcq = (options: string) =>
    `# --screen-- mcq\n\n## --question--\n\nq\n\n## --options--\n\n${options}\n\n## --why--\n\nw\n`;

  it('mcq needs exactly one correct option', () => {
    const two = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = mcq('- [x] a\n  > y\n- [x] b\n  > y');
    });
    expectOne(two, /mcq needs exactly one correct option \(\[x\]\), found 2/);
    const none = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = mcq('- [ ] a\n  > n\n- [ ] b\n  > n');
    });
    expectOne(none, /found 0/);
  });

  it('predict and spotbug need exactly one correct option too', () => {
    const predict = (type: string) =>
      `# --screen-- ${type}\n\n## --code--\n\n\`\`\`html\n<p>a</p>\n\`\`\`\n\n## --question--\n\nq\n\n## --options--\n\n- [x] a\n  > y\n- [x] b\n  > y\n\n## --why--\n\nw\n`;
    for (const type of ['predict', 'spotbug']) {
      const issues = broken((t) => {
        t['blocks/lesson-a/lesson.md'] = predict(type);
      });
      expectOne(issues, new RegExp(`${type} needs exactly one correct option`));
    }
  });

  it('multi needs at least one correct option, and accepts several', () => {
    const none = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = mcq('- [ ] a\n  > n\n- [ ] b\n  > n').replace(
        'mcq',
        'multi',
      );
    });
    expectOne(none, /multi needs at least one correct option/);
    const many = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = mcq('- [x] a\n  > y\n- [x] b\n  > y').replace(
        'mcq',
        'multi',
      );
    });
    expect(many).toEqual([]);
  });

  const tap = (template: string, tokens: string[], answer: string[]) =>
    `# --screen-- tapbuild\n\n## --prompt--\n\np\n\n## --template--\n\n\`\`\`html\n${template}\n\`\`\`\n\n## --tokens--\n\n${tokens
      .map((x) => `- \`${x}\``)
      .join(
        '\n',
      )}\n\n## --answer--\n\n${answer.map((x) => `- \`${x}\``).join('\n')}\n\n## --why--\n\nw\n`;

  it('tapbuild answer tokens must be in the token list', () => {
    const issues = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = tap('___x___', ['<h1>', '</h1>'], ['<h1>', '</p>']);
    });
    expectOne(issues, /answer token "<\/p>" is not in the token list/);
  });

  it('tapbuild answer cannot use a token more often than it is listed', () => {
    const issues = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = tap('___x___', ['<h1>', '</h1>'], ['<h1>', '<h1>']);
    });
    expectOne(issues, /answer token "<h1>" is not in the token list \(or is used more times/);
    const twice = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = tap('___x___', ['<p>', '<p>'], ['<p>', '<p>']);
    });
    expect(twice).toEqual([]);
  });

  it('tapbuild blank count must equal the answer length', () => {
    const issues = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = tap('___x___y___', ['<h1>', '</h1>'], ['<h1>', '</h1>']);
    });
    expectOne(issues, /template has 3 blanks but the answer has 2 tokens/);
  });

  it('tapbuild rejects a longer run of underscores', () => {
    const issues = broken((t) => {
      t['blocks/lesson-a/lesson.md'] = tap('____x', ['<h1>', '</h1>'], ['<h1>']);
    });
    expectOne(issues, /exactly three underscores/);
  });

  it('order items and match right sides must differ; checklist patterns must compile', () => {
    expectOne(
      broken((t) => {
        t['blocks/lesson-a/lesson.md'] =
          '# --screen-- order\n\n## --prompt--\n\np\n\n## --items--\n\n- a\n- a\n\n## --why--\n\nw\n';
      }),
      /order items must all be different/,
    );
    expectOne(
      broken((t) => {
        t['blocks/lesson-a/lesson.md'] =
          '# --screen-- match\n\n## --prompt--\n\np\n\n## --pairs--\n\n- a\n  - same\n- b\n  - same\n\n## --why--\n\nw\n';
      }),
      /right-hand side of each pair must be different/,
    );
    expectOne(
      broken((t) => {
        t['blocks/lesson-a/lesson.md'] =
          '# --screen-- checklist\n\n## --items--\n\n- Do it\n  - command: `x`\n  - pattern: `(`\n  - hint: h\n';
      }),
      /not a valid regular expression/,
    );
  });

  it('typein needs exactly one editable region and a matching solution', () => {
    const typein = (seed: string, solution: string) =>
      `# --screen-- typein\n\n## --prompt--\n\np\n\n## --seed-contents--\n\n\`\`\`html file=index.html\n${seed}\n\`\`\`\n\n## --tests--\n\nm\n\n\`\`\`js\nassert.ok(true);\n\`\`\`\n\n## --solutions--\n\n\`\`\`html file=${solution}\nx\n\`\`\`\n\n## --why--\n\nw\n`;
    expectOne(
      broken((t) => {
        t['blocks/lesson-a/lesson.md'] = typein('<p></p>', 'index.html');
      }),
      /typein screen needs exactly one editable region, found 0/,
    );
    expectOne(
      broken((t) => {
        t['blocks/lesson-a/lesson.md'] = typein(
          '--editable-region--\n\n--editable-region--',
          'other.html',
        );
      }),
      /solutions and seed must contain the same files/,
    );
  });
});

describe('validation: quiz and exam', () => {
  it('pass must not exceed draw', () => {
    expectOne(
      broken((t) => {
        t['blocks/quiz-a/quiz.md'] = quizMd(2, 3, ['a?', 'b?', 'c?']);
      }),
      /pass \(3\) must not be more than draw \(2\)/,
    );
  });

  it('draw must not exceed the pool size', () => {
    expectOne(
      broken((t) => {
        t['blocks/quiz-a/quiz.md'] = quizMd(4, 2, ['a?', 'b?', 'c?']);
      }),
      /draw \(4\) must not be more than the number of questions \(3\)/,
    );
  });

  it('pass = draw = pool size is allowed', () => {
    expect(
      broken((t) => {
        t['blocks/quiz-a/quiz.md'] = quizMd(3, 3, ['a?', 'b?', 'c?']);
      }),
    ).toEqual([]);
  });

  it('an exam must pass at 80% or more of draw', () => {
    expectOne(
      broken((t) => {
        t['blocks/exam-a/quiz.md'] = quizMd(5, 3, ['a?', 'b?', 'c?', 'd?', 'e?']);
      }),
      /an exam passes at 80% or more/,
    );
  });
});

describe('validation: workshops', () => {
  it('steps must be numbered contiguously from 01', () => {
    expectOne(
      broken((t) => {
        delete t['blocks/shop-a/02.md'];
        t['blocks/shop-a/03.md'] = stepMd('bbbb0003', 3);
      }),
      /03\.md:1: steps must be numbered 01, 02, 03\.\.\. without gaps: expected 02\.md before 03\.md/,
    );
    expectOne(
      broken((t) => {
        delete t['blocks/shop-a/01.md'];
      }),
      /02\.md:1: steps must start at 01/,
    );
  });

  it('the step title must match the file name and the runner must match meta.json', () => {
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = mutate(
          stepMd(IDS.step2, 2),
          'title: Step 2',
          'title: Second step',
        );
      }),
      /title must be "Step 2"/,
    );
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = mutate(
          stepMd(IDS.step2, 2),
          'runner: web',
          'runner: python',
        ).replace(/```js/, '```py');
      }),
      /step runner "python" must match the block runner "web"/,
    );
  });

  it('every step needs solutions', () => {
    const noSolutions = mutate(
      stepMd(IDS.step2, 2),
      /# --solutions--[\s\S]*?(?=# --help--)/.exec(stepMd(IDS.step2, 2))![0],
      '',
    );
    const issues = broken((t) => {
      t['blocks/shop-a/02.md'] = noSolutions;
    });
    expectOne(issues, /missing section "--solutions--"/);
  });

  it('solutions must list the same files as the seed', () => {
    const src = stepMd(IDS.step2, 2).replace(
      /```html file=index.html\n<body>\n  <h1>Hi/,
      '```html file=other.html\n<body>\n  <h1>Hi',
    );
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = src;
      }),
      /solutions and seed must contain the same files \(missing in solutions: index\.html\) \(not in seed: other\.html\)/,
    );
  });

  it('a step needs exactly one editable region', () => {
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = stepMd(IDS.step2, 2, { seed: '<body>\n</body>' });
      }),
      /a step needs exactly one editable region, found 0/,
    );
    expectOne(
      broken((t) => {
        const region = '--editable-region--\n\n--editable-region--';
        t['blocks/shop-a/02.md'] = stepMd(IDS.step2, 2, {
          seed: `<body>\n${region}\n</body>\n\`\`\`\n\n\`\`\`css file=more.css\n${region}`,
          solutions: '<body>\n  <h1>Hi</h1>\n</body>\n```\n\n```css file=more.css\nh1 {}',
        });
      }),
      /a step needs exactly one editable region, found 2/,
    );
  });

  it('an editable region must contain a line', () => {
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = stepMd(IDS.step2, 2, {
          seed: '<body>\n--editable-region--\n--editable-region--\n</body>',
        });
      }),
      /the editable region must contain at least one line/,
    );
  });

  it('a step has at most three hints', () => {
    const src = mutate(
      stepMd(IDS.step2, 2),
      'An element has an opening and a closing tag.\n',
      'one\n\n## --hint--\n\ntwo\n\n## --hint--\n\nthree\n\n## --hint--\n\nfour\n',
    );
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = src;
      }),
      /help: at most three hints/,
    );
  });

  it('test fences must match the runner language', () => {
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = stepMd(IDS.step2, 2).replace('```js', '```py');
      }),
      /test blocks for runner "web" must use ```js \(found "py"\)/,
    );
    const pyStep = stepMd('cccc0002', 1, {
      seed: 'print("a")\n--editable-region--\n\n--editable-region--',
      solutions: 'print("a")\nprint("b")',
    })
      .replace('runner: web', 'runner: python')
      .replace(/file=index\.html/g, 'file=main.py');
    const tree = {
      ...baseTree(),
      'curriculum.json': JSON.stringify({
        tracks: [
          {
            id: 'B',
            title: 'B',
            chapters: [
              {
                id: 'B1',
                title: 'x',
                blocks: [
                  'lesson-a',
                  'shop-a',
                  'lab-a',
                  'quiz-a',
                  'exam-a',
                  'review-a',
                  'project-a',
                  'py-a',
                ],
              },
            ],
          },
        ],
      }),
      'blocks/py-a/meta.json': meta({
        id: 'cccc0001',
        slug: 'py-a',
        type: 'workshop',
        title: 'P',
        runner: 'python',
      }),
      'blocks/py-a/01.md': pyStep,
    };
    // The step still has a ```js test block, which is wrong for python.
    expectOne(
      check(tree),
      /py-a\/01\.md:\d+: test blocks for runner "python" must use ```py \(found "js"\)/,
    );
    // With a ```py block it passes.
    tree['blocks/py-a/01.md'] = pyStep.replace(
      "```js\nassert.exists(document.querySelector('h1'));",
      '```py\nassert prints("a")',
    );
    expect(check(tree)).toEqual([]);
  });

  it('js tests must parse', () => {
    expectOne(
      broken((t) => {
        t['blocks/shop-a/02.md'] = stepMd(IDS.step2, 2).replace(
          "assert.exists(document.querySelector('h1'));",
          'assert.exists(;',
        );
      }),
      /test code has a syntax error/,
    );
  });
});

describe('validation: labs and block files', () => {
  it('a web lab needs a demo that names a solution file', () => {
    expectOne(
      broken((t) => {
        t['blocks/lab-a/meta.json'] = meta({
          id: IDS.lab,
          slug: 'lab-a',
          type: 'lab',
          title: 'L',
          runner: 'web',
        });
      }),
      /a web lab needs "demo"/,
    );
    expectOne(
      broken((t) => {
        t['blocks/lab-a/meta.json'] = meta({
          id: IDS.lab,
          slug: 'lab-a',
          type: 'lab',
          title: 'L',
          runner: 'web',
          demo: 'nope.html',
        });
      }),
      /demo: demo "nope.html" is not a file in the solutions/,
    );
  });

  it('a lab needs user stories', () => {
    expectOne(
      broken((t) => {
        t['blocks/lab-a/lab.md'] = LAB.replace(/# --user-stories--[\s\S]*?(?=# --hints--)/, '');
      }),
      /missing section "--user-stories--"/,
    );
  });

  it('workshops and labs cannot have runner none', () => {
    const issues = broken((t) => {
      t['blocks/shop-a/meta.json'] = meta({
        id: IDS.shop,
        slug: 'shop-a',
        type: 'workshop',
        title: 'W',
        runner: 'none',
      });
    });
    expectOne(issues, /a workshop needs a runner/);
  });

  it('flags a missing, extra or misnamed block file', () => {
    expectOne(
      broken((t) => {
        delete t['blocks/review-a/review.md'];
      }),
      /review-a\/meta\.json:1: missing review\.md/,
    );
    expectOne(
      broken((t) => {
        t['blocks/review-a/notes.md'] = 'x';
      }),
      /notes\.md:1: unexpected file in a review block/,
    );
    expectOne(
      broken((t) => {
        t['blocks/shop-a/intro.md'] = 'x';
      }),
      /intro\.md:1: unexpected file in a workshop block/,
    );
  });

  it('the slug must equal the folder name; meta keys are strict', () => {
    expectOne(
      broken((t) => {
        t['blocks/review-a/meta.json'] = meta({
          id: IDS.review,
          slug: 'other',
          type: 'review',
          title: 'R',
          runner: 'none',
        });
      }),
      /slug "other" must equal the folder name "review-a"/,
    );
    expectOne(
      broken((t) => {
        t['blocks/review-a/meta.json'] = meta({
          id: IDS.review,
          slug: 'review-a',
          type: 'review',
          title: 'R',
          runner: 'none',
          colour: 'red',
        });
      }),
      /Unrecognized key/,
    );
  });

  it('a block folder needs meta.json', () => {
    expectOne(
      broken((t) => {
        delete t['blocks/review-a/meta.json'];
      }),
      /block folder has no meta\.json/,
    );
  });

  it('project ci jobs are unique', () => {
    const issues = broken((t) => {
      t['blocks/lesson-a/meta.json'] = meta({
        id: IDS.lesson,
        slug: 'lesson-a',
        type: 'project',
        title: 'P2',
        runner: 'none',
      });
      t['blocks/lesson-a/project.md'] = PROJECT;
      delete t['blocks/lesson-a/lesson.md'];
    });
    expectOne(issues, /ciJob "lab-setup" is already used by project/);
  });

  it('review and lesson files must not carry frontmatter', () => {
    expectOne(
      broken((t) => {
        t['blocks/review-a/review.md'] = `---\ntitle: x\n---\n${REVIEW}`;
      }),
      /review\.md takes no frontmatter/,
    );
  });
});

describe('validation: curriculum', () => {
  it('every listed slug must have a folder', () => {
    const issues = broken((t) => {
      t['curriculum.json'] = mutate(t['curriculum.json'], '"project-a"', '"project-a",\n"ghost"');
    });
    expectOne(
      issues,
      /curriculum\.json:\d+: block "ghost" is listed in B1 but content\/blocks\/ghost\/ does not exist/,
    );
  });

  it('every block folder must be listed', () => {
    const issues = broken((t) => {
      t['curriculum.json'] = JSON.stringify({
        tracks: [
          {
            id: 'B',
            title: 'B',
            chapters: [
              {
                id: 'B1',
                title: 'x',
                blocks: ['lesson-a', 'shop-a', 'lab-a', 'quiz-a', 'exam-a', 'review-a'],
              },
            ],
          },
        ],
      });
    });
    expectOne(
      issues,
      /project-a\/meta\.json:1: block "project-a" is not listed in curriculum\.json/,
    );
  });

  it('track Z must be a fixture; chapter ids must start with the track id; slugs are listed once', () => {
    const tree = (track: object) => ({
      ...baseTree(),
      'curriculum.json': JSON.stringify({ tracks: [track] }),
    });
    const chapter = { id: 'Z1', title: 'x', blocks: ['lesson-a'] };
    expect(check(tree({ id: 'Z', title: 'Z', chapters: [chapter] })).join('\n')).toMatch(
      /must set "fixture": true/,
    );
    expect(check(tree({ id: 'B', title: 'B', chapters: [chapter] })).join('\n')).toMatch(
      /chapter id "Z1" must start with its track id "B"/,
    );
    expect(
      check(
        tree({
          id: 'B',
          title: 'B',
          chapters: [{ id: 'B1', title: 'x', blocks: ['lesson-a', 'lesson-a'] }],
        }),
      ).join('\n'),
    ).toMatch(/block "lesson-a" is listed more than once/);
  });

  it('reports invalid JSON with a line', () => {
    const issues = broken((t) => {
      t['curriculum.json'] = '{\n  "tracks": [\n';
    });
    expect(issues[0]).toMatch(/curriculum\.json:\d+: invalid JSON/);
  });

  it('flags unexpected files at the top of content/', () => {
    expectOne(
      broken((t) => {
        t['notes.txt'] = 'x';
      }),
      /content\/notes\.txt:1: unexpected file/,
    );
  });
});
