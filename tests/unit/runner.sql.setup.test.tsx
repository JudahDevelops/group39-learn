/**
 * setup.sql is the exercise's own data. The learner can read it but never change it, and a check
 * always runs the block's own copy (src/runners/sql/files.ts, and useCodeSession for steps and labs).
 */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SeedFile, TestCase } from '../../src/content/schema';
import { freeEditorFiles, seedToEditorFiles } from '../../src/editor/files';
import { useCodeSession } from '../../src/players/workshop/useCodeSession';
import { lockOwnSetup, withOwnSetup } from '../../src/runners/sql/files';
import type { Files, RunOutput } from '../../src/runners/types';
import { LocalStore } from '../../src/store/LocalStore';
import { StoreProvider } from '../../src/store/StoreContext';

const SETUP = 'create table rooms (id integer primary key);\ninsert into rooms values (1), (2);';
const TAMPERED = 'create table rooms (id integer primary key);\ninsert into rooms values (1);';

const file = (name: string, contents: string, editable?: SeedFile['editable']): SeedFile => ({
  name,
  lang: 'sql',
  contents,
  ...(editable ? { editable } : {}),
});

/** A lab seed: no editable region, so every file would be free. */
const labSeed = [file('query.sql', '-- Count the rooms.'), file('setup.sql', SETUP)];
/** A workshop step seed: the region is in query.sql. */
const stepSeed = [
  file('query.sql', '-- Count the rooms.\n', { start: 1, end: 2 }),
  file('setup.sql', SETUP),
];

describe('lockOwnSetup', () => {
  it('locks setup.sql in a lab with no editable region, and leaves query.sql free', () => {
    const files = lockOwnSetup(seedToEditorFiles(labSeed), 'sql', labSeed);
    expect(files.map((f) => [f.name, f.mode.kind])).toEqual([
      ['query.sql', 'free'],
      ['setup.sql', 'locked'],
    ]);
  });

  it('locks setup.sql in a Try it box, where every file starts free', () => {
    const tryit = labSeed.map((f) => ({ name: f.name, lang: 'sql', contents: f.contents }));
    const files = lockOwnSetup(freeEditorFiles(tryit), 'sql', tryit);
    expect(files.map((f) => f.mode.kind)).toEqual(['free', 'locked']);
  });

  it('keeps the editable region of query.sql, and locks setup.sql whatever the seed says', () => {
    const files = lockOwnSetup(seedToEditorFiles(stepSeed), 'sql', stepSeed);
    expect(files[0]?.mode).toEqual({ kind: 'region', start: 1, end: 2 });
    expect(files[1]?.mode).toEqual({ kind: 'locked' });
    const odd = [file('query.sql', 'select 1'), file('setup.sql', SETUP, { start: 0, end: 1 })];
    expect(lockOwnSetup(seedToEditorFiles(odd), 'sql', odd)[1]?.mode).toEqual({ kind: 'locked' });
  });

  it("puts the block's own text back, so a copy with an edit in it cannot get in", () => {
    const edited = seedToEditorFiles(labSeed).map((f) =>
      f.name === 'setup.sql' ? { ...f, contents: TAMPERED } : f,
    );
    expect(lockOwnSetup(edited, 'sql', labSeed)[1]?.contents).toBe(SETUP);
  });

  it('leaves every other runner alone', () => {
    const files = seedToEditorFiles(labSeed);
    expect(lockOwnSetup(files, 'web', labSeed)).toBe(files);
    expect(lockOwnSetup(files, 'python', labSeed)).toBe(files);
  });
});

describe('withOwnSetup', () => {
  it("replaces the editor's setup.sql with the block's own", () => {
    const edited: Files = { 'query.sql': 'select 1', 'setup.sql': TAMPERED };
    expect(withOwnSetup(edited, 'sql', labSeed)).toEqual({
      'query.sql': 'select 1',
      'setup.sql': SETUP,
    });
  });

  it('drops a setup.sql the block does not have', () => {
    const edited: Files = { 'query.sql': 'select 1', 'setup.sql': TAMPERED };
    expect(withOwnSetup(edited, 'sql', [file('query.sql', '')])).toEqual({
      'query.sql': 'select 1',
    });
  });

  it('leaves other runners alone', () => {
    const files: Files = { 'setup.sql': TAMPERED };
    expect(withOwnSetup(files, 'web', labSeed)).toBe(files);
  });
});

// ---------------------------------------------------------------------------
// The code session of a step or lab: what the editor holds and what a check runs

const ran: { files: Files; tests: TestCase[] }[] = [];
const fakeOutput: RunOutput = { results: [], firstFailure: null, logs: [] };

vi.mock('../../src/runners', () => ({
  getRunner: async () => ({
    run: async (files: Files, tests: TestCase[]) => {
      ran.push({ files, tests });
      return fakeOutput;
    },
  }),
}));

let store: LocalStore;

beforeEach(async () => {
  localStorage.clear();
  ran.length = 0;
  store = new LocalStore();
  await store.signIn('ada@example.com', 'pw');
});

afterEach(() => cleanup());

function session(seed: SeedFile[], runner: 'sql' | 'web' = 'sql') {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider store={store}>{children}</StoreProvider>
  );
  return renderHook(
    () =>
      useCodeSession({
        itemId: 'lab00001',
        runner,
        seed,
        tests: [{ text: 'A test.', code: 'assert.ok(true)' }],
        onPass: async () => undefined,
      }),
    { wrapper },
  );
}

const typed = (
  query: string,
): Parameters<ReturnType<typeof session>['result']['current']['onEdit']>[0] => ({
  files: { 'query.sql': query, 'setup.sql': TAMPERED },
  editableCode: query,
});

describe('a sql lab with no editable region', () => {
  it('opens with setup.sql locked and query.sql free', async () => {
    const { result } = session(labSeed);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.editorFiles.map((f) => [f.name, f.mode.kind])).toEqual([
      ['query.sql', 'free'],
      ['setup.sql', 'locked'],
    ]);
  });

  it("a Check runs the lab's own setup.sql even when the editor held an edited copy", async () => {
    const { result } = session(labSeed);
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.onEdit(typed('select count(*) from rooms;')));
    await act(async () => {
      await result.current.check();
    });
    expect(ran).toHaveLength(1);
    expect(ran[0]?.files).toEqual({
      'query.sql': 'select count(*) from rooms;',
      'setup.sql': SETUP,
    });
    expect(ran[0]?.tests).toHaveLength(1);
  });

  it("a Run uses the lab's own setup.sql too", async () => {
    const { result } = session(labSeed);
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.onEdit(typed('select 1;')));
    await act(async () => {
      await result.current.run();
    });
    expect(ran[0]?.files['setup.sql']).toBe(SETUP);
    expect(ran[0]?.tests).toEqual([]);
  });

  it("code saved with an edited setup.sql opens with the lab's own, locked", async () => {
    await store.saveCode('lab00001', { 'query.sql': 'select 2;', 'setup.sql': TAMPERED });
    const { result } = session(labSeed);
    await waitFor(() => expect(result.current.ready).toBe(true));
    const [query, setup] = result.current.editorFiles;
    expect(query?.contents).toBe('select 2;');
    expect(setup?.contents).toBe(SETUP);
    expect(setup?.mode.kind).toBe('locked');
  });

  it('Reset keeps setup.sql locked', async () => {
    const { result } = session(labSeed);
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.reset());
    expect(result.current.editorFiles[1]?.mode.kind).toBe('locked');
    expect(result.current.editorFiles[1]?.contents).toBe(SETUP);
  });
});

describe('other runners', () => {
  it('a file called setup.sql in a web lab stays as the seed made it', async () => {
    const seed = [file('index.html', '<p>Hi</p>'), file('setup.sql', SETUP)];
    const { result } = session(seed, 'web');
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.editorFiles.map((f) => f.mode.kind)).toEqual(['free', 'free']);
  });
});
