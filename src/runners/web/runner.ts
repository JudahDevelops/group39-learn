/**
 * The web runner. One check = one fresh, hidden, sandboxed iframe:
 *
 *   assemble the learner's page + the test harness -> iframe.srcdoc -> the harness runs every test
 *   -> postMessage back -> the frame is removed.
 *
 * The frame is `sandbox="allow-scripts"` and never `allow-same-origin`, so the learner's code
 * cannot touch the app (its cookies, storage or DOM). The page only listens to messages whose
 * `event.source` is that frame and that carry this run's nonce.
 *
 * A frame cannot be killed while its own code is in a tight loop, so a run that never answers is
 * reported as "took too long" after the timeout and the frame is removed. A browser that shares
 * one thread between the page and the frame can still stall until that loop ends.
 */
import type { TestCase } from '../../content/schema';
import type { Files, RunOutput, Runner, TestResult } from '../types';
import { buildPreviewDocument, codeForTests, locateScriptLine } from './assemble';
import { makeNonce } from './bridge';
import { isDoneMessage, testHarness, type DoneMessage } from './harness';

export const DEFAULT_TIMEOUT_MS = 5000;

/** Opens a frame holding `srcdoc` and passes every message from it to `onMessage`. */
export interface FrameHost {
  open(srcdoc: string, onMessage: (data: unknown) => void): { dispose(): void };
}

/** The real thing: a hidden sandboxed iframe in the current page. */
export const domFrameHost: FrameHost = {
  open(srcdoc, onMessage) {
    const frame = document.createElement('iframe');
    // No allow-modals: alert() and confirm() in the learner's code must not block a check.
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('title', 'Code check');
    frame.tabIndex = -1;
    // Off-screen but laid out, so innerText and getComputedStyle give real answers.
    frame.style.cssText =
      'position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:0;opacity:0;pointer-events:none;';
    const listener = (event: MessageEvent) => {
      if (event.source === frame.contentWindow) onMessage(event.data);
    };
    window.addEventListener('message', listener);
    frame.srcdoc = srcdoc;
    document.body.appendChild(frame);
    return {
      dispose() {
        window.removeEventListener('message', listener);
        frame.remove();
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Plain-words errors

/** Rewrites a browser's syntax error message into something a beginner can act on. */
export function plainSyntaxProblem(message: string): string {
  const text = message.trim();
  if (/unexpected end of input|unexpected eof/i.test(text)) {
    return 'the code ends before a bracket, quote or block is closed. Look for a missing ), ] or }';
  }
  const token = /unexpected token '?([^'\s]+)'?/i.exec(text);
  if (token?.[1]) {
    return `the character ${token[1]} is not expected there. Check the line above it for a missing bracket, quote or comma`;
  }
  if (/missing \) after argument list/i.test(text)) {
    return 'a closing ) is missing after the values in a function call';
  }
  if (/invalid or unexpected token/i.test(text)) {
    return 'a character or quote is not allowed there. Check for a quote that is never closed';
  }
  if (/unexpected identifier/i.test(text)) {
    return 'a word is in the wrong place. A comma, operator or quote is probably missing before it';
  }
  if (/unexpected string/i.test(text)) {
    return 'a piece of text is in the wrong place. A comma or operator is probably missing before it';
  }
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** The sentence a learner sees for a syntax error. `doc` is the page the frame ran, used to find the line. */
export function syntaxErrorText(syntax: { message: string; line: number }, doc: string): string {
  const where = syntax.line > 0 ? locateScriptLine(doc, syntax.line) : null;
  const place = where ? ` on line ${where.line} of ${where.file}` : '';
  return `Your JavaScript has a syntax error${place}: ${plainSyntaxProblem(syntax.message)}. Fix it, then check again.`;
}

const TIMEOUT_TEXT =
  'Your code took too long to run, so the check was stopped. Look for a loop that never ends.';

// ---------------------------------------------------------------------------

function toRunOutput(done: DoneMessage, tests: TestCase[], doc: string): RunOutput {
  const logs = done.logs;
  if (done.loop) {
    return { results: [], firstFailure: null, logs, error: done.loop };
  }
  if (done.syntax) {
    return { results: [], firstFailure: null, logs, error: syntaxErrorText(done.syntax, doc) };
  }
  const raw = done.results ?? [];
  const results: TestResult[] = tests.map((test, i) => {
    const got = raw[i];
    const result: TestResult = { ok: got?.ok === true, message: test.text };
    if (got && !got.ok && got.detail) result.detail = got.detail;
    return result;
  });
  const firstFailure = results.findIndex((r) => !r.ok);
  return { results, firstFailure: firstFailure === -1 ? null : firstFailure, logs };
}

export function createWebRunner(host: FrameHost = domFrameHost): Runner {
  return {
    run(files: Files, tests: TestCase[], options) {
      const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const nonce = makeNonce();
      const harness = testHarness({
        nonce,
        tests: tests.map((t) => t.code),
        code: codeForTests(files),
        files,
      });
      const doc = buildPreviewDocument(files, { inject: harness });

      return new Promise<RunOutput>((resolve) => {
        let settled = false;
        let handle: { dispose(): void } | null = null;
        const timer = setTimeout(
          () => finish({ results: [], firstFailure: null, logs: [], error: TIMEOUT_TEXT }),
          timeoutMs,
        );
        function finish(output: RunOutput) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          handle?.dispose();
          resolve(output);
        }
        try {
          handle = host.open(doc, (data) => {
            if (isDoneMessage(data, nonce)) finish(toRunOutput(data, tests, doc));
          });
          // A host that answered before open() returned.
          if (settled) handle.dispose();
        } catch (err) {
          finish({
            results: [],
            firstFailure: null,
            logs: [],
            error: `The code check could not start: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      });
    },
  };
}

/** The runner the app uses. */
export const webRunner: Runner = createWebRunner();
