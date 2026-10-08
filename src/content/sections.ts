/**
 * Low-level scanning for the markdown content format: lines with their file line numbers,
 * YAML frontmatter, `# --marker--` sections, fenced code blocks, `::: tryit` blocks and simple lists.
 * Everything here is fence-aware: a marker inside a code fence is just text.
 */
import { parseDocument } from 'yaml';
import type { ZodError } from 'zod';

export interface Line {
  /** 1-based line number in the file. */
  n: number;
  text: string;
}

export interface Issue {
  file: string;
  line: number;
  message: string;
}

/** Dot-path -> line number, e.g. "screens.2.options" -> 41. Used to give zod errors a line. */
export type Anchors = Record<string, number>;

export type Report = (line: number, message: string) => void;

export function toLines(source: string): Line[] {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  return text.split(/\r\n|\r|\n/).map((t, i) => ({ n: i + 1, text: t }));
}

export function textOf(lines: readonly Line[]): string {
  return lines.map((l) => l.text).join('\n');
}

export function isBlank(lines: readonly Line[]): boolean {
  return lines.every((l) => l.text.trim() === '');
}

export function trimBlank(lines: Line[]): Line[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].text.trim() === '') start++;
  while (end > start && lines[end - 1].text.trim() === '') end--;
  return lines.slice(start, end);
}

// ---------------------------------------------------------------------------
// Frontmatter

export interface FrontmatterResult {
  /** Parsed YAML, or undefined when the file has no frontmatter. */
  data: unknown;
  /** Line number of the opening `---` (1 when there is none). */
  line: number;
  /** Line number of each top-level key, for error messages. */
  keyLines: Record<string, number>;
  rest: Line[];
}

export function splitFrontmatter(lines: Line[], report: Report): FrontmatterResult {
  if (lines.length === 0 || lines[0].text.trim() !== '---') {
    return { data: undefined, line: 1, keyLines: {}, rest: lines };
  }
  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].text.trim() === '---') {
      close = i;
      break;
    }
  }
  if (close === -1) {
    report(lines[0].n, 'frontmatter starts with --- but is never closed');
    return { data: undefined, line: lines[0].n, keyLines: {}, rest: [] };
  }
  const yamlText = lines
    .slice(1, close)
    .map((l) => l.text)
    .join('\n');
  const doc = parseDocument(yamlText);
  if (doc.errors.length > 0) {
    const err = doc.errors[0];
    const offset = err.linePos?.[0].line ?? 1;
    report(lines[0].n + offset, `invalid YAML frontmatter: ${err.message.split('\n')[0]}`);
    return { data: undefined, line: lines[0].n, keyLines: {}, rest: lines.slice(close + 1) };
  }
  const data: unknown = doc.toJS() ?? {};
  const keyLines: Record<string, number> = {};
  for (const l of lines.slice(1, close)) {
    const key = /^([A-Za-z][\w-]*)\s*:/.exec(l.text);
    if (key && !(key[1] in keyLines)) keyLines[key[1]] = l.n;
  }
  return { data, line: lines[0].n, keyLines, rest: lines.slice(close + 1) };
}

// ---------------------------------------------------------------------------
// Fences

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;

interface FenceState {
  char: string;
  length: number;
  /** Line where the fence opened. */
  line: number;
}

/** Advances fence state for one line; returns whether the line is inside (or is a delimiter of) a fence. */
function stepFence(
  state: FenceState | null,
  text: string,
  n = 0,
): { state: FenceState | null; inside: boolean } {
  if (state) {
    const close = new RegExp(`^ {0,3}${state.char === '`' ? '`' : '~'}{${state.length},}\\s*$`);
    if (close.test(text)) return { state: null, inside: true };
    return { state, inside: true };
  }
  const open = FENCE_OPEN.exec(text);
  if (open) {
    const fence = open[1];
    // A backtick fence's info string cannot contain a backtick (that would be inline code).
    if (fence[0] === '`' && open[2].includes('`')) return { state: null, inside: false };
    return { state: { char: fence[0], length: fence.length, line: n }, inside: true };
  }
  return { state: null, inside: false };
}

export type Chunk =
  | { kind: 'text'; lines: Line[] }
  | {
      kind: 'fence';
      /** Line number of the opening fence. */
      line: number;
      lang: string;
      attrs: Record<string, string>;
      /** Raw content lines between the fences (marker lines included). */
      body: Line[];
    };

function parseInfo(
  info: string,
  line: number,
  report: Report,
): { lang: string; attrs: Record<string, string> } {
  const tokens = info.trim().length ? (info.trim().match(/(?:[^\s"]+|"[^"]*")+/g) ?? []) : [];
  let lang = '';
  const attrs: Record<string, string> = {};
  for (const token of tokens) {
    const eq = token.indexOf('=');
    if (eq === -1) {
      if (lang === '') lang = token;
      else report(line, `unexpected "${token}" in the code fence info string`);
      continue;
    }
    const key = token.slice(0, eq);
    const value = token.slice(eq + 1).replace(/^"(.*)"$/, '$1');
    if (key !== 'file') {
      report(line, `unknown code fence attribute "${key}" (only file=name is supported)`);
      continue;
    }
    attrs[key] = value;
  }
  return { lang, attrs };
}

/** Splits lines into plain-text chunks and fenced code chunks. */
export function chunkFences(lines: Line[], report: Report): Chunk[] {
  const chunks: Chunk[] = [];
  let text: Line[] = [];
  let state: FenceState | null = null;
  let current: Extract<Chunk, { kind: 'fence' }> | null = null;

  const flushText = () => {
    if (text.length) chunks.push({ kind: 'text', lines: text });
    text = [];
  };

  for (const line of lines) {
    if (current === null) {
      const step = stepFence(state, line.text, line.n);
      if (step.inside) {
        flushText();
        const open = FENCE_OPEN.exec(line.text);
        const info = open ? parseInfo(open[2], line.n, report) : { lang: '', attrs: {} };
        current = { kind: 'fence', line: line.n, lang: info.lang, attrs: info.attrs, body: [] };
        state = step.state;
      } else {
        text.push(line);
      }
      continue;
    }
    const step = stepFence(state, line.text, line.n);
    if (step.state === null) {
      chunks.push(current);
      current = null;
      state = null;
    } else {
      current.body.push(line);
      state = step.state;
    }
  }
  if (current) {
    report(current.line, 'code fence is never closed');
    chunks.push(current);
  }
  flushText();
  return chunks;
}

/**
 * Catches the classic mistake of forgetting a closing fence. A fence is never closed by a line with
 * an info string, so a "```html file=..." line inside an open fence means the earlier fence is unclosed.
 * (To show a fence inside a fence, wrap it in a longer one: ````.)
 */
export function checkFences(lines: Line[], report: Report): void {
  let state: FenceState | null = null;
  for (const line of lines) {
    if (state) {
      const open = FENCE_OPEN.exec(line.text);
      if (
        open &&
        open[1][0] === state.char &&
        open[1].length >= state.length &&
        open[2].trim() !== ''
      ) {
        report(
          state.line,
          `code fence is never closed (a new code block starts at line ${line.n} before it ends; use a longer fence to nest fences)`,
        );
        return;
      }
    }
    state = stepFence(state, line.text, line.n).state;
  }
  if (state) report(state.line, 'code fence is never closed');
}

// ---------------------------------------------------------------------------
// Markers and sections

export const EDITABLE_MARKER = '--editable-region--';

const MARKER = /^(#{1,6}) --([a-z]+(?:-[a-z]+)*)--(?: +(.*\S))?\s*$/;

export interface Section {
  name: string;
  /** Text after the marker name, e.g. the type in `# --screen-- mcq`. Empty when absent. */
  arg: string;
  /** Line number of the marker. */
  line: number;
  /** Lines after the marker, up to the next marker of the same or a higher level. */
  body: Line[];
}

export interface SplitResult {
  /** Lines before the first marker. */
  pre: Line[];
  sections: Section[];
}

/**
 * Splits `lines` at markers of exactly `level` (1 = `#`, 2 = `##`, 3 = `###`).
 * Markers of a lower level number (a higher heading) inside the range are reported.
 */
export function splitSections(lines: Line[], level: number, report: Report): SplitResult {
  const pre: Line[] = [];
  const sections: Section[] = [];
  let state: FenceState | null = null;
  let current: Section | null = null;
  for (const line of lines) {
    const step = stepFence(state, line.text, line.n);
    state = step.state;
    const m = step.inside ? null : MARKER.exec(line.text);
    if (m) {
      const depth = m[1].length;
      if (depth < level) {
        report(
          line.n,
          `"${line.text.trim()}" is not allowed here (expected a "${'#'.repeat(level)} --name--" marker or deeper)`,
        );
        continue;
      }
      if (depth === level) {
        current = { name: m[2], arg: m[3] ?? '', line: line.n, body: [] };
        sections.push(current);
        continue;
      }
    }
    if (current) current.body.push(line);
    else pre.push(line);
  }
  return { pre, sections };
}

/** Lines that are `# --name--` markers outside code fences, at any level. */
export function findMarkerLines(lines: Line[]): Line[] {
  const found: Line[] = [];
  let state: FenceState | null = null;
  for (const line of lines) {
    const step = stepFence(state, line.text, line.n);
    state = step.state;
    if (!step.inside && MARKER.test(line.text)) found.push(line);
  }
  return found;
}

export interface SectionSpec {
  required?: readonly string[];
  optional?: readonly string[];
}

/**
 * Checks section names against a spec: unknown, duplicate and missing sections are reported.
 * Returns the sections by name (first occurrence).
 */
export function pickSections(
  sections: Section[],
  spec: SectionSpec,
  report: Report,
  where: string,
  missingLine: number,
): Map<string, Section> {
  const allowed = new Set([...(spec.required ?? []), ...(spec.optional ?? [])]);
  const found = new Map<string, Section>();
  for (const s of sections) {
    if (!allowed.has(s.name)) {
      report(
        s.line,
        `unknown section "--${s.name}--" in ${where} (allowed: ${[...allowed].map((n) => `--${n}--`).join(', ')})`,
      );
      continue;
    }
    if (found.has(s.name)) {
      report(s.line, `section "--${s.name}--" appears twice in ${where}`);
      continue;
    }
    found.set(s.name, s);
  }
  for (const name of spec.required ?? []) {
    if (!found.has(name)) report(missingLine, `missing section "--${name}--" in ${where}`);
  }
  return found;
}

// ---------------------------------------------------------------------------
// ::: tryit blocks

export type TryitSegment =
  { kind: 'text'; lines: Line[] } | { kind: 'tryit'; line: number; runner: string; body: Line[] };

const TRYIT_OPEN = /^::: *tryit(?: +(\S+))? *$/;
const TRYIT_CLOSE = /^::: *$/;

/** Cuts `::: tryit <runner>` ... `:::` blocks out of a body, keeping reading order. */
export function splitTryits(lines: Line[], report: Report): TryitSegment[] {
  const out: TryitSegment[] = [];
  let text: Line[] = [];
  let state: FenceState | null = null;
  let tryit: Extract<TryitSegment, { kind: 'tryit' }> | null = null;

  const flush = () => {
    if (text.length) out.push({ kind: 'text', lines: text });
    text = [];
  };

  for (const line of lines) {
    const step = stepFence(state, line.text, line.n);
    state = step.state;
    if (!step.inside) {
      if (tryit === null) {
        const open = TRYIT_OPEN.exec(line.text);
        if (open) {
          flush();
          if (!open[1]) report(line.n, 'a tryit block needs a runner: "::: tryit web"');
          tryit = { kind: 'tryit', line: line.n, runner: open[1] ?? '', body: [] };
          continue;
        }
      } else if (TRYIT_CLOSE.test(line.text)) {
        out.push(tryit);
        tryit = null;
        continue;
      }
    }
    if (tryit) tryit.body.push(line);
    else text.push(line);
  }
  if (tryit) {
    report(tryit.line, 'tryit block is never closed (end it with a line containing only ":::")');
    out.push(tryit);
  }
  flush();
  return out;
}

// ---------------------------------------------------------------------------
// Lists

export interface ListItem {
  line: number;
  /** Item text; continuation lines are joined with "\n". */
  text: string;
  /** Lines starting with `>` that follow the item, with the `> ` removed. */
  quote: string[];
  children: ListItem[];
}

const LIST_MARKER = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;

/** Parses a bulleted or numbered list (two levels are enough for this format). */
export function parseList(lines: Line[], report: Report): ListItem[] {
  const roots: ListItem[] = [];
  const stack: { indent: number; item: ListItem }[] = [];
  let last: ListItem | null = null;
  for (const line of lines) {
    if (line.text.trim() === '') continue;
    const marker = LIST_MARKER.exec(line.text);
    if (marker) {
      const indent = marker[1].replace(/\t/g, '    ').length;
      const item: ListItem = { line: line.n, text: marker[2], quote: [], children: [] };
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      if (stack.length) stack[stack.length - 1].item.children.push(item);
      else roots.push(item);
      stack.push({ indent, item });
      last = item;
      continue;
    }
    const quote = QUOTE.exec(line.text);
    if (quote) {
      if (last) last.quote.push(quote[1]);
      else report(line.n, 'a "> ..." line must follow a list item');
      continue;
    }
    if (last && last.quote.length === 0) {
      last.text += '\n' + line.text.trim();
    } else if (last) {
      last.quote[last.quote.length - 1] += '\n' + line.text.trim();
    } else {
      report(line.n, 'expected a list item ("- ...") here');
    }
  }
  return roots;
}

/** `` `x` `` -> `x`. Text without backticks is returned trimmed. */
export function unwrapCode(text: string): string {
  const trimmed = text.trim();
  const m = /^(`+)([\s\S]*?)\1$/.exec(trimmed);
  if (!m) return trimmed;
  let inner = m[2];
  if (inner.length > 2 && inner.startsWith(' ') && inner.endsWith(' ') && inner.trim() !== '') {
    inner = inner.slice(1, -1);
  }
  return inner;
}

// ---------------------------------------------------------------------------
// zod error -> file:line

/** Finds the best line for a zod/path-style error by walking from the full path up to its prefixes. */
export function lineForPath(
  anchors: Anchors,
  path: readonly (string | number)[],
  fallback = 1,
): number {
  for (let len = path.length; len > 0; len--) {
    const key = path.slice(0, len).join('.');
    if (key in anchors) return anchors[key];
  }
  return anchors[''] ?? fallback;
}

export function describePath(path: readonly (string | number)[]): string {
  return path.join('.');
}

export function zodIssues(error: ZodError, file: string, anchors: Anchors): Issue[] {
  return error.issues.map((issue) => {
    const where = describePath(issue.path);
    return {
      file,
      line: lineForPath(anchors, issue.path),
      message: where ? `${where}: ${issue.message}` : issue.message,
    };
  });
}
