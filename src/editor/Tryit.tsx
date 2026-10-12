/**
 * "Try it": a small playground in a lesson or review. Everything is editable, Run shows the
 * result. Web code renders in a sandboxed preview; the other runners arrive in later updates, so
 * their code is shown read-only for now.
 */
import { useMemo, useState } from 'react';
import type { Tryit as TryitData } from '../content/schema';
import { WebPreview } from '../runners/web/Preview';
import { CodeEditor } from './CodeEditor';
import { filesToRecord, freeEditorFiles } from './files';

export function Tryit({ tryit }: { tryit: TryitData }) {
  const initial = useMemo(() => freeEditorFiles(tryit.files), [tryit]);

  if (tryit.runner !== 'web') {
    return (
      <div className="tryit">
        <CodeEditor files={initial} readOnly height="auto" ariaLabel="Example code" />
        <p className="tryit-note">Running this code arrives in a later update.</p>
      </div>
    );
  }
  return <WebTryit initial={initial} />;
}

function WebTryit({ initial }: { initial: ReturnType<typeof freeEditorFiles> }) {
  const [current, setCurrent] = useState(() => filesToRecord(initial));
  const [shown, setShown] = useState(current);
  const [runs, setRuns] = useState(0);
  const [lines, setLines] = useState<string[]>([]);

  function run() {
    setShown(current);
    setRuns((n) => n + 1);
  }

  return (
    <div className="tryit">
      <CodeEditor
        files={initial}
        height="auto"
        ariaLabel="Try it code"
        onChange={(snapshot) => setCurrent(snapshot.files)}
        onCheck={run}
      />
      <div className="tryit-actions">
        <button type="button" className="btn btn-primary" onClick={run}>
          Run
        </button>
        <span className="tryit-hint">Ctrl+Enter</span>
      </div>
      <div className="tryit-result">
        <WebPreview
          key={runs}
          files={shown}
          title="Result"
          className="tryit-frame"
          onConsole={setLines}
        />
      </div>
      {lines.length > 0 && (
        <pre className="tryit-console" aria-label="Console output">
          {lines.join('\n')}
        </pre>
      )}
    </div>
  );
}
