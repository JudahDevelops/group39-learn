import type { ElementType } from 'react';

/**
 * Renders HTML that the content build produced from markdown. It is trusted (docs/content-format.md),
 * so it goes straight into the page. Use `as="span"` for inline fields such as option text.
 */
export function Html({
  html,
  as: Tag = 'div',
  className,
  id,
}: {
  html: string;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  return <Tag id={id} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** The text of an HTML fragment, for accessible names. Parsing does not run scripts or load images. */
export function plainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
