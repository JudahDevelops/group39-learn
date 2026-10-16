/**
 * Starts the check harness: builds verify/ with vite.verify.config.ts, opens it in headless
 * Chromium and hands back a `CheckFn`. One page serves every check; the web runner already puts
 * each run in a fresh frame.
 *
 * Chromium comes from PW_CHROMIUM_PATH when set (this machine has no Playwright browsers), else
 * from Playwright's own install (CI).
 *
 * The build goes to a folder of its own under .verify-dist/ and is removed at the end, so two
 * runs at once (a test and a manual run) never touch each other's files, and nothing here
 * writes public/content.
 */
import { chromium, type Browser } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { build } from 'vite';
import { HARNESS_GLOBAL, type CheckFn } from '../../verify/protocol';
import { ROOT } from './disk';

/** A name that never resolves in DNS (`.test` is reserved), so the page is served only by our route. */
const ORIGIN = 'http://g39-verify.test';

/** The web runner stops a run after 5 s on its own; this only catches a page that stopped answering. */
const WATCHDOG_MS = 30_000;

/**
 * The python runner has one worker, so checks wait in a queue. A call can sit behind Python's first
 * download (cold, 6 MB) and behind runs that were stopped at 5 s, each followed by a 4 to 6 s restart.
 * That is slow, not stuck, so a python call gets this much longer before the page is declared dead.
 */
const PYTHON_ALLOWANCE_MS = 120_000;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
};

export interface Harness {
  check: CheckFn;
  close(): Promise<void>;
}

export async function openHarness(): Promise<Harness> {
  const dist = join(ROOT, '.verify-dist', `${process.pid}-${Date.now().toString(36)}`);
  const cleanup = () => rmSync(dist, { recursive: true, force: true });
  process.on('exit', cleanup);

  let browser: Browser | undefined;
  try {
    await build({
      configFile: join(ROOT, 'vite.verify.config.ts'),
      logLevel: 'warn',
      build: { outDir: dist, emptyOutDir: true },
    });

    try {
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PW_CHROMIUM_PATH || undefined,
      });
    } catch (err) {
      throw new Error(
        `could not start Chromium (${err instanceof Error ? err.message.split('\n')[0] : String(err)}). ` +
          'Set PW_CHROMIUM_PATH to a Chromium or chrome-headless-shell binary.',
      );
    }

    const page = await browser.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.route(`${ORIGIN}/**`, async (route) => {
      const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
      const file = resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(dist + sep)) return route.fulfill({ status: 403, body: 'forbidden' });
      try {
        const body = await readFile(file);
        return await route.fulfill({
          status: 200,
          contentType: MIME[extname(file)] ?? 'application/octet-stream',
          body,
        });
      } catch {
        return route.fulfill({ status: 404, body: 'not found' });
      }
    });
    await page.goto(`${ORIGIN}/index.html`);
    try {
      await page.waitForFunction(
        (name) => typeof (window as unknown as Record<string, unknown>)[name] === 'function',
        HARNESS_GLOBAL,
        {
          timeout: 15_000,
        },
      );
    } catch {
      throw new Error(
        `the check harness page did not start${pageErrors.length ? `: ${pageErrors[0]}` : ''}`,
      );
    }

    let dead: Error | null = null;
    const check: CheckFn = async (runner, files, tests, timeoutMs) => {
      if (dead) throw dead;
      const call = page.evaluate(
        ({ name, args }) =>
          (window as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[name]!(
            ...args,
          ),
        { name: HARNESS_GLOBAL, args: [runner, files, tests, timeoutMs] },
      );
      const limitMs =
        WATCHDOG_MS + (timeoutMs ?? 0) + (runner === 'python' ? PYTHON_ALLOWANCE_MS : 0);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const watchdog = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`the browser stopped answering for ${limitMs / 1000} s`)),
          limitMs,
        );
      });
      try {
        return (await Promise.race([call, watchdog])) as Awaited<ReturnType<CheckFn>>;
      } catch (err) {
        // A hung or crashed page cannot be trusted again: fail the rest quickly instead of waiting on each.
        dead = err instanceof Error ? err : new Error(String(err));
        throw dead;
      } finally {
        clearTimeout(timer);
      }
    };

    const opened = browser;
    return {
      check,
      async close() {
        await opened.close().catch(() => undefined);
        cleanup();
      },
    };
  } catch (err) {
    await browser?.close().catch(() => undefined);
    cleanup();
    throw err;
  }
}
