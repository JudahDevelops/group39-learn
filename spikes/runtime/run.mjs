// WP 0.1 runtime feasibility spike. `node run.mjs` serves pages/ on a free port, drives them with
// playwright-core + the cached chrome-headless-shell (PW_CHROMIUM_PATH), and prints one JSON summary
// covering S1-S8 on stdout. Progress goes to stderr. The same JSON is saved to results.json.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./server.mjs";
import { PYODIDE_VERSION, PGLITE_VERSION, PYODIDE_INDEX_URL, PGLITE_BASE_URL } from "./pages/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXECUTABLE_PATH = process.env.PW_CHROMIUM_PATH;
const PROFILE_DIR = path.join(__dirname, ".profile");
const MB = 1e6; // decimal megabytes, as mobile data plans count them

const log = (...a) => console.error(...a);

if (!EXECUTABLE_PATH || !fs.existsSync(EXECUTABLE_PATH)) {
  console.error("Set PW_CHROMIUM_PATH to the cached chrome-headless-shell binary (see docs/style-guide.md). Never run `npx playwright install`.");
  process.exit(1);
}

// The two files that cannot import config.js (classic worker, static-import worker) hard-code the versions.
for (const [file, needle] of [["pages/s6-worker.js", `pglite@${PGLITE_VERSION}/`], ["pages/s1-classic-worker.js", `pyodide/v${PYODIDE_VERSION}/`]]) {
  if (!fs.readFileSync(path.join(__dirname, file), "utf8").includes(needle)) throw new Error(`${file} does not match the versions in pages/config.js`);
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const round = (n, d = 0) => (n == null ? n : Math.round(n * 10 ** d) / 10 ** d);

// Open `url`, wait for window.__ready, return its value (never throws).
async function runPage(context, url, timeoutMs) {
  const page = await context.newPage();
  const consoleLines = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleLines.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => consoleLines.push(`pageerror: ${e}`));
  const t0 = performance.now();
  try {
    await page.goto(url);
    const result = await Promise.race([
      page.evaluate(() => window.__ready),
      new Promise((resolve) => setTimeout(() => resolve({ ok: false, error: `harness timeout after ${timeoutMs} ms` }), timeoutMs)),
    ]);
    result.wallMs = performance.now() - t0;
    if (!result.ok) result.consoleLines = consoleLines.slice(-15);
    return result;
  } catch (err) {
    return { ok: false, error: String((err && err.stack) || err), consoleLines: consoleLines.slice(-15) };
  } finally {
    await page.close().catch(() => {});
  }
}

// ---- S7 helpers: bytes per request, grouped ----

// Package closures from pyodide-lock.json, so each downloaded wheel is attributed to the stage that first needs it.
async function loadLock() {
  const lock = await (await fetch(PYODIDE_INDEX_URL + "pyodide-lock.json")).json();
  const norm = (n) => n.toLowerCase().replace(/[-_.]+/g, "-");
  const pkgs = Object.fromEntries(Object.entries(lock.packages).map(([k, v]) => [norm(k), v]));
  const closure = (names, seen = new Set()) => {
    for (const n of names.map(norm)) {
      if (seen.has(n)) continue;
      seen.add(n);
      closure(pkgs[n].depends || [], seen);
    }
    return seen;
  };
  const fileToPkg = Object.fromEntries(Object.entries(pkgs).map(([k, v]) => [v.file_name, k]));
  const stages = [
    ["fastapiSet (fastapi, pydantic, httpx + deps)", ["fastapi", "pydantic", "httpx"]],
    ["sqlalchemy", ["sqlalchemy"]],
    ["bcrypt + micropip", ["bcrypt", "micropip"]],
  ];
  const owner = {};
  const taken = new Set();
  for (const [label, roots] of stages) {
    for (const p of closure(roots)) if (!taken.has(p)) { taken.add(p); owner[p] = label; }
  }
  return { lockInfo: lock.info, fileToPkg, owner, stageLabels: stages.map((s) => s[0]), versions: Object.fromEntries(Object.entries(pkgs).map(([k, v]) => [k, v.version])) };
}

function groupOf(url, serverUrl, lock) {
  if (url.startsWith(serverUrl)) return "local harness (ignored)";
  if (url.startsWith(PYODIDE_INDEX_URL)) {
    const file = url.slice(PYODIDE_INDEX_URL.length).split("?")[0];
    const pkg = lock.fileToPkg[file];
    if (pkg) return `python: ${lock.owner[pkg] || "unattributed package"}`;
    return "python: pyodide core";
  }
  if (url.startsWith(PGLITE_BASE_URL)) return "pglite";
  const host = new URL(url).host;
  if (host === "pypi.org" || host === "files.pythonhosted.org") return "python: pyjwt via micropip (PyPI)";
  return `other (${host})`;
}

// One page load of s7.html in the given context; returns stages, bytes (CDP encodedDataLength) and wall time.
// Playwright's request.sizes() is encodedDataLength split into headers + body (Network.loadingFinished).
async function measureLoad(context, serverUrl, lock) {
  const page = await context.newPage();
  const finished = [];
  const failed = [];
  const pending = [];
  const onFinished = (req) => pending.push((async () => {
    const s = await req.sizes();
    finished.push({ url: req.url(), bytes: s.responseBodySize + s.responseHeadersSize });
  })());
  context.on("requestfinished", onFinished);
  context.on("requestfailed", (r) => failed.push(r.url()));
  const t0 = performance.now();
  await page.goto(`${serverUrl}/pages/s7.html`);
  const result = await Promise.race([
    page.evaluate(() => window.__ready),
    new Promise((resolve) => setTimeout(() => resolve({ ok: false, error: "harness timeout after 180 s" }), 180000)),
  ]);
  const wallMs = performance.now() - t0;
  await page.waitForTimeout(500);
  await Promise.all(pending);
  context.off("requestfinished", onFinished);
  await page.close();

  const groups = {};
  const files = [];
  for (const f of finished) {
    const g = groupOf(f.url, serverUrl, lock);
    if (g.startsWith("local")) continue;
    groups[g] = (groups[g] || 0) + f.bytes;
    files.push({ group: g, file: f.url.replace(PYODIDE_INDEX_URL, "pyodide:").replace(PGLITE_BASE_URL, "pglite:"), bytes: f.bytes });
  }
  const sum = (pred) => Object.entries(groups).filter(([g]) => pred(g)).reduce((a, [, b]) => a + b, 0);
  return {
    ok: result.ok === true,
    error: result.error,
    wallMs,
    stages: result.stages,
    smoke: result.smoke,
    groupsBytes: groups,
    totals: {
      pythonRunnerBytes: sum((g) => g === "python: pyodide core"),
      fastapiRunnerBytes: sum((g) => g.startsWith("python:")),
      sqlRunnerBytes: sum((g) => g === "pglite"),
      allBytes: sum(() => true),
    },
    requestCount: finished.length,
    failedRequests: failed,
    files: files.sort((a, b) => b.bytes - a.bytes),
  };
}

const mb = (b) => round(b / MB, 2);
const mbGroups = (groups) => Object.fromEntries(Object.entries(groups).sort().map(([k, v]) => [k, mb(v)]));

async function main() {
  const summary = {
    meta: {
      startedAt: new Date().toISOString(),
      node: process.version,
      playwrightCore: JSON.parse(fs.readFileSync(path.join(__dirname, "node_modules/playwright-core/package.json"), "utf8")).version,
      pyodide: PYODIDE_VERSION,
      pglite: PGLITE_VERSION,
      sizeUnit: "MB = 1,000,000 bytes, bytes transferred (encodedDataLength, i.e. compressed on the wire)",
    },
    checks: {},
  };
  const record = (id, data) => {
    summary.checks[id] = data;
    log(`[${id}] ${data.ok ? "PASS" : "FAIL"}${data.ok ? "" : "  " + (data.error || JSON.stringify((data.checks || []).filter((c) => !c.ok)).slice(0, 300))}`);
  };

  const server = await startServer();
  log(`static server ${server.url}`);
  const lock = await loadLock();
  summary.meta.pyodideLock = lock.lockInfo;

  // ---- S1-S6: functional checks, plain headers (no COOP/COEP) ----
  const browser = await chromium.launch({ executablePath: EXECUTABLE_PATH, headless: true });
  summary.meta.chrome = browser.version();
  const context = await browser.newContext();
  // Any single page that has not finished in 3 minutes is recorded as FAIL (harness timeout) and the run moves on.
  const page = (name, t = 180000) => runPage(context, `${server.url}/pages/${name}`, t);

  log("S1 pyodide in a worker");
  record("S1", await page("s1.html"));
  log("S2 fastapi + pydantic + httpx");
  record("S2", await page("s2.html"));
  log("S3 sqlalchemy");
  record("S3", await page("s3.html"));
  log("S4 bcrypt + pyjwt + oauth2");
  record("S4", await page("s4.html"));
  log("S5 timeout + restart");
  record("S5", await page("s5.html"));
  log("S6 pglite (main thread, then worker)");
  const s6main = await page("s6.html?mode=main");
  const s6worker = await page("s6.html?mode=worker");
  record("S6", { ok: s6main.ok, mainThread: s6main, webWorker: s6worker, note: `main-thread ok=${s6main.ok}, web-worker ok=${s6worker.ok}` });

  log("S8 (plain headers)");
  const s8plain = await page("s8.html");
  await browser.close();

  // ---- S7: sizes + cold/warm boot. Cold = fresh profile; warm = same profile, new browser process. ----
  log("S7 sizes and timing");
  const retries = [];
  const load = async (label, fresh) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (fresh) { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); fs.mkdirSync(PROFILE_DIR, { recursive: true }); }
      const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { executablePath: EXECUTABLE_PATH, headless: true });
      const r = await measureLoad(ctx, server.url, lock);
      await ctx.close();
      if (r.ok || attempt === 2) { r.attempts = attempt; return r; }
      retries.push({ run: label, error: r.error });
      log(`  ${label}: ${r.error}, retrying once`);
    }
  };
  const cold = [];
  for (let i = 0; i < 3; i++) {
    cold.push(await load(`cold ${i + 1}`, true));
    log(`  cold run ${i + 1}: ${cold[i].ok ? "ok" : "FAILED " + cold[i].error}, ${mb(cold[i].totals.allBytes)} MB, ${round(cold[i].wallMs)} ms`);
  }
  // The profile now holds the cache from the last cold run. Three warm runs, each a new browser process.
  const warm = [];
  for (let i = 0; i < 3; i++) {
    warm.push(await load(`warm ${i + 1}`, false));
    log(`  warm run ${i + 1}: ${warm[i].ok ? "ok" : "FAILED " + warm[i].error}, ${mb(warm[i].totals.allBytes)} MB, ${round(warm[i].wallMs)} ms`);
  }
  fs.rmSync(PROFILE_DIR, { recursive: true, force: true });

  const stageKeys = ["pyodideCoreMs", "fastapiSetMs", "sqlalchemyMs", "bcryptMicropipMs", "pyjwtFromPypiMs", "pgliteImportMs", "pgliteBootMs", "pythonCoreReadyMs", "fastapiRunnerReadyMs", "sqlRunnerReadyMs"];
  const timing = (runs) => Object.fromEntries(stageKeys.map((k) => [k, round(median(runs.map((r) => r.stages[k])))]));
  const allOk = [...cold, ...warm].every((r) => r.ok);
  record("S7", {
    ok: allOk && cold.every((r) => r.failedRequests.length === 0),
    sizesMB: {
      cold: cold.map((r) => ({ groups: mbGroups(r.groupsBytes), totals: Object.fromEntries(Object.entries(r.totals).map(([k, v]) => [k, mb(v)])) })),
      warm: warm.map((r) => ({ totals: Object.fromEntries(Object.entries(r.totals).map(([k, v]) => [k, mb(v)])) })),
    },
    timingsMs: {
      coldRuns: cold.map((r) => timing([r])),
      coldMedianOf3: timing(cold),
      warmRuns: warm.map((r) => timing([r])),
      warmMedianOf3: timing(warm),
    },
    wallMs: { cold: cold.map((r) => round(r.wallMs)), warm: warm.map((r) => round(r.wallMs)) },
    requestCount: { cold: cold.map((r) => r.requestCount), warm: warm.map((r) => r.requestCount) },
    failedRequests: [...cold, ...warm].flatMap((r) => r.failedRequests),
    largestFilesCold: cold[0].files.slice(0, 12).map((f) => ({ file: f.file, group: f.group, MB: mb(f.bytes) })),
    allFilesCold: cold[0].files.map((f) => ({ file: f.file, group: f.group, bytes: f.bytes })),
    retriedAfterStall: retries,
    effectiveColdMBps: cold.map((r) => round(r.totals.allBytes / MB / (r.wallMs / 1000), 2)),
    errors: [...cold, ...warm].map((r) => r.error).filter(Boolean),
  });

  // ---- S8: does anything need SharedArrayBuffer / COOP+COEP? ----
  // S1-S7 ran without COOP/COEP. This also loads the same stack on a cross-origin-isolated origin to see
  // what isolation would add (a Stop button via setInterruptBuffer) and whether jsDelivr still loads under COEP.
  log("S8 (COOP/COEP headers on)");
  const coiServer = await startServer({ coi: true });
  const coiBrowser = await chromium.launch({ executablePath: EXECUTABLE_PATH, headless: true });
  const s8coi = await runPage(await coiBrowser.newContext(), `${coiServer.url}/pages/s8.html`, 180000);
  await coiBrowser.close();
  await coiServer.close();
  const functional = ["S1", "S2", "S3", "S4", "S5", "S6"].map((id) => [id, summary.checks[id].ok]);
  const functionalPass = functional.every(([, ok]) => ok);
  record("S8", {
    ok: functionalPass && s8plain.ok === true && s8plain.env.crossOriginIsolated === false,
    needsSharedArrayBuffer: false,
    reason: functionalPass
      ? `S1-S6 passed with no COOP/COEP headers and crossOriginIsolated=${s8plain.env && s8plain.env.crossOriginIsolated}; nothing in them used SharedArrayBuffer.`
      : "Some of S1-S6 failed without COOP/COEP headers; see those checks.",
    functionalWithoutHeaders: Object.fromEntries(functional),
    plainOrigin: s8plain,
    isolatedOrigin: s8coi,
  });
  await server.close();

  // ---- versions as reported by the runtime ----
  const v = (id, key) => (summary.checks[id] && summary.checks[id].versions && summary.checks[id].versions[key]) || null;
  summary.versions = {
    pyodide: PYODIDE_VERSION,
    python: v("S2", "python"),
    pyodideLockPlatform: lock.lockInfo,
    pglite: PGLITE_VERSION,
    postgres: summary.checks.S6.mainThread.postgres,
    sqlite: v("S3", "sqlite3"),
    packages: {
      fastapi: v("S2", "fastapi"), starlette: v("S2", "starlette"), pydantic: v("S2", "pydantic"), "pydantic-core": v("S2", "pydantic_core"),
      httpx: v("S2", "httpx"), anyio: v("S2", "anyio"), jinja2: v("S2", "jinja2"),
      "typing-extensions": v("S2", "typing_extensions"), sqlalchemy: v("S3", "sqlalchemy"), bcrypt: v("S4", "bcrypt"), micropip: v("S4", "micropip"),
      pyjwt: v("S4", "pyjwt"), "python-multipart": v("S4", "python-multipart"),
    },
  };
  summary.meta.finishedAt = new Date().toISOString();

  fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((err) => {
    console.error("FATAL:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
  });
