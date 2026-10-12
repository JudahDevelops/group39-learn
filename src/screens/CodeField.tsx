/**
 * The editable part of a typein screen. A plain textarea for now; WP 1.5's editor can replace the body
 * of this component as long as it keeps these props, and nothing else in the lesson has to change.
 */
export interface CodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Language of the code, for an editor that highlights it. Unused by the textarea. */
  lang: string;
  /** Accessible name of the field. */
  label: string;
  /** Stops edits but keeps the text selectable (used while feedback is showing). */
  readOnly?: boolean;
}

export function CodeField({ value, onChange, label, readOnly = false }: CodeFieldProps) {
  const rows = Math.min(Math.max(value.split('\n').length + 1, 3), 16);
  return (
    <div className="code-field">
      <textarea
        aria-label={label}
        value={value}
        rows={rows}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
