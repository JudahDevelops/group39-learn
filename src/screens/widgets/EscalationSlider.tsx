import { useMemo, useState } from 'react';
import '../../styles/widgets.css';
import {
  emailedText,
  escalationLevel,
  formatHours,
  levelText,
  parseEscalationProps,
  scoreSlide,
  taskText,
  urgencyOf,
  type Level,
} from './escalation';
import type { WidgetProps } from './index';

/**
 * Slide t, the time a complaint has been open, and watch the escalation level L and who has been emailed
 * change. A timeline marks d and 2d. Without a `target` it is an explorer and never reports a result. With
 * a `target` it asks for the first moment that level starts and reports on Check; the slider moves one
 * hour at a time, and two buttons nudge it by exactly one hour for a thumb that is too coarse.
 */
export function EscalationSlider({ props, onResult }: WidgetProps) {
  const {
    deadlineHours: d,
    maxHours,
    target,
  } = useMemo(() => parseEscalationProps(props), [props]);

  const [t, setT] = useState(0);
  const [checked, setChecked] = useState(false);

  const level = escalationLevel(t, d);
  const percent = (hours: number) => (hours / maxHours) * 100;
  const emailed = emailedText(level);
  const segments = [
    { level: 0 as Level, from: 0, to: d },
    { level: 1 as Level, from: d, to: 2 * d },
    { level: 2 as Level, from: 2 * d, to: maxHours },
  ];

  function nudge(delta: -1 | 1) {
    setT((now) => Math.min(maxHours, Math.max(0, now + delta)));
  }

  function check() {
    if (target === undefined || checked) return;
    const verdict = scoreSlide(t, d, target);
    setChecked(true);
    onResult(verdict.correct, verdict.correct ? undefined : verdict.note);
  }

  return (
    <div className="w-slider">
      <p className="w-lead">
        {urgencyOf(d)}: d = {formatHours(d)}, 2d = {formatHours(2 * d)}
      </p>
      {target !== undefined && <p className="w-task">{taskText(target)}</p>}

      <dl className="w-readout">
        <div>
          <dt>Time open</dt>
          <dd>t = {formatHours(t)}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>L = {level}</dd>
        </div>
        <div>
          <dt>Emailed</dt>
          <dd>{emailed}</dd>
        </div>
      </dl>
      <p className="w-levelnote" aria-live="polite">
        {levelText(level)}
      </p>

      <div className="w-timeline-wrap">
        <div className="w-timeline" aria-hidden="true">
          {segments.map((segment) => (
            <span
              key={segment.level}
              className={`w-seg${segment.level === level ? ' w-seg-on' : ''}`}
              style={{ flexBasis: `${percent(segment.to) - percent(segment.from)}%` }}
            >
              L{segment.level}
            </span>
          ))}
          <span className="w-now" style={{ left: `${percent(t)}%` }} />
        </div>
        <input
          type="range"
          className="w-range"
          min={0}
          max={maxHours}
          step={1}
          value={t}
          disabled={checked}
          aria-label="Time the complaint has been open, in hours"
          aria-valuetext={`${formatHours(t)}, level ${level}. Emailed: ${emailed.toLowerCase()}.`}
          onChange={(event) => setT(Number(event.target.value))}
        />
        <div className="w-axis" aria-hidden="true">
          <span style={{ left: 0 }}>0</span>
          <span style={{ left: `${percent(d)}%` }}>d</span>
          <span style={{ left: `${percent(2 * d)}%` }}>2d</span>
          {percent(2 * d) < 86 && (
            <span className="w-axis-end" style={{ left: '100%' }}>
              {maxHours} h
            </span>
          )}
        </div>
      </div>

      <div className="w-actions w-actions-split">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={checked || t === 0}
          onClick={() => nudge(-1)}
        >
          1 hour earlier
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={checked || t === maxHours}
          onClick={() => nudge(1)}
        >
          1 hour later
        </button>
      </div>

      {target !== undefined && (
        <div className="w-actions">
          <button type="button" className="btn btn-primary" disabled={checked} onClick={check}>
            Check
          </button>
        </div>
      )}
    </div>
  );
}

/** Scored only in the lesson's scored mode, which is when it is given a `target`. */
EscalationSlider.scored = (props: Record<string, unknown>) => props.target !== undefined;
