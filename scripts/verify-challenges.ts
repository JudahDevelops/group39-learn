/**
 * npm run verify:challenges: proves every challenge in content/ works as written, with the runner
 * code the app uses (see docs/content-format.md, "Verify your content").
 *
 *   npm run verify:challenges
 *   npm run verify:challenges -- --block student-profile
 *   npm run verify:challenges -- --content path/to/content --strict
 *
 * Exit codes: 0 all good, 1 a challenge is broken (or content does not validate, or a skip under
 * --strict), 2 the command could not run (bad option, no content folder, no browser).
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { formatIssues, loadContent } from '../src/content/validate';
import { CONTENT_DIR, readContentDir } from './lib/disk';
import { openHarness } from './lib/verify-browser';
import { planChecks } from './lib/verify-plan';
import { report, runChecks } from './lib/verify-run';

const USAGE = `Checks every challenge in content/ in a headless browser:
  - a step, lab or typein screen: the seed fails at least one test, the solution passes all of them
  - a try-it block: running the code raises no uncaught error
A runner that is not built yet (fastapi) is skipped.

  npm run verify:challenges [-- options]

  --block <slug>     verify one block
  --content <dir>    use another content folder (default: content)
  --strict           a skipped check counts as a failure
  --help             this text

Chromium is taken from PW_CHROMIUM_PATH when set.`;

class UsageError extends Error {}

async function main(): Promise<number> {
  let values;
  try {
    ({ values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        block: { type: 'string' },
        content: { type: 'string' },
        strict: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
      allowPositionals: false,
    }));
  } catch (err) {
    throw new UsageError(`${(err as Error).message}\n\n${USAGE}`);
  }
  if (values.help) {
    console.log(USAGE);
    return 0;
  }

  const dir = values.content !== undefined ? resolve(values.content) : CONTENT_DIR;
  if (!existsSync(dir)) throw new UsageError(`content folder not found: ${values.content ?? dir}`);
  const root = values.content !== undefined ? values.content.replace(/[\\/]+$/, '') : 'content';

  const loaded = loadContent(readContentDir(dir), root);
  const block = values.block;
  // A whole run needs content that validates. One block only needs its own files to be sound, so an
  // author is not stopped by someone else's half-written block.
  const issues =
    block === undefined
      ? loaded.issues
      : loaded.issues.filter((i) => i.file.startsWith(`${root}/blocks/${block}/`));
  if (issues.length > 0) {
    console.error(formatIssues(issues));
    console.error(
      `\n${issues.length} content problem${issues.length === 1 ? '' : 's'}; fix them first (npm run validate:content). Nothing was verified.`,
    );
    return 1;
  }
  if (block !== undefined && !loaded.blocks.has(block)) {
    throw new UsageError(`no block called "${block}" in ${root}/blocks/`);
  }

  const checks = planChecks(loaded.blocks, { root, block });
  const outcomes = [];
  if (checks.length > 0) {
    const harness = await openHarness();
    try {
      outcomes.push(...(await runChecks(checks, harness.check)));
    } finally {
      await harness.close();
    }
  }
  const result = report(outcomes, { strict: values.strict ?? false });
  console.log(result.lines.join('\n'));
  return result.exitCode;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(
      err instanceof UsageError
        ? `verify:challenges: ${err.message}`
        : `verify:challenges failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(2);
  },
);
