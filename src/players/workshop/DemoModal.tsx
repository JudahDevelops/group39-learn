import type { CodeRunner, SeedFile } from '../../content/schema';
import { CodeEditor } from '../../editor/CodeEditor';
import { freeEditorFiles } from '../../editor/files';
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

/** The finished project, rendered from the solutions. Web code runs; other code is shown read-only. */
export function DemoModal({ title, runner, files, entry, onClose }: DemoModalProps) {
  const record = Object.fromEntries(files.map((f) => [f.name, f.contents]));
  return (
    <Modal title={title} onClose={onClose} wide>
      {runner === 'web' ? (
        <div className="wk-demo">
          <WebPreview files={record} entry={entry} title={title} className="wk-demo-frame" />
        </div>
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
