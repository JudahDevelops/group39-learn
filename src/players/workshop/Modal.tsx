import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** A larger sheet, for the finished-project preview. */
  wide?: boolean;
  role?: 'dialog' | 'alertdialog';
}

/**
 * A sheet that rises from the bottom edge (docs/design.md: 16 px top corners, the one shadow).
 * Escape and a click outside close it. Focus moves inside, stays inside, and goes back to the
 * button that opened it.
 */
export function Modal({ title, onClose, children, wide = false, role = 'dialog' }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    // Start on the first control in the body, not on the close button.
    const target =
      dialog?.querySelector<HTMLElement>('.wk-modal-body')?.querySelector<HTMLElement>(FOCUSABLE) ??
      dialog?.querySelector<HTMLElement>(FOCUSABLE) ??
      dialog;
    target?.focus();
    return () => opener?.focus();
  }, []);

  // Escape closes the sheet even when focus has been lost (a button that was pressed can
  // disappear from the page, which leaves focus on the body).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className="wk-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={wide ? 'wk-modal wk-modal-wide' : 'wk-modal'}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <header className="wk-modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="btn btn-text wk-modal-close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="wk-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
