import { createRoot } from 'react-dom/client';
import { SqlNotice } from './Notice';

/**
 * Puts the PostgreSQL note above a lesson's bottom bar. The `typein` screen belongs to the lesson
 * player, which knows nothing about the download, so the note gets a small root of its own.
 * Returns the function that removes it.
 */
export function mountSqlNotice(): () => void {
  const host = document.createElement('div');
  host.className = 'sql-floating';
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<SqlNotice />);
  return () => {
    // Unmounting while React is still committing the screen that asked for this is not allowed.
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  };
}
