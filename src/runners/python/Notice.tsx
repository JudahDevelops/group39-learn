import './python.css';
import { statusText } from './messages';
import { usePythonStatus } from './status';

/**
 * One line about Python itself: its size before the first download, then what it is doing while it
 * loads or restarts. Empty when there is nothing to say. The element is always present, so a screen
 * reader hears the text when it appears.
 */
export function PythonNotice({ className }: { className?: string }) {
  const text = statusText(usePythonStatus());
  return (
    <p className={className ? `py-notice ${className}` : 'py-notice'} role="status">
      {text}
    </p>
  );
}
