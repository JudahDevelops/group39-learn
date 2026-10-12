// Informational S1 variant: classic (non-module) worker using importScripts("pyodide.js").
const INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
(async () => {
  try {
    importScripts(INDEX_URL + "pyodide.js");
    const out = [];
    const py = await loadPyodide({ indexURL: INDEX_URL, stdout: (t) => out.push(t) });
    py.runPython(`print("classic ok")`);
    postMessage({ ok: out.join("|") === "classic ok", stdout: out });
  } catch (e) {
    postMessage({ ok: false, error: String((e && e.message) || e) });
  }
})();
