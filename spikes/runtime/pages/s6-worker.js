// Web Worker host for PGlite. Static imports (no top-level await) so the worker's "init" message
// listener is registered before the first message arrives. Version must match config.js (run.mjs checks).
import { PGlite } from "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js";
import { worker } from "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/worker/index.js";

worker({
  async init() {
    return new PGlite();
  },
});
