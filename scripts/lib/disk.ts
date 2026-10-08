import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContentFiles } from '../../src/content/validate';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const CONTENT_DIR = join(ROOT, 'content');
export const OUT_DIR = join(ROOT, 'public', 'content');

/** Reads every non-hidden file under `dir` into the { "blocks/x/meta.json": text } shape loadContent expects. */
export function readContentDir(dir: string = CONTENT_DIR): ContentFiles {
  const files: ContentFiles = {};
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else files[relative(dir, full).split(sep).join('/')] = readFileSync(full, 'utf8');
    }
  };
  if (existsSync(dir)) walk(dir);
  return files;
}
