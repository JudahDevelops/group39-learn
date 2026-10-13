import { useMemo, useRef, useState } from 'react';
import '../../styles/widgets.css';
import { CodeBlock } from '../CodeBlock';
import { FlowColumn, type FlowMove } from './FlowColumn';
import { parseExchangeProps, phaseAt, requestText, responseText } from './exchange';
import type { WidgetProps } from './index';

/**
 * Steps a request from the browser to the server to the database, and the response back, one stop at a
 * time. Back and Next move along the stops; the arrows between the boxes light up and animate in the
 * direction of travel. The request is shown from the first stop and the response from the stop after the
 * deepest one, both in the code style. Nothing is scored, so it never reports a result.
 */
export function RequestResponse({ props }: WidgetProps) {
  const exchange = useMemo(() => parseExchangeProps(props), [props]);
  const { stops, tiers } = exchange;

  const [index, setIndex] = useState(0);
  const [move, setMove] = useState<FlowMove | null>(null);
  const moves = useRef(0);

  const tierOf = (stop: number) => tiers.indexOf(stops[stop].tier);
  const phase = phaseAt(stops, index);

  function go(delta: -1 | 1) {
    const next = index + delta;
    if (next < 0 || next >= stops.length) return;
    moves.current += 1;
    setMove({ from: tierOf(index), to: tierOf(next), id: moves.current });
    setIndex(next);
  }

  return (
    <div className="w-exchange">
      <div className="w-stepbox" aria-live="polite">
        <p className="meta">
          Step {index + 1} of {stops.length}
        </p>
        <p className="w-step">{stops[index].label}</p>
      </div>

      <div className="w-actions w-actions-split">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={index === 0}
          onClick={() => go(-1)}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={index === stops.length - 1}
          onClick={() => go(1)}
        >
          Next
        </button>
      </div>

      <FlowColumn
        label="Where the request is"
        tierCount={tiers.length}
        move={move}
        box={(t) => {
          const here = tierOf(index) === t;
          return (
            <div
              className={`w-tier${here ? ' w-tier-here' : ''}`}
              aria-current={here ? 'step' : undefined}
            >
              <span className="w-tier-name">{tiers[t]}</span>
              {here && <span className="w-badge">Here</span>}
            </div>
          );
        }}
      />

      <CodeBlock name="Request" contents={requestText(exchange.request)} label="Request" />
      {phase === 'response' ? (
        <CodeBlock name="Response" contents={responseText(exchange.response)} label="Response" />
      ) : (
        <p className="w-placeholder">The response appears once the server has built it.</p>
      )}
    </div>
  );
}
