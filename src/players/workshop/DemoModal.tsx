import type { CodeRunner, SeedFile } from '../../content/schema';
import { CodeEditor } from '../../editor/CodeEditor';
import { freeEditorFiles } from '../../editor/files';
import { PythonConsole } from '../../runners/python/Console';
import { PythonNotice } from '../../runners/python/Notice';
import { usePythonRun } from '../../runners/python/useRun';
import { SqlNotice } from '../../runners/sql/Notice';
import { SqlResults } from '../../runners/sql/Results';
import { useSqlRun } from '../../runners/sql/useRun';
import { WebPreview } from '../../runners/web/Preview';
import { Modal } from './Modal';

interface DemoModalProps {
  title: string;
  runner: CodeRunner;
  /** The solution files of the last step (or the lab). */
  files: SeedFile[];
  /** The file the example opens, from meta.json `demo`. */
  entry: string;
  onClose: () => void;
}

/** The finished project, rendered from the solutions. Web, Python and SQL code run; other code is shown read-only. */
export function DemoModal({ title, runner, files, entry, onClose }: DemoModalProps) {
  const record = Object.fromEntries(files.map((f) => [f.name, f.contents]));
  return (
    <Modal title={title} onClose={onClose} wide>
      {runner === 'web' ? (
        <div className="wk-demo">
          <WebPreview files={record} entry={entry} title={title} className="wk-demo-frame" />
        </div>
      ) : runner === 'python' ? (
        <PythonDemo files={files} record={record} />
      ) : runner === 'sql' ? (
        <SqlDemo files={files} record={record} />
      ) : (
        <>
          <CodeEditor
            files={freeEditorFiles(files)}
            readOnly
            height="auto"
            ariaLabel="Finished project code"
          />
          <p className="wk-output-note">Running this code arrives in a later update.</p>
        </>
      )}
    </Modal>
  );
}

function PythonDemo({ files, record }: { files: SeedFile[]; record: Record<string, string> }) {
  const python = usePythonRun();
  return (
    <div className="tryit">
      <CodeEditor
        files={freeEditorFiles(files)}
        readOnly
        height="auto"
        ariaLabel="Finished project code"
      />
      <div className="tryit-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void python.run(record)}
          disabled={python.running}
        >
          Run
        </button>
      </div>
      <PythonConsole output={python.output} running={python.running} />
      <PythonNotice />
    </div>
  );
}

function SqlDemo({ files, record }: { files: SeedFile[]; record: Record<string, string> }) {
  const sql = useSqlRun();
  return (
    <div className="tryit">
      <CodeEditor
        files={freeEditorFiles(files)}
        readOnly
        height="auto"
        ariaLabel="Finished project code"
      />
      <div className="tryit-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void sql.run(record)}
          disabled={sql.running}
        >
          Run
        </button>
      </div>
      <SqlResults view={sql.view} running={sql.running} />
      <SqlNotice />
    </div>
  );
}
