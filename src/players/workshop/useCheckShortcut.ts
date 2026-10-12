import { useEffect } from 'react';

/**
 * Ctrl/Cmd+Enter anywhere on the page runs `handler` (check the code, or continue once it passes).
 * The editor handles the key itself when it has focus and marks the event, so it never runs twice.
 * A dialog that is open keeps the key to itself.
 */
export function useCheckShortcut(handler: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.defaultPrevented) {
        return;
      }
      if (document.querySelector('.wk-backdrop')) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handler]);
}
