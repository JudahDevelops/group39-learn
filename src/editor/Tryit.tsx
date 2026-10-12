// PLACEHOLDER: WP 1.5 replaces this with an editable editor plus a live preview/output.
// Keep the export name and props.
import type { Tryit as TryitData } from '../content/schema';

export function Tryit({ tryit }: { tryit: TryitData }) {
  return (
    <div className="tryit tryit-placeholder">
      {tryit.files.map((file) => (
        <pre key={file.name}>
          <code>{file.contents}</code>
        </pre>
      ))}
    </div>
  );
}
