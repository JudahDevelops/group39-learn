import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import '../../styles/workshop.css';
import {
  loadPanes,
  MIN_PANE,
  resizePanes,
  savePanes,
  type LayoutMode,
  type PaneSizes,
} from './panes';

type Tab = 'instructions' | 'code' | 'preview';

interface WorkspaceProps {
  mode: LayoutMode;
  instructions: ReactNode;
  /** The correction slip. It sits under the instructions, or above the buttons on a phone. */
  slip: ReactNode;
  editor: ReactNode;
  /** Check and Reset. Under the editor, or in a bar at the bottom on a phone. */
  actions: ReactNode;
  output: ReactNode;
  /** Label for the right-hand pane's tab on a phone. */
  outputLabel?: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'instructions', label: 'Instructions' },
  { id: 'code', label: 'Code' },
];

/**
 * The three panes. The panes are always the same elements in the same order, whatever the width,
 * so resizing the window never rebuilds the editor or the preview: only the CSS and the
 * placement of the slip and the buttons change.
 */
export function Workspace({
  mode,
  instructions,
  slip,
  editor,
  actions,
  output,
  outputLabel = 'Preview',
}: WorkspaceProps) {
  const [tab, setTab] = useState<Tab>('instructions');
  const [sizes, setSizes] = useState<PaneSizes>(() => loadPanes());
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const narrow = mode === 'narrow';
  const wide = mode === 'wide';

  // The player fills the window below the top bar, whatever height the top bar has.
  useEffect(() => {
    const player = rootRef.current?.closest<HTMLElement>('.wk-player');
    if (!player) return;
    const fit = () => {
      player.style.setProperty(
        '--wk-top',
        `${player.getBoundingClientRect().top + window.scrollY}px`,
      );
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  function startDrag(divider: 0 | 1, event: ReactPointerEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) return;
    event.preventDefault();
    const width = root.getBoundingClientRect().width;
    const startX = event.clientX;
    const start = sizes;
    let latest = sizes;
    setDragging(true);
    const move = (e: PointerEvent) => {
      latest = resizePanes(start, divider, ((e.clientX - startX) / width) * 100);
      setSizes(latest);
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      setDragging(false);
      savePanes(latest);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }

  function onDividerKey(divider: 0 | 1, event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowLeft' ? -2 : event.key === 'ArrowRight' ? 2 : 0;
    if (!step) return;
    event.preventDefault();
    const next = resizePanes(sizes, divider, step);
    setSizes(next);
    savePanes(next);
  }

  const columns = wide
    ? {
        gridTemplateColumns: `minmax(0, ${sizes[0]}fr) 10px minmax(0, ${sizes[1]}fr) 10px minmax(0, ${sizes[2]}fr)`,
      }
    : undefined;

  const hide = (which: Tab) => narrow && tab !== which;

  return (
    <div ref={rootRef} className={`wk-workspace wk-${mode}${dragging ? ' wk-dragging' : ''}`}>
      {narrow && (
        <div className="wk-tabs" role="tablist" aria-label="Panels">
          {[...TABS, { id: 'preview' as const, label: outputLabel }].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className="wk-tab"
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="wk-grid" style={columns}>
        <section
          className="wk-pane wk-instructions"
          aria-label="Instructions"
          hidden={hide('instructions')}
        >
          <div className="wk-scroll">
            {instructions}
            {!narrow && slip}
          </div>
        </section>
        {wide && (
          <div
            className="wk-divider"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize instructions and editor"
            aria-valuenow={Math.round(sizes[0])}
            aria-valuemin={MIN_PANE}
            aria-valuemax={100 - 2 * MIN_PANE}
            tabIndex={0}
            onPointerDown={(e) => startDrag(0, e)}
            onKeyDown={(e) => onDividerKey(0, e)}
          />
        )}
        <section className="wk-pane wk-editor" aria-label="Code" hidden={hide('code')}>
          <div className="wk-editor-body">{editor}</div>
          {!narrow && actions}
        </section>
        {wide && (
          <div
            className="wk-divider"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor and preview"
            aria-valuenow={Math.round(sizes[1])}
            aria-valuemin={MIN_PANE}
            aria-valuemax={100 - 2 * MIN_PANE}
            tabIndex={0}
            onPointerDown={(e) => startDrag(1, e)}
            onKeyDown={(e) => onDividerKey(1, e)}
          />
        )}
        <section
          className="wk-pane wk-output-pane"
          aria-label={outputLabel}
          hidden={hide('preview')}
        >
          {output}
        </section>
      </div>
      {narrow && (
        <div className="wk-bottom">
          {slip}
          {actions}
        </div>
      )}
    </div>
  );
}
