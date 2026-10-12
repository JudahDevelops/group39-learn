# WP 0.1: runtime feasibility spike

Run on 2026-10-12 with `cd spikes/runtime && node run.mjs` (Node 26.8.1, playwright-core 1.64.0, headless Chromium 151.0.7922.47 from `PW_CHROMIUM_PATH`). Raw output: `spikes/runtime/results.json`. Every number below comes from that run unless a line says otherwise.

Scope: desktop Chromium only. Firefox and Safari were not tested (no cached build; not downloading one).

## Results

| # | Check | Result | Note |
|---|---|---|---|
| S1 | Pyodide boots in a Web Worker, stdout reaches the main thread | PASS | Needs a **module** worker and `pyodide.mjs`. stdout and stderr stream separately; a Python exception comes back with its traceback and earlier stdout intact. A classic worker with `importScripts("pyodide.js")` failed (see snag 6). |
| S2 | fastapi + pydantic + httpx, GET and POST with a pydantic model through `httpx.ASGITransport` | PASS | 200, 200, 422 (missing field, `loc` correct), 404 and `/openapi.json` all as expected. Plain `def` handlers fail without a patch (snag 1). `starlette.testclient.TestClient` imports but fails on the first call: `RuntimeError: can't start new thread`. |
| S3 | SQLAlchemy 2.0 ORM on in-memory SQLite, plus a route with a Session dependency | PASS | ORM insert and select work, with relationships. The `async def` generator dependency works as is. The textbook `def get_db()` generator with `def` routes and a file DB (`sqlite:////app/ihms.db`, `check_same_thread=False`) works only after the patch. |
| S4 | bcrypt, PyJWT via micropip, `OAuth2PasswordBearer` | PASS | 401 without a token (with `WWW-Authenticate: Bearer`), 401 with a bad token, 200 with a valid one. Form login (`OAuth2PasswordRequestForm`) works only with `python-multipart` installed first and the patch (snags 1 and 2). |
| S5 | `while True: pass` killed after 5 s, fresh worker, time to `print(1)` | PASS | Terminated at 5002 ms. The blocked worker never answered a queued message. Restart to `print(1)`, warm cache: 3955 to 5897 ms (median 4848 ms). |
| S6 | PGlite with Appendix D verbatim | PASS | Main thread and Web Worker both pass 11 of 11 assertions. `one_active_allocation_per_bed` rejects the second active allocation (SQLSTATE 23505). PostgreSQL 18.3. In worker mode the error arrives as a message only (snag 8). |
| S7 | Sizes and boot times, cold and warm | PASS | 16.15 MB over the wire in total, 0 bytes on a warm load. Tables below. |
| S8 | SharedArrayBuffer or COOP/COEP needed? | PASS (not needed) | S1 to S6 passed with no COOP/COEP headers; `crossOriginIsolated` was false and `SharedArrayBuffer` was undefined. |

S6 source: Appendix D, `course-content.md` lines 4804 to 4888. The two `sql` blocks (schema at lines 4807 to 4875, sample data at lines 4881 to 4884) are read from the file by `scripts/build-s6.mjs` and loaded unchanged. SHA-256 of each block is in `results.json`.

## Pinned versions

| Item | Version | Source |
|---|---|---|
| Pyodide | 314.0.7 (`npm view pyodide version`, dist-tag `latest`, checked 2026-10-08) | `https://cdn.jsdelivr.net/pyodide/v314.0.7/full/` |
| Python | 3.14.2 | `sys.version` in the worker |
| Pyodide lock | abi 2026_0, emscripten_5_0_3, wasm32 | `pyodide-lock.json` |
| PGlite | 0.5.8 (`npm view @electric-sql/pglite version`, dist-tag `latest`, checked 2026-10-08) | `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/` |
| PostgreSQL inside PGlite | 18.3 | `select version()` |
| SQLite inside Pyodide | 3.39.0 | `sqlite3.sqlite_version` |

Python packages, as reported by `importlib.metadata` inside the worker:

| Package | Version | How loaded |
|---|---|---|
| fastapi | 0.136.1 | `loadPackage` |
| starlette | 1.0.0 | dependency of fastapi |
| pydantic / pydantic-core | 2.12.5 / 2.41.5 | `loadPackage` |
| httpx | 0.28.1 | `loadPackage` |
| anyio | 4.13.0 | dependency of fastapi |
| jinja2 | 3.1.6 | dependency of fastapi |
| typing-extensions | 4.15.0 | dependency |
| sqlalchemy | 2.0.48 | `loadPackage` |
| bcrypt | 5.0.0 | `loadPackage` |
| micropip | 0.11.1 | `loadPackage` |
| pyjwt | 2.15.1 | `micropip.install` (PyPI) |
| python-multipart | 0.0.32 | `micropip.install` (PyPI) |

`httpcore` and `h11` are not installed with httpx here and are not needed for `ASGITransport`.

Not in the Pyodide 314.0.7 package list (checked in `pyodide-lock.json`): passlib, email-validator, pydantic-settings, python-dotenv, apscheduler, aiosmtplib, python-jose, alembic, sqlmodel, uvicorn. Whether each installs from PyPI with micropip was not tested.

## Sizes

Bytes transferred, from CDP `Network.loadingFinished` `encodedDataLength` (Playwright's `request.sizes()` header plus body). These are compressed on the wire. 1 MB = 1,000,000 bytes. Three cold loads, each in a fresh browser profile, gave identical figures.

| Group | MB | Largest files |
|---|---|---|
| Pyodide core | 6.25 | `pyodide.asm.wasm` 3.44, `python_stdlib.zip` 2.51, `pyodide.asm.mjs` 0.26 |
| fastapi + pydantic + httpx and dependencies | 2.36 | `pydantic_core` 1.31, `pydantic` 0.46, `jinja2` 0.13, `fastapi` 0.11 |
| sqlalchemy | 1.97 | one wheel |
| bcrypt + micropip | 0.18 | `micropip` 0.11 |
| pyjwt from PyPI (micropip) | 0.06 | pypi.org and files.pythonhosted.org |
| PGlite | 5.33 | `pglite.wasm` 3.37, `pglite.data` 1.67, `initdb.wasm` 0.14 |

| What a member downloads once | MB |
|---|---|
| Python runner (core only) | 6.25 |
| FastAPI runner (core + all Python groups above) | 10.82 |
| SQL runner (PGlite) | 5.33 |
| Everything | 16.15 |

The estimate in PLAN.md was 25 to 40 MB. The measured total is 16.15 MB. Decoded size in Cache Storage was not measured.

Warm load (new browser process, same profile): 0 bytes from jsDelivr and PyPI, all of it answered by the browser's HTTP cache. A service worker or Cache API was not tested.

## Timings

Milliseconds. Cold = fresh profile, three runs, median with the range. Warm = same profile in a new browser process, three runs. The machine was shared (load average about 4 on 12 cores) and the link gave 0.5 to 0.7 MB/s end to end on cold loads, so treat these as order of magnitude. Stages are cumulative within one page load, so each row is the extra time for that stage.

| Stage | Cold median (range) | Warm median (range) |
|---|---|---|
| Pyodide core ready | 6429 (6246 to 7900) | 4183 (3364 to 4712) |
| + fastapi, pydantic, httpx | 2074 (1340 to 2087) | 1159 (637 to 1202) |
| + sqlalchemy | 1536 (1155 to 3161) | 296 (248 to 496) |
| + bcrypt, micropip | 568 (305 to 574) | 66 (47 to 102) |
| + pyjwt from PyPI | 2692 (2482 to 3667) | 766 (710 to 1062) |
| FastAPI runner ready (sum) | 13277 (12524 to 16414) | 6742 (5073 to 7235) |
| PGlite import | 1144 (495 to 1179) | 96 (74 to 108) |
| PGlite boot (create + first query) | 5887 (3980 to 6424) | 3157 (2678 to 5032) |
| SQL runner ready (sum) | 7031 (4476 to 7604) | 3252 (2752 to 5140) |

Other timings from single runs:

| Measurement | ms |
|---|---|
| S5: first boot to `print(1)` (cache being filled) | 5457 |
| S5: restart to `print(1)`, core only, warm (3 runs) | 4848 median (3955, 4848, 5897) |
| S5: restart with fastapi, pydantic, httpx, sqlalchemy, bcrypt, warm | 5172 |
| S4: `bcrypt.hashpw` at cost 12 / `checkpw` | 613 / 587 |
| S4: `micropip.install("pyjwt")` including micropip load | 5914 |
| S6 main thread: second fresh PGlite (create + first query) / Appendix D load | 2844 / 46 |
| S6 worker: second fresh PGlite (create + first query) / Appendix D load | 3686 / 95 |
| S6: reset in place (`DROP SCHEMA public CASCADE; CREATE SCHEMA public;` + Appendix D), main / worker | 75 / 106 |
| S8, isolated origin: `setInterruptBuffer` stops `while True: pass` | 1017 |

## Code patterns that worked

Full working versions: `spikes/runtime/pages/py-worker.js`, `lib.js` (`PyWorker`), `s2.html`, `s4.html`, `s5.html`.

### S1: Pyodide in a module worker, stdout to the main thread

```js
// py-worker.js, started with: new Worker(url, { type: "module" })
const INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
let pyodide, currentId;
self.onmessage = async ({ data: { id, type, code } }) => {   // registered synchronously
  try {
    if (type === "init") {
      const { loadPyodide } = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`);
      pyodide = await loadPyodide({
        indexURL: INDEX_URL,
        stdout: (text) => postMessage({ type: "stdout", id: currentId, text }),   // one call per line
        stderr: (text) => postMessage({ type: "stderr", id: currentId, text }),
      });
      postMessage({ type: "done", id });
    } else if (type === "run") {
      currentId = id;
      const value = await pyodide.runPythonAsync(code);   // value of the last expression
      postMessage({ type: "done", id, value });
    }
  } catch (err) {
    postMessage({ type: "fail", id, error: String(err.message) });   // message holds the Python traceback
  }
};
```

### S2: FastAPI app called in process

```js
await pyodide.loadPackage(["fastapi", "pydantic", "httpx"]);   // pulls starlette, anyio, jinja2 and the rest
```

```python
# 1. Let sync code run without threads. Run once, before any learner code.
import anyio.to_thread
async def _run_sync_inline(func, *args, abandon_on_cancel=False, cancellable=None, limiter=None):
    return func(*args)
anyio.to_thread.run_sync = _run_sync_inline

# 2. The app and the client.
import httpx
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
class Complaint(BaseModel):
    room: str
    description: str

@app.post("/complaints")
async def create(c: Complaint):          # def also works once the patch above is in
    return {"id": 1, **c.model_dump()}

async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as client:
    r = await client.post("/complaints", json={"room": "A-101", "description": "Leaking tap"})
    assert r.status_code == 200 and r.json()["room"] == "A-101"
```

Top-level `await` works inside `runPythonAsync`.

### S4: bcrypt, PyJWT, OAuth2

```js
await pyodide.loadPackage(["fastapi", "pydantic", "httpx", "bcrypt", "micropip"]);
pyodide.globals.set("_pkgs", pyodide.toPy(["pyjwt", "python-multipart"]));
// Install BEFORE fastapi or starlette is imported (snag 2).
await pyodide.runPythonAsync(`import micropip\nawait micropip.install(_pkgs)`);
```

```python
import bcrypt, jwt
hashed = bcrypt.hashpw(b"secret", bcrypt.gensalt())      # about 0.6 s at cost 12
assert bcrypt.checkpw(b"secret", hashed)
token = jwt.encode({"sub": "amaka"}, "key", algorithm="HS256")
jwt.decode(token, "key", algorithms=["HS256"])

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
async def current_user(token: str = Depends(oauth2_scheme)):     # no token: FastAPI answers 401 itself
    try:
        return jwt.decode(token, "key", algorithms=["HS256"])["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token", headers={"WWW-Authenticate": "Bearer"})
```

### S5: timeout, terminate, restart

```js
function runWithTimeout(pw, code, ms) {          // pw wraps one Worker running py-worker.js
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { pw.terminate(); reject(new Error("TIMEOUT")); }, ms);
  });
  return Promise.race([pw.run(code), timeout]).finally(() => clearTimeout(timer));
}
// On TIMEOUT: show "Your code ran for more than 5 seconds", then
//   pw = new PyWorker(); await pw.init(); await pw.load(packages);
// All Python state is gone, so re-run the lesson's setup code too.
```

### S6: PGlite

```js
import { PGlite } from "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js";
const db = new PGlite();                 // in memory
await db.exec(schemaSql);                // multiple statements
const { rows } = await db.query("select ...");
try { await db.exec(secondActiveAllocation); } catch (e) { /* e.message names the constraint */ }
await db.exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");   // clean slate without a new instance
```

Worker mode: `s6-worker.js` does `worker({ async init() { return new PGlite(); } })` with static imports; the page calls `await PGliteWorker.create(new Worker(url, { type: "module" }))`.

## Snags

1. **Sync code needs a patch.** FastAPI runs plain `def` handlers, sync dependencies and class dependencies (`Depends()` on `OAuth2PasswordRequestForm`) in a thread pool through `anyio.to_thread.run_sync`. Pyodide has no threads: `RuntimeError: can't start new thread`. Observed without the patch in S2 (`def` handler), S3 (`def get_db()` plus `def` routes) and S4 (form login). With the patch in S2 all three work. Consequence: the fastapi runner must apply it before learner code. A long-running sync handler then blocks the worker, which the 5 s timeout already covers.
2. **python-multipart must be installed before fastapi or starlette is imported.** Without it, defining a form route raises a `RuntimeError`. Installed after the import, the route is defined but every form POST returns 400 `There was an error parsing the body`. Installed first, the login form returns 200. It is not a built-in Pyodide package, so it comes from PyPI.
3. **pyjwt and python-multipart come from PyPI** (pypi.org and files.pythonhosted.org). That adds 2.5 to 3.7 s cold for pyjwt and an outside dependency at lesson time. Copying the wheels to `public/` and installing from that URL would remove it; not tested.
4. **TestClient cannot be used.** It imports, then fails at the first request for the same reason as snag 1. Tests use `ASGITransport`, as PLAN.md says.
5. **Restart is slow.** After a timeout, a fresh worker needs 4 to 6 s on this machine even with everything cached (Wasm compile, stdlib unzip). The UI needs a "Restarting Python" state.
6. **Classic worker loader fails.** `importScripts("…/v314.0.7/full/pyodide.js")` threw `NetworkError … failed to load` in Chromium 151 although the file returned HTTP 200. Cause not found. An ad hoc check during the spike (not part of `run.mjs`) loaded `pyodide.js` from v0.29.5 the same way without error, so the problem is specific to this build. Use the ESM build in a module worker.
7. **PGlite worker proxy reports ready early.** `PGliteWorker.create()` and `waitReady` resolved before the database inside the worker was up; the first query paid the boot cost. Time boot with a first query.
8. **PGlite worker errors lose their fields.** On the main thread the error carries `constraint` and `code`. Through `PGliteWorker` only `message` arrives (`duplicate key value violates unique constraint "one_active_allocation_per_bed"`). SQL tests should match on the message.
9. **A new PGlite instance costs 2.8 to 3.7 s; a reset in place costs 75 to 106 ms.** "A fresh DB per check" in PLAN.md is far cheaper as `DROP SCHEMA public CASCADE` plus the challenge's `setup.sql`. After the reset, users, allocations and hostels were back to their expected counts.
10. **Worker script for PGlite uses static imports.** Chosen so the `init` message listener exists before the first message. Whether top-level `await` would drop that message was not tested.
11. **Only Chromium 151 was exercised.** Timings are from a loaded shared machine, not a phone. Phones, Firefox and Safari are open.

## Recommendations

1. **Keep the planned stack.** The python, fastapi and sql rows of PLAN.md's runner table all work on Pyodide 314.0.7 and PGlite 0.5.8 with no change of engine. The `web` runner (sandboxed iframe) was not part of this spike. Pin both versions exactly, as in `spikes/runtime/pages/config.js`.
2. **Use `py-worker.js` and `PyWorker` as the base of the python and fastapi runners.** One message protocol: `init`, `load`, `pip`, `run`, with streamed stdout and stderr.
3. **In the fastapi runner:** load packages, run micropip installs (`pyjwt`, `python-multipart`), apply the anyio patch, then run learner code. Lessons can use `def` or `async def`.
4. **Replace the size estimate.** Say "about 6 MB" for Python, "about 11 MB" for FastAPI work and "about 5 MB" for SQL, once. Everything together is about 16 MB. Check Cache Storage use before promising anything about phone storage.
5. **Python timeout:** terminate at 5 s and restart, as planned. Show a restart message. Starting a spare worker in the background after a run would hide the 4 to 6 s restart; not tested.
6. **SQL runner:** one PGlite per lesson, reset in place between checks. A worker is fine for responsiveness; match errors on message text.
7. **Deploy:** no COOP/COEP headers. With them on, jsDelivr still loads, Pyodide and PGlite boot, and `setInterruptBuffer` stopped the loop in 1017 ms with the worker kept alive, which would replace the 4 to 6 s restart. Costs not tested: effect on the `web` runner's sandboxed iframes, on cross-origin calls, and on the PWA cache. Revisit only if restart time hurts in practice.
8. **Before the offline (PWA) work:** test that `vite-plugin-pwa` can cache the jsDelivr files and PyPI wheels (not tested here), and that a second visit stays at 0 bytes.
