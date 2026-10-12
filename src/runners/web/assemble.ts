/**
 * Pure helpers that turn a learner's files into one HTML document for the preview frame and for
 * the hidden test frame. Nothing here touches the DOM, so it is unit-tested directly
 * (tests/unit/runner.assemble.test.ts).
 *
 * `styles.css` and `script.js` are inlined: a matching `<link>` / `<script src>` is replaced in
 * place, and a file the page never mentions is appended (CSS to the head, JS to the end of the
 * body). A sandboxed `srcdoc` frame has no file system to load them from.
 */
import type { Files } from '../types';
import { protectLoops } from './loops';

export const DEFAULT_ENTRY = 'index.html';

/** `./styles.css` and `/styles.css` both mean `styles.css`. */
export function normalizeName(name: string): string {
  return name.trim().replace(/^(?:\.\/|\/)+/, '');
}

const isHtml = (name: string) => /\.html?$/i.test(name);
const isCss = (name: string) => /\.css$/i.test(name);
const isJs = (name: string) => /\.m?js$/i.test(name);

/** The HTML file the preview opens: `entry` if given, else index.html, else the first HTML file. */
export function entryFile(files: Files, entry?: string): string | null {
  if (entry && entry in files) return entry;
  if (DEFAULT_ENTRY in files) return DEFAULT_ENTRY;
  return Object.keys(files).find(isHtml) ?? null;
}

/**
 * What a test sees as `code`: the learner's HTML page, or every file joined when there is no
 * HTML (a JavaScript-only block, say).
 */
export function codeForTests(files: Files): string {
  const entry = entryFile(files);
  if (entry) return files[entry] ?? '';
  return Object.values(files).join('\n');
}

// ---------------------------------------------------------------------------
// Escaping

/** Keeps a script's text from ending its own `<script>` element or opening an HTML comment. */
export function escapeScriptText(source: string): string {
  return source.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

function escapeStyleText(source: string): string {
  return source.replace(/<\/(style)/gi, '<\\/$1');
}

/** JSON that is safe to paste into a `<script>` as a JavaScript expression. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Fills `__NAME__` placeholders in one pass, so text inside a value (a learner's code that happens
 * to contain `__FILES__`) is never mistaken for a placeholder.
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/__([A-Z]+)__/g, (whole, name: string) => values[name] ?? whole);
}

/** A `<script>` element holding `body`. Used for the console bridge and the test harness. */
export function scriptElement(body: string): string {
  return `<script>${escapeScriptText(body)}</script>`;
}

// ---------------------------------------------------------------------------
// Matching tags

function getAttr(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? '';
}

/** Applies `replace` to the parts of the HTML that are not inside `<!-- comments -->`. */
function replaceOutsideComments(
  html: string,
  pattern: RegExp,
  replacer: (match: string) => string,
): string {
  // With a capture group, split() puts the comments at the odd indexes.
  return html
    .split(/(<!--[\s\S]*?-->)/)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(pattern, replacer)))
    .join('');
}

const SCRIPT_MARK = (name: string) => `/*g39:${name}*/`;

function styleElement(css: string): string {
  return `<style>${escapeStyleText(css)}</style>`;
}

/** The marker comment sits on the same line as the first line of the file, so line N of the file is line N of the marker's line onward. */
function inlineScriptElement(name: string, source: string, attrs: string): string {
  const safe = protectLoops(source, name);
  return `<script${attrs}>${SCRIPT_MARK(name)}${escapeScriptText(safe)}</script>`;
}

/** Applies loop protection to the `<script>` elements written inside the page itself. */
function protectPageScripts(html: string, pageName: string): string {
  let count = 0;
  return replaceOutsideComments(html, /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (whole) => {
    const match = /^<script\b([^>]*)>([\s\S]*?)<\/script\s*>$/i.exec(whole);
    const attrs = match?.[1] ?? '';
    const body = match?.[2] ?? '';
    if (/\ssrc\s*=/i.test(attrs)) return whole;
    const type = getAttr(`<script${attrs}>`, 'type');
    if (
      type !== null &&
      !/^(?:module|(?:text|application)\/(?:x-)?(?:java|ecma)script)?$/i.test(type.trim())
    ) {
      return whole;
    }
    count++;
    return `<script${attrs}>${protectLoops(body, `${pageName}#${count}`)}</script>`;
  });
}

// ---------------------------------------------------------------------------
// Placing things in the document

function insertAfterMatch(html: string, pattern: RegExp, snippet: string): string | null {
  const match = pattern.exec(html);
  if (!match) return null;
  const at = match.index + match[0].length;
  return html.slice(0, at) + snippet + html.slice(at);
}

/** Puts `snippet` as the first thing inside `<head>`; falls back to after `<html>`, then after the doctype, then the very start. */
export function injectAtHeadStart(html: string, snippet: string): string {
  return (
    insertAfterMatch(html, /<head(?:\s[^>]*)?>/i, snippet) ??
    insertAfterMatch(html, /<html(?:\s[^>]*)?>/i, snippet) ??
    insertAfterMatch(html, /^\s*<!doctype[^>]*>/i, snippet) ??
    snippet + html
  );
}

function lastIndexOfTag(html: string, tag: string): number {
  const re = new RegExp(`</${tag}\\s*>`, 'gi');
  let at = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) at = m.index;
  return at;
}

function appendToHead(html: string, snippet: string): string {
  const close = lastIndexOfTag(html, 'head');
  if (close >= 0) return html.slice(0, close) + snippet + html.slice(close);
  return injectAtHeadStart(html, snippet);
}

function appendToBody(html: string, snippet: string): string {
  const close = lastIndexOfTag(html, 'body');
  if (close >= 0) return html.slice(0, close) + snippet + html.slice(close);
  return html + snippet;
}

// ---------------------------------------------------------------------------
// Assembly

export interface PreviewOptions {
  /** Which HTML file is the page. Defaults to index.html. */
  entry?: string;
  /** HTML placed at the very start of the head, before the learner's own scripts. */
  inject?: string;
}

const EMPTY_PAGE =
  '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n</head>\n<body>\n</body>\n</html>';

/** One HTML document with the learner's CSS and JavaScript inlined. */
export function buildPreviewDocument(files: Files, options: PreviewOptions = {}): string {
  const entry = entryFile(files, options.entry);
  let html = entry ? protectPageScripts(files[entry] ?? '', entry) : EMPTY_PAGE;
  const deferred: string[] = [];

  for (const [rawName, contents] of Object.entries(files)) {
    if (rawName === entry) continue;
    const name = normalizeName(rawName);

    if (isCss(name)) {
      let used = false;
      html = replaceOutsideComments(html, /<link\b[^>]*>/gi, (tag) => {
        if (used) return tag;
        const href = getAttr(tag, 'href');
        if (href === null || !/stylesheet/i.test(getAttr(tag, 'rel') ?? '')) return tag;
        if (normalizeName(href) !== name) return tag;
        used = true;
        return styleElement(contents);
      });
      if (!used) html = appendToHead(html, styleElement(contents));
    } else if (isJs(name)) {
      let used = false;
      html = replaceOutsideComments(
        html,
        /<script\b[^>]*\bsrc\s*=[^>]*>\s*<\/script\s*>/gi,
        (tag) => {
          if (used) return tag;
          const src = getAttr(tag, 'src');
          if (src === null || normalizeName(src) !== name) return tag;
          used = true;
          const opening = /^<script\b([^>]*)>/i.exec(tag)?.[1] ?? '';
          const attrs = opening.replace(/\ssrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
          // An inline script ignores `defer`, so run it where defer would have: after the page is read.
          const isModule = /\btype\s*=\s*["']?module/i.test(attrs);
          if (/\sdefer\b/i.test(attrs) && !isModule) {
            deferred.push(
              inlineScriptElement(
                name,
                contents,
                attrs.replace(/\sdefer\b(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/i, ''),
              ),
            );
            return '';
          }
          return inlineScriptElement(name, contents, attrs);
        },
      );
      if (!used) deferred.push(inlineScriptElement(name, contents, ''));
    }
  }

  if (deferred.length) html = appendToBody(html, deferred.join('\n'));
  if (options.inject) html = injectAtHeadStart(html, options.inject);
  return html;
}

/**
 * Maps a line number in the assembled document back to a line of an inlined file, using the
 * marker comment `buildPreviewDocument` writes at the start of each inlined script.
 * Returns null for lines that belong to the HTML page itself.
 */
export function locateScriptLine(
  doc: string,
  lineno: number,
): { file: string; line: number } | null {
  const lines = doc.split('\n');
  for (let i = Math.min(lineno, lines.length) - 1; i >= 0; i--) {
    const marker = /\/\*g39:([^*]+)\*\//.exec(lines[i] ?? '');
    if (marker?.[1]) return { file: marker[1], line: lineno - i };
    // Reaching the end of another script means the line is not inside an inlined file.
    if (i < lineno - 1 && /<\/script/i.test(lines[i] ?? '')) return null;
  }
  return null;
}

/** True when the page runs JavaScript: a script file with code in it, or a `<script>` element. */
export function usesScript(files: Files): boolean {
  return Object.entries(files).some(([name, text]) =>
    isJs(name) ? text.trim() !== '' : isHtml(name) && /<script\b/i.test(text),
  );
}
