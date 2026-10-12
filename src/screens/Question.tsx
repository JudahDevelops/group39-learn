import { Html } from './Html';

/** The question or prompt of a screen: 20/700, announced as a level-2 heading. */
export function Question({ html, id }: { html: string; id?: string }) {
  return (
    <div role="heading" aria-level={2} className="question">
      <Html id={id} html={html} />
    </div>
  );
}
