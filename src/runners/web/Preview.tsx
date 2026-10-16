import { useEffect, useMemo, useRef } from 'react';
import type { Files } from '../types';
import { buildPreviewDocument } from './assemble';
import { fetchShim, isPreviewMessage, makeNonce, previewBridge } from './bridge';

const MAX_CONSOLE_LINES = 500;

interface WebPreviewProps {
  files: Files;
  /** Which HTML file is the page. Defaults to index.html. */
  entry?: string;
  title?: string;
  className?: string;
  /** Called with every console line so far (oldest first). It is called with [] each time the page reloads. */
  onConsole?: (lines: string[]) => void;
}

/**
 * A live render of the learner's page in a sandboxed iframe. `allow-scripts` and `allow-modals`
 * only: never `allow-same-origin`, so the page cannot reach the app that hosts it.
 */
export function WebPreview({
  files,
  entry,
  title = 'Preview',
  className,
  onConsole,
}: WebPreviewProps) {
  const nonce = useMemo(() => makeNonce(), []);
  const srcDoc = useMemo(
    () => buildPreviewDocument(files, { entry, inject: previewBridge(nonce) + fetchShim(files) }),
    [files, entry, nonce],
  );
  const frameRef = useRef<HTMLIFrameElement>(null);
  const linesRef = useRef<string[]>([]);
  const onConsoleRef = useRef(onConsole);

  useEffect(() => {
    onConsoleRef.current = onConsole;
  });

  // A new page: start the console over.
  useEffect(() => {
    linesRef.current = [];
    onConsoleRef.current?.([]);
  }, [srcDoc]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      timer = undefined;
      onConsoleRef.current?.([...linesRef.current]);
    };
    const listener = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isPreviewMessage(event.data, nonce)) return;
      if (linesRef.current.length < MAX_CONSOLE_LINES) linesRef.current.push(event.data.line);
      // A loop that logs thousands of lines should not re-render the page thousands of times.
      timer ??= setTimeout(flush, 40);
    };
    window.addEventListener('message', listener);
    return () => {
      window.removeEventListener('message', listener);
      clearTimeout(timer);
    };
  }, [nonce]);

  return (
    <iframe
      ref={frameRef}
      className={className ?? 'web-preview'}
      title={title}
      sandbox="allow-scripts allow-modals"
      srcDoc={srcDoc}
    />
  );
}
