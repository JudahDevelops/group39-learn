/**
 * setup.sql is the exercise's own data: the tables and rows every check runs against. A learner
 * can read it but never change it, whatever the editable regions say, and a check always runs the
 * block's own copy, never the editor's. Pure functions, unit-tested
 * (tests/unit/runner.sql.setup.test.ts).
 */
import type { EditorFile } from '../../editor/files';
import type { Files } from '../types';
import { SETUP_FILE } from './config';

type Named = { name: string; contents: string };

/**
 * The editor's files with setup.sql locked and set back to the block's own text (a saved copy from
 * an earlier visit cannot carry an edit in). `own` is the step or lab seed, or a Try it block's files. Other runners' files are returned as they are.
 */
export function lockOwnSetup(
  files: EditorFile[],
  runner: string,
  own: readonly Named[],
): EditorFile[] {
  if (runner !== 'sql') return files;
  const original = own.find((f) => f.name === SETUP_FILE);
  return files.map((file) =>
    file.name === SETUP_FILE
      ? { ...file, contents: original?.contents ?? file.contents, mode: { kind: 'locked' } }
      : file,
  );
}

/**
 * The files to run: the learner's, with setup.sql replaced by the block's own. A setup.sql the
 * block does not have is dropped, so the learner's files cannot add one.
 */
export function withOwnSetup(files: Files, runner: string, own: readonly Named[]): Files {
  if (runner !== 'sql') return files;
  const rest = Object.fromEntries(Object.entries(files).filter(([name]) => name !== SETUP_FILE));
  const original = own.find((f) => f.name === SETUP_FILE);
  return original ? { ...rest, [SETUP_FILE]: original.contents } : rest;
}
