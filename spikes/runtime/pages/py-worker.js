// Pyodide host worker (module worker). One protocol for every Python check:
//   main -> worker  {id, type: "init" | "load" | "pip" | "run" | "interrupt-buffer", ...}
//   worker -> main  {type: "stdout" | "stderr", id, text}   streamed while a "run" executes
//                   {type: "done", id, ms, value?}           request finished
//                   {type: "fail", id, error}                request threw (error = message with Python traceback)
import { PYODIDE_INDEX_URL } from "./config.js";

let pyodide = null;
let currentId = null;

async function handle({ id, type, ...args }) {
  const t0 = performance.now();
  let value;
  if (type === "init") {
    // Pyodide 314 ships as ESM; a module worker loads it with dynamic import().
    const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
    pyodide = await loadPyodide({
      indexURL: PYODIDE_INDEX_URL,
      stdout: (text) => postMessage({ type: "stdout", id: currentId, text }),
      stderr: (text) => postMessage({ type: "stderr", id: currentId, text }),
    });
    value = { pyodideVersion: pyodide.version };
  } else if (type === "load") {
    // Quiet the "Loading x, y" progress lines; loadPackage also pulls dependencies from pyodide-lock.json.
    await pyodide.loadPackage(args.packages, { messageCallback: () => {}, errorCallback: (m) => postMessage({ type: "stderr", id, text: m }) });
  } else if (type === "pip") {
    await pyodide.loadPackage("micropip", { messageCallback: () => {} });
    pyodide.globals.set("_pip_packages", pyodide.toPy(args.packages));
    await pyodide.runPythonAsync("import micropip\nawait micropip.install(_pip_packages)");
    pyodide.globals.delete("_pip_packages");
  } else if (type === "interrupt-buffer") {
    pyodide.setInterruptBuffer(args.buffer); // needs a SharedArrayBuffer (cross-origin isolation); used only by S8
  } else if (type === "run") {
    currentId = id;
    try {
      const result = await pyodide.runPythonAsync(args.code);
      value = result && typeof result.toJs === "function" ? result.toJs({ dict_converter: Object.fromEntries }) : result;
      if (result && typeof result.destroy === "function") result.destroy();
    } finally {
      currentId = null;
    }
  }
  postMessage({ type: "done", id, ms: performance.now() - t0, value });
}

self.onmessage = async (e) => {
  try {
    await handle(e.data);
  } catch (err) {
    postMessage({ type: "fail", id: e.data.id, error: String((err && err.message) || err) });
  }
};
