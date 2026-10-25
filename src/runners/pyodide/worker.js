// The Pyodide worker for the python and fastapi runners. It is read as text (`?raw`) and started
// from a Blob as a module worker, so it does not depend on how the app is bundled. docs/SPIKE.md,
// S1, S2, S4 and S5.
//
//   main -> worker  { id, type: "init", indexURL, harness, packages?, pip?, after? }
//                   { id, type: "run", payload, fn? }     fn defaults to "g39_run"; payload is sent as JSON
//   worker -> main  { type: "stage", id, stage: "download" | "start" | "prepare" }
//                   { type: "out", id, stream: "stdout" | "stderr", text }   one line at a time
//                   { type: "done", id, result? }
//                   { type: "fail", id, error }
//
// `harness` is Python source. It is run once after Pyodide (and the packages, if any) are ready, and
// the functions it defines are what "run" calls. A function may be plain or `async def`: its result
// is awaited either way, and must be a JSON string.
//
// The python runner passes only `harness`. The fastapi runner also passes:
//   packages  names for pyodide.loadPackage (the built-in packages, from the CDN)
//   pip       requirements for micropip.install (from PyPI), installed before `after` runs
//   after     Python source run (async) after the harness: pre-imports and patches
//
// The message handler is set before anything is awaited, so no message is lost while Pyodide loads.

let pyodide = null;
let currentId = 0;
const functions = new Map();

function post(message) {
  self.postMessage(message);
}

/** Tells the page when the two big files have arrived, so it can say "Starting Python". Best effort. */
function watchDownloads(id) {
  try {
    const wanted = new Set(['pyodide.asm.wasm', 'python_stdlib.zip']);
    const seen = new Set();
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const file = entry.name.split('/').pop().split('?')[0];
        if (wanted.has(file)) seen.add(file);
      }
      if (seen.size === wanted.size) {
        observer.disconnect();
        post({ type: 'stage', id, stage: 'start' });
      }
    });
    observer.observe({ type: 'resource', buffered: true });
  } catch {
    // No resource timing here: the page keeps saying "Downloading" until Python is ready.
  }
}

async function init({ id, indexURL, harness, packages, pip, after }) {
  const hasPackages = Array.isArray(packages) && packages.length > 0;
  post({ type: 'stage', id, stage: 'download' });
  // With packages the download goes on after Pyodide itself is in, so "Starting" waits for them.
  if (!hasPackages) watchDownloads(id);
  const { loadPyodide } = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`);
  pyodide = await loadPyodide({
    indexURL,
    stdout: (text) => post({ type: 'out', id: currentId, stream: 'stdout', text }),
    stderr: (text) => post({ type: 'out', id: currentId, stream: 'stderr', text }),
    // There is nobody to type an answer: input() ends with an EOFError the page explains.
    stdin: () => undefined,
  });
  if (hasPackages) {
    // Pyodide would print "Loading fastapi, ..." as output; the page does not want it.
    await pyodide.loadPackage(packages, { messageCallback() {}, errorCallback() {} });
  }
  if (Array.isArray(pip) && pip.length > 0) {
    // Before the packages that look for them are imported (docs/SPIKE.md, snag 2).
    pyodide.globals.set('_g39_pip', pyodide.toPy(pip));
    await pyodide.runPythonAsync('import micropip\nawait micropip.install(_g39_pip)\ndel _g39_pip');
  }
  if (hasPackages) post({ type: 'stage', id, stage: 'start' });
  post({ type: 'stage', id, stage: 'prepare' });
  pyodide.runPython(harness);
  if (typeof after === 'string' && after !== '') await pyodide.runPythonAsync(after);
  post({ type: 'done', id });
}

function lookup(name) {
  let fn = functions.get(name);
  if (!fn) {
    fn = pyodide.globals.get(name);
    if (!fn) throw new Error(`The harness has no function called ${name}.`);
    functions.set(name, fn);
  }
  return fn;
}

async function run({ id, payload, fn }) {
  const call = lookup(fn || 'g39_run');
  currentId = id;
  try {
    // Blocks the worker while the learner's code runs. A loop that never ends is stopped by the
    // page, which terminates this worker after the timeout.
    const raw = await call(JSON.stringify(payload));
    post({ type: 'done', id, result: JSON.parse(raw) });
  } finally {
    currentId = 0;
  }
}

self.onmessage = async (event) => {
  const message = event.data;
  try {
    if (message.type === 'init') await init(message);
    else if (message.type === 'run') await run(message);
  } catch (error) {
    post({
      type: 'fail',
      id: message.id,
      error: String((error && error.message) || error),
    });
  }
};
