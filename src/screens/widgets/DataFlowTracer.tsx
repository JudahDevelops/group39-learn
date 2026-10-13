import { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/widgets.css';
import { CheckIcon, CrossIcon } from '../Icons';
import { FlowColumn, type FlowMove } from './FlowColumn';
import type { WidgetProps } from './index';
import {
  isFinished,
  parseTracerProps,
  pickTier,
  startTracer,
  traceVerdict,
  type TracerState,
} from './tracer';

interface Message {
  right: boolean;
  text: string;
}

/**
 * Walks one flow (F1 to F4) a step at a time. The learner taps the tier that handles the current step. A
 * wrong tier is counted and marked, and the step stays open; the right tier moves the flow there and
 * lights the arrows it crossed. Once every step is placed, Check reports: correct only if no pick was
 * wrong, so the first attempt decides.
 */
export function DataFlowTracer({ props, onResult }: WidgetProps) {
  const { title, tiers, steps } = useMemo(() => parseTracerProps(props), [props]);

  const [tracer, setTracer] = useState<TracerState>(startTracer);
  const [where, setWhere] = useState<number | null>(null);
  const [move, setMove] = useState<FlowMove | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const moves = useRef(0);
  const checkButton = useRef<HTMLButtonElement>(null);

  const finished = isFinished(tracer, steps);

  // The last step is placed with a tap on a tier; the next thing to do is Check.
  useEffect(() => {
    if (finished) checkButton.current?.focus({ preventScroll: true });
  }, [finished]);

  function pick(tier: number) {
    if (submitted) return;
    const step = steps[tracer.current];
    const { state, right } = pickTier(tracer, steps, tier);
    if (state === tracer) return;
    setTracer(state);
    if (right) {
      moves.current += 1;
      setMove(where === null ? null : { from: where, to: step.tier, id: moves.current });
      setWhere(step.tier);
      setMessage({ right: true, text: `${tiers[tier]} is right.` });
    } else {
      setMessage({
        right: false,
        text: `${tiers[tier]} is not right for this step. Pick another tier.`,
      });
    }
  }

  function check() {
    if (!finished || submitted) return;
    const verdict = traceVerdict(tracer, steps.length);
    setSubmitted(true);
    onResult(verdict.correct, verdict.correct ? undefined : verdict.note);
  }

  return (
    <div className="w-tracer">
      <h3 className="w-title">{title}</h3>

      <div className="w-stepbox" aria-live="polite">
        {finished ? (
          <p className="w-step">That is the whole flow. Press Check to see how you did.</p>
        ) : (
          <>
            <p className="meta">
              Step {tracer.current + 1} of {steps.length}
            </p>
            <p className="w-step">{steps[tracer.current].text}</p>
            <p className="meta">Tap the tier that handles this step.</p>
          </>
        )}
      </div>

      <p
        className={`w-note${message ? (message.right ? ' w-note-right' : ' w-note-wrong') : ''}`}
        role="status"
      >
        {message && (
          <>
            {message.right ? <CheckIcon /> : <CrossIcon />}
            <span>{message.text}</span>
          </>
        )}
      </p>

      <FlowColumn
        label="Tiers"
        tierCount={tiers.length}
        move={move}
        box={(t) => {
          const rejected = tracer.rejected.includes(t);
          const here = where === t;
          return (
            <button
              type="button"
              className={`w-tier w-tier-button${here ? ' w-tier-here' : ''}${rejected ? ' w-tier-wrong' : ''}`}
              disabled={finished}
              aria-disabled={rejected || undefined}
              onClick={() => pick(t)}
            >
              <span className="w-tier-name">{tiers[t]}</span>
              {here && <span className="w-badge">Flow is here</span>}
              {rejected && (
                <span className="w-mark">
                  <CrossIcon />
                  <span className="sr-only">Not this step</span>
                </span>
              )}
            </button>
          );
        }}
      />

      {finished && (
        <div className="w-actions">
          <button
            ref={checkButton}
            type="button"
            className="btn btn-primary"
            disabled={submitted}
            onClick={check}
          >
            Check
          </button>
        </div>
      )}

      {tracer.current > 0 && (
        <section className="w-group" aria-labelledby="w-trace-title">
          <h4 id="w-trace-title" className="w-heading">
            Your trace
          </h4>
          <ol className="w-trace">
            {steps.slice(0, tracer.current).map((step, i) => (
              <li key={i}>
                <span>{step.text}</span> <span className="w-trace-tier">{tiers[step.tier]}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

DataFlowTracer.scored = true;
