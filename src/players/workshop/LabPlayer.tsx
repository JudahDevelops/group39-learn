import { useCallback, useState } from 'react';
import { CodeEditor } from '../../editor/CodeEditor';
import { completeItem } from '../../lib/progress';
import { useStore } from '../../store/StoreContext';
import '../../styles/workshop.css';
import type { PlayerProps } from '../types';
import { CheckActions } from './CheckActions';
import { DemoModal } from './DemoModal';
import { CorrectionSlip, TestList } from './Feedback';
import { HelpModal, whatsappUrl } from './HelpModal';
import { Html } from './Html';
import { OutputPane, outputLabel, RunnerNote } from './OutputPane';
import { PlayerBar, type SegmentState } from './PlayerBar';
import { useCheckShortcut } from './useCheckShortcut';
import { useCodeSession } from './useCodeSession';
import { useLayoutMode } from './useLayoutMode';
import { Workspace } from './Workspace';

export function LabPlayer({ block, itemId, onExit }: PlayerProps<'lab'>) {
  const { lab, meta } = block;
  const store = useStore();
  const mode = useLayoutMode();
  const [helpOpen, setHelpOpen] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);

  const session = useCodeSession({
    itemId,
    runner: lab.runner,
    seed: lab.seed,
    tests: lab.tests,
    onPass: async () => {
      await completeItem(store, meta.id, meta.id, ['lab']);
    },
  });
  const { check, outcome, stale } = session;

  // Ctrl+Enter checks; once every test passes, Ctrl+Enter continues.
  const checkOrContinue = useCallback(() => {
    if (outcome?.passed && !stale) onExit();
    else void check();
  }, [outcome, stale, onExit, check]);
  useCheckShortcut(checkOrContinue);

  const results = outcome?.output.results ?? [];
  const segments: SegmentState[] = lab.tests.map((_, i) => (results[i]?.ok ? 'done' : 'todo'));
  const passing = results.filter((r) => r.ok).length;
  const position = results.length > 0 ? `${passing} of ${lab.tests.length} tests pass` : 'Lab';

  const whatsappHref = whatsappUrl({
    blockTitle: meta.title,
    stepTitle: 'Lab',
    href: window.location.href,
    code: helpOpen ? session.getEditableCode() : '',
  });

  const instructions = (
    <>
      <Html html={lab.description} className="wk-text" />
      <h2 className="wk-subhead">User stories</h2>
      <ol className="wk-stories">
        {lab.userStories.map((story, i) => (
          <Html key={i} as="li" html={story} className="wk-story" />
        ))}
      </ol>
      {(lab.demo ?? meta.demo) && (
        <button
          type="button"
          className="btn btn-secondary wk-demo-button"
          onClick={() => setDemoOpen(true)}
        >
          See the example project
        </button>
      )}
      {outcome && <TestList output={outcome.output} />}
    </>
  );

  return (
    <div className="wk-player">
      <PlayerBar
        title={meta.title}
        position={position}
        segments={segments}
        onHelp={() => setHelpOpen(true)}
      />
      {session.ready ? (
        <Workspace
          mode={mode}
          instructions={instructions}
          slip={
            <CorrectionSlip
              output={outcome?.output ?? { results: [], firstFailure: null, logs: [] }}
              passed={outcome?.passed ?? false}
              doneText="Lab done"
              onContinue={onExit}
              hideTestFailure
            />
          }
          editor={
            <CodeEditor
              key={session.editorKey}
              files={session.editorFiles}
              onChange={session.onEdit}
              onCheck={checkOrContinue}
              ariaLabel="Code editor"
            />
          }
          actions={
            <CheckActions
              checking={session.busy}
              onCheck={() => void check()}
              onReset={session.reset}
              onRun={session.livePreview ? undefined : session.refreshPreview}
              note={mode === 'narrow' ? <RunnerNote runner={lab.runner} /> : undefined}
              resetLabel="Reset lab"
              confirmText="Reset this lab to its starting code?"
            />
          }
          outputLabel={outputLabel(lab.runner)}
          output={<OutputPane runner={lab.runner} files={session.previewFiles} session={session} />}
        />
      ) : (
        <div className="wk-loading" aria-busy="true" />
      )}
      {helpOpen && (
        <HelpModal
          hints={lab.help}
          revealed={hintsShown}
          onReveal={() => setHintsShown((n) => Math.min(n + 1, lab.help.length))}
          whatsappHref={whatsappHref}
          onClose={() => setHelpOpen(false)}
        />
      )}
      {demoOpen && (lab.demo ?? meta.demo) && (
        <DemoModal
          title="The example project"
          runner={lab.runner}
          files={lab.solutions}
          entry={lab.demo ?? meta.demo ?? ''}
          onClose={() => setDemoOpen(false)}
        />
      )}
    </div>
  );
}
