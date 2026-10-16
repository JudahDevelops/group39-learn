/**
 * The small scripts that run inside the learner's sandboxed frames. Both are plain JavaScript in
 * strings (never compiled by the build), so they are written in ES2017 with no template literals.
 *
 *  - `previewBridge`: for the visible preview. Streams console lines and uncaught errors to the
 *    page, and stops links and forms from navigating the frame away from the learner's page.
 *  - `captureScript`: the console and error capture shared with the test harness (harness.ts).
 *  - `fetchShim`: answers `fetch("complaints.json")` from the learner's own files (both frames).
 *
 * The frames are sandboxed without `allow-same-origin`, so the only way out is postMessage. Every
 * message carries the nonce the page chose, and the page also checks `event.source`.
 */
import type { Files } from '../types';
import { fillTemplate, jsonForScript, normalizeName, scriptElement } from './assemble';
import { LOOP_GUARD } from './loops';

/** Fresh unguessable text for one frame. */
export function makeNonce(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** How long one run of a loop may go on before the learner's script is stopped. */
export const LOOP_LIMIT_MS = 1500;

/**
 * The call that protectLoops() puts at the start of every loop body. A run of a loop is a series
 * of iterations less than 300 ms apart; one that lasts longer than the limit throws.
 */
export const loopGuardScript = String.raw`
var loopSites = {};
function loopGuard(id) {
  var now = Date.now();
  var site = loopSites[id];
  if (!site || now - site.last > 300) { loopSites[id] = { start: now, last: now }; return; }
  site.last = now;
  if (now - site.start > __LIMIT__) {
    var stop = new Error('Your loop ran for more than ' + (__LIMIT__ / 1000) + ' seconds, so it was stopped. Check that something inside the loop changes, so its condition can become false.');
    stop.name = 'LoopStopped';
    throw stop;
  }
}
Object.defineProperty(window, '__GUARDNAME__', { value: loopGuard, enumerable: false });
`;

/**
 * Shared by both scripts. The surrounding script must define `report(line)` (one console line),
 * `onSyntax(message, line)` (a syntax error in the learner's code) and `onLoop(message)` (a loop
 * was stopped) before this runs.
 */
export const captureScript = String.raw`
function fmt(v) {
  if (typeof v === 'string') return v;
  if (v && v.nodeType === 1) return String(v.outerHTML).slice(0, 200);
  if (v instanceof Error) return v.name + ': ' + v.message;
  if (typeof v === 'function') return String(v);
  try { var s = JSON.stringify(v); if (s !== undefined) return s; } catch (e) {}
  return String(v);
}
function describe(err, fallback) {
  if (err && err.name) return err.name + ': ' + err.message;
  return String(fallback);
}
['log', 'info', 'debug', 'warn', 'error'].forEach(function (level) {
  var original = console[level];
  console[level] = function () {
    var text = Array.prototype.map.call(arguments, fmt).join(' ');
    if (level === 'warn') text = 'Warning: ' + text;
    else if (level === 'error') text = 'Error: ' + text;
    report(text);
    try { if (original) original.apply(console, arguments); } catch (e) {}
  };
});
window.addEventListener('error', function (e) {
  var err = e.error;
  if (err && err.name === 'LoopStopped') { onLoop(err.message); return; }
  var isSyntax = (err && err.name === 'SyntaxError') || /SyntaxError/.test(e.message || '');
  if (isSyntax) {
    var raw = (err && err.message) || String(e.message || '').replace(/^(Uncaught )?(SyntaxError: )?/, '');
    onSyntax(raw, e.lineno || 0);
    return;
  }
  report('Uncaught ' + describe(err, e.message));
});
window.addEventListener('unhandledrejection', function (e) {
  report('Uncaught (in promise) ' + describe(e.reason, e.reason));
});
`;

const PREVIEW_BRIDGE = String.raw`
(function () {
  var NONCE = __NONCE__;
  function send(m) { m.g39 = NONCE; try { window.parent.postMessage(m, '*'); } catch (e) {} }
  function report(line) { send({ kind: 'log', line: line }); }
  function onSyntax(message) { report('Uncaught SyntaxError: ' + message); }
  function onLoop(message) { report(message); }
  __LOOPGUARD__
  __CAPTURE__
  // Links and forms would load another page inside the frame. Keep the learner on their page.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || !e.target || !e.target.closest) return;
    var a = e.target.closest('a[href]');
    if (a && (a.getAttribute('href') || '').charAt(0) !== '#') e.preventDefault();
  });
  document.addEventListener('submit', function (e) { if (!e.defaultPrevented) e.preventDefault(); });
})();
`;

/** The loop guard with its limit and global name filled in. */
export function guardWithLimit(): string {
  return fillTemplate(loopGuardScript, { LIMIT: String(LOOP_LIMIT_MS), GUARDNAME: LOOP_GUARD });
}

/** The `<script>` placed at the start of the visible preview's head. */
export function previewBridge(nonce: string): string {
  const body = fillTemplate(PREVIEW_BRIDGE, {
    NONCE: JSON.stringify(nonce),
    LOOPGUARD: guardWithLimit(),
    CAPTURE: captureScript,
  });
  return scriptElement(body);
}

/** What the preview frame sends back. */
export interface PreviewMessage {
  g39: string;
  kind: 'log';
  line: string;
}

export function isPreviewMessage(data: unknown, nonce: string): data is PreviewMessage {
  if (typeof data !== 'object' || data === null) return false;
  const m = data as Record<string, unknown>;
  return m.g39 === nonce && m.kind === 'log' && typeof m.line === 'string';
}

/**
 * Inside a frame, `fetch("complaints.json")` answers from the learner's own files, the way a static
 * server would. The frame has no origin of its own, so a relative URL would otherwise ask the app's
 * server. A file that is not in the project gets a 404; an absolute URL goes to the real network.
 * The answer comes a few milliseconds later, so code that forgets `await` fails as it would online.
 */
const FETCH_SHIM = String.raw`
(function () {
  var FILES = __FILES__;
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  var TYPES = { json: 'application/json', html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript', txt: 'text/plain', csv: 'text/csv' };
  function typeOf(name) {
    var dot = name.lastIndexOf('.');
    return TYPES[dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''] || 'text/plain';
  }
  function fileName(url) {
    var path = url.split('#')[0].split('?')[0].trim().replace(/^(?:\.\/|\/)+/, '');
    try { return decodeURIComponent(path); } catch (e) { return path; }
  }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input && input.url ? String(input.url) : String(input);
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.indexOf('//') === 0) {
      return realFetch ? realFetch(input, init) : Promise.reject(new TypeError('Failed to fetch'));
    }
    var name = fileName(url);
    var found = Object.prototype.hasOwnProperty.call(FILES, name);
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (found) {
          resolve(new Response(FILES[name], { status: 200, headers: { 'Content-Type': typeOf(name) } }));
        } else {
          resolve(new Response('Not found: ' + name, { status: 404, statusText: 'Not Found', headers: { 'Content-Type': 'text/plain' } }));
        }
      }, 5);
    });
  };
})();
`;

/** The `<script>` that makes relative `fetch()` calls read the learner's files. */
export function fetchShim(files: Files): string {
  const byName: Record<string, string> = {};
  for (const [name, contents] of Object.entries(files)) byName[normalizeName(name)] = contents;
  return scriptElement(fillTemplate(FETCH_SHIM, { FILES: jsonForScript(byName) }));
}
