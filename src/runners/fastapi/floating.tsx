import { createRoot } from 'react-dom/client';
import { FastapiNotice } from './Notice';

/**
 * Puts the FastAPI runner note above a lesson's bottom bar. The `typein` screen belongs to the
 * lesson player, which knows nothing about the download, so the note gets a small root of its own.
 * Returns the function that removes it.
 */
export function mountFastapiNotice(): () => void {
  const host = document.createElement('div');
  host.className = 'fa-floating';
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<FastapiNotice />);
  return () => {
    // Unmounting while React is still committing the screen that asked for this is not allowed.
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  };
}
