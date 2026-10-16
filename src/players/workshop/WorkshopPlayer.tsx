import { useCallback, useState } from 'react';
import type { Step } from '../../content/schema';
import { CodeEditor } from '../../editor/CodeEditor';
import { completeItem } from '../../lib/progress';
import { useStore } from '../../store/StoreContext';
import '../../styles/workshop.css';
import type { PlayerProps } from '../types';
import { CheckActions } from './CheckActions';
import { DemoModal } from './DemoModal';
import { CorrectionSlip } from './Feedback';
import { HelpModal, whatsappUrl } from './HelpModal';
import { Html } from './Html';
import { PythonNotice } from '../../runners/python/Notice';
import { OutputPane } from './OutputPane';
import { PlayerBar, type SegmentState } from './PlayerBar';
import { useCheckShortcut } from './useCheckShortcut';
import { useCodeSession } from './useCodeSession';
import { useDoneItems } from './useDoneItems';
import { useLayoutMode } from './useLayoutMode';
import { Workspace } from './Workspace';

export function WorkshopPlayer(props: PlayerProps<'workshop'>) {
  const step = props.block.steps.find((s) => s.id === props.itemId);
  if (!step) {
    return (
      <div className="wk-done">
        <h1>This step could not be found</h1>
        <p className="wk-text">Go back to the map and open the workshop again.</p>
        <button type="button" className="btn btn-primary" onClick={props.onExit}>
          Back to the map
        </button>
      </div>
    );
  }
  // One StepView per step: moving to the next step starts with fresh hints, console and slip.
  return <StepView key={step.id} {...props} step={step} />;
}

function StepView({ block, step, onExit, onNavigate }: PlayerProps<'workshop'> & { step: Step }) {
  const store = useStore();
  const mode = useLayoutMode();
  const doneItems = useDoneItems();
  const [helpOpen, setHelpOpen] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = block.steps.length;
  const index = block.steps.findIndex((s) => s.id === step.id);
  const number = index + 1;
  const next = block.steps[index + 1];
  const last = block.steps[total - 1] ?? step;

  const session = useCodeSession({
    itemId: step.id,
    runner: step.runner,
    seed: step.seed,
    tests: step.tests,
    onPass: async () => {
      await completeItem(store, step.id, block.meta.id, ['step']);
    },
  });
  const { check, outcome, stale } = session;

  const goOn = useCallback(() => {
    if (next) onNavigate(next.id);
    else setFinished(true);
  }, [next, onNavigate]);

  // Ctrl+Enter checks; once the code passes, Ctrl+Enter continues.
  const checkOrContinue = useCallback(() => {
    if (outcome?.passed && !stale) goOn();
    else void check();
  }, [outcome, stale, goOn, check]);
  useCheckShortcut(checkOrContinue);

  if (finished) {
    const doneCount = block.steps.filter((s) => doneItems.has(s.id) || s.id === step.id).length;
    return (
      <div className="wk-done">
        <h1>Workshop done</h1>
        <p className="wk-text">
          {block.meta.title}: {doneCount} of {total} steps done.
        </p>
        <button type="button" className="btn btn-primary" onClick={onExit}>
          Continue
        </button>
      </div>
    );
  }

  const segments: SegmentState[] = block.steps.map((s) =>
    s.id === step.id ? 'current' : doneItems.has(s.id) ? 'done' : 'todo',
  );

  const whatsappHref = whatsappUrl({
    blockTitle: block.meta.title,
    stepTitle: step.title,
    href: window.location.href,
    code: helpOpen ? session.getEditableCode() : '',
  });

  const instructions = (
    <>
      <Html html={step.description} className="wk-text" />
      {index === 0 && block.meta.demo && (
        <button
          type="button"
          className="btn btn-secondary wk-demo-button"
          onClick={() => setDemoOpen(true)}
        >
          See the finished project
        </button>
      )}
    </>
  );

  const slip = (
    <CorrectionSlip
      output={outcome?.output ?? { results: [], firstFailure: null, logs: [] }}
      passed={outcome?.passed ?? false}
      doneText={`Step ${number} of ${total} done`}
      onContinue={goOn}
    />
  );

  return (
    <div className="wk-player">
      <PlayerBar
        title={block.meta.title}
        position={`Step ${number} of ${total}`}
        segments={segments}
        onHelp={() => setHelpOpen(true)}
      />
      {session.ready ? (
        <Workspace
          mode={mode}
          instructions={instructions}
          slip={slip}
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
              note={step.runner === 'python' && mode === 'narrow' ? <PythonNotice /> : undefined}
            />
          }
          outputLabel={step.runner === 'python' ? 'Output' : 'Preview'}
          output={
            <OutputPane runner={step.runner} files={session.previewFiles} session={session} />
          }
        />
      ) : (
        <div className="wk-loading" aria-busy="true" />
      )}
      {helpOpen && (
        <HelpModal
          hints={step.help}
          revealed={hintsShown}
          onReveal={() => setHintsShown((n) => Math.min(n + 1, step.help.length))}
          whatsappHref={whatsappHref}
          onClose={() => setHelpOpen(false)}
        />
      )}
      {demoOpen && block.meta.demo && (
        <DemoModal
          title="The finished project"
          runner={step.runner}
          files={last.solutions}
          entry={block.meta.demo}
          onClose={() => setDemoOpen(false)}
        />
      )}
    </div>
  );
}
