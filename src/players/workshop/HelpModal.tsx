import { useEffect, useRef } from 'react';
import { firstCharacters } from '../../editor/files';
import { Html } from './Html';
import { Modal } from './Modal';

/** The link that opens WhatsApp with a message the learner can send to the group. */
export function whatsappUrl(input: {
  blockTitle: string;
  stepTitle: string;
  href: string;
  code: string;
}): string {
  const text = `${input.blockTitle}, ${input.stepTitle}\n${input.href}\n\n${firstCharacters(input.code, 600)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

interface HelpModalProps {
  /** Hints as HTML, from the content. Shown one at a time, in order. */
  hints: string[];
  revealed: number;
  onReveal: () => void;
  whatsappHref: string;
  onClose: () => void;
}

export function HelpModal({ hints, revealed, onReveal, whatsappHref, onClose }: HelpModalProps) {
  const lastHint = useRef<HTMLLIElement>(null);
  const opened = useRef(false);

  // When the last hint is shown, its button leaves the page. Put focus on the hint instead, so
  // keyboard and screen reader users land on what they asked for.
  useEffect(() => {
    if (opened.current && revealed === hints.length) lastHint.current?.focus();
    opened.current = true;
  }, [revealed, hints.length]);

  return (
    <Modal title="Help" onClose={onClose}>
      {revealed > 0 && (
        <ol className="wk-hints" aria-label="Hints">
          {hints.slice(0, revealed).map((hint, i) => (
            <li key={i} ref={i === revealed - 1 ? lastHint : undefined} tabIndex={-1}>
              <p className="wk-hint-label">Hint {i + 1}</p>
              <Html html={hint} className="wk-text" />
            </li>
          ))}
        </ol>
      )}
      <div className="wk-help-actions">
        {revealed < hints.length && (
          <button type="button" className="btn btn-primary" onClick={onReveal}>
            Show hint {revealed + 1}
          </button>
        )}
        <a
          className="btn btn-secondary"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ask the group on WhatsApp
        </a>
      </div>
      <p className="wk-integrity">AI may explain code to you, but it must not write it.</p>
      <p className="wk-help-note">
        Tab indents in the editor. To move on with Tab instead, press Ctrl+M first.
      </p>
    </Modal>
  );
}
