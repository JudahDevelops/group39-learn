import type { ElementType } from 'react';

/**
 * Puts build-time HTML into the page. Only content from `npm run content` goes through here: it was
 * rendered from our own markdown, so it is trusted (see src/content/schema.ts). Never pass learner input.
 */
export function Html({
  html,
  as: Tag = 'div',
  className,
}: {
  html: string;
  as?: ElementType;
  className?: string;
}) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
