import './python.css';

/** What a Python run printed, and the plain-words error if the code stopped. */
export interface ConsoleOutput {
  lines: string[];
  error: string | null;
}

interface PythonConsoleProps {
  /** Null until the code has run once. */
  output: ConsoleOutput | null;
  running: boolean;
  /** Said before the first run. */
  emptyText?: string;
  className?: string;
}

/**
 * The console: lines the code printed in code type, and a correction slip when it stopped. It sits
 * on the dark bench surface in the workshop pane and in Try it boxes (docs/design.md).
 */
export function PythonConsole({
  output,
  running,
  emptyText = 'Nothing printed yet. Press Run to see what your code prints.',
  className,
}: PythonConsoleProps) {
  const lines = output?.lines ?? [];
  const error = output?.error ?? null;
  let note: string | null = null;
  if (running && lines.length === 0 && !error) note = 'Running your code.';
  else if (!output) note = emptyText;
  else if (lines.length === 0 && !error) note = 'Your code ran and printed nothing.';

  return (
    <div
      className={className ? `py-console ${className}` : 'py-console'}
      role="log"
      aria-label="Output"
      aria-busy={running}
      tabIndex={0}
    >
      {lines.length > 0 && <pre className="py-lines">{lines.join('\n')}</pre>}
      {error && (
        <p className="py-error">
          <span className="py-sr-only">Error. </span>
          {error}
        </p>
      )}
      {note && <p className="py-empty">{note}</p>}
    </div>
  );
}
