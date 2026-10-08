/**
 * Markdown sources -> typed content. The format is documented in docs/content-format.md.
 *
 * Every parse function returns `{ value, issues, anchors }`:
 * - `issues` are file:line problems (structure first; zod rules only run when the structure is sound).
 * - `value` is set only when `issues` is empty.
 * - `anchors` maps dot-paths ("screens.2.options") to line numbers so later checks can point at a line.
 */
import { z } from 'zod';
import { questionId } from './ids';
import { markdownInline, markdownToHtml } from './markdown';
import {
  CALLOUT_KINDS,
  CodeRunnerSchema,
  IdSchema,
  LabSchema,
  LessonSchema,
  ProjectSchema,
  QuizSchema,
  ReviewSchema,
  SCREEN_TYPES,
  StepSchema,
  TEST_LANG,
  type Lab,
  type Lesson,
  type Project,
  type Quiz,
  type Review,
  type Runner,
  type SeedFile,
  type Step,
} from './schema';
import {
  EDITABLE_MARKER,
  checkFences,
  chunkFences,
  findMarkerLines,
  isBlank,
  parseList,
  pickSections,
  splitFrontmatter,
  splitSections,
  splitTryits,
  textOf,
  toLines,
  trimBlank,
  unwrapCode,
  zodIssues,
  type Anchors,
  type Issue,
  type Line,
  type ListItem,
  type Section,
} from './sections';

export interface ParseResult<T> {
  value?: T;
  issues: Issue[];
  anchors: Anchors;
}

/** What a parser needs to know about the block a file belongs to (from meta.json). */
export interface BlockContext {
  file: string;
  blockId: string;
  runner: Runner;
  demo?: string;
}

class Reporter {
  issues: Issue[] = [];
  anchors: Anchors = {};
  constructor(readonly file: string) {}
  report = (line: number, message: string) => {
    if (this.issues.some((i) => i.line === line && i.message === message)) return;
    this.issues.push({ file: this.file, line, message });
  };
  anchor(path: string, line: number) {
    this.anchors[path] = line;
  }
}

function finish<S extends z.ZodTypeAny>(
  rep: Reporter,
  schema: S,
  raw: unknown,
): ParseResult<z.infer<S>> {
  if (rep.issues.length > 0) return { issues: rep.issues, anchors: rep.anchors };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { issues: zodIssues(parsed.error, rep.file, rep.anchors), anchors: rep.anchors };
  }
  return { value: parsed.data as z.infer<S>, issues: [], anchors: rep.anchors };
}

/** Validates frontmatter against a strict schema; reports each problem on its key's line. */
function readFrontmatter<S extends z.ZodTypeAny>(
  rep: Reporter,
  lines: Line[],
  schema: S | null,
  what: string,
): { data: z.infer<S> | undefined; rest: Line[]; keyLines: Record<string, number> } {
  const fm = splitFrontmatter(lines, rep.report);
  checkFences(fm.rest, rep.report);
  if (schema === null) {
    if (fm.data !== undefined && Object.keys((fm.data ?? {}) as object).length > 0) {
      rep.report(
        fm.line,
        `${what} takes no frontmatter (the block's id, title and runner live in meta.json)`,
      );
    }
    return { data: undefined, rest: fm.rest, keyLines: fm.keyLines };
  }
  if (fm.data === undefined) {
    if (rep.issues.length === 0)
      rep.report(1, `${what} needs YAML frontmatter between "---" lines`);
    return { data: undefined, rest: fm.rest, keyLines: fm.keyLines };
  }
  const result = schema.safeParse(fm.data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? '');
      const where = issue.path.join('.');
      rep.report(
        fm.keyLines[key] ?? fm.line,
        `frontmatter ${where ? where + ': ' : ''}${issue.message}`,
      );
    }
    return { data: undefined, rest: fm.rest, keyLines: fm.keyLines };
  }
  for (const [key, line] of Object.entries(fm.keyLines)) rep.anchor(key, line);
  return { data: result.data as z.infer<S>, rest: fm.rest, keyLines: fm.keyLines };
}

// ---------------------------------------------------------------------------
// Shared pieces

function firstContentLine(lines: Line[], fallback: number): number {
  return lines.find((l) => l.text.trim() !== '')?.n ?? fallback;
}

/** Markdown block (paragraphs, lists, code...) -> HTML. Reports an empty section. */
function blockHtml(sec: Section, rep: Reporter): string {
  const body = trimBlank(sec.body);
  if (body.length === 0) {
    rep.report(sec.line, `"--${sec.name}--" is empty`);
    return '';
  }
  return markdownToHtml(textOf(body));
}

function requireBlankBefore(pre: Line[], rep: Reporter, what: string) {
  if (!isBlank(pre)) {
    rep.report(
      firstContentLine(pre, 1),
      `text before the first section marker in ${what}; put it under a marker`,
    );
  }
}

/** Parses fenced blocks as files. Each fence needs `lang file=name`. */
function toFiles(
  body: Line[],
  rep: Reporter,
  opts: { allowEditable: boolean; where: string },
): SeedFile[] {
  const files: SeedFile[] = [];
  for (const chunk of chunkFences(body, rep.report)) {
    if (chunk.kind === 'text') {
      if (!isBlank(chunk.lines)) {
        rep.report(
          firstContentLine(chunk.lines, 1),
          `only fenced code blocks are allowed in ${opts.where}`,
        );
      }
      continue;
    }
    const name = chunk.attrs.file;
    if (!name) {
      rep.report(chunk.line, 'code fence needs a file name: ```html file=index.html');
      continue;
    }
    if (!chunk.lang) {
      rep.report(chunk.line, 'code fence needs a language: ```html file=index.html');
      continue;
    }
    const markerIdx: number[] = [];
    chunk.body.forEach((l, i) => {
      if (l.text.trim() === EDITABLE_MARKER) markerIdx.push(i);
    });
    const kept = chunk.body.filter((l) => l.text.trim() !== EDITABLE_MARKER).map((l) => l.text);
    const file: SeedFile = { name, lang: chunk.lang, contents: kept.join('\n') };
    if (markerIdx.length > 0) {
      if (!opts.allowEditable) {
        rep.report(
          chunk.body[markerIdx[0]].n,
          `${EDITABLE_MARKER} is not allowed in ${opts.where}`,
        );
      } else if (markerIdx.length !== 2) {
        rep.report(
          chunk.body[markerIdx[0]].n,
          `${EDITABLE_MARKER} must appear exactly twice in a file (open and close), found ${markerIdx.length}`,
        );
      } else {
        // Line numbers refer to the text with both marker lines removed: the region starts where the
        // first marker was, and the second marker (one line earlier now) is the exclusive end.
        file.editable = { start: markerIdx[0], end: markerIdx[1] - 1 };
      }
    }
    files.push(file);
  }
  return files;
}

/** Test pairs: a message paragraph followed by a fenced test block. */
function parseTests(
  body: Line[],
  runner: Runner,
  rep: Reporter,
  anchorBase: string,
): { text: string; code: string }[] {
  const tests: { text: string; code: string }[] = [];
  let pending: { text: string; line: number } | null = null;
  const want = runner === 'none' ? null : TEST_LANG[runner];
  for (const chunk of chunkFences(body, rep.report)) {
    if (chunk.kind === 'text') {
      if (isBlank(chunk.lines)) continue;
      if (pending) {
        rep.report(
          pending.line,
          'this message has no test block after it (a message is followed by a fenced test)',
        );
      }
      const trimmed = trimBlank(chunk.lines);
      pending = { text: markdownInline(textOf(trimmed)), line: trimmed[0].n };
      continue;
    }
    if (!pending) {
      rep.report(chunk.line, 'test block has no message above it');
      continue;
    }
    if (want && chunk.lang !== want) {
      rep.report(
        chunk.line,
        `test blocks for runner "${runner}" must use \`\`\`${want} (found "${chunk.lang || 'no language'}")`,
      );
    }
    rep.anchor(`${anchorBase}.${tests.length}`, pending.line);
    tests.push({ text: pending.text, code: textOf(chunk.body) });
    pending = null;
  }
  if (pending)
    rep.report(
      pending.line,
      'this message has no test block after it (a message is followed by a fenced test)',
    );
  return tests;
}

/** The single fenced block in a section (`--code--`, `--template--`). */
function singleFence(
  sec: Section,
  rep: Reporter,
): { lang: string; name?: string; contents: string } | undefined {
  const chunks = chunkFences(sec.body, rep.report);
  const fences = chunks.filter((c) => c.kind === 'fence');
  for (const c of chunks) {
    if (c.kind === 'text' && !isBlank(c.lines)) {
      rep.report(
        firstContentLine(c.lines, sec.line),
        `only one fenced code block is allowed in "--${sec.name}--"`,
      );
      return undefined;
    }
  }
  if (fences.length !== 1) {
    rep.report(
      sec.line,
      `"--${sec.name}--" needs exactly one fenced code block, found ${fences.length}`,
    );
    return undefined;
  }
  const f = fences[0];
  if (f.kind !== 'fence') return undefined;
  if (!f.lang) {
    rep.report(f.line, 'code fence needs a language, e.g. ```html');
    return undefined;
  }
  const out: { lang: string; name?: string; contents: string } = {
    lang: f.lang,
    contents: textOf(f.body),
  };
  if (f.attrs.file) out.name = f.attrs.file;
  return out;
}

function itemText(item: ListItem): string {
  return item.text;
}

function noChildren(item: ListItem, rep: Reporter, what: string) {
  if (item.children.length > 0)
    rep.report(item.children[0].line, `${what} cannot have nested list items`);
}

/** `- item` lists whose items become inline HTML. */
function inlineList(sec: Section, rep: Reporter, anchorBase: string): string[] {
  const items = parseList(sec.body, rep.report);
  if (items.length === 0) rep.report(sec.line, `"--${sec.name}--" needs a list ("- item")`);
  return items.map((item, i) => {
    noChildren(item, rep, `an item in "--${sec.name}--"`);
    rep.anchor(`${anchorBase}.${i}`, item.line);
    return markdownInline(itemText(item));
  });
}

// ---------------------------------------------------------------------------
// Workshop step and lab

const StepFrontmatter = z
  .object({ id: IdSchema, title: z.string().min(1), runner: CodeRunnerSchema })
  .strict();

function fileNumber(file: string): number | undefined {
  const m = /(?:^|[\\/])(\d{2,3})\.md$/.exec(file);
  return m ? Number(m[1]) : undefined;
}

interface ChallengeBody {
  description: string;
  userStories?: string[];
  tests: { text: string; code: string }[];
  seed: SeedFile[];
  solutions: SeedFile[];
  help: string[];
}

function parseChallengeBody(
  rest: Line[],
  runner: Runner,
  rep: Reporter,
  kind: 'step' | 'lab',
): ChallengeBody | undefined {
  const { pre, sections } = splitSections(rest, 1, rep.report);
  requireBlankBefore(pre, rep, kind === 'lab' ? 'lab.md' : 'a step');
  const where = kind === 'lab' ? 'lab.md' : 'a workshop step';
  const spec =
    kind === 'lab'
      ? { required: ['description', 'user-stories', 'hints', 'seed', 'solutions', 'help'] }
      : { required: ['description', 'hints', 'seed', 'solutions', 'help'] };
  const picked = pickSections(sections, spec, rep.report, where, 1);

  const out: Partial<ChallengeBody> = {};
  const description = picked.get('description');
  if (description) {
    rep.anchor('description', description.line);
    out.description = blockHtml(description, rep);
  }
  const stories = picked.get('user-stories');
  if (stories) {
    rep.anchor('userStories', stories.line);
    out.userStories = inlineList(stories, rep, 'userStories');
  }
  const hints = picked.get('hints');
  if (hints) {
    rep.anchor('tests', hints.line);
    out.tests = parseTests(hints.body, runner, rep, 'tests');
    if (out.tests.length === 0) rep.report(hints.line, '"--hints--" has no tests');
  }
  const seed = picked.get('seed');
  if (seed) {
    rep.anchor('seed', seed.line);
    const inner = splitSections(seed.body, 2, rep.report);
    requireBlankBefore(inner.pre, rep, '"--seed--"');
    const contents = pickSections(
      inner.sections,
      { required: ['seed-contents'] },
      rep.report,
      '"--seed--"',
      seed.line,
    );
    const sc = contents.get('seed-contents');
    if (sc) {
      rep.anchor('seed', sc.line);
      out.seed = toFiles(sc.body, rep, { allowEditable: true, where: '"--seed-contents--"' });
    }
  }
  const solutions = picked.get('solutions');
  if (solutions) {
    rep.anchor('solutions', solutions.line);
    out.solutions = toFiles(solutions.body, rep, {
      allowEditable: false,
      where: '"--solutions--"',
    });
  }
  const help = picked.get('help');
  if (help) {
    rep.anchor('help', help.line);
    const inner = splitSections(help.body, 2, rep.report);
    requireBlankBefore(inner.pre, rep, '"--help--"');
    out.help = [];
    for (const h of inner.sections) {
      if (h.name !== 'hint') {
        rep.report(h.line, `unknown section "--${h.name}--" in "--help--" (use "## --hint--")`);
        continue;
      }
      rep.anchor(`help.${out.help.length}`, h.line);
      out.help.push(blockHtml(h, rep));
    }
    if (out.help.length === 0) rep.report(help.line, '"--help--" needs at least one "## --hint--"');
  }
  return out as ChallengeBody;
}

export function parseStep(source: string, file: string): ParseResult<Step> {
  const rep = new Reporter(file);
  const lines = toLines(source);
  const fm = readFrontmatter(rep, lines, StepFrontmatter, 'a workshop step');
  const step = fileNumber(file);
  if (step === undefined)
    rep.report(1, 'step files are named with their number: 01.md, 02.md, ...');
  rep.anchor('step', 1);
  if (!fm.data) return { issues: rep.issues, anchors: rep.anchors };
  const body = parseChallengeBody(fm.rest, fm.data.runner, rep, 'step');
  const raw = body && {
    id: fm.data.id,
    step,
    title: fm.data.title,
    runner: fm.data.runner,
    description: body.description,
    tests: body.tests,
    seed: body.seed,
    solutions: body.solutions,
    help: body.help,
  };
  return finish(rep, StepSchema, raw);
}

export function parseLab(source: string, ctx: BlockContext): ParseResult<Lab> {
  const rep = new Reporter(ctx.file);
  const lines = toLines(source);
  const fm = readFrontmatter(rep, lines, null, 'lab.md');
  if (ctx.runner === 'none') {
    rep.report(1, 'a lab needs a runner (web, python, sql, fastapi) but meta.json says "none"');
    return { issues: rep.issues, anchors: rep.anchors };
  }
  const body = parseChallengeBody(fm.rest, ctx.runner, rep, 'lab');
  const raw = body && {
    id: ctx.blockId,
    runner: ctx.runner,
    description: body.description,
    userStories: body.userStories,
    demo: ctx.demo,
    tests: body.tests,
    seed: body.seed,
    solutions: body.solutions,
    help: body.help,
  };
  return finish(rep, LabSchema, raw);
}

// ---------------------------------------------------------------------------
// Lesson

const OPTION_MARKER = /^\[( |x|X)\]\s+([\s\S]*)$/;

function parseOptions(sec: Section, rep: Reporter, base: string) {
  const items = parseList(sec.body, rep.report);
  if (items.length === 0)
    rep.report(sec.line, '"--options--" needs a list of "- [x]" and "- [ ]" items');
  return items.map((item, j) => {
    rep.anchor(`${base}.options.${j}`, item.line);
    noChildren(item, rep, 'an option');
    const m = OPTION_MARKER.exec(itemText(item));
    if (!m) {
      rep.report(item.line, 'an option starts with "[x]" (correct) or "[ ]" (wrong)');
      return { html: '', correct: false, feedback: '' };
    }
    const feedback = item.quote.join('\n').trim();
    if (!feedback)
      rep.report(
        item.line,
        'option is missing its feedback: add a line starting with "> " under it',
      );
    return {
      html: markdownInline(m[2]),
      correct: m[1].toLowerCase() === 'x',
      feedback: feedback ? markdownInline(feedback) : '',
    };
  });
}

type ScreenRaw = Record<string, unknown>;

function parseTryit(seg: { line: number; runner: string; body: Line[] }, rep: Reporter) {
  const runner = CodeRunnerSchema.safeParse(seg.runner);
  if (!runner.success) {
    rep.report(
      seg.line,
      `tryit runner must be web, python, sql or fastapi (found "${seg.runner}")`,
    );
  }
  const files = toFiles(seg.body, rep, { allowEditable: false, where: 'a tryit block' });
  if (files.length === 0) rep.report(seg.line, 'a tryit block needs at least one fenced file');
  return { runner: runner.success ? runner.data : undefined, files };
}

function parseConcept(
  pre: Line[],
  subs: Map<string, Section>,
  rep: Reporter,
  base: string,
  line: number,
): ScreenRaw {
  const segments = splitTryits(pre, rep.report);
  const text: string[] = [];
  let tryit: ReturnType<typeof parseTryit> | undefined;
  for (const seg of segments) {
    if (seg.kind === 'text') {
      text.push(textOf(seg.lines));
      continue;
    }
    if (tryit) {
      rep.report(seg.line, 'a concept screen takes at most one tryit block');
      continue;
    }
    rep.anchor(`${base}.tryit`, seg.line);
    tryit = parseTryit(seg, rep);
  }
  const bodyMd = text.join('\n\n').trim();
  rep.anchor(`${base}.body`, firstContentLine(pre, line));
  if (!bodyMd)
    rep.report(line, 'a concept screen needs body text under the "# --screen-- concept" line');
  const raw: ScreenRaw = { type: 'concept', body: bodyMd ? markdownToHtml(bodyMd) : '' };
  const code = subs.get('code');
  if (code) {
    rep.anchor(`${base}.code`, code.line);
    raw.code = singleFence(code, rep);
  }
  if (tryit) raw.tryit = tryit;
  const callout = subs.get('callout');
  if (callout) {
    rep.anchor(`${base}.callout`, callout.line);
    const kind = callout.arg || 'info';
    if (!(CALLOUT_KINDS as readonly string[]).includes(kind)) {
      rep.report(
        callout.line,
        `callout kind must be ${CALLOUT_KINDS.join(', ')} (found "${kind}")`,
      );
    }
    raw.callout = { kind, html: blockHtml(callout, rep) };
  }
  return raw;
}

function parseScreen(
  section: Section,
  index: number,
  ctx: BlockContext,
  rep: Reporter,
): ScreenRaw | undefined {
  const base = `screens.${index}`;
  rep.anchor(base, section.line);
  const type = section.arg;
  if (!(SCREEN_TYPES as readonly string[]).includes(type)) {
    rep.report(
      section.line,
      `unknown screen type "${type}" (use one of: ${SCREEN_TYPES.join(', ')})`,
    );
    return undefined;
  }
  const { pre, sections } = splitSections(section.body, 2, rep.report);
  const where = `a ${type} screen`;
  const pick = (spec: { required?: string[]; optional?: string[] }) =>
    pickSections(sections, spec, rep.report, where, section.line);
  const noPre = () => requireBlankBefore(pre, rep, where);
  const block = (sec: Section | undefined, key: string): string | undefined => {
    if (!sec) return undefined;
    rep.anchor(`${base}.${key}`, sec.line);
    return blockHtml(sec, rep);
  };

  switch (type) {
    case 'concept': {
      const subs = pick({ optional: ['code', 'callout'] });
      return parseConcept(pre, subs, rep, base, section.line);
    }
    case 'mcq':
    case 'multi': {
      noPre();
      const subs = pick({ required: ['question', 'options', 'why'] });
      const options = subs.get('options');
      if (options) rep.anchor(`${base}.options`, options.line);
      return {
        type,
        question: block(subs.get('question'), 'question'),
        options: options && parseOptions(options, rep, base),
        why: block(subs.get('why'), 'why'),
      };
    }
    case 'predict':
    case 'spotbug': {
      noPre();
      const subs = pick({ required: ['code', 'question', 'options', 'why'] });
      const code = subs.get('code');
      if (code) rep.anchor(`${base}.code`, code.line);
      const options = subs.get('options');
      if (options) rep.anchor(`${base}.options`, options.line);
      return {
        type,
        code: code && singleFence(code, rep),
        question: block(subs.get('question'), 'question'),
        options: options && parseOptions(options, rep, base),
        why: block(subs.get('why'), 'why'),
      };
    }
    case 'tapbuild': {
      noPre();
      const subs = pick({ required: ['prompt', 'template', 'tokens', 'answer', 'why'] });
      const template = subs.get('template');
      if (template) rep.anchor(`${base}.template`, template.line);
      const tokensSec = subs.get('tokens');
      const answerSec = subs.get('answer');
      const tokenList = (sec: Section | undefined, key: string) => {
        if (!sec) return undefined;
        rep.anchor(`${base}.${key}`, sec.line);
        const items = parseList(sec.body, rep.report);
        if (items.length === 0) rep.report(sec.line, `"--${sec.name}--" needs a list of tokens`);
        return items.map((item) => {
          noChildren(item, rep, 'a token');
          return unwrapCode(itemText(item));
        });
      };
      return {
        type,
        prompt: block(subs.get('prompt'), 'prompt'),
        template: template && singleFence(template, rep),
        tokens: tokenList(tokensSec, 'tokens'),
        answer: tokenList(answerSec, 'answer'),
        why: block(subs.get('why'), 'why'),
      };
    }
    case 'typein': {
      noPre();
      const subs = pick({ required: ['prompt', 'seed-contents', 'tests', 'solutions', 'why'] });
      if (ctx.runner === 'none') {
        rep.report(section.line, 'a typein screen needs a runner but meta.json says "none"');
      }
      const seed = subs.get('seed-contents');
      const tests = subs.get('tests');
      const solutions = subs.get('solutions');
      if (seed) rep.anchor(`${base}.seed`, seed.line);
      if (tests) rep.anchor(`${base}.tests`, tests.line);
      if (solutions) rep.anchor(`${base}.solutions`, solutions.line);
      return {
        type,
        prompt: block(subs.get('prompt'), 'prompt'),
        seed:
          seed && toFiles(seed.body, rep, { allowEditable: true, where: '"--seed-contents--"' }),
        tests: tests && parseTests(tests.body, ctx.runner, rep, `${base}.tests`),
        solutions:
          solutions &&
          toFiles(solutions.body, rep, { allowEditable: false, where: '"--solutions--"' }),
        why: block(subs.get('why'), 'why'),
      };
    }
    case 'order': {
      noPre();
      const subs = pick({ required: ['prompt', 'items', 'why'] });
      const items = subs.get('items');
      if (items) rep.anchor(`${base}.items`, items.line);
      return {
        type,
        prompt: block(subs.get('prompt'), 'prompt'),
        items: items && inlineList(items, rep, `${base}.items`),
        why: block(subs.get('why'), 'why'),
      };
    }
    case 'match': {
      noPre();
      const subs = pick({ required: ['prompt', 'pairs', 'why'] });
      const pairsSec = subs.get('pairs');
      let pairs: { left: string; right: string }[] | undefined;
      if (pairsSec) {
        rep.anchor(`${base}.pairs`, pairsSec.line);
        pairs = parseList(pairsSec.body, rep.report).map((item, j) => {
          rep.anchor(`${base}.pairs.${j}`, item.line);
          if (item.children.length !== 1) {
            rep.report(
              item.line,
              'each pair is "- left" with exactly one indented "  - right" under it',
            );
          }
          return {
            left: markdownInline(itemText(item)),
            right: markdownInline(item.children[0] ? itemText(item.children[0]) : ''),
          };
        });
        if (pairs.length === 0) rep.report(pairsSec.line, '"--pairs--" needs a list of pairs');
      }
      return {
        type,
        prompt: block(subs.get('prompt'), 'prompt'),
        pairs,
        why: block(subs.get('why'), 'why'),
      };
    }
    case 'widget': {
      noPre();
      const subs = pick({ required: ['widget'], optional: ['prompt', 'why'] });
      const widget = subs.get('widget');
      let name: string | undefined;
      let props: unknown;
      if (widget) {
        rep.anchor(`${base}.name`, widget.line);
        rep.anchor(`${base}.props`, widget.line);
        name = widget.arg || undefined;
        if (!name)
          rep.report(
            widget.line,
            'a widget screen needs a name: "## --widget-- escalation-slider"',
          );
        const fence = singleFence(widget, rep);
        if (fence) {
          if (fence.lang !== 'json') rep.report(widget.line, 'widget props are a ```json fence');
          try {
            props = JSON.parse(fence.contents);
            if (props === null || typeof props !== 'object' || Array.isArray(props)) {
              rep.report(widget.line, 'widget props must be a JSON object, e.g. {}');
            }
          } catch (e) {
            rep.report(widget.line, `widget props are not valid JSON: ${(e as Error).message}`);
          }
        }
      }
      return {
        type,
        name,
        props,
        prompt: block(subs.get('prompt'), 'prompt'),
        why: block(subs.get('why'), 'why'),
      };
    }
    case 'flashcard': {
      noPre();
      const subs = pick({ required: ['question', 'answer'] });
      return {
        type,
        question: block(subs.get('question'), 'question'),
        answer: block(subs.get('answer'), 'answer'),
      };
    }
    case 'checklist': {
      noPre();
      const subs = pick({ required: ['items'] });
      const itemsSec = subs.get('items');
      let items: unknown[] | undefined;
      if (itemsSec) {
        rep.anchor(`${base}.items`, itemsSec.line);
        items = parseList(itemsSec.body, rep.report).map((item, j) => {
          rep.anchor(`${base}.items.${j}`, item.line);
          const entry: { html: string; check?: Record<string, string> } = {
            html: markdownInline(itemText(item)),
          };
          if (item.children.length > 0) {
            const check: Record<string, string> = {};
            for (const child of item.children) {
              const kv = /^(command|pattern|hint)\s*:\s*([\s\S]*)$/.exec(itemText(child));
              if (!kv) {
                rep.report(
                  child.line,
                  'a check line is "command: ...", "pattern: ..." or "hint: ..."',
                );
                continue;
              }
              check[kv[1]] = kv[1] === 'hint' ? markdownInline(kv[2]) : unwrapCode(kv[2]);
            }
            for (const key of ['command', 'pattern', 'hint']) {
              if (!(key in check))
                rep.report(
                  item.line,
                  `a check needs "${key}: ..." (command, pattern and hint are all required)`,
                );
            }
            entry.check = check;
          }
          return entry;
        });
        if (items.length === 0) rep.report(itemsSec.line, '"--items--" needs a list');
      }
      return { type, items };
    }
  }
  return undefined;
}

export function parseLesson(source: string, ctx: BlockContext): ParseResult<Lesson> {
  const rep = new Reporter(ctx.file);
  const lines = toLines(source);
  const fm = readFrontmatter(rep, lines, null, 'lesson.md');
  const { pre, sections } = splitSections(fm.rest, 1, rep.report);
  if (!isBlank(pre)) {
    rep.report(firstContentLine(pre, 1), 'text before the first "# --screen-- <type>" line');
  }
  const screens: unknown[] = [];
  sections.forEach((section) => {
    if (section.name !== 'screen') {
      rep.report(
        section.line,
        `unknown section "--${section.name}--" in lesson.md (every top-level section is "# --screen-- <type>")`,
      );
      return;
    }
    screens.push(parseScreen(section, screens.length, ctx, rep));
  });
  if (screens.length === 0) rep.report(1, 'a lesson needs at least one "# --screen-- <type>"');
  return finish(rep, LessonSchema, { id: ctx.blockId, screens });
}

// ---------------------------------------------------------------------------
// Quiz and exam

const QuizFrontmatter = z
  .object({ draw: z.number().int().min(1), pass: z.number().int().min(1) })
  .strict();

export function parseQuiz(source: string, ctx: BlockContext): ParseResult<Quiz> {
  const rep = new Reporter(ctx.file);
  const lines = toLines(source);
  const fm = readFrontmatter(rep, lines, QuizFrontmatter, 'quiz.md');
  if (!fm.data) return { issues: rep.issues, anchors: rep.anchors };
  const { pre, sections } = splitSections(fm.rest, 2, rep.report);
  requireBlankBefore(pre, rep, 'quiz.md');
  const questions: unknown[] = [];
  for (const section of sections) {
    if (section.name !== 'question') {
      rep.report(
        section.line,
        `unknown section "--${section.name}--" in quiz.md (every question is "## --question--")`,
      );
      continue;
    }
    const i = questions.length;
    const base = `questions.${i}`;
    rep.anchor(base, section.line);
    const inner = splitSections(section.body, 3, rep.report);
    requireBlankBefore(inner.pre, rep, 'a question');
    const subs = pickSections(
      inner.sections,
      { required: ['text', 'distractors', 'answer', 'explanation'] },
      rep.report,
      'a question',
      section.line,
    );
    const text = subs.get('text');
    const distractors = subs.get('distractors');
    const answer = subs.get('answer');
    const explanation = subs.get('explanation');
    for (const [key, sec] of [
      ['text', text],
      ['distractors', distractors],
      ['answer', answer],
      ['explanation', explanation],
    ] as const) {
      if (sec) rep.anchor(`${base}.${key}`, sec.line);
    }
    const textSource = text ? textOf(trimBlank(text.body)) : '';
    rep.anchor(`${base}.id`, section.line);
    questions.push({
      id: textSource ? questionId(textSource) : undefined,
      text: text && blockHtml(text, rep),
      distractors: distractors && inlineList(distractors, rep, `${base}.distractors`),
      answer: answer && markdownInline(textOf(trimBlank(answer.body))),
      explanation: explanation && blockHtml(explanation, rep),
    });
    if (answer && isBlank(answer.body)) rep.report(answer.line, '"--answer--" is empty');
  }
  if (questions.length === 0) rep.report(1, 'a quiz needs at least one "## --question--"');
  return finish(rep, QuizSchema, {
    id: ctx.blockId,
    draw: fm.data.draw,
    pass: fm.data.pass,
    questions,
  });
}

// ---------------------------------------------------------------------------
// Review

export function parseReview(source: string, ctx: BlockContext): ParseResult<Review> {
  const rep = new Reporter(ctx.file);
  const lines = toLines(source);
  const fm = readFrontmatter(rep, lines, null, 'review.md');
  for (const marker of findMarkerLines(fm.rest)) {
    rep.report(marker.n, 'review.md is plain markdown; section markers are not used here');
  }
  const body: unknown[] = [];
  for (const seg of splitTryits(fm.rest, rep.report)) {
    if (seg.kind === 'text') {
      if (isBlank(seg.lines)) continue;
      body.push({ type: 'html', html: markdownToHtml(textOf(trimBlank(seg.lines))) });
    } else {
      rep.anchor(`body.${body.length}`, seg.line);
      body.push({ type: 'tryit', tryit: parseTryit(seg, rep) });
    }
  }
  if (body.length === 0) rep.report(1, 'review.md is empty');
  return finish(rep, ReviewSchema, { id: ctx.blockId, body });
}

// ---------------------------------------------------------------------------
// Project

const ProjectFrontmatter = z.object({ ciJob: z.string().min(1) }).strict();

export function parseProject(source: string, ctx: BlockContext): ParseResult<Project> {
  const rep = new Reporter(ctx.file);
  const lines = toLines(source);
  const fm = readFrontmatter(rep, lines, ProjectFrontmatter, 'project.md');
  if (!fm.data) return { issues: rep.issues, anchors: rep.anchors };
  const { pre, sections } = splitSections(fm.rest, 1, rep.report);
  requireBlankBefore(pre, rep, 'project.md');
  const picked = pickSections(
    sections,
    { required: ['user-stories', 'instructions'] },
    rep.report,
    'project.md',
    1,
  );
  const stories = picked.get('user-stories');
  const instructions = picked.get('instructions');
  if (stories) rep.anchor('userStories', stories.line);
  if (instructions) rep.anchor('instructions', instructions.line);
  return finish(rep, ProjectSchema, {
    id: ctx.blockId,
    ciJob: fm.data.ciJob,
    userStories: stories && inlineList(stories, rep, 'userStories'),
    instructions: instructions && blockHtml(instructions, rep),
  });
}
