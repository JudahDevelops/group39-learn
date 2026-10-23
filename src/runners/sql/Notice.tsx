import './sql.css';
import { statusText } from './messages';
import { useSqlStatus } from './status';

/**
 * One line about PostgreSQL itself: its size before the first download, then what it is doing while
 * it loads or restarts. Empty when there is nothing to say. The element is always present, so a
 * screen reader hears the text when it appears.
 */
export function SqlNotice({ className }: { className?: string }) {
  const text = statusText(useSqlStatus());
  return (
    <p className={className ? `sql-notice ${className}` : 'sql-notice'} role="status">
      {text}
    </p>
  );
}
