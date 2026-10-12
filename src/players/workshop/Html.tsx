import type { ElementType } from 'react';

/** Renders HTML that the content build made from our own markdown. It is trusted. */
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
