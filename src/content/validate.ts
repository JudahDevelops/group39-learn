/**
 * Loads a whole content tree (from memory, so tests can feed inline files), parses and validates
 * every file with zod, then applies the cross-file rules from docs/content-format.md.
 *
 * `files` maps a path relative to content/ ("curriculum.json", "blocks/<slug>/meta.json", ...)
 * to the file's text. scripts/validate-content.ts and build-content.ts read the disk into that shape.
 */
import {
  BlockMetaSchema,
  CurriculumSchema,
  type Block,
  type BlockMeta,
  type BlockType,
  type Curriculum,
  type Lab,
  type Lesson,
  type Project,
  type Quiz,
  type Review,
  type Step,
} from './schema';
import {
  parseLab,
  parseLesson,
  parseProject,
  parseQuiz,
  parseReview,
  parseStep,
  type ParseResult,
} from './parse';
import { lineForPath, type Anchors, type Issue } from './sections';

export type ContentFiles = Record<string, string>;

/** A block as parsed, before its room code is known. */
export type ParsedBlock =
  | { type: 'lesson'; meta: BlockMeta; lesson: Lesson }
  | { type: 'workshop'; meta: BlockMeta; steps: Step[] }
  | { type: 'lab'; meta: BlockMeta; lab: Lab }
  | { type: 'review'; meta: BlockMeta; review: Review }
  | { type: 'quiz'; meta: BlockMeta; quiz: Quiz }
  | { type: 'exam'; meta: BlockMeta; quiz: Quiz }
  | { type: 'project'; meta: BlockMeta; project: Project };

export interface LoadResult {
  curriculum?: Curriculum;
  /** Successfully parsed blocks by slug. */
  blocks: Map<string, ParsedBlock>;
  issues: Issue[];
}

export function withRoomCode(block: ParsedBlock, roomCode: string): Block {
  return { ...block, roomCode } as Block;
}

// ---------------------------------------------------------------------------
// JSON line lookup (curriculum.json and meta.json errors)

function lineAt(source: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) if (source[i] === '\n') line++;
  return line;
}

/** Offset of the n-th element of the array that starts at or after `from`. */
function arrayElementOffset(source: string, from: number, n: number): number {
  const open = source.indexOf('[', from);
  if (open === -1) return from;
  let depth = 0;
  let index = 0;
  let inString = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      if (depth === 1 && index === n) return i;
      continue;
    }
    if (c === '[' || c === '{') {
      depth++;
      if (depth === 2 && index === n) return i;
    } else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) break;
    } else if (c === ',' && depth === 1) {
      index++;
    }
  }
  return from;
}

/** Best-effort line for a zod path inside JSON text. */
export function jsonLine(source: string, path: readonly (string | number)[]): number {
  let offset = 0;
  for (const segment of path) {
    if (typeof segment === 'number') {
      offset = arrayElementOffset(source, offset, segment);
    } else {
      const found = source.indexOf(`"${segment}"`, offset);
      if (found === -1) break;
      offset = found;
    }
  }
  return lineAt(source, offset);
}

function parseJson(
  source: string,
  file: string,
  issues: Issue[],
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (e) {
    const message = (e as Error).message;
    const pos = /position (\d+)/.exec(message);
    issues.push({
      file,
      line: pos ? lineAt(source, Number(pos[1])) : 1,
      message: `invalid JSON: ${message}`,
    });
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Test code checks

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => unknown;

function jsSyntaxError(code: string): string | null {
  try {
    new AsyncFunction('code', 'document', 'window', 'assert', 'db', code);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

function checkJsTests(
  tests: readonly { code: string }[],
  anchorBase: string,
  anchors: Anchors,
  file: string,
  issues: Issue[],
) {
  tests.forEach((test, i) => {
    const error = jsSyntaxError(test.code);
    if (error) {
      issues.push({
        file,
        line: lineForPath(anchors, [...anchorBase.split('.').filter(Boolean), i]),
        message: `${anchorBase ? anchorBase + '.' : ''}${i}: test code has a syntax error: ${error}`,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Loading

const BLOCK_FILE: Record<Exclude<BlockType, 'workshop'>, string> = {
  lesson: 'lesson.md',
  lab: 'lab.md',
  review: 'review.md',
  quiz: 'quiz.md',
  exam: 'quiz.md',
  project: 'project.md',
};

const STEP_FILE = /^(\d{2,3})\.md$/;

interface IdUse {
  file: string;
  line: number;
  what: string;
}

export function loadContent(files: ContentFiles, root = 'content'): LoadResult {
  const issues: Issue[] = [];
  const blocks = new Map<string, ParsedBlock>();
  const label = (key: string) => `${root}/${key}`;
  const ids = new Map<string, IdUse>();
  const claimId = (id: string, use: IdUse) => {
    const first = ids.get(id);
    if (first) {
      issues.push({
        file: use.file,
        line: use.line,
        message: `id "${id}" (${use.what}) is already used by ${first.what} at ${first.file}:${first.line}`,
      });
    } else {
      ids.set(id, use);
    }
  };

  // --- shape of the tree
  const folders = new Map<string, string[]>(); // slug -> file names
  let hasCurriculum = false;
  for (const key of Object.keys(files).sort()) {
    if (key === 'curriculum.json') {
      hasCurriculum = true;
      continue;
    }
    if (key.startsWith('reference/')) continue; // reference pages are validated by their own WP
    const m = /^blocks\/([^/]+)\/([^/]+)$/.exec(key);
    if (m) {
      const list = folders.get(m[1]) ?? [];
      list.push(m[2]);
      folders.set(m[1], list);
      continue;
    }
    issues.push({
      file: label(key),
      line: 1,
      message: 'unexpected file; content/ holds curriculum.json, blocks/<slug>/... and reference/',
    });
  }

  // --- curriculum
  let curriculum: Curriculum | undefined;
  const curriculumFile = label('curriculum.json');
  const curriculumSource = files['curriculum.json'];
  if (!hasCurriculum) {
    issues.push({ file: curriculumFile, line: 1, message: 'missing curriculum.json' });
  } else {
    const json = parseJson(curriculumSource, curriculumFile, issues);
    if (json.ok) {
      const parsed = CurriculumSchema.safeParse(json.value);
      if (parsed.success) curriculum = parsed.data;
      else {
        for (const issue of parsed.error.issues) {
          issues.push({
            file: curriculumFile,
            line: jsonLine(curriculumSource, issue.path),
            message: `${issue.path.join('.')}: ${issue.message}`,
          });
        }
      }
    }
  }

  // --- blocks
  for (const slug of [...folders.keys()].sort()) {
    const names = folders.get(slug) ?? [];
    const dir = `blocks/${slug}`;
    const metaKey = `${dir}/meta.json`;
    const metaFile = label(metaKey);
    if (!names.includes('meta.json')) {
      issues.push({ file: label(dir), line: 1, message: 'block folder has no meta.json' });
      continue;
    }
    const metaSource = files[metaKey];
    const json = parseJson(metaSource, metaFile, issues);
    if (!json.ok) continue;
    const parsedMeta = BlockMetaSchema.safeParse(json.value);
    if (!parsedMeta.success) {
      for (const issue of parsedMeta.error.issues) {
        const where = issue.path.join('.');
        issues.push({
          file: metaFile,
          line: jsonLine(metaSource, issue.path),
          message: `${where ? where + ': ' : ''}${issue.message}`,
        });
      }
      continue;
    }
    const meta = parsedMeta.data;
    const metaLine = (key: string) => jsonLine(metaSource, [key]);
    claimId(meta.id, { file: metaFile, line: metaLine('id'), what: `block "${slug}"` });
    let metaOk = true;
    if (meta.slug !== slug) {
      issues.push({
        file: metaFile,
        line: metaLine('slug'),
        message: `slug "${meta.slug}" must equal the folder name "${slug}"`,
      });
      metaOk = false;
    }
    if ((meta.type === 'workshop' || meta.type === 'lab') && meta.runner === 'none') {
      issues.push({
        file: metaFile,
        line: metaLine('runner'),
        message: `a ${meta.type} needs a runner (web, python, sql or fastapi)`,
      });
      metaOk = false;
    }
    if (meta.demo !== undefined && meta.type !== 'workshop' && meta.type !== 'lab') {
      issues.push({
        file: metaFile,
        line: metaLine('demo'),
        message: `"demo" only applies to workshops and labs, not ${meta.type}`,
      });
      metaOk = false;
    }
    if (meta.type === 'lab' && meta.runner === 'web' && !meta.demo) {
      issues.push({
        file: metaFile,
        line: 1,
        message:
          'a web lab needs "demo": the solution file the example project opens, e.g. "index.html"',
      });
      metaOk = false;
    }

    const others = names.filter((n) => n !== 'meta.json');
    const sourceOf = (name: string) => files[`${dir}/${name}`];
    const fileOf = (name: string) => label(`${dir}/${name}`);

    // expected files
    if (meta.type === 'workshop') {
      for (const n of others) {
        if (!STEP_FILE.test(n)) {
          issues.push({
            file: fileOf(n),
            line: 1,
            message: 'unexpected file in a workshop block; steps are named 01.md, 02.md, ...',
          });
        }
      }
    } else {
      const expected = BLOCK_FILE[meta.type];
      for (const n of others) {
        if (n !== expected) {
          issues.push({
            file: fileOf(n),
            line: 1,
            message: `unexpected file in a ${meta.type} block; the only content file is ${expected}`,
          });
        }
      }
      if (!others.includes(expected)) {
        issues.push({
          file: metaFile,
          line: 1,
          message: `missing ${expected} (block type is ${meta.type})`,
        });
        continue;
      }
    }
    if (!metaOk) continue;

    const ctxFor = (name: string) => ({
      file: fileOf(name),
      blockId: meta.id,
      runner: meta.runner,
      demo: meta.demo,
    });
    const collect = <T>(result: ParseResult<T>): T | undefined => {
      issues.push(...result.issues);
      return result.value;
    };

    switch (meta.type) {
      case 'lesson': {
        const parsed = parseLesson(sourceOf('lesson.md'), ctxFor('lesson.md'));
        const lesson = collect(parsed);
        if (lesson) {
          lesson.screens.forEach((screen, i) => {
            if (screen.type === 'typein' && (meta.runner === 'web' || meta.runner === 'sql')) {
              checkJsTests(
                screen.tests,
                `screens.${i}.tests`,
                parsed.anchors,
                fileOf('lesson.md'),
                issues,
              );
            }
          });
          blocks.set(slug, { type: 'lesson', meta, lesson });
        }
        break;
      }
      case 'lab': {
        const parsed = parseLab(sourceOf('lab.md'), ctxFor('lab.md'));
        const lab = collect(parsed);
        if (lab) {
          if (meta.runner === 'web' || meta.runner === 'sql') {
            checkJsTests(lab.tests, 'tests', parsed.anchors, fileOf('lab.md'), issues);
          }
          blocks.set(slug, { type: 'lab', meta, lab });
        }
        break;
      }
      case 'review': {
        const review = collect(parseReview(sourceOf('review.md'), ctxFor('review.md')));
        if (review) blocks.set(slug, { type: 'review', meta, review });
        break;
      }
      case 'quiz':
      case 'exam': {
        const parsed = parseQuiz(sourceOf('quiz.md'), ctxFor('quiz.md'));
        const quiz = collect(parsed);
        if (quiz) {
          quiz.questions.forEach((q, i) =>
            claimId(q.id, {
              file: fileOf('quiz.md'),
              line: lineForPath(parsed.anchors, ['questions', i]),
              what: `question ${i + 1} of "${slug}"`,
            }),
          );
          if (meta.type === 'exam' && quiz.pass * 5 < quiz.draw * 4) {
            issues.push({
              file: fileOf('quiz.md'),
              line: lineForPath(parsed.anchors, ['pass']),
              message: `an exam passes at 80% or more: pass (${quiz.pass}) must be at least ${Math.ceil(quiz.draw * 0.8)} of draw (${quiz.draw})`,
            });
          }
          blocks.set(
            slug,
            meta.type === 'quiz' ? { type: 'quiz', meta, quiz } : { type: 'exam', meta, quiz },
          );
        }
        break;
      }
      case 'project': {
        const project = collect(parseProject(sourceOf('project.md'), ctxFor('project.md')));
        if (project) blocks.set(slug, { type: 'project', meta, project });
        break;
      }
      case 'workshop': {
        const stepNames = others.filter((n) => STEP_FILE.test(n)).sort();
        if (stepNames.length === 0) {
          issues.push({
            file: metaFile,
            line: 1,
            message: 'a workshop needs at least one step (01.md)',
          });
          break;
        }
        const steps: Step[] = [];
        let broken = false;
        for (const n of stepNames) {
          const parsed = parseStep(sourceOf(n), fileOf(n));
          const step = collect(parsed);
          if (!step) {
            broken = true;
            continue;
          }
          claimId(step.id, {
            file: fileOf(n),
            line: lineForPath(parsed.anchors, ['id']),
            what: `step ${step.step} of "${slug}"`,
          });
          if (step.runner !== meta.runner) {
            issues.push({
              file: fileOf(n),
              line: lineForPath(parsed.anchors, ['runner']),
              message: `step runner "${step.runner}" must match the block runner "${meta.runner}" in meta.json`,
            });
            broken = true;
          }
          if (step.title !== `Step ${step.step}`) {
            issues.push({
              file: fileOf(n),
              line: lineForPath(parsed.anchors, ['title']),
              message: `title must be "Step ${step.step}" to match the file name (found "${step.title}")`,
            });
            broken = true;
          }
          if (meta.runner === 'web' || meta.runner === 'sql') {
            checkJsTests(step.tests, 'tests', parsed.anchors, fileOf(n), issues);
          }
          steps.push(step);
        }
        // contiguous numbering from 1
        const numbers = stepNames.map((n) => Number(STEP_FILE.exec(n)?.[1]));
        numbers.forEach((num, i) => {
          if (num !== i + 1) {
            issues.push({
              file: fileOf(stepNames[i]),
              line: 1,
              message:
                i === 0
                  ? `steps must start at 01 (the first file is ${stepNames[i]})`
                  : `steps must be numbered 01, 02, 03... without gaps: expected ${String(i + 1).padStart(2, '0')}.md before ${stepNames[i]}`,
            });
            broken = true;
          }
        });
        if (meta.demo && steps.length > 0) {
          const last = steps[steps.length - 1];
          if (!last.solutions.some((f) => f.name === meta.demo)) {
            issues.push({
              file: metaFile,
              line: metaLine('demo'),
              message: `demo "${meta.demo}" is not a file in the last step's solutions`,
            });
            broken = true;
          }
        }
        if (!broken) blocks.set(slug, { type: 'workshop', meta, steps });
        break;
      }
    }
  }

  // --- project ci jobs are unique
  const jobs = new Map<string, string>();
  for (const [slug, block] of blocks) {
    if (block.type !== 'project') continue;
    const first = jobs.get(block.project.ciJob);
    if (first) {
      issues.push({
        file: label(`blocks/${slug}/project.md`),
        line: 1,
        message: `ciJob "${block.project.ciJob}" is already used by project "${first}"`,
      });
    } else {
      jobs.set(block.project.ciJob, slug);
    }
  }

  // --- curriculum <-> folders
  if (curriculum) {
    const listed = new Set<string>();
    for (const track of curriculum.tracks) {
      for (const chapter of track.chapters) {
        for (const slug of chapter.blocks) {
          listed.add(slug);
          if (!folders.has(slug)) {
            issues.push({
              file: curriculumFile,
              line: lineOfSlug(curriculumSource, slug),
              message: `block "${slug}" is listed in ${chapter.id} but content/blocks/${slug}/ does not exist`,
            });
          }
        }
      }
    }
    for (const slug of [...folders.keys()].sort()) {
      if (!listed.has(slug)) {
        issues.push({
          file: label(`blocks/${slug}/meta.json`),
          line: 1,
          message: `block "${slug}" is not listed in curriculum.json`,
        });
      }
    }
  }

  return { curriculum, blocks, issues: sortIssues(issues) };
}

function lineOfSlug(source: string, slug: string): number {
  const idx = source.indexOf(`"${slug}"`);
  return idx === -1 ? 1 : lineAt(source, idx);
}

function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1,
  );
}

export function formatIssues(issues: readonly Issue[]): string {
  return issues.map((i) => `${i.file}:${i.line}: ${i.message}`).join('\n');
}
