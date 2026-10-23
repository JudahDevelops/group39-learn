import { useEffect, useState } from 'react';
import type { CodeRunner } from '../../content/schema';
import { PythonConsole } from '../../runners/python/Console';
import { PythonNotice } from '../../runners/python/Notice';
import { warmIfCached as warmPythonIfCached } from '../../runners/python/warm';
import { SqlNotice } from '../../runners/sql/Notice';
import { SqlResults } from '../../runners/sql/Results';
import { warmIfCached as warmSqlIfCached } from '../../runners/sql/warm';
import { WebPreview } from '../../runners/web/Preview';
import type { Files } from '../../runners/types';
import type { CodeSession } from './useCodeSession';

interface OutputPaneProps {
  runner: CodeRunner;
  files: Files;
  /** The HTML file the preview opens. Defaults to index.html. */
  entry?: string;
  /** The code session; the python runner needs its Run button and its console. */
  session?: CodeSession;
}

/** The name of the right-hand pane (and of its tab on a phone). */
export function outputLabel(runner: CodeRunner): string {
  if (runner === 'python') return 'Output';
  if (runner === 'sql') return 'Results';
  return 'Preview';
}

/** The runner's own note (its download size, or that it is restarting), for under the buttons on a phone. */
export function RunnerNote({ runner }: { runner: CodeRunner }) {
  if (runner === 'python') return <PythonNotice />;
  if (runner === 'sql') return <SqlNotice />;
  return null;
}

/**
 * The right-hand pane. For the web runner: the page and a console. For python: an Output tab with
 * the console and a Run button. For sql: a Results tab with the rows and a Run button. The other
 * runners put their own output here when they arrive (docs/design.md, "Other runners").
 */
export function OutputPane({ runner, files, entry, session }: OutputPaneProps) {
  if (runner === 'python' && session) return <PythonOutput session={session} />;
  if (runner === 'sql' && session) return <SqlOutput session={session} />;
  return <WebOrWaiting runner={runner} files={files} entry={entry} />;
}

function SqlOutput({ session }: { session: CodeSession }) {
  useEffect(() => warmSqlIfCached(), []);
  return (
    <div className="wk-output">
      <div className="wk-output-tabs on-dark" role="tablist" aria-label="Results">
        <button
          type="button"
          role="tab"
          id="wk-tab-results"
          aria-selected="true"
          aria-controls="wk-panel-results"
          className="wk-output-tab"
        >
          Results
        </button>
        <button
          type="button"
          className="btn btn-secondary wk-run"
          onClick={() => void session.run()}
          disabled={session.busy}
          aria-busy={session.busy}
        >
          Run
        </button>
      </div>
      <div
        className="wk-sql"
        role="tabpanel"
        id="wk-panel-results"
        aria-labelledby="wk-tab-results"
      >
        <SqlNotice className="wk-sql-note" />
        <SqlResults view={session.results} running={session.busy} />
      </div>
    </div>
  );
}

function PythonOutput({ session }: { session: CodeSession }) {
  useEffect(() => warmPythonIfCached(), []);
  return (
    <div className="wk-output">
      <div className="wk-output-tabs on-dark" role="tablist" aria-label="Output">
        <button
          type="button"
          role="tab"
          id="wk-tab-output"
          aria-selected="true"
          aria-controls="wk-panel-output"
          className="wk-output-tab"
        >
          Output
        </button>
        <button
          type="button"
          className="btn btn-secondary wk-run"
          onClick={() => void session.run()}
          disabled={session.busy}
          aria-busy={session.busy}
        >
          Run
        </button>
      </div>
      <div
        className="wk-python"
        role="tabpanel"
        id="wk-panel-output"
        aria-labelledby="wk-tab-output"
      >
        <PythonNotice className="wk-python-note" />
        <PythonConsole output={session.console} running={session.busy} />
      </div>
    </div>
  );
}

function WebOrWaiting({ runner, files, entry }: Omit<OutputPaneProps, 'session'>) {
  const [tab, setTab] = useState<'preview' | 'console'>('preview');
  const [lines, setLines] = useState<string[]>([]);

  if (runner !== 'web') {
    return (
      <div className="wk-output">
        <p className="wk-output-note">Running this code arrives in a later update.</p>
      </div>
    );
  }

  return (
    <div className="wk-output">
      <div className="wk-output-tabs on-dark" role="tablist" aria-label="Output">
        <button
          type="button"
          role="tab"
          id="wk-tab-preview"
          aria-selected={tab === 'preview'}
          aria-controls="wk-panel-preview"
          className="wk-output-tab"
          onClick={() => setTab('preview')}
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          id="wk-tab-console"
          aria-selected={tab === 'console'}
          aria-controls="wk-panel-console"
          className="wk-output-tab"
          onClick={() => setTab('console')}
        >
          {lines.length > 0 ? `Console (${lines.length})` : 'Console'}
        </button>
      </div>
      <div
        className="wk-preview"
        role="tabpanel"
        id="wk-panel-preview"
        aria-labelledby="wk-tab-preview"
        hidden={tab !== 'preview'}
      >
        <WebPreview files={files} entry={entry} title="Preview of your page" onConsole={setLines} />
      </div>
      <div
        className="wk-console"
        role="tabpanel"
        id="wk-panel-console"
        aria-labelledby="wk-tab-console"
        hidden={tab !== 'console'}
      >
        {lines.length > 0 ? (
          <pre role="log" aria-label="Console output">
            {lines.join('\n')}
          </pre>
        ) : (
          <p className="wk-output-note">
            Nothing printed yet. Text from <code>console.log</code> in your JavaScript appears here.
          </p>
        )}
      </div>
    </div>
  );
}
