/**
 * npm run content: validate content/ and write public/content/curriculum.json plus
 * public/content/blocks/<slug>.json. Fixture tracks are included only when INCLUDE_FIXTURES=1.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { buildOutput } from '../src/content/build';
import { buildReference } from '../src/content/reference';
import { formatIssues, loadContent } from '../src/content/validate';
import { OUT_DIR, readContentDir } from './lib/disk';

const includeFixtures = process.env.INCLUDE_FIXTURES === '1';
const files = readContentDir();
const result = loadContent(files);

if (result.issues.length > 0 || !result.curriculum) {
  console.error(formatIssues(result.issues));
  console.error(
    `\nContent has ${result.issues.length} problem${result.issues.length === 1 ? '' : 's'}; nothing was built.`,
  );
  process.exit(1);
}

const out = buildOutput(result.curriculum, result.blocks, { includeFixtures });
let reference: ReturnType<typeof buildReference>;
try {
  reference = buildReference(files);
} catch (e) {
  console.error(
    `content/${(e as Error).message}\n\nReference pages have a problem; nothing was built.`,
  );
  process.exit(1);
}

// Overwrite in place and delete only stale files. Removing the whole folder makes a running
// `vite` dev server lose track of public/content and answer every content request with index.html.
const written = new Set<string>();
function write(path: string, data: unknown) {
  const full = join(OUT_DIR, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(data));
  written.add(full);
}

write('curriculum.json', out.curriculum);
for (const [slug, block] of out.blocks) write(join('blocks', `${slug}.json`), block);
if (reference.pages.size > 0) {
  write(join('reference', 'index.json'), reference.index);
  for (const [slug, page] of reference.pages) write(join('reference', `${slug}.json`), page);
}
for (const entry of readdirSync(OUT_DIR, { recursive: true, withFileTypes: true })) {
  const full = join(entry.parentPath, entry.name);
  if (entry.isFile() && !written.has(full)) {
    rmSync(full);
    console.log(`removed stale ${relative(OUT_DIR, full)}`);
  }
}
console.log(
  `content built: ${out.blocks.size} block${out.blocks.size === 1 ? '' : 's'} -> public/content, ${reference.pages.size} reference page${reference.pages.size === 1 ? '' : 's'}` +
    (includeFixtures ? ' (fixtures included)' : ''),
);
