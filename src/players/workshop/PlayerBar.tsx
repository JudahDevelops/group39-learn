import '../../styles/workshop.css';

export type SegmentState = 'done' | 'current' | 'todo';

/** Segmented progress: done segments are door green, the current one is brass, the rest are rule grey. */
export function Segments({ states }: { states: SegmentState[] }) {
  return (
    <div className="wk-segments" aria-hidden="true">
      {states.map((state, i) => (
        <span key={i} className={`wk-segment wk-segment-${state}`} />
      ))}
    </div>
  );
}

interface PlayerBarProps {
  title: string;
  /** "Step 3 of 25", or "Lab". */
  position: string;
  segments: SegmentState[];
  onHelp: () => void;
}

export function PlayerBar({ title, position, segments, onHelp }: PlayerBarProps) {
  return (
    <div className="wk-bar">
      <h1 className="wk-title">{title}</h1>
      <span className="wk-position">{position}</span>
      <Segments states={segments} />
      <button type="button" className="btn btn-secondary wk-help-button" onClick={onHelp}>
        Help
      </button>
    </div>
  );
}
