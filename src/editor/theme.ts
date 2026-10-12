/**
 * The bench theme: dark green editor surface, Atkinson Hyperlegible Mono, and the syntax colours
 * from docs/design.md. Colours come from the tokens in src/styles/tokens.css. The one value that
 * is not a token, #1E2D27 (the editable lines), is the design's own number.
 */
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

// Syntax colours (docs/design.md, "Editor (bench) syntax colours").
const TAG = '#8FD1A8';
const ATTRIBUTE = '#E9C46A'; // attributes, numbers, CSS properties
const STRING = '#F2B8A0';
const KEYWORD = '#A9C7F5';
const COMMENT = '#7E918A';
const EDITABLE_BACKGROUND = '#1E2D27';

export const benchHighlight = HighlightStyle.define([
  { tag: [t.tagName, t.angleBracket, t.standard(t.tagName), t.className, t.labelName], color: TAG },
  {
    tag: [t.attributeName, t.propertyName, t.number, t.integer, t.float, t.bool, t.color],
    color: ATTRIBUTE,
  },
  // JavaScript method calls such as console.log read as plain text, not as attributes.
  { tag: [t.function(t.propertyName), t.function(t.variableName)], color: 'var(--bench-ink)' },
  {
    tag: [t.string, t.attributeValue, t.special(t.string), t.regexp, t.character, t.docString],
    color: STRING,
  },
  {
    tag: [
      t.keyword,
      t.controlKeyword,
      t.operatorKeyword,
      t.definitionKeyword,
      t.moduleKeyword,
      t.modifier,
      t.atom,
      t.null,
      t.self,
      t.unit,
    ],
    color: KEYWORD,
  },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: COMMENT },
  { tag: t.invalid, color: 'var(--bench-ink)', textDecoration: 'underline wavy var(--key)' },
]);

export const benchTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--bench-ink)',
      backgroundColor: 'var(--bench)',
      fontSize: 'var(--text-code)',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-code)',
      lineHeight: 'var(--lh-code)',
      overflow: 'auto',
    },
    '.cm-content': { caretColor: 'var(--key)', padding: '8px 0' },
    '.cm-line': { padding: '0 12px 0 8px' },
    '&.cm-focused': { outline: '2px solid var(--key)', outlineOffset: '-2px' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--key)', borderLeftWidth: '2px' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground':
      { background: 'rgba(233, 184, 36, 0.25)' },
    '.cm-gutters': {
      backgroundColor: 'var(--bench-2)',
      color: 'var(--bench-ink)',
      border: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 12px', opacity: '0.65' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'transparent',
      outline: '1px solid var(--key)',
    },
    // Locked lines sit back at 60%. The lines the learner may edit get a lifted surface and a
    // 3 px brass bar in the gutter.
    '.cm-line.cm-line-locked': { opacity: '0.6' },
    '.cm-line.cm-line-editable': { backgroundColor: EDITABLE_BACKGROUND },
    '.cm-gutterElement.cm-gutter-locked': { opacity: '0.6' },
    '.cm-gutterElement.cm-gutter-editable': {
      backgroundColor: EDITABLE_BACKGROUND,
      boxShadow: 'inset 3px 0 0 var(--key)',
      opacity: '1',
    },
    '.cm-lineNumbers .cm-gutterElement.cm-gutter-locked': { opacity: '0.45' },
  },
  { dark: true },
);

export const benchLook: Extension = [benchTheme, syntaxHighlighting(benchHighlight)];
