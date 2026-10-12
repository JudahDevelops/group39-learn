import { lockedLines } from '../players/lesson/grade';
import { CodeBlock } from './CodeBlock';
import { CodeField } from './CodeField';
import { Question } from './Question';
import type { ScreenProps } from './types';

/** Whether the code runner for this exercise could be loaded. Decided by the lesson player. */
export type RunnerStatus = 'checking' | 'ready' | 'missing';

export const RUNNER_MISSING_TEXT =
  'This exercise needs the code runner, which arrives in a later update.';

/**
 * A small editor for the lines the learner may change. The lines around them are locked and shown
 * muted; any other files are shown read-only. Checking happens in the player, through the runner.
 */
export function TypeinScreen({
  screen,
  answer,
  onAnswer,
  checked,
  runnerStatus,
}: ScreenProps<'typein', 'typein'> & { runnerStatus: RunnerStatus }) {
  const missing = runnerStatus === 'missing';
  return (
    <div className="screen" data-runner={runnerStatus}>
      <Question html={screen.prompt} />
      {screen.seed.map((file) => {
        if (!file.editable) {
          return <CodeBlock key={file.name} contents={file.contents} name={file.name} />;
        }
        const { before, after } = lockedLines(screen);
        return (
          <div key={file.name} className="editor">
            <div className="code-name">{file.name}</div>
            {before !== '' && <pre className="locked">{before}</pre>}
            <CodeField
              value={answer.text}
              lang={file.lang}
              label="Your code"
              readOnly={checked}
              onChange={(text) => onAnswer({ kind: 'typein', text })}
            />
            {after !== '' && <pre className="locked">{after}</pre>}
          </div>
        );
      })}
      {missing ? (
        <p className="notice">{RUNNER_MISSING_TEXT}</p>
      ) : (
        <p className="meta">Press Ctrl+Enter to check your code.</p>
      )}
    </div>
  );
}
