// Page-side helpers shared by every spike page.
import { PYODIDE_INDEX_URL } from "./config.js";

// Client for py-worker.js. One instance = one Web Worker = one Pyodide interpreter.
export class PyWorker {
  constructor() {
    this.worker = new Worker(new URL("./py-worker.js", import.meta.url), { type: "module" });
    this.nextId = 1;
    this.pending = new Map(); // id -> {resolve, reject, stdout, stderr}
    this.worker.onmessage = ({ data }) => {
      const job = this.pending.get(data.id);
      if (!job) return;
      if (data.type === "stdout") job.stdout.push(data.text);
      else if (data.type === "stderr") job.stderr.push(data.text);
      else if (data.type === "done") {
        this.pending.delete(data.id);
        job.resolve({ value: data.value, ms: data.ms, stdout: job.stdout, stderr: job.stderr });
      } else if (data.type === "fail") {
        this.pending.delete(data.id);
        job.reject(Object.assign(new Error(data.error), { stdout: job.stdout, stderr: job.stderr }));
      }
    };
    this.worker.onerror = (e) => {
      for (const job of this.pending.values()) job.reject(new Error("worker error: " + (e.message || e)));
      this.pending.clear();
    };
  }
  call(type, args = {}, transfer) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, stdout: [], stderr: [] });
      this.worker.postMessage({ id, type, ...args }, transfer);
    });
  }
  init() { return this.call("init"); }
  load(packages) { return this.call("load", { packages }); }
  pip(packages) { return this.call("pip", { packages }); }
  run(code) { return this.call("run", { code }); }
  // Run Python that ends with `json.dumps(...)` and parse the result.
  async runJson(code) {
    const r = await this.run(code);
    return { ...r, json: JSON.parse(r.value) };
  }
  terminate() { this.worker.terminate(); }
}

// Collects named pass/fail assertions; the page result is ok only if all pass.
export function makeChecks() {
  const list = [];
  return {
    list,
    check(name, ok, detail) {
      list.push({ name, ok: !!ok, detail: detail === undefined ? undefined : detail });
      return !!ok;
    },
    get ok() {
      return list.length > 0 && list.every((c) => c.ok);
    },
  };
}

// Every page sets window.__ready to a promise of {ok, ...}; run.mjs awaits it.
export function publish(fn) {
  window.__ready = (async () => {
    try {
      return await fn();
    } catch (err) {
      return { ok: false, error: String((err && err.stack) || err) };
    }
  })();
}

// Python snippet shared by S2-S4: lets `def` routes run without threads (see docs/SPIKE.md S2).
export const NO_THREADS_PATCH = `
import anyio.to_thread
async def _run_sync_inline(func, *args, abandon_on_cancel=False, cancellable=None, limiter=None):
    return func(*args)
anyio.to_thread.run_sync = _run_sync_inline
`;

export const VERSIONS_PY = (names) => `
import json, sys
from importlib.metadata import version
_out = {"python": sys.version.split()[0]}
for _n in ${JSON.stringify(names)}:
    try:
        _out[_n] = version(_n)
    except Exception as e:
        _out[_n] = "unavailable: " + str(e)
json.dumps(_out)
`;

export { PYODIDE_INDEX_URL };
