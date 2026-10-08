/**
 * Creates content files with a fresh, unused 8-char id.
 *
 *   npm run new:step -- <slug>          add the next step (NN.md) to the workshop block <slug>
 *   npm run new:step -- --block <slug> --type <type> --title "Build a Recipe Page" --runner web --est 20
 *                       [--chapter B1] [--source "course-content.md:1542-1798"] [--demo index.html]
 *                                       create a block folder (meta.json + a starter file)
 *   npm run new:step -- --id [count]    just print fresh ids
 *
 * New files validate as they are, with TODO text where you write the content.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { randomId } from '../src/content/ids';
import { parseStep } from '../src/content/parse';
import {
  BLOCK_TYPES,
  RUNNERS,
  type BlockType,
  type Runner,
  type SeedFile,
} from '../src/content/schema';
import { CONTENT_DIR, readContentDir } from './lib/disk';

const USAGE = `Creates content files with a fresh, unused 8-char id.

  npm run new:step -- <slug>          add the next step (NN.md) to the workshop block <slug>
  npm run new:step -- --block <slug> --type <type> --title "Build a Recipe Page" --runner web --est 20
                      [--chapter B1] [--source "course-content.md:1542-1798"] [--demo index.html]
                                      create a block folder (meta.json + a starter file)
  npm run new:step -- --id [count]    just print fresh ids

New files validate as they are, with TODO text where you write the content.`;

function fail(message: string): never {
  console.error(`new:step: ${message}`);
  process.exit(1);
}

function freshIds(count: number): string[] {
  const text = Object.values(readContentDir()).join('\n');
  const made: string[] = [];
  while (made.length < count) {
    const id = randomId((max) => randomInt(max));
    if (!text.includes(id) && !made.includes(id)) made.push(id);
  }
  return made;
}

// ---------------------------------------------------------------------------
// Step skeletons

const STARTERS: Record<
  Exclude<Runner, 'none'>,
  { file: string; lang: string; testLang: string; test: string; solution: string }
> = {
  web: {
    file: 'index.html',
    lang: 'html',
    testLang: 'js',
    test: "assert.exists(document.querySelector('h1'));",
    solution: '<h1>TODO</h1>',
  },
  python: {
    file: 'main.py',
    lang: 'python',
    testLang: 'py',
    test: "assert prints('TODO')",
    solution: "print('TODO')",
  },
  sql: {
    file: 'query.sql',
    lang: 'sql',
    testLang: 'js',
    test: "const result = await db.query('select 1 as one');\nassert.equal(result.rows[0].one, 1);",
    solution: 'select 1 as one;',
  },
  fastapi: {
    file: 'main.py',
    lang: 'python',
    testLang: 'py',
    test: 'response = await client.get("/")\nassert response.status_code == 200',
    solution: 'from fastapi import FastAPI\n\napp = FastAPI()',
  },
};

const MARKER = '--editable-region--';

function fence(file: SeedFile): string {
  return '```' + `${file.lang} file=${file.name}\n${file.contents}\n` + '```';
}

function stepSkeleton(
  id: string,
  n: number,
  runner: Exclude<Runner, 'none'>,
  previous: SeedFile[] | null,
): string {
  const starter = STARTERS[runner];
  const solutions: SeedFile[] = previous
    ? previous.map((f, i) =>
        i === 0
          ? { ...f, contents: `${f.contents}\n${runner === 'web' ? '<!-- TODO -->' : '# TODO'}` }
          : f,
      )
    : [{ name: starter.file, lang: starter.lang, contents: starter.solution }];
  const seed: SeedFile[] = previous
    ? previous.map((f, i) =>
        i === 0 ? { ...f, contents: `${f.contents}\n${MARKER}\n\n${MARKER}` } : f,
      )
    : [{ name: starter.file, lang: starter.lang, contents: `${MARKER}\n\n${MARKER}` }];
  return [
    '---',
    `id: ${id}`,
    `title: Step ${n}`,
    `runner: ${runner}`,
    '---',
    '',
    '# --description--',
    '',
    'TODO: say what to do, in one or two sentences.',
    '',
    '# --hints--',
    '',
    'TODO: the message shown when this test fails.',
    '',
    '```' + starter.testLang,
    starter.test,
    '```',
    '',
    '# --seed--',
    '',
    '## --seed-contents--',
    '',
    ...seed.flatMap((f) => [fence(f), '']),
    '# --solutions--',
    '',
    ...solutions.flatMap((f) => [fence(f), '']),
    '# --help--',
    '',
    '## --hint--',
    '',
    'TODO: a hint that points at the idea without giving the code.',
    '',
  ].join('\n');
}

function addStep(slug: string) {
  const dir = join(CONTENT_DIR, 'blocks', slug);
  const metaPath = join(dir, 'meta.json');
  if (!existsSync(metaPath)) fail(`no block "${slug}" (expected ${metaPath})`);
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as { type: BlockType; runner: Runner };
  if (meta.type !== 'workshop')
    fail(`block "${slug}" is a ${meta.type}; steps only belong in workshops`);
  if (meta.runner === 'none')
    fail(`block "${slug}" has runner "none"; set a runner in meta.json first`);
  const existing = readdirSync(dir)
    .filter((n) => /^\d{2,3}\.md$/.test(n))
    .sort();
  const n = existing.length === 0 ? 1 : Number(existing[existing.length - 1].slice(0, -3)) + 1;
  const name = `${String(n).padStart(2, '0')}.md`;
  let previous: SeedFile[] | null = null;
  if (existing.length > 0) {
    const last = existing[existing.length - 1];
    const parsed = parseStep(readFileSync(join(dir, last), 'utf8'), last);
    previous = parsed.value?.solutions ?? null;
  }
  const [id] = freshIds(1);
  writeFileSync(join(dir, name), stepSkeleton(id, n, meta.runner, previous));
  console.log(`created content/blocks/${slug}/${name} (id ${id})`);
  if (previous)
    console.log("seed starts from the previous step's solution; edit the region and the solution.");
}

// ---------------------------------------------------------------------------
// Block skeletons

function starterFor(
  type: Exclude<BlockType, 'workshop'>,
  slug: string,
  runner: Runner,
): { file: string; text: string } {
  const run: Exclude<Runner, 'none'> = runner === 'none' ? 'web' : runner;
  const starter = STARTERS[run];
  switch (type) {
    case 'lesson':
      return {
        file: 'lesson.md',
        text: '# --screen-- concept\n\nTODO: one idea, at most 60 words.\n',
      };
    case 'review':
      return { file: 'review.md', text: 'TODO: a short summary of the chapter.\n' };
    case 'quiz':
    case 'exam': {
      const text = 'TODO: question text?';
      return {
        file: 'quiz.md',
        text: [
          '---',
          'draw: 1',
          'pass: 1',
          '---',
          '',
          '## --question--',
          '',
          '### --text--',
          '',
          text,
          '',
          '### --distractors--',
          '',
          '- TODO: wrong answer one',
          '- TODO: wrong answer two',
          '',
          '### --answer--',
          '',
          'TODO: the right answer',
          '',
          '### --explanation--',
          '',
          'TODO: why it is right.',
          '',
        ].join('\n'),
      };
    }
    case 'project':
      return {
        file: 'project.md',
        text: [
          '---',
          `ciJob: lab-${slug}`,
          '---',
          '',
          '# --user-stories--',
          '',
          '1. TODO: what the repo must do.',
          '',
          '# --instructions--',
          '',
          'TODO: how to set up and submit.',
          '',
        ].join('\n'),
      };
    case 'lab':
      return {
        file: 'lab.md',
        text: [
          '# --description--',
          '',
          'TODO: build something that works like the example.',
          '',
          '# --user-stories--',
          '',
          '1. TODO: the first thing it must do.',
          '',
          '# --hints--',
          '',
          'TODO: the message shown when this test fails.',
          '',
          '```' + starter.testLang,
          starter.test,
          '```',
          '',
          '# --seed--',
          '',
          '## --seed-contents--',
          '',
          fence({ name: starter.file, lang: starter.lang, contents: '' }),
          '',
          '# --solutions--',
          '',
          fence({ name: starter.file, lang: starter.lang, contents: starter.solution }),
          '',
          '# --help--',
          '',
          '## --hint--',
          '',
          'TODO: a conceptual hint, never the answer.',
          '',
        ].join('\n'),
      };
  }
}

function addBlock(values: Record<string, string | boolean | undefined>) {
  const slug = String(values.block);
  const type = String(values.type ?? '') as BlockType;
  const runner = String(values.runner ?? 'none') as Runner;
  const title = typeof values.title === 'string' ? values.title : '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    fail(`slug "${slug}" must be lowercase words joined by hyphens`);
  if (!(BLOCK_TYPES as readonly string[]).includes(type))
    fail(`--type must be one of: ${BLOCK_TYPES.join(', ')}`);
  if (!(RUNNERS as readonly string[]).includes(runner))
    fail(`--runner must be one of: ${RUNNERS.join(', ')}`);
  if (!title) fail('--title is required');
  if ((type === 'workshop' || type === 'lab') && runner === 'none')
    fail(`a ${type} needs --runner web|python|sql|fastapi`);
  const est = Number(values.est ?? 10);
  if (!Number.isInteger(est) || est <= 0) fail('--est must be a positive whole number of minutes');

  const dir = join(CONTENT_DIR, 'blocks', slug);
  if (existsSync(dir)) fail(`content/blocks/${slug}/ already exists`);

  const curriculumPath = join(CONTENT_DIR, 'curriculum.json');
  let curriculum: { tracks: { chapters: { id: string; blocks: string[] }[] }[] } | undefined;
  const chapterId = typeof values.chapter === 'string' ? values.chapter : undefined;
  if (chapterId) {
    curriculum = JSON.parse(readFileSync(curriculumPath, 'utf8'));
    const chapter = curriculum?.tracks.flatMap((t) => t.chapters).find((c) => c.id === chapterId);
    if (!chapter) fail(`no chapter "${chapterId}" in content/curriculum.json`);
    chapter.blocks.push(slug);
  }

  const [id, stepId] = freshIds(2);
  const meta: Record<string, unknown> = { id, slug, type, title, runner, estMinutes: est };
  if (typeof values.source === 'string') meta.sourceRef = values.source;
  if (typeof values.demo === 'string') meta.demo = values.demo;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  const created = ['meta.json'];
  if (type === 'workshop') {
    writeFileSync(
      join(dir, '01.md'),
      stepSkeleton(stepId, 1, runner as Exclude<Runner, 'none'>, null),
    );
    created.push('01.md');
  } else {
    const starter = starterFor(type, slug, runner);
    writeFileSync(join(dir, starter.file), starter.text);
    created.push(starter.file);
  }
  if (curriculum) writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2) + '\n');
  console.log(`created content/blocks/${slug}/ (${created.join(', ')}), block id ${id}`);
  console.log(
    chapterId
      ? `added "${slug}" to chapter ${chapterId}`
      : `add "${slug}" to a chapter in content/curriculum.json (or pass --chapter)`,
  );
}

// ---------------------------------------------------------------------------

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    block: { type: 'string' },
    type: { type: 'string' },
    title: { type: 'string' },
    runner: { type: 'string' },
    est: { type: 'string' },
    chapter: { type: 'string' },
    source: { type: 'string' },
    demo: { type: 'string' },
    id: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help) {
  console.log(USAGE);
} else if (values.id) {
  const count = positionals[0] ? Number(positionals[0]) : 1;
  console.log(freshIds(Number.isInteger(count) && count > 0 ? count : 1).join('\n'));
} else if (values.block) {
  addBlock(values);
} else if (positionals.length === 1) {
  addStep(positionals[0]);
} else {
  fail('give a workshop slug (add a step), --block <slug> ... (new block) or --id. See --help.');
}
