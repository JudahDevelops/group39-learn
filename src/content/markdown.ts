/**
 * Markdown -> HTML at build time. Content is trusted: raw HTML in the markdown is passed through
 * unchanged (put tags you want to SHOW inside backticks).
 */
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

export function markdownToHtml(markdown: string): string {
  return String(processor.processSync(markdown)).trim();
}

/**
 * Like markdownToHtml, but when the result is a single paragraph the wrapping <p> is removed,
 * so the text can sit inside a button, a list item or a tile.
 */
export function markdownInline(markdown: string): string {
  const html = markdownToHtml(markdown);
  const single = /^<p>([\s\S]*)<\/p>$/.exec(html);
  if (single && !single[1].includes('</p>')) return single[1];
  return html;
}
