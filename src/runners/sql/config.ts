/** Pinned in docs/SPIKE.md (checked 2026-10-08). Change both together with a new spike run. */
export const PGLITE_VERSION = '0.5.8';
export const PGLITE_MODULE_URL = `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${PGLITE_VERSION}/dist/index.js`;

/** "PostgreSQL needs about 5.3 MB, once." Measured as 5.33 MB over the wire (docs/SPIKE.md, Sizes). */
export const SQL_DOWNLOAD_MB = 5.3;

/** A check (setup, the learner's code and every test) longer than this is stopped and the worker is replaced. */
export const RUN_TIMEOUT_MS = 5000;

/** Downloading and starting the database gives up after this long, so a dead connection does not hang. */
export const BOOT_TIMEOUT_MS = 120_000;

/** Set once PostgreSQL has loaded, so the "needs about N MB" note is shown only before the first download. */
export const LOADED_FLAG_KEY = 'g39.sql.loaded';

/** The two files the runner reads (docs/content-format.md, "SQL tests"). */
export const QUERY_FILE = 'query.sql';
export const SETUP_FILE = 'setup.sql';

/** The Results panel shows at most this many rows; the count above it still says how many there are. */
export const MAX_ROWS = 500;
