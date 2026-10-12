/** A read-only code listing in Mono on the bench colour. `name` is the file name, when the block has one. */
export function CodeBlock({
  contents,
  name,
  label,
}: {
  contents: string;
  name?: string;
  label?: string;
}) {
  return (
    <figure className="code-block">
      {name && <figcaption className="code-name">{name}</figcaption>}
      {/* Focusable so a keyboard user can scroll a long line sideways. */}
      <pre tabIndex={0} aria-label={label ?? (name ? `Code in ${name}` : 'Code')}>
        <code>{contents}</code>
      </pre>
    </figure>
  );
}
