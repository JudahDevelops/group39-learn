import { createRoot } from 'react-dom/client';
import { PythonNotice } from './Notice';

/**
 * Puts the Python note above a lesson's bottom bar. The `typein` screen belongs to the lesson
 * player, which knows nothing about Python's download, so the note gets a small root of its own.
 * Returns the function that removes it.
 */
export function mountPythonNotice(): () => void {
  const host = document.createElement('div');
  host.className = 'py-floating';
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<PythonNotice />);
  return () => {
    // Unmounting while React is still committing the screen that asked for this is not allowed.
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  };
}
