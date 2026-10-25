import { PYODIDE_INDEX_URL } from '../python/config';

/** Pyodide itself is pinned in ../python/config.ts; the runner loads it from the same place. */
export { PYODIDE_INDEX_URL };

/**
 * The packages that come with Pyodide 314.0.7. Their versions are fixed by that release
 * (docs/SPIKE.md, Pinned versions): fastapi 0.136.1, pydantic 2.12.5, httpx 0.28.1,
 * sqlalchemy 2.0.48, bcrypt 5.0.0, micropip 0.11.1.
 */
export const PYODIDE_PACKAGES = [
  'fastapi',
  'pydantic',
  'httpx',
  'sqlalchemy',
  'bcrypt',
  'micropip',
];

/**
 * Packages that are not in Pyodide and come from PyPI through micropip, at the versions the spike
 * ran. python-multipart is installed before fastapi is imported, or form routes break (snag 2).
 */
export const PIP_PACKAGES = ['pyjwt==2.15.1', 'python-multipart==0.0.32'];

/** "The FastAPI runner needs about 10.8 MB, once." Measured as 10.82 MB over the wire (docs/SPIKE.md, Sizes). */
export const FASTAPI_DOWNLOAD_MB = 10.8;

/** A check (the app's start, the learner's code and every test), a Run, or a request longer than this is stopped and the worker is replaced. */
export const RUN_TIMEOUT_MS = 5000;

/** Downloading and starting the runner gives up after this long, so a dead connection does not hang. */
export const BOOT_TIMEOUT_MS = 180_000;

/** Set once the runner has loaded, so the "needs about N MB" note is shown only before the first download. */
export const LOADED_FLAG_KEY = 'g39.fastapi.loaded';

/** The file the runner imports `app` from (docs/content-format.md, "FastAPI tests"). */
export const ENTRY_FILE = 'main.py';

/** The methods the Requests panel offers. */
export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type Method = (typeof METHODS)[number];

/** The Requests panel keeps this many earlier requests. */
export const MAX_HISTORY = 10;

/** A reply shown in full up to this many characters of pretty-printed text. */
export const MAX_SHOWN_CHARS = 20_000;
