import { useState } from 'react';
import type { CodeRunner } from '../../content/schema';
import { WebPreview } from '../../runners/web/Preview';
import type { Files } from '../../runners/types';

interface OutputPaneProps {
  runner: CodeRunner;
  files: Files;
  /** The HTML file the preview opens. Defaults to index.html. */
  entry?: string;
}

/**
 * The right-hand pane. For the web runner: the page and a console. The other runners put their
 * own output here when they arrive (docs/design.md, "Other runners").
 */
export function OutputPane({ runner, files, entry }: OutputPaneProps) {
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
