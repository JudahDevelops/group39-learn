/**
 * Reference pages (content/reference/*.md): glossary, group decisions, do's and don'ts, schema.
 * Each file starts with a `# Title` line. The build writes public/content/reference/index.json and
 * one <page>.json per file. Pure, so it is unit-tested without touching the disk.
 */
import { markdownToHtml } from './markdown';

export interface ReferenceIndex {
  pages: { slug: string; title: string }[];
}

/** What public/content/reference/<slug>.json holds. `html` does not repeat the title. */
export interface ReferencePage {
  title: string;
  html: string;
}

/** The order the pages are listed in; any other file follows, in alphabetical order. */
export const REFERENCE_ORDER = ['glossary', 'decisions', 'dos-donts', 'schema'] as const;

const PATH_RE = /^reference\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

export interface ReferenceBuild {
  index: ReferenceIndex;
  pages: Map<string, ReferencePage>;
}

/** The page shows its title as an h2, so headings inside the body move down one level (h2 -> h3). */
function demoteHeadings(html: string): string {
  return html.replace(/<(\/?)h([1-5])(?=[\s>])/g, (_, slash: string, level: string) => {
    return `<${slash}h${Number(level) + 1}`;
  });
}

/** Wrapping each table lets it scroll sideways on a phone instead of widening the page. */
function wrapTables(html: string): string {
  return html
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

/**
 * `files` maps a path relative to content/ ("reference/glossary.md") to its text. Files outside
 * reference/ are ignored. Throws when a page has no `# Title` first line, so the build stops.
 */
export function buildReference(files: Record<string, string>): ReferenceBuild {
  const pages = new Map<string, ReferencePage>();
  for (const [path, text] of Object.entries(files)) {
    const match = PATH_RE.exec(path);
    if (!match) continue;
    const slug = match[1];
    if (slug === 'index') {
      throw new Error(`${path}: "index" is reserved for the page list; rename the file`);
    }
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const first = lines.findIndex((line) => line.trim() !== '');
    const title = first === -1 ? null : /^# (.+?)\s*$/.exec(lines[first])?.[1];
    if (!title) throw new Error(`${path}:1: a reference page starts with a "# Title" line`);
    const body = lines.slice(first + 1).join('\n');
    pages.set(slug, { title, html: wrapTables(demoteHeadings(markdownToHtml(body))) });
  }

  const rank = (slug: string) => {
    const i = (REFERENCE_ORDER as readonly string[]).indexOf(slug);
    return i === -1 ? REFERENCE_ORDER.length : i;
  };
  const slugs = [...pages.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return {
    index: { pages: slugs.map((slug) => ({ slug, title: pages.get(slug)!.title })) },
    pages,
  };
}
