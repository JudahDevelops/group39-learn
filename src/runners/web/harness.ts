/**
 * The test harness: a script placed at the start of the hidden test frame's head. It carries
 * chai, waits for the learner's page to finish loading, runs every test body as an async function
 * and posts the outcome back to the page.
 *
 * chai ships one ESM bundle (`chai/index.js`, a single `export { ... }` and no imports). We load it
 * as a raw string and turn the export into a return value, so it runs as a classic inline script
 * inside the sandboxed frame with nothing leaked onto the learner's `window`.
 */
import chaiSource from 'chai/index.js?raw';
import { captureScript, guardWithLimit } from './bridge';
import { fillTemplate, jsonForScript, scriptElement } from './assemble';
import type { Files } from '../types';

/** chai's bundle as a function body that returns `{ assert, expect }`. Exported for tests. */
export function chaiAsFunctionBody(source: string = chaiSource): string {
  const exportBlock = /\bexport\s*\{[^}]*\}\s*;?\s*$/;
  if (!exportBlock.test(source)) {
    throw new Error('Unexpected chai bundle: no trailing export block to replace.');
  }
  return source.replace(exportBlock, 'return { assert: assert, expect: expect };');
}

const HARNESS = String.raw`
(function () {
  var NONCE = __NONCE__;
  var TESTS = __TESTS__;
  var CODE = __CODE__;
  var FILES = __FILES__;
  var MAX_LOGS = 200;
  var chai = (function () {
    'use strict';
    __CHAI__
  })();
  var logs = [];
  var syntax = null;
  var loopMessage = null;
  function send(m) { m.g39 = NONCE; try { window.parent.postMessage(m, '*'); } catch (e) {} }
  function report(line) { if (logs.length < MAX_LOGS) logs.push(line); }
  function onSyntax(message, line) { if (!syntax) syntax = { message: message, line: line }; }
  function onLoop(message) { if (!loopMessage) loopMessage = message; report(message); }
  __LOOPGUARD__
  __CAPTURE__

  var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  // Wait for the page: the load event, or shortly after the document is ready when a slow
  // image or font keeps load waiting (campus wifi).
  function pageReady() {
    return new Promise(function (resolve) {
      var finished = false;
      function go() { if (!finished) { finished = true; setTimeout(resolve, 0); } }
      window.addEventListener('load', go);
      document.addEventListener('DOMContentLoaded', function () { setTimeout(go, 1200); });
    });
  }

  async function runAll() {
    if (syntax || loopMessage) { send({ kind: 'done', logs: logs, syntax: syntax, loop: loopMessage }); return; }
    var results = [];
    for (var i = 0; i < TESTS.length; i++) {
      try {
        var fn = new AsyncFunction('code', 'assert', 'document', 'window', 'files', TESTS[i]);
        await fn(CODE, chai.assert, document, window, FILES);
        results.push({ ok: true });
      } catch (err) {
        results.push({ ok: false, detail: err && err.message ? String(err.message) : String(err) });
      }
    }
    if (loopMessage) { send({ kind: 'done', logs: logs, loop: loopMessage }); return; }
    send({ kind: 'done', logs: logs, results: results });
  }

  pageReady().then(runAll, function (err) {
    send({ kind: 'done', logs: logs, results: [], detail: String(err) });
  });
})();
`;

export interface HarnessInput {
  nonce: string;
  /** Each test's JavaScript body, in order. */
  tests: string[];
  /** The text a test sees as `code`. */
  code: string;
  files: Files;
}

/** The `<script>` element for the hidden test frame. */
export function testHarness(input: HarnessInput): string {
  const body = fillTemplate(HARNESS, {
    NONCE: JSON.stringify(input.nonce),
    TESTS: jsonForScript(input.tests),
    CODE: jsonForScript(input.code),
    FILES: jsonForScript(input.files),
    LOOPGUARD: guardWithLimit(),
    CAPTURE: captureScript,
    CHAI: chaiAsFunctionBody(),
  });
  return scriptElement(body);
}

/** What the test frame sends back when it is finished. */
export interface DoneMessage {
  g39: string;
  kind: 'done';
  logs: string[];
  results?: { ok: boolean; detail?: string }[];
  syntax?: { message: string; line: number } | null;
  /** The plain-words message when a loop in the learner's code was stopped. */
  loop?: string | null;
}

export function isDoneMessage(data: unknown, nonce: string): data is DoneMessage {
  if (typeof data !== 'object' || data === null) return false;
  const m = data as Record<string, unknown>;
  return m.g39 === nonce && m.kind === 'done' && Array.isArray(m.logs);
}
