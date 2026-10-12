/**
 * The code editor (CodeMirror 6): Atkinson Hyperlegible Mono on the bench surface, syntax colours
 * from docs/design.md, one tab per file, and an editable region that blocks edits outside it.
 *
 * Props:
 *  - `files`: the files to show. They are read once, when the editor mounts. To start over (reset a
 *    step, switch to another step) give the editor a new `key`.
 *  - `onChange`: after every edit, with the text of every file and the text the learner may edit.
 *  - `onCheck`: Ctrl/Cmd+Enter. Without it, that key does what CodeMirror normally does.
 *  - `readOnly`: show code that cannot be changed (it can still be selected and copied).
 *  - `height`: "fill" takes the height of its parent; "auto" grows with the code, up to 320 px.
 */
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { EditorState, Prec } from '@codemirror/state';
import { drawSelection, EditorView, keymap, lineNumbers } from '@codemirror/view';
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { editableRegion, editableText, type EditMode } from './editableRegion';
import type { EditorFile } from './files';
import { languageExtension } from './languages';
import { benchLook } from './theme';
import './editor.css';

export interface EditorSnapshot {
  /** File name -> current text, for every file. */
  files: Record<string, string>;
  /** The text the learner may edit: the region's lines, or the whole file when it is free. */
  editableCode: string;
}

interface CodeEditorProps {
  files: EditorFile[];
  onChange?: (snapshot: EditorSnapshot) => void;
  onCheck?: () => void;
  readOnly?: boolean;
  ariaLabel?: string;
  height?: 'fill' | 'auto';
  className?: string;
}

const NOTICE_MS = 3500;

function lockedMessage(mode: EditMode): string {
  return mode.kind === 'locked'
    ? 'This file is locked in this step. Edit the file with the highlighted lines.'
    : 'That part is locked. Type inside the highlighted lines.';
}

export function CodeEditor({
  files: initialFiles,
  onChange,
  onCheck,
  readOnly = false,
  ariaLabel = 'Code editor',
  height = 'fill',
  className,
}: CodeEditorProps) {
  const [files] = useState(initialFiles);
  const [active, setActive] = useState(files[0]?.name ?? '');
  const [notice, setNotice] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const idBase = useId();

  // Latest callbacks, so the editor never has to be rebuilt when a parent re-renders.
  const callbacks = useRef({ onChange, onCheck });
  useEffect(() => {
    callbacks.current = { onChange, onCheck };
  });

  const api = useRef<{ switchTo(name: string): void } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const first = files[0];
    if (!host || !first) return;

    const states = new Map<string, EditorState>();
    let shown = first.name;
    setActive(shown);

    const snapshot = (): EditorSnapshot => {
      const record: Record<string, string> = {};
      const editable: string[] = [];
      for (const file of files) {
        const state = file.name === shown ? view.state : states.get(file.name);
        record[file.name] = state ? state.doc.toString() : file.contents;
        if (state && file.mode.kind !== 'locked') editable.push(editableText(state));
      }
      return { files: record, editableCode: editable.join('\n') };
    };

    const buildState = (file: EditorFile) =>
      EditorState.create({
        doc: file.contents,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          EditorView.lineWrapping,
          benchLook,
          languageExtension(file.name, file.lang),
          editableRegion(file.mode, () => showNotice(lockedMessage(file.mode))),
          EditorState.readOnly.of(readOnly),
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  const check = callbacks.current.onCheck;
                  check?.();
                  return Boolean(check);
                },
              },
            ]),
          ),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.contentAttributes.of({
            'aria-label': `${ariaLabel}: ${file.name}`,
            spellcheck: 'false',
            autocorrect: 'off',
            autocapitalize: 'off',
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange?.(snapshot());
          }),
        ],
      });

    for (const file of files) states.set(file.name, buildState(file));
    const view = new EditorView({ state: states.get(first.name), parent: host });

    api.current = {
      switchTo(name) {
        const next = states.get(name);
        if (!next || name === shown) return;
        states.set(shown, view.state);
        view.setState(next);
        shown = name;
        setActive(name);
        view.focus();
      },
    };

    return () => {
      api.current = null;
      view.destroy();
      clearTimeout(noticeTimer.current);
    };
  }, [files, readOnly, ariaLabel, showNotice]);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = files[(index + step + files.length) % files.length];
    if (!next) return;
    api.current?.switchTo(next.name);
    document.getElementById(`${idBase}-tab-${next.name}`)?.focus();
  }

  const classes = ['code-editor', `code-editor-${height}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="editor-tabs on-dark" role="tablist" aria-label="Files">
        {files.map((file, index) => (
          <button
            key={file.name}
            type="button"
            role="tab"
            id={`${idBase}-tab-${file.name}`}
            aria-selected={file.name === active}
            aria-controls={`${idBase}-panel`}
            tabIndex={file.name === active ? 0 : -1}
            className="editor-tab"
            onClick={() => api.current?.switchTo(file.name)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {file.name}
          </button>
        ))}
      </div>
      <div
        ref={hostRef}
        className="editor-host"
        role="tabpanel"
        id={`${idBase}-panel`}
        aria-labelledby={`${idBase}-tab-${active}`}
        data-testid="code-editor"
      />
      <p className="editor-notice" role="status">
        {notice}
      </p>
    </div>
  );
}
