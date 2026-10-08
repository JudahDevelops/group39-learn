/**
 * npm run content: validate content/ and write public/content/curriculum.json plus
 * public/content/blocks/<slug>.json. Fixture tracks are included only when INCLUDE_FIXTURES=1.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildOutput } from '../src/content/build';
import { formatIssues, loadContent } from '../src/content/validate';
import { OUT_DIR, readContentDir } from './lib/disk';

const includeFixtures = process.env.INCLUDE_FIXTURES === '1';
const result = loadContent(readContentDir());

if (result.issues.length > 0 || !result.curriculum) {
  console.error(formatIssues(result.issues));
  console.error(
    `\nContent has ${result.issues.length} problem${result.issues.length === 1 ? '' : 's'}; nothing was built.`,
  );
  process.exit(1);
}

const out = buildOutput(result.curriculum, result.blocks, { includeFixtures });

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'curriculum.json'), JSON.stringify(out.curriculum));
if (out.blocks.size > 0) {
  mkdirSync(join(OUT_DIR, 'blocks'), { recursive: true });
  for (const [slug, block] of out.blocks) {
    writeFileSync(join(OUT_DIR, 'blocks', `${slug}.json`), JSON.stringify(block));
  }
}
console.log(
  `content built: ${out.blocks.size} block${out.blocks.size === 1 ? '' : 's'} -> public/content` +
    (includeFixtures ? ' (fixtures included)' : ''),
);
