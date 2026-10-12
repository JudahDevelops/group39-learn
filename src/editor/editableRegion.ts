/**
 * The locked-outside-the-region rule for the code editor, as a CodeMirror extension.
 *
 * A file is in one of three modes:
 *  - `free`: the whole file can be edited (Try it boxes, labs without a region).
 *  - `region`: only the lines `start..end-1` (0-based, as in the content format) can be edited.
 *  - `locked`: nothing can be edited (the other files of a step).
 *
 * The region is stored as two document positions. A transaction filter cancels any change that
 * touches text outside them (or cuts it down to the part inside). The positions are mapped through every accepted change, so the region
 * grows and shrinks as the learner types: `from` stays put when text is inserted at it and `to`
 * moves past text inserted at it, which keeps new text inside the region at both ends.
 *
 * The newline just before the region and the newline just after it are outside it, so a learner
 * cannot join the region to the locked lines around it.
 */
import {
  ChangeSet,
  EditorSelection,
  EditorState,
  Facet,
  RangeSetBuilder,
  StateField,
  Text,
  Transaction,
  type Extension,
} from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, gutterLineClass } from '@codemirror/view';

export type EditMode =
  { kind: 'free' } | { kind: 'locked' } | { kind: 'region'; start: number; end: number };

export interface Region {
  from: number;
  to: number;
}

/** The mode for one editor state. */
export const editMode = Facet.define<EditMode, EditMode>({
  combine: (values) => values[0] ?? { kind: 'free' },
});

/** Called when a change is refused. The editor uses it to tell the learner that part is locked. */
export const onLockedAttempt = Facet.define<() => void, (() => void) | null>({
  combine: (values) => values[0] ?? null,
});

function initialRegion(state: EditorState): Region | null {
  const mode = state.facet(editMode);
  if (mode.kind !== 'region') return null;
  const lastLine = state.doc.lines;
  const start = Math.min(Math.max(mode.start, 0), lastLine - 1);
  const end = Math.min(Math.max(mode.end, start + 1), lastLine);
  return { from: state.doc.line(start + 1).from, to: state.doc.line(end).to };
}

const regionField = StateField.define<Region | null>({
  create: initialRegion,
  update(value, tr) {
    if (!value || !tr.docChanged) return value;
    return { from: tr.changes.mapPos(value.from, -1), to: tr.changes.mapPos(value.to, 1) };
  },
});

/** The editable region of a state in document positions, or null when the whole file is free or locked. */
export function regionOf(state: EditorState): Region | null {
  return state.field(regionField, false) ?? null;
}

/** The text the learner may edit: the region, or the whole document in a free file. Empty when locked. */
export function editableText(state: EditorState): string {
  const mode = state.facet(editMode);
  if (mode.kind === 'free') return state.doc.toString();
  const region = regionOf(state);
  return region ? state.sliceDoc(region.from, region.to) : '';
}

/**
 * The guard. A change inside the region goes through untouched. A change outside it is dropped.
 * A change that straddles the edge (select all, then delete or type) is cut down to the part inside
 * the region, so the learner can clear or replace what they wrote without ever touching a locked line.
 */
const guard = EditorState.transactionFilter.of((tr) => {
  const mode = tr.startState.facet(editMode);
  if (mode.kind === 'free' || !tr.docChanged) return tr;
  const region = tr.startState.field(regionField, false) ?? null;
  const blocked = tr.startState.facet(onLockedAttempt);

  if (mode.kind !== 'region' || !region) {
    blocked?.();
    return [];
  }

  const kept: { from: number; to: number; insert: Text }[] = [];
  let clipped = false;
  tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    if (fromA >= region.from && toA <= region.to) {
      kept.push({ from: fromA, to: toA, insert: inserted });
      return;
    }
    clipped = true;
    const from = Math.max(fromA, region.from);
    const to = Math.min(toA, region.to);
    // Wholly outside, an insertion outside, or a deletion that only reaches the edge: nothing to keep.
    if (from > to || fromA === toA || (from === to && inserted.length === 0)) return;
    kept.push({ from, to, insert: inserted });
  });

  if (!clipped) return tr;
  blocked?.();
  if (kept.length === 0) return [];

  // Put the cursor after what was typed, inside the region. Without this the selection that
  // spanned the whole file would stay selected and the next key would replace the last one.
  const changes = ChangeSet.of(kept, tr.startState.doc.length);
  const last = kept[kept.length - 1];
  return [
    {
      changes,
      selection: EditorSelection.cursor(changes.mapPos(last ? last.to : region.to, 1)),
      scrollIntoView: tr.scrollIntoView,
      userEvent: tr.annotation(Transaction.userEvent),
    },
  ];
});

const lockedLine = Decoration.line({ class: 'cm-line-locked' });
const editableLine = Decoration.line({ class: 'cm-line-editable' });

class LineClassMarker extends GutterMarker {
  constructor(readonly elementClass: string) {
    super();
  }
}
const lockedGutter = new LineClassMarker('cm-gutter-locked');
const editableGutter = new LineClassMarker('cm-gutter-editable');

function lineKinds(state: EditorState): boolean[] | null {
  const mode = state.facet(editMode);
  if (mode.kind === 'free') return null;
  const region = regionOf(state);
  const kinds: boolean[] = [];
  for (let n = 1; n <= state.doc.lines; n++) {
    const line = state.doc.line(n);
    kinds.push(region !== null && line.from >= region.from && line.from <= region.to);
  }
  return kinds;
}

const lineDecorations = EditorView.decorations.compute([regionField, 'doc'], (state) => {
  const builder = new RangeSetBuilder<Decoration>();
  const kinds = lineKinds(state);
  if (!kinds) return builder.finish();
  kinds.forEach((editable, i) => {
    const from = state.doc.line(i + 1).from;
    builder.add(from, from, editable ? editableLine : lockedLine);
  });
  return builder.finish();
});

const gutterClasses = gutterLineClass.compute([regionField, 'doc'], (state) => {
  const builder = new RangeSetBuilder<GutterMarker>();
  const kinds = lineKinds(state);
  if (!kinds) return builder.finish();
  kinds.forEach((editable, i) => {
    const from = state.doc.line(i + 1).from;
    builder.add(from, from, editable ? editableGutter : lockedGutter);
  });
  return builder.finish();
});

/**
 * Everything the region needs, for one file. `blocked` is called whenever a change is refused.
 * Returns [] for a free file, so a Try it box pays for nothing.
 */
export function editableRegion(mode: EditMode, blocked?: () => void): Extension {
  if (mode.kind === 'free') return [];
  return [
    editMode.of(mode),
    blocked ? onLockedAttempt.of(blocked) : [],
    regionField,
    guard,
    lineDecorations,
    gutterClasses,
  ];
}
