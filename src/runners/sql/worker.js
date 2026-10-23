// The PostgreSQL worker for the sql runner. It is read as text (`?raw`) and started from a Blob as
// a module worker, so it does not depend on how the app is bundled. PGlite (PostgreSQL compiled to
// WebAssembly) is imported from jsDelivr, in this worker's own thread (docs/SPIKE.md, S6).
//
//   main -> worker  { id, type: "init", moduleURL }
//                   { id, type: "run", setup, code, maxRows }   fresh database, setup.sql, then the learner's code
//                   { id, type: "query", sql, params }          one query for a test, on the database "run" left
//   worker -> main  { type: "stage", id, stage: "download" | "start" }
//                   { type: "done", id, result? }
//                   { type: "fail", id, error }                 the worker itself failed; SQL errors are results
//
// The message handler is set before anything is awaited, so no message is lost while PGlite loads.
//
// One PGlite lives for the whole life of the worker. A "fresh database" is made by resetting it in
// place (about 0.1 s) instead of creating a new instance (about 3 s, docs/SPIKE.md, snag 9). The
// reset drops everything a learner can create. If it fails, a new instance replaces the old one.
//
// SQL errors come back as results, not as thrown errors, with PostgreSQL's own fields. (Through
// PGliteWorker only the message arrives, snag 8; this worker is not that proxy.)
//
// The functions are exported so tests/unit/runner.sql.engine.test.ts can run them in Node against
// the real PGlite. A worker ignores the exports.

/** Result columns whose values are numbers: int8, int2, int4, oid, float4, float8, numeric. */
const NUMERIC_OIDS = new Set([20, 21, 23, 26, 700, 701, 1700]);
const BOOL_OID = 16;

/** The fields of a PostgreSQL error that the page uses. */
export function errorInfo(error) {
  const e = error && typeof error === 'object' ? error : {};
  const info = { message: String(e.message ?? error) };
  for (const key of ['code', 'detail', 'hint', 'constraint', 'table', 'column', 'schema']) {
    if (typeof e[key] === 'string' && e[key] !== '') info[key] = e[key];
  }
  const position = Number(e.position);
  if (Number.isInteger(position) && position > 0) info.position = position;
  return info;
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/** True when the code has nothing to run: it is empty or holds only comments and semicolons. */
export function isBlank(sql) {
  return (
    String(sql)
      .replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, '')
      .replace(/[\s;]+/g, '') === ''
  );
}

/** The last result that has columns (a statement that returns rows), or null. */
function lastWithColumns(results) {
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i].fields.length > 0) return results[i];
  }
  return null;
}

const fieldsOf = (result) =>
  result ? result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) : [];

/** Every type's text, as PostgreSQL prints it. Booleans read true and false, not t and f. */
async function textParsers(db) {
  const { rows } = await db.query('select oid::int as oid from pg_type');
  const parsers = {};
  for (const { oid } of rows) parsers[oid] = (value) => value;
  parsers[BOOL_OID] = (value) => (value === 't' ? 'true' : 'false');
  return parsers;
}

export function createEngine(PGlite) {
  let db = null;
  let parsers = {};

  async function open() {
    db = await PGlite.create();
    await db.query('select 1');
    parsers = await textParsers(db);
  }

  /** Back to an empty database: no tables, schemas, roles, settings or open transaction. */
  async function reset() {
    if (db) {
      try {
        await db.exec('rollback'); // only a warning when no transaction is open
        await db.exec('discard all');
        const schemas = await db.query(
          "select nspname from pg_namespace where nspname !~ '^pg_' and nspname <> 'information_schema'",
        );
        let sql = schemas.rows.map((r) => `drop schema ${quoteIdent(r.nspname)} cascade;`).join('');
        sql += 'create schema public;';
        const roles = await db.query(
          "select rolname from pg_roles where rolname !~ '^pg_' and rolname <> current_user",
        );
        for (const r of roles.rows) {
          sql += `drop owned by ${quoteIdent(r.rolname)}; drop role ${quoteIdent(r.rolname)};`;
        }
        await db.exec(sql);
        return;
      } catch {
        // The old instance is in a state the reset cannot fix: replace it.
      }
      try {
        await db.close();
      } catch {
        // Nothing left to close.
      }
      db = null;
    }
    await open();
  }

  /** A fresh database, setup.sql, then the learner's code. Never throws for a SQL error. */
  async function run({ setup, code, maxRows }) {
    await reset();
    if (setup && !isBlank(setup)) {
      try {
        await db.exec(setup);
      } catch (error) {
        return { ok: false, phase: 'setup', error: errorInfo(error) };
      }
    }
    if (isBlank(code)) return { ok: true, table: null, empty: true };
    let results;
    try {
      results = await db.exec(code, { rowMode: 'array', parsers });
    } catch (error) {
      return { ok: false, phase: 'code', error: errorInfo(error) };
    }
    const last = lastWithColumns(results);
    if (!last) return { ok: true, table: null, empty: false };
    return {
      ok: true,
      empty: false,
      table: {
        columns: last.fields.map((f) => f.name),
        rows: last.rows.slice(0, maxRows),
        rowCount: last.rows.length,
        numeric: last.fields.map((f) => NUMERIC_OIDS.has(f.dataTypeID)),
      },
    };
  }

  /**
   * One query for a test, on the database `run` left. Rows are objects with JavaScript values.
   * With parameters it is one statement. Without, it may be several (the learner's own code), and
   * the answer is that of the last statement that returns rows.
   */
  async function query(sql, params) {
    if (params === undefined) {
      const results = await db.exec(sql);
      const last = lastWithColumns(results);
      return { rows: last ? last.rows : [], fields: fieldsOf(last) };
    }
    const result = await db.query(sql, params);
    return { rows: result.rows, fields: fieldsOf(result) };
  }

  return { open, run, query };
}

// ---------------------------------------------------------------------------
// The worker itself. Skipped when the file is imported by tests.

const inWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

if (inWorker) {
  let engine = null;
  const post = (message) => self.postMessage(message);

  /** Tells the page when the two big files have arrived, so it can say "Starting PostgreSQL". Best effort. */
  const watchDownloads = (id) => {
    try {
      const wanted = new Set(['pglite.wasm', 'pglite.data']);
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
      // No resource timing here: the page keeps saying "Downloading" until PostgreSQL is ready.
    }
  };

  self.onmessage = async (event) => {
    const message = event.data;
    try {
      if (message.type === 'init') {
        post({ type: 'stage', id: message.id, stage: 'download' });
        watchDownloads(message.id);
        const { PGlite } = await import(/* @vite-ignore */ message.moduleURL);
        engine = createEngine(PGlite);
        await engine.open();
        post({ type: 'done', id: message.id });
      } else if (message.type === 'run') {
        post({ type: 'done', id: message.id, result: await engine.run(message) });
      } else if (message.type === 'query') {
        let result;
        try {
          result = { ok: true, ...(await engine.query(message.sql, message.params)) };
        } catch (error) {
          result = { ok: false, error: errorInfo(error) };
        }
        post({ type: 'done', id: message.id, result });
      }
    } catch (error) {
      post({ type: 'fail', id: message.id, error: String((error && error.message) || error) });
    }
  };
}
