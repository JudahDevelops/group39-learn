/**
 * "Try it": a small playground in a lesson or review. Everything is editable, Run shows the
 * result. Web code renders in a sandboxed preview, Python code prints to a console and SQL code
 * shows its rows in a Results panel; the other runners arrive in later updates, so their code is
 * shown read-only for now.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Tryit as TryitData } from '../content/schema';
import { PythonConsole } from '../runners/python/Console';
import { PythonNotice } from '../runners/python/Notice';
import { usePythonRun } from '../runners/python/useRun';
import { warmIfCached } from '../runners/python/warm';
import { lockOwnSetup, withOwnSetup } from '../runners/sql/files';
import { SqlNotice } from '../runners/sql/Notice';
import { SqlResults } from '../runners/sql/Results';
import { useSqlRun } from '../runners/sql/useRun';
import { warmIfCached as warmSqlIfCached } from '../runners/sql/warm';
import { WebPreview } from '../runners/web/Preview';
import { CodeEditor } from './CodeEditor';
import { filesToRecord, freeEditorFiles } from './files';

export function Tryit({ tryit }: { tryit: TryitData }) {
  // In SQL, setup.sql (the table and its rows) is shown but cannot be changed.
  const initial = useMemo(
    () => lockOwnSetup(freeEditorFiles(tryit.files), tryit.runner, tryit.files),
    [tryit],
  );

  if (tryit.runner === 'python') return <PythonTryit initial={initial} />;
  if (tryit.runner === 'sql') return <SqlTryit initial={initial} own={tryit.files} />;
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

function PythonTryit({ initial }: { initial: ReturnType<typeof freeEditorFiles> }) {
  const [current, setCurrent] = useState(() => filesToRecord(initial));
  const python = usePythonRun();
  useEffect(() => warmIfCached(), []);

  function run() {
    void python.run(current);
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
        <button type="button" className="btn btn-primary" onClick={run} disabled={python.running}>
          Run
        </button>
        <span className="tryit-hint">Ctrl+Enter</span>
      </div>
      <PythonNotice />
      <PythonConsole output={python.output} running={python.running} />
    </div>
  );
}

function SqlTryit({
  initial,
  own,
}: {
  initial: ReturnType<typeof freeEditorFiles>;
  own: TryitData['files'];
}) {
  const [current, setCurrent] = useState(() => filesToRecord(initial));
  const sql = useSqlRun();
  useEffect(() => warmSqlIfCached(), []);

  function run() {
    void sql.run(withOwnSetup(current, 'sql', own));
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
        <button type="button" className="btn btn-primary" onClick={run} disabled={sql.running}>
          Run
        </button>
        <span className="tryit-hint">Ctrl+Enter</span>
      </div>
      <SqlNotice />
      <SqlResults view={sql.view} running={sql.running} />
    </div>
  );
}

function WebTryit({ initial }: { initial: ReturnType<typeof freeEditorFiles> }) {
  const [current, setCurrent] = useState(() => filesToRecord(initial));
  const [shown, setShown] = useState(current);
  const [runs, setRuns] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  // JavaScript with no HTML page has nothing to show: the frame still runs it, out of sight.
  const [pageless] = useState(() => !Object.keys(current).some((name) => /\.html?$/i.test(name)));

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
      <div
        className={pageless ? 'tryit-result tryit-result-hidden' : 'tryit-result'}
        aria-hidden={pageless || undefined}
      >
        <WebPreview
          key={runs}
          files={shown}
          title="Result"
          className="tryit-frame"
          onConsole={setLines}
        />
      </div>
      {(lines.length > 0 || pageless) && (
        <pre className="tryit-console" aria-label="Console output">
          {lines.length > 0
            ? lines.join('\n')
            : 'Nothing logged yet. Press Run to see what your code logs.'}
        </pre>
      )}
    </div>
  );
}
