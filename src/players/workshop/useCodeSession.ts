/**
 * Everything a workshop step or a lab does with the learner's code, shared by both players:
 * restoring saved work, tracking edits, autosave (1 s after the last edit), the live preview,
 * running the checks, recording the attempt, and resetting to the seed.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CodeRunner, SeedFile, TestCase } from '../../content/schema';
import type { EditorSnapshot } from '../../editor/CodeEditor';
import {
  editableOf,
  filesToRecord,
  restoreSavedFiles,
  seedToEditorFiles,
  type EditorFile,
} from '../../editor/files';
import { getRunner } from '../../runners';
import { runPassed } from '../../runners/outcome';
import type { ConsoleOutput } from '../../runners/python/Console';
import type { Files, RunOutput } from '../../runners/types';
import { usesScript } from '../../runners/web/assemble';
import { useStore } from '../../store/StoreContext';

const SAVE_MS = 1000;
const PREVIEW_MS = 600;

export interface Outcome {
  output: RunOutput;
  passed: boolean;
}

interface Options {
  /** Where the code is saved and attempts are recorded: a step id, or a lab's block id. */
  itemId: string;
  runner: CodeRunner;
  seed: SeedFile[];
  tests: TestCase[];
  /** Runs once when a check passes (marks the item complete). */
  onPass: (output: RunOutput) => Promise<void>;
}

export interface CodeSession {
  /** False until saved code has been looked up. */
  ready: boolean;
  editorFiles: EditorFile[];
  /** Changes when the editor must start over (after a reset). */
  editorKey: number;
  /** The files the preview shows. */
  previewFiles: Files;
  /** False when the page runs JavaScript: the preview then refreshes on Run and on Check only. */
  livePreview: boolean;
  refreshPreview(): void;
  onEdit(snapshot: EditorSnapshot): void;
  /** The text the learner may edit, as it is right now. */
  getEditableCode(): string;
  check(): Promise<void>;
  checking: boolean;
  /** Python only: runs the code with no tests and shows what it prints in the Output tab. */
  run(): Promise<void>;
  /** True while a check or a run is in progress. */
  busy: boolean;
  /** Python only: what the last run or check printed. Null before the first. */
  console: ConsoleOutput | null;
  outcome: Outcome | null;
  /** True when the code was edited after the last check. */
  stale: boolean;
  reset(): void;
}

function initialEditable(files: EditorFile[]): string {
  return files
    .filter((f) => f.mode.kind !== 'locked')
    .map(editableOf)
    .join('\n');
}

export function useCodeSession({ itemId, runner, seed, tests, onPass }: Options): CodeSession {
  const store = useStore();
  const [editorFiles, setEditorFiles] = useState<EditorFile[] | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [previewFiles, setPreviewFiles] = useState<Files>({});
  const [livePreview, setLivePreview] = useState(true);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [stale, setStale] = useState(false);
  const [checking, setChecking] = useState(false);
  const [runBusy, setRunBusy] = useState(false);
  const [consoleOut, setConsoleOut] = useState<ConsoleOutput | null>(null);

  const latest = useRef<EditorSnapshot>({ files: {}, editableCode: '' });
  const dirty = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const running = useRef(false);
  const onPassRef = useRef(onPass);
  useEffect(() => {
    onPassRef.current = onPass;
  });

  const flush = useCallback(() => {
    clearTimeout(saveTimer.current);
    if (!dirty.current) return;
    dirty.current = false;
    store.saveCode(itemId, latest.current.files).catch(() => {
      // A failed autosave must not interrupt the learner; the next edit saves again.
    });
  }, [store, itemId]);

  // Restore saved code when it still fits the seed, else start from the seed.
  useEffect(() => {
    let cancelled = false;
    store
      .loadCode(itemId)
      .then((saved) => (saved ? restoreSavedFiles(seed, saved) : null))
      .catch(() => null)
      .then((restored) => {
        if (cancelled) return;
        const files = restored ?? seedToEditorFiles(seed);
        const record = filesToRecord(files);
        latest.current = { files: record, editableCode: initialEditable(files) };
        setPreviewFiles(record);
        setLivePreview(!usesScript(record));
        setEditorFiles(files);
      });
    return () => {
      cancelled = true;
    };
  }, [store, itemId, seed]);

  // Leaving the step saves what is pending.
  useEffect(
    () => () => {
      clearTimeout(previewTimer.current);
      flush();
    },
    [flush],
  );

  const onEdit = useCallback(
    (snapshot: EditorSnapshot) => {
      latest.current = snapshot;
      dirty.current = true;
      setStale(true);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flush, SAVE_MS);

      const live = !usesScript(snapshot.files);
      setLivePreview(live);
      clearTimeout(previewTimer.current);
      if (live) {
        previewTimer.current = setTimeout(() => setPreviewFiles(snapshot.files), PREVIEW_MS);
      }
    },
    [flush],
  );

  const refreshPreview = useCallback(() => {
    clearTimeout(previewTimer.current);
    // Save first: if the learner's script never ends, the frame can freeze the page.
    flush();
    setPreviewFiles(latest.current.files);
  }, [flush]);

  const check = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setChecking(true);
    const files = latest.current.files;
    refreshPreview();
    let output: RunOutput;
    try {
      const engine = await getRunner(runner);
      output = await engine.run(files, tests);
    } catch (err) {
      output = {
        results: [],
        firstFailure: null,
        logs: [],
        error: err instanceof Error ? err.message : 'Your code could not be checked.',
      };
    }
    const passed = runPassed(output);
    setOutcome({ output, passed });
    if (runner === 'python') setConsoleOut({ lines: output.logs, error: output.error ?? null });
    setStale(false);
    setChecking(false);
    running.current = false;
    // The result is already on screen. A store failure here must not hide it, and a failed
    // attempt record must not stop the pass from counting.
    try {
      await store.recordAttempt(itemId, passed, output.firstFailure ?? undefined);
    } catch {
      // Attempts only feed the admin's stuck list.
    }
    if (passed) {
      try {
        await onPassRef.current(output);
      } catch {
        // The next passing check writes the progress again.
      }
    }
  }, [store, itemId, runner, tests, refreshPreview]);

  const run = useCallback(async () => {
    if (runner !== 'python' || running.current) return;
    running.current = true;
    setRunBusy(true);
    // Save first, as a check does: the code may never come back.
    flush();
    let shown: ConsoleOutput;
    try {
      const engine = await getRunner(runner);
      const output = await engine.run(latest.current.files, []);
      shown = { lines: output.logs, error: output.error ?? null };
    } catch (err) {
      shown = {
        lines: [],
        error: err instanceof Error ? err.message : 'Your code could not run.',
      };
    }
    setConsoleOut(shown);
    setRunBusy(false);
    running.current = false;
  }, [runner, flush]);

  const reset = useCallback(() => {
    const files = seedToEditorFiles(seed);
    const record = filesToRecord(files);
    clearTimeout(saveTimer.current);
    clearTimeout(previewTimer.current);
    dirty.current = false;
    latest.current = { files: record, editableCode: initialEditable(files) };
    store.saveCode(itemId, record).catch(() => {
      // The seed is shown either way.
    });
    setEditorFiles(files);
    setEditorKey((k) => k + 1);
    setPreviewFiles(record);
    setLivePreview(!usesScript(record));
    setOutcome(null);
    setConsoleOut(null);
    setStale(false);
  }, [store, itemId, seed]);

  const getEditableCode = useCallback(() => latest.current.editableCode, []);

  return useMemo(
    () => ({
      ready: editorFiles !== null,
      editorFiles: editorFiles ?? [],
      editorKey,
      previewFiles,
      livePreview,
      refreshPreview,
      onEdit,
      getEditableCode,
      check,
      checking,
      run,
      busy: checking || runBusy,
      console: consoleOut,
      outcome,
      stale,
      reset,
    }),
    [
      editorFiles,
      editorKey,
      previewFiles,
      livePreview,
      refreshPreview,
      onEdit,
      getEditableCode,
      check,
      checking,
      run,
      runBusy,
      consoleOut,
      outcome,
      stale,
      reset,
    ],
  );
}
