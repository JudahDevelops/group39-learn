// Tiny static file server for the spike pages (Node core only), on a free port.
// startServer({coi: true}) adds COOP/COEP headers; the default sends neither, which is what S1-S7 use.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
};

export function startServer({ coi = false } = {}) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.join(ROOT, urlPath);
    // Only serve pages/ (never node_modules, .profile, results).
    if (!filePath.startsWith(path.join(ROOT, "pages") + path.sep)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found: " + urlPath);
        return;
      }
      const headers = {
        "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
        "Content-Length": String(data.length),
        "Cache-Control": "no-store",
      };
      if (coi) {
        headers["Cross-Origin-Opener-Policy"] = "same-origin";
        headers["Cross-Origin-Embedder-Policy"] = "require-corp";
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port, url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}
