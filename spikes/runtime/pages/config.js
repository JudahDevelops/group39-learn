// Single source of truth for pinned versions and CDN URLs. Imported by pages, workers and run.mjs.
export const PYODIDE_VERSION = "314.0.7"; // npm view pyodide version (dist-tag latest), 2026-10-08
export const PGLITE_VERSION = "0.5.8"; // npm view @electric-sql/pglite version (dist-tag latest), 2026-10-08

export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PGLITE_BASE_URL = `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${PGLITE_VERSION}/dist/`;
