import type { PlayerProps } from '../types';

/** Checking a repo is built in a later work package (WP 3.4); until then this page says so. */
export function ProjectPage({ block, onExit }: PlayerProps<'project'>) {
  return (
    <div className="page">
      <h1>{block.meta.title}</h1>
      <p>Checking your repo arrives in a later update.</p>
      <button type="button" className="btn btn-secondary" onClick={onExit}>
        Back to the map
      </button>
    </div>
  );
}
