import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { indentUnit } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';

type LanguageName = 'html' | 'css' | 'js' | 'py' | 'sql';

const BY_EXTENSION: Record<string, LanguageName> = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'js',
  mjs: 'js',
  json: 'js',
  py: 'py',
  sql: 'sql',
};

/** The language of a file: by its extension first, then by the `lang` from the code fence. */
export function languageName(fileName: string, lang?: string): LanguageName | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext in BY_EXTENSION) return BY_EXTENSION[ext] ?? null;
  const fence = (lang ?? '').toLowerCase();
  if (fence in BY_EXTENSION) return BY_EXTENSION[fence] ?? null;
  if (fence === 'javascript') return 'js';
  if (fence === 'python') return 'py';
  return null;
}

/** Highlighting and indentation for one file. Plain text when the language is unknown. */
export function languageExtension(fileName: string, lang?: string): Extension {
  switch (languageName(fileName, lang)) {
    case 'html':
      // No auto-closing tags: typing the closing tag is part of what a first step teaches.
      return [html({ autoCloseTags: false }), indentUnit.of('  '), EditorState.tabSize.of(2)];
    case 'css':
      return [css(), indentUnit.of('  '), EditorState.tabSize.of(2)];
    case 'js':
      return [javascript(), indentUnit.of('  '), EditorState.tabSize.of(2)];
    case 'py':
      return [python(), indentUnit.of('    '), EditorState.tabSize.of(4)];
    case 'sql':
      return [sql(), indentUnit.of('  '), EditorState.tabSize.of(2)];
    default:
      return [indentUnit.of('  '), EditorState.tabSize.of(2)];
  }
}
