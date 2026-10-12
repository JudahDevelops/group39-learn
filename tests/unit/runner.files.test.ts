import { describe, expect, it } from 'vitest';
import type { SeedFile } from '../../src/content/schema';
import {
  editableOf,
  filesToRecord,
  firstCharacters,
  freeEditorFiles,
  restoreSavedFiles,
  seedToEditorFiles,
} from '../../src/editor/files';
import { whatsappUrl } from '../../src/players/workshop/HelpModal';
import {
  DEFAULT_PANES,
  layoutModeFor,
  loadPanes,
  MIN_PANE,
  resizePanes,
  savePanes,
} from '../../src/players/workshop/panes';

const seed: SeedFile[] = [
  {
    name: 'index.html',
    lang: 'html',
    contents: '<body>\n\n</body>',
    editable: { start: 1, end: 2 },
  },
  { name: 'styles.css', lang: 'css', contents: 'p { }' },
];

describe('seedToEditorFiles', () => {
  it('uses the editable range, and locks the files without one', () => {
    const files = seedToEditorFiles(seed);
    expect(files[0]?.mode).toEqual({ kind: 'region', start: 1, end: 2 });
    expect(files[1]?.mode).toEqual({ kind: 'locked' });
  });

  it('frees every file when the seed has no region (a lab)', () => {
    const files = seedToEditorFiles(
      seed.map(({ name, lang, contents }) => ({ name, lang, contents })),
    );
    expect(files.map((f) => f.mode.kind)).toEqual(['free', 'free']);
  });

  it('freeEditorFiles and filesToRecord', () => {
    const files = freeEditorFiles([{ name: 'a.js', lang: 'js', contents: 'x' }]);
    expect(files[0]?.mode).toEqual({ kind: 'free' });
    expect(filesToRecord(files)).toEqual({ 'a.js': 'x' });
  });

  it('editableOf reads the region, the whole file, or nothing', () => {
    const [region, locked] = seedToEditorFiles(seed);
    expect(
      editableOf({
        ...region!,
        contents: '<body>\nhi\nthere\n</body>',
        mode: { kind: 'region', start: 1, end: 3 },
      }),
    ).toBe('hi\nthere');
    expect(editableOf(locked!)).toBe('');
    expect(editableOf({ name: 'a', contents: 'all', mode: { kind: 'free' } })).toBe('all');
  });
});

describe('restoreSavedFiles', () => {
  it('rebuilds the region from saved text, however many lines it grew to', () => {
    const saved = { 'index.html': '<body>\n<h1>a</h1>\n<p>b</p>\n</body>', 'styles.css': 'p { }' };
    const files = restoreSavedFiles(seed, saved);
    expect(files?.[0]?.mode).toEqual({ kind: 'region', start: 1, end: 3 });
    expect(files?.[0]?.contents).toBe(saved['index.html']);
  });

  it('restores an emptied region as one line', () => {
    const files = restoreSavedFiles(seed, {
      'index.html': '<body>\n\n</body>',
      'styles.css': 'p { }',
    });
    expect(files?.[0]?.mode).toEqual({ kind: 'region', start: 1, end: 2 });
  });

  it('returns null when the names differ, or the locked lines changed', () => {
    expect(restoreSavedFiles(seed, { 'index.html': '<body>\n\n</body>' })).toBeNull();
    expect(
      restoreSavedFiles(seed, { 'index.html': '<main>\nx\n</body>', 'styles.css': 'p { }' }),
    ).toBeNull();
    expect(
      restoreSavedFiles(seed, { 'index.html': '<body>\nx\n</body>', 'styles.css': 'changed' }),
    ).toBeNull();
  });

  it('restores a lab without a region as plain text', () => {
    const lab: SeedFile[] = [{ name: 'index.html', lang: 'html', contents: '<p></p>' }];
    const files = restoreSavedFiles(lab, { 'index.html': '<h1>mine</h1>' });
    expect(files?.[0]?.contents).toBe('<h1>mine</h1>');
    expect(files?.[0]?.mode.kind).toBe('free');
  });

  it('a region at the very start or end of a file', () => {
    const top: SeedFile[] = [
      { name: 'a.py', lang: 'py', contents: 'x = 1\nprint(x)', editable: { start: 0, end: 1 } },
    ];
    expect(restoreSavedFiles(top, { 'a.py': 'x = 1\ny = 2\nprint(x)' })?.[0]?.mode).toEqual({
      kind: 'region',
      start: 0,
      end: 2,
    });
    const bottom: SeedFile[] = [
      { name: 'a.py', lang: 'py', contents: 'x = 1\nprint(x)', editable: { start: 1, end: 2 } },
    ];
    expect(restoreSavedFiles(bottom, { 'a.py': 'x = 1\nprint(x)\nprint(2)' })?.[0]?.mode).toEqual({
      kind: 'region',
      start: 1,
      end: 3,
    });
  });
});

describe('Ask the group on WhatsApp', () => {
  it('encodes the step title, the address and the first 600 characters of code', () => {
    const url = whatsappUrl({
      blockTitle: 'Build a Hall Notice',
      stepTitle: 'Step 2',
      href: 'https://learn.example/learn/x/y?a=1&b=2',
      code: 'é'.repeat(700),
    });
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length));
    expect(text).toContain('Step 2');
    expect(text).toContain('https://learn.example/learn/x/y?a=1&b=2');
    expect(text.split('\n\n')[1]).toBe('é'.repeat(600));
    // Nothing unencoded that would end the query early.
    expect(url.slice('https://wa.me/?text='.length)).not.toMatch(/[&# \n]/);
  });

  it('firstCharacters does not split a character in half', () => {
    expect(firstCharacters('a😀b', 2)).toBe('a😀');
  });
});

describe('pane layout', () => {
  it('picks the layout from the width', () => {
    expect(layoutModeFor(1100)).toBe('wide');
    expect(layoutModeFor(1099)).toBe('medium');
    expect(layoutModeFor(768)).toBe('medium');
    expect(layoutModeFor(767)).toBe('narrow');
  });

  it('resizes by moving one divider and keeps the total at 100', () => {
    expect(resizePanes([30, 40, 30], 0, 5)).toEqual([35, 35, 30]);
    expect(resizePanes([30, 40, 30], 1, -10)).toEqual([30, 30, 40]);
    const total = (s: number[]) => s.reduce((a, b) => a + b, 0);
    expect(total(resizePanes([30, 40, 30], 0, 12.5))).toBeCloseTo(100);
  });

  it('never shrinks a pane below the minimum', () => {
    expect(resizePanes([30, 40, 30], 0, -50)[0]).toBe(MIN_PANE);
    expect(resizePanes([30, 40, 30], 0, 90)[1]).toBe(MIN_PANE);
    expect(resizePanes([30, 40, 30], 1, 90)[2]).toBe(MIN_PANE);
  });

  it('remembers sizes and ignores a bad saved value', () => {
    window.localStorage.clear();
    expect(loadPanes()).toEqual(DEFAULT_PANES);
    savePanes([20, 50, 30]);
    expect(loadPanes()).toEqual([20, 50, 30]);
    window.localStorage.setItem('g39.workshop.panes', JSON.stringify([5, 5, 5]));
    expect(loadPanes()).toEqual(DEFAULT_PANES);
    window.localStorage.setItem('g39.workshop.panes', 'not json');
    expect(loadPanes()).toEqual(DEFAULT_PANES);
  });
});
