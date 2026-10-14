/**
 * Markdown -> HTML at build time. Content is trusted: raw HTML in the markdown is passed through
 * unchanged (put tags you want to SHOW inside backticks).
 */
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * Wraps every markdown image in a link to itself, so a figure too small to read on a phone opens
 * full size in a new tab. Images already inside a link are left alone.
 */
function rehypeFigureLinks() {
  const walk = (node: HastNode, insideLink: boolean) => {
    node.children?.forEach((child, i) => {
      if (child.type !== 'element') return;
      if (child.tagName === 'img' && !insideLink && typeof child.properties?.src === 'string') {
        node.children![i] = {
          type: 'element',
          tagName: 'a',
          properties: {
            href: child.properties.src,
            target: '_blank',
            rel: 'noopener',
            className: ['figure-link'],
            title: 'Open full size',
          },
          children: [child],
        };
        return;
      }
      walk(child, insideLink || child.tagName === 'a');
    });
  };
  return (tree: HastNode) => walk(tree, false);
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeFigureLinks)
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
