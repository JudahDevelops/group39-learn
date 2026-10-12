import { useId } from 'react';
import { itemTicked, matchesPattern } from '../players/lesson/grade';
import { leaveOutput, setOutput, toggleItem } from './answers';
import { CodeBlock } from './CodeBlock';
import { CrossIcon } from './Icons';
import { Html } from './Html';
import type { ScreenProps } from './types';

/**
 * Tasks to do on the learner's own laptop. An item with a check shows the command to run and a box to
 * paste what it printed; the item only ticks once that output matches the item's pattern.
 */
export function ChecklistScreen({
  screen,
  answer,
  onAnswer,
}: Omit<ScreenProps<'checklist', 'checklist'>, 'checked'>) {
  const group = useId();
  return (
    <div className="screen">
      <ul className="checklist">
        {screen.items.map((item, i) => {
          const output = answer.output[i];
          const ticked = itemTicked(item, answer.ticked[i], output);
          const check = item.check;
          const showHint =
            Boolean(check) && answer.tried[i] && !matchesPattern(check!.pattern, output);
          const hintId = `${group}-hint-${i}`;
          const pasteId = `${group}-paste-${i}`;
          return (
            <li key={i} className="check-item">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={ticked}
                  aria-describedby={showHint ? hintId : undefined}
                  onChange={() => onAnswer(toggleItem(screen, answer, i))}
                />
                <Html as="span" html={item.html} className="check-text" />
              </label>
              {check && (
                <div className="check-detail">
                  <CodeBlock contents={check.command} label="Command to run" />
                  <label className="check-paste-label" htmlFor={pasteId}>
                    Paste what it prints
                  </label>
                  <textarea
                    id={pasteId}
                    className="text-input check-paste"
                    rows={3}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    value={output}
                    onChange={(event) => onAnswer(setOutput(answer, i, event.target.value))}
                    onBlur={() => onAnswer(leaveOutput(answer, i))}
                  />
                  {showHint && (
                    <p id={hintId} className="check-hint" role="alert">
                      <CrossIcon size={16} />
                      <span>{check.hint}</span>
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
