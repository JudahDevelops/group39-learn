// The Pyodide worker for the python runner. It is read as text (`?raw`) and started from a Blob as
// a module worker, so it does not depend on how the app is bundled. docs/SPIKE.md, S1 and S5.
//
//   main -> worker  { id, type: "init", indexURL, harness }
//                   { id, type: "run", payload }            payload = { files, tests }
//   worker -> main  { type: "stage", id, stage: "download" | "start" | "prepare" }
//                   { type: "out", id, stream: "stdout" | "stderr", text }   one line at a time
//                   { type: "done", id, result? }
//                   { type: "fail", id, error }
//
// The message handler is set before anything is awaited, so no message is lost while Pyodide loads.

let pyodide = null;
let runHarness = null;
let currentId = 0;

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

async function init({ id, indexURL, harness }) {
  post({ type: 'stage', id, stage: 'download' });
  watchDownloads(id);
  const { loadPyodide } = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`);
  pyodide = await loadPyodide({
    indexURL,
    stdout: (text) => post({ type: 'out', id: currentId, stream: 'stdout', text }),
    stderr: (text) => post({ type: 'out', id: currentId, stream: 'stderr', text }),
    // There is nobody to type an answer: input() ends with an EOFError the page explains.
    stdin: () => undefined,
  });
  post({ type: 'stage', id, stage: 'prepare' });
  pyodide.runPython(harness);
  runHarness = pyodide.globals.get('g39_run');
  post({ type: 'done', id });
}

function run({ id, payload }) {
  currentId = id;
  // Blocks the worker while the learner's code runs. A loop that never ends is stopped by the page,
  // which terminates this worker after the timeout.
  const raw = runHarness(JSON.stringify(payload));
  currentId = 0;
  post({ type: 'done', id, result: JSON.parse(raw) });
}

self.onmessage = async (event) => {
  const message = event.data;
  try {
    if (message.type === 'init') await init(message);
    else if (message.type === 'run') run(message);
  } catch (error) {
    post({
      type: 'fail',
      id: message.id,
      error: String((error && error.message) || error),
    });
  }
};
