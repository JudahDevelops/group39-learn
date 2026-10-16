/** Pinned in docs/SPIKE.md (checked 2026-10-08). Change both numbers together with a new spike run. */
export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** "Python needs about 6 MB, once." Measured as 6.25 MB over the wire (docs/SPIKE.md, Sizes). */
export const PYTHON_DOWNLOAD_MB = 6;

/** A run longer than this is stopped and the worker is replaced. */
export const RUN_TIMEOUT_MS = 5000;

/** Downloading and starting Python gives up after this long, so a dead connection does not hang. */
export const BOOT_TIMEOUT_MS = 120_000;

/** Set once Python has loaded, so the "needs about N MB" note is shown only before the first download. */
export const LOADED_FLAG_KEY = 'g39.python.loaded';
