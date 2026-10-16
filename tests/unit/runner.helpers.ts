import { JSDOM, VirtualConsole } from 'jsdom';
import type { FrameHost } from '../../src/runners/web/runner';

/**
 * Stands in for the hidden iframe: runs the srcdoc in its own jsdom window, scripts on. A top-level
 * jsdom window is its own `parent`, so the harness's postMessage lands on that window.
 * jsdom has no layout, so tests here avoid innerText and getComputedStyle (the e2e tests cover those).
 */
export const jsdomHost: FrameHost = {
  open(srcdoc, onMessage) {
    const virtualConsole = new VirtualConsole(); // swallow jsdom's own "Error: Uncaught" printing
    const dom = new JSDOM(srcdoc, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      virtualConsole,
      // jsdom has no fetch API; lend it Node's Response so the fetch shim can answer.
      beforeParse(window) {
        (window as unknown as { Response: typeof Response }).Response = Response;
      },
    });
    dom.window.addEventListener('message', (event: MessageEvent) => onMessage(event.data));
    return {
      dispose() {
        dom.window.close();
      },
    };
  },
};

/** A frame that never answers, to exercise the timeout. */
export const silentHost: FrameHost = {
  open() {
    return { dispose() {} };
  },
};
