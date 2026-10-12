import { history, undo } from '@codemirror/commands';
import { EditorState, type Extension } from '@codemirror/state';
import { describe, expect, it, vi } from 'vitest';
import {
  editableRegion,
  editableText,
  regionOf,
  type EditMode,
} from '../../src/editor/editableRegion';

const DOC = ['<body>', '  <h1>Title</h1>', '', '</body>'].join('\n');
// Lines (0-based): 0 "<body>", 1 "  <h1>Title</h1>", 2 "", 3 "</body>". The region is line 2.
const REGION: EditMode = { kind: 'region', start: 2, end: 3 };

function make(mode: EditMode, doc = DOC, extra: Extension = [], blocked?: () => void) {
  return EditorState.create({ doc, extensions: [history(), editableRegion(mode, blocked), extra] });
}

const line = (state: EditorState, n: number) => state.doc.line(n + 1);

describe('editable region: what is allowed', () => {
  it('starts as the lines the content names', () => {
    const state = make(REGION);
    const region = regionOf(state);
    expect(region).toEqual({ from: line(state, 2).from, to: line(state, 2).to });
    expect(editableText(state)).toBe('');
  });

  it('allows typing inside the region', () => {
    let state = make(REGION);
    state = state.update({ changes: { from: regionOf(state)!.from, insert: '  <p>Hi</p>' } }).state;
    expect(state.doc.toString()).toBe(
      ['<body>', '  <h1>Title</h1>', '  <p>Hi</p>', '</body>'].join('\n'),
    );
    expect(editableText(state)).toBe('  <p>Hi</p>');
  });

  it('blocks a change in a locked line', () => {
    const blocked = vi.fn();
    const state = make(REGION, DOC, [], blocked);
    const next = state.update({ changes: { from: 0, insert: 'x' } }).state;
    expect(next.doc.toString()).toBe(DOC);
    expect(blocked).toHaveBeenCalledTimes(1);
  });

  it('blocks deleting a locked line', () => {
    const state = make(REGION);
    const h1 = line(state, 1);
    expect(state.update({ changes: { from: h1.from, to: h1.to } }).state.doc.toString()).toBe(DOC);
  });

  it('cuts a change that reaches into a locked line down to the part inside the region', () => {
    let state = make(REGION);
    state = state.update({ changes: { from: regionOf(state)!.from, insert: 'typed' } }).state;
    const r = regionOf(state)!;
    // A replacement that starts in the region and ends in the next locked line.
    const next = state.update({ changes: { from: r.from + 2, to: r.to + 3, insert: 'X' } }).state;
    expect(next.doc.toString()).toBe(['<body>', '  <h1>Title</h1>', 'tyX', '</body>'].join('\n'));
    expect(editableText(next)).toBe('tyX');
  });

  it('keeps the region apart from the lines around it (no joining)', () => {
    const state = make(REGION);
    const r = regionOf(state)!;
    // Backspace at the start of the region would delete the newline before it.
    expect(state.update({ changes: { from: r.from - 1, to: r.from } }).state.doc.toString()).toBe(
      DOC,
    );
    // Delete at the end of the region would delete the newline after it.
    expect(state.update({ changes: { from: r.to, to: r.to + 1 } }).state.doc.toString()).toBe(DOC);
  });

  it('applies the part of a multi-part change that is inside and drops the rest', () => {
    const state = make(REGION);
    const r = regionOf(state)!;
    const next = state.update({
      changes: [
        { from: 0, insert: 'bad' },
        { from: r.from, insert: 'ok' },
      ],
    }).state;
    expect(next.doc.toString()).toBe(['<body>', '  <h1>Title</h1>', 'ok', '</body>'].join('\n'));
  });

  it('select all, then type, replaces only what the learner wrote and keeps typing in order', () => {
    let state = make(REGION);
    state = state.update({ changes: { from: regionOf(state)!.from, insert: 'old' } }).state;
    // Select the whole file and type "a" over it.
    state = state.update({ selection: { anchor: 0, head: state.doc.length } }).state;
    state = state.update({
      changes: { from: 0, to: state.doc.length, insert: 'a' },
      userEvent: 'input.type',
    }).state;
    expect(state.doc.toString()).toBe(['<body>', '  <h1>Title</h1>', 'a', '</body>'].join('\n'));
    // The cursor sits after the typed text, so the next key follows it.
    expect(state.selection.main.empty).toBe(true);
    state = state.update({
      changes: { from: state.selection.main.head, insert: 'b' },
      userEvent: 'input.type',
    }).state;
    expect(editableText(state)).toBe('ab');
  });

  it('select all, then delete, empties the region and nothing else', () => {
    let state = make(REGION);
    state = state.update({ changes: { from: regionOf(state)!.from, insert: 'old\nlines' } }).state;
    state = state.update({ changes: { from: 0, to: state.doc.length } }).state;
    expect(state.doc.toString()).toBe(DOC);
    expect(editableText(state)).toBe('');
  });

  it('lets selections move anywhere', () => {
    const state = make(REGION);
    const next = state.update({ selection: { anchor: 0 } }).state;
    expect(next.selection.main.anchor).toBe(0);
  });
});

describe('editable region: it grows and shrinks', () => {
  it('grows when a newline is typed at either end', () => {
    let state = make(REGION);
    let r = regionOf(state)!;
    state = state.update({ changes: { from: r.from, insert: 'a\nb' } }).state;
    r = regionOf(state)!;
    expect(state.sliceDoc(r.from, r.to)).toBe('a\nb');
    // Typing at the very end of the grown region still lands inside it.
    state = state.update({ changes: { from: r.to, insert: '\nc' } }).state;
    r = regionOf(state)!;
    expect(state.sliceDoc(r.from, r.to)).toBe('a\nb\nc');
    // Typing at the very start too.
    state = state.update({ changes: { from: r.from, insert: 'z\n' } }).state;
    r = regionOf(state)!;
    expect(state.sliceDoc(r.from, r.to)).toBe('z\na\nb\nc');
    // The locked lines are untouched.
    expect(state.doc.toString().startsWith('<body>\n  <h1>Title</h1>\n')).toBe(true);
    expect(state.doc.toString().endsWith('\n</body>')).toBe(true);
  });

  it('keeps working on the grown region: a locked line next to it is still locked', () => {
    let state = make(REGION);
    state = state.update({ changes: { from: regionOf(state)!.from, insert: 'a\nb' } }).state;
    const before = state.doc.toString();
    const after = state.update({ changes: { from: 0, insert: 'x' } }).state;
    expect(after.doc.toString()).toBe(before);
  });

  it('shrinks when lines inside it are deleted', () => {
    let state = make(REGION);
    state = state.update({ changes: { from: regionOf(state)!.from, insert: 'a\nb\nc' } }).state;
    const r = regionOf(state)!;
    // Delete "\nb" in the middle.
    state = state.update({ changes: { from: r.from + 1, to: r.from + 3 } }).state;
    const r2 = regionOf(state)!;
    expect(state.sliceDoc(r2.from, r2.to)).toBe('a\nc');
    // Delete everything inside: an empty region is left, not removed.
    state = state.update({ changes: { from: r2.from, to: r2.to } }).state;
    const r3 = regionOf(state)!;
    expect(state.sliceDoc(r3.from, r3.to)).toBe('');
    expect(state.doc.toString()).toBe(DOC);
    // And it can still be typed into.
    state = state.update({ changes: { from: r3.from, insert: 'again' } }).state;
    expect(editableText(state)).toBe('again');
  });

  it('survives undo', () => {
    let state = make(REGION);
    state = state.update({ changes: { from: regionOf(state)!.from, insert: 'typed' } }).state;
    let undone = state;
    undo({ state, dispatch: (tr) => (undone = tr.state) });
    expect(undone.doc.toString()).toBe(DOC);
    expect(editableText(undone)).toBe('');
  });

  it('handles a region at the start and at the end of the file', () => {
    const top = make({ kind: 'region', start: 0, end: 1 }, 'first\nsecond');
    expect(editableText(top)).toBe('first');
    expect(top.update({ changes: { from: 0, insert: 'x' } }).state.doc.toString()).toBe(
      'xfirst\nsecond',
    );
    expect(top.update({ changes: { from: 6, insert: 'x' } }).state.doc.toString()).toBe(
      'first\nsecond',
    );

    const bottom = make({ kind: 'region', start: 1, end: 2 }, 'first\nsecond');
    expect(editableText(bottom)).toBe('second');
    expect(bottom.update({ changes: { from: 12, insert: '!' } }).state.doc.toString()).toBe(
      'first\nsecond!',
    );
  });
});

describe('editable region: other modes', () => {
  it('a locked file refuses every change', () => {
    const blocked = vi.fn();
    const state = make({ kind: 'locked' }, DOC, [], blocked);
    expect(state.update({ changes: { from: 0, insert: 'x' } }).state.doc.toString()).toBe(DOC);
    expect(blocked).toHaveBeenCalled();
    expect(editableText(state)).toBe('');
  });

  it('a free file allows everything and reports its whole text', () => {
    const state = make({ kind: 'free' });
    expect(state.update({ changes: { from: 0, insert: 'x' } }).state.doc.toString()).toBe(
      'x' + DOC,
    );
    expect(editableText(state)).toBe(DOC);
    expect(regionOf(state)).toBeNull();
  });

  it('clamps a region that runs past the end of the file', () => {
    const state = make({ kind: 'region', start: 3, end: 99 });
    expect(editableText(state)).toBe('</body>');
  });
});
