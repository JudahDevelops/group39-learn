import './fastapi.css';
import { statusText } from './messages';
import { useFastapiStatus } from './status';

/**
 * One line about the FastAPI runner itself: its size before the first download, then what it is
 * doing while it loads or restarts. Empty when there is nothing to say. The element is always
 * present, so a screen reader hears the text when it appears.
 */
export function FastapiNotice({ className }: { className?: string }) {
  const text = statusText(useFastapiStatus());
  return (
    <p className={className ? `fa-notice ${className}` : 'fa-notice'} role="status">
      {text}
    </p>
  );
}
