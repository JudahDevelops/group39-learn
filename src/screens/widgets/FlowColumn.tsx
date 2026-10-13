import { Fragment, type ReactNode } from 'react';
import '../../styles/widgets.css';
import { gapsCrossed, type Move } from './tracer';

/** The latest move of the flow. `id` changes with every move, so the arrows animate again. */
export interface FlowMove extends Move {
  id: number;
}

/**
 * The tiers as a column of boxes with an arrow between neighbours. The gaps that the latest move crosses
 * light up: the line turns dark, gets an arrowhead that points the way the flow went, and a brass dot
 * runs along it. Under prefers-reduced-motion the dot is not shown and the arrowhead says the same thing.
 * The caller draws the boxes, so they can be buttons (the tracer) or plain boxes (request and response).
 */
export function FlowColumn({
  label,
  tierCount,
  move,
  box,
}: {
  label: string;
  tierCount: number;
  move: FlowMove | null;
  box: (tier: number) => ReactNode;
}) {
  const crossed = move ? gapsCrossed(move) : null;
  return (
    <div className="w-flow" role="group" aria-label={label}>
      {Array.from({ length: tierCount }, (_, tier) => {
        const order = crossed ? crossed.gaps.indexOf(tier) : -1;
        return (
          <Fragment key={tier}>
            {box(tier)}
            {tier < tierCount - 1 && (
              <Link
                direction={order === -1 ? null : crossed!.direction}
                order={order}
                moveId={move?.id ?? 0}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/** One arrow between two neighbouring boxes. `order` is how far along the move's path this gap is. */
function Link({
  direction,
  order,
  moveId,
}: {
  direction: 'down' | 'up' | null;
  order: number;
  moveId: number;
}) {
  return (
    <span className={`w-link${direction ? ' w-link-lit' : ''}`} aria-hidden="true">
      <svg width="24" height="28" viewBox="0 0 24 28" fill="none" focusable="false">
        <path d="M12 0V28" />
        {direction === 'down' && <path d="M6 21 12 27 18 21" />}
        {direction === 'up' && <path d="M6 7 12 1 18 7" />}
      </svg>
      {direction && (
        <span
          key={moveId}
          className={`w-dot w-dot-${direction}`}
          style={{ animationDelay: `${order * 260}ms` }}
        />
      )}
    </span>
  );
}
