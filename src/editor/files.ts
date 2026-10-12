/**
 * Turning content (seed files with an editable range) into what the editor shows, and turning a
 * learner's saved text back into editor files. Pure functions, unit-tested.
 */
import type { SeedFile } from '../content/schema';
import type { EditMode } from './editableRegion';

export interface EditorFile {
  name: string;
  /** The code fence language from the content, e.g. "html". Used when the extension is not enough. */
  lang?: string;
  contents: string;
  mode: EditMode;
}

type Files = Record<string, string>;

/**
 * Editor files for a step or lab seed. When any seed file has an editable region, the files
 * without one are locked; when none has, every file is fully editable (a lab without a region).
 */
export function seedToEditorFiles(seed: readonly SeedFile[]): EditorFile[] {
  const hasRegion = seed.some((f) => f.editable);
  return seed.map((f) => ({
    name: f.name,
    lang: f.lang,
    contents: f.contents,
    mode: f.editable
      ? { kind: 'region', start: f.editable.start, end: f.editable.end }
      : hasRegion
        ? { kind: 'locked' }
        : { kind: 'free' },
  }));
}

/** Editor files for a Try it box: everything editable. */
export function freeEditorFiles(
  files: readonly { name: string; lang: string; contents: string }[],
): EditorFile[] {
  return files.map((f) => ({
    name: f.name,
    lang: f.lang,
    contents: f.contents,
    mode: { kind: 'free' },
  }));
}

/** Plain name -> text map of editor files. */
export function filesToRecord(files: readonly EditorFile[]): Files {
  return Object.fromEntries(files.map((f) => [f.name, f.contents]));
}

/**
 * Rebuilds editor files from text saved earlier. Returns null when the save no longer fits the
 * seed (different file names, or the locked lines around the region changed), so the player
 * falls back to the seed rather than showing code that is out of step with the instructions.
 */
export function restoreSavedFiles(seed: readonly SeedFile[], saved: Files): EditorFile[] | null {
  const seedNames = seed.map((f) => f.name).sort();
  const savedNames = Object.keys(saved).sort();
  if (seedNames.length !== savedNames.length || seedNames.some((n, i) => n !== savedNames[i])) {
    return null;
  }
  const base = seedToEditorFiles(seed);
  const restored: EditorFile[] = [];
  for (const [i, file] of base.entries()) {
    const text = saved[file.name];
    const original = seed[i];
    if (text === undefined || !original) return null;
    if (file.mode.kind === 'locked') {
      if (text !== original.contents) return null;
      restored.push(file);
    } else if (file.mode.kind === 'free') {
      restored.push({ ...file, contents: text });
    } else {
      const lines = original.contents.split('\n');
      const { start, end } = file.mode;
      const before = start > 0 ? `${lines.slice(0, start).join('\n')}\n` : '';
      const after = end < lines.length ? `\n${lines.slice(end).join('\n')}` : '';
      if (text.length < before.length + after.length) return null;
      if (!text.startsWith(before) || !text.endsWith(after)) return null;
      const region = text.slice(before.length, text.length - after.length);
      restored.push({
        ...file,
        contents: text,
        mode: { kind: 'region', start, end: start + region.split('\n').length },
      });
    }
  }
  return restored;
}

/** Truncates to `max` characters without cutting a surrogate pair in half. */
export function firstCharacters(text: string, max: number): string {
  return Array.from(text).slice(0, max).join('');
}

/** The text the learner may edit in one file: the region's lines, or the whole file when free. */
export function editableOf(file: EditorFile): string {
  if (file.mode.kind === 'free') return file.contents;
  if (file.mode.kind === 'locked') return '';
  return file.contents.split('\n').slice(file.mode.start, file.mode.end).join('\n');
}
