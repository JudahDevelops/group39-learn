/**
 * The sentences a learner reads when Python stops, a test fails with an error, or Python cannot load.
 * Pure text in, text out, so it is unit-tested directly (tests/unit/runner.python.messages.test.ts).
 *
 * `RunOutput.error` is plain text (not HTML), so nothing here uses backticks or markup. Names are
 * wrapped in straight double quotes.
 */
import { PYTHON_DOWNLOAD_MB, RUN_TIMEOUT_MS } from './config';

/** What harness.py reports about an exception. `file`, `line` and `source` point into the learner's files. */
export interface PyError {
  type: string;
  message: string;
  file: string | null;
  line: number | null;
  source: string | null;
  syntax: boolean;
}

export function timeoutText(timeoutMs: number = RUN_TIMEOUT_MS): string {
  const seconds = Math.max(1, Math.round(timeoutMs / 1000));
  return `Your code ran for more than ${seconds} ${seconds === 1 ? 'second' : 'seconds'}, so it was stopped. Check for a loop that never ends.`;
}

export const BOOT_FAILED_TEXT =
  'Python could not be downloaded. Check your internet connection, then try again.';
export const BOOT_TIMEOUT_TEXT =
  'Python took too long to load, so loading was stopped. Check your internet connection, then try again.';
export const WORKER_CRASHED_TEXT =
  'Python stopped working unexpectedly. Try again; it restarts by itself.';

// ---------------------------------------------------------------------------
// Where in the learner's code

function clip(text: string, limit: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

/** " on line 4 of main.py, which reads print(totl)", or "" when the error did not come from the learner's files. */
export function whereText(err: PyError): string {
  if (!err.file) return '';
  const place = err.line ? ` on line ${err.line} of ${err.file}` : ` in ${err.file}`;
  const code = err.source ? `, which reads ${clip(err.source, 60)}` : '';
  return `${place}${code}`;
}

// ---------------------------------------------------------------------------
// What went wrong, in plain words

const SIMPLE_TYPES: Record<string, string> = {
  int: 'a whole number',
  float: 'a decimal number',
  str: 'text',
  list: 'a list',
  dict: 'a dictionary',
  tuple: 'a tuple',
  bool: 'True or False',
  NoneType: 'None (no value)',
};

function typeWords(name: string): string {
  return SIMPLE_TYPES[name] ?? `a ${name} value`;
}

function syntaxReason(message: string): string {
  const m = message.trim();
  if (/^expected ':'/.test(m)) return 'A colon (:) is missing at the end of the line.';
  const open = /'(.)' was never closed/.exec(m);
  if (open) {
    return `A bracket ${open[1]} is opened here but never closed. Add the matching closing bracket.`;
  }
  if (/unterminated (triple-quoted )?string literal/.test(m)) {
    return 'A piece of text starts with a quote but never ends. Add the closing quote.';
  }
  if (/expected an indented block/.test(m)) {
    return 'The line after a colon must be indented, pushed in by 4 spaces.';
  }
  if (/unexpected indent/.test(m)) {
    return 'This line is indented but should not be. Remove the spaces at the start.';
  }
  if (/unindent does not match/.test(m)) {
    return 'The spaces at the start of this line do not line up with an earlier line. Make them match.';
  }
  const stray = /unmatched '(.)'/.exec(m);
  if (stray) {
    return `There is a closing ${stray[1]} with no opening one. Remove it, or add the opening one.`;
  }
  if (/invalid decimal literal/.test(m)) {
    return 'A number is mixed up with letters. A name cannot start with a digit.';
  }
  if (/invalid syntax/.test(m)) {
    const comma = /forgot a comma/.test(m) ? ' A comma may be missing.' : '';
    return `Something here does not follow Python's rules. Look for a missing quote, bracket, comma or colon.${comma}`;
  }
  return `Python says: ${m}.`;
}

/** One or two sentences about the cause, ending in a full stop. */
export function reasonText(err: PyError): string {
  const m = err.message.trim();
  if (err.syntax) return syntaxReason(m);
  switch (err.type) {
    case 'NameError': {
      const name = /name '(.+?)' is not defined/.exec(m)?.[1];
      const guess = /Did you mean: '(.+?)'/.exec(m)?.[1];
      if (!name) return `Python says: ${m}.`;
      const maybe = guess ? ` Did you mean "${guess}"?` : '';
      return `Python does not know the name "${name}". Check the spelling, or give it a value before this line.${maybe}`;
    }
    case 'UnboundLocalError': {
      const name = /variable '(.+?)'/.exec(m)?.[1];
      return name
        ? `The variable "${name}" is used inside a function before it has a value. Give it a value first.`
        : `Python says: ${m}.`;
    }
    case 'TypeError': {
      const concat = /can only concatenate str \(not "(\w+)"\) to str/.exec(m);
      if (concat) {
        return `You cannot join text and ${typeWords(concat[1] ?? '')} with +. Turn the number into text with str(), or use an f-string.`;
      }
      const operand = /unsupported operand type\(s\) for (.+?): '(\w+)' and '(\w+)'/.exec(m);
      if (operand) {
        return `Python cannot use "${operand[1]}" between ${typeWords(operand[2] ?? '')} and ${typeWords(operand[3] ?? '')}. Change one of them first, for example with int() or str().`;
      }
      if (/positional argument/.test(m)) {
        return `A function was called with the wrong number of values. Python says: ${m}.`;
      }
      return `A value has the wrong type for what the code does with it. Python says: ${m}.`;
    }
    case 'ValueError': {
      const literal = /invalid literal for int\(\) with base 10: (.+)/.exec(m)?.[1];
      if (literal) return `int() cannot turn ${literal.replace(/'/g, '"')} into a number.`;
      return `A value is not acceptable here. Python says: ${m}.`;
    }
    case 'ZeroDivisionError':
      return 'Python cannot divide by zero. Check the number you divide by.';
    case 'IndexError':
      return 'The list has fewer items than the position you asked for. Positions start at 0.';
    case 'KeyError':
      return `The dictionary has no key ${m.replace(/'/g, '"')}. Check the spelling of the key.`;
    case 'AttributeError': {
      const attr = /'(\w+)' object has no attribute '(.+?)'/.exec(m);
      if (attr) {
        return `${typeWords(attr[1] ?? '')} has no "${attr[2]}". Check the spelling, and that the value is what you expect.`;
      }
      return `Python says: ${m}.`;
    }
    case 'ModuleNotFoundError':
    case 'ImportError': {
      const name = /No module named '(.+?)'/.exec(m)?.[1];
      return name
        ? `Python cannot find the module "${name}". Check the spelling. Only Python's built-in modules are available here.`
        : `Python says: ${m}.`;
    }
    case 'EOFError':
      return 'input() waits for you to type an answer, and this editor cannot do that yet. Put the value in the code instead, for example name = "Amina".';
    case 'RecursionError':
      return 'A function keeps calling itself and never stops. Check that it has a way to finish.';
    case 'FileNotFoundError': {
      const file = /No such file or directory: '(.+?)'/.exec(m)?.[1];
      return file ? `The file "${file}" does not exist here.` : `Python says: ${m}.`;
    }
    case 'AssertionError':
      return m ? `An assert in your code failed: ${m}.` : 'An assert in your code failed.';
    case 'NoEntry':
      return m;
    default:
      return m ? `Python reported ${err.type}: ${m}.` : `Python reported ${err.type}.`;
  }
}

/** The whole sentence a learner sees when their code stops or cannot be read. */
export function describeError(err: PyError, context: 'run' | 'test' = 'run'): string {
  if (err.type === 'NoEntry') return err.message;
  const where = whereText(err);
  const reason = reasonText(err);
  if (context === 'test') return `Python stopped while checking your code${where}. ${reason}`;
  if (err.syntax) return `Python cannot read your code${where}. ${reason} Fix it, then run again.`;
  return `Your code stopped${where}. ${reason}`;
}

// ---------------------------------------------------------------------------
// Test results

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ENTITIES[c] ?? c);
}

/**
 * The message for a failed test. A failed assert shows the test's own hint. Any other exception
 * keeps the hint and adds what Python said, in plain words.
 */
export function failureMessage(hint: string, error: PyError | null): string {
  if (!error) return hint;
  return `${hint} <span class="py-reason">${escapeHtml(describeError(error, 'test'))}</span>`;
}

// ---------------------------------------------------------------------------
// The note beside the Run button

export type PythonPhase = 'idle' | 'downloading' | 'starting' | 'ready' | 'running' | 'restarting';

export interface PythonStatus {
  phase: PythonPhase;
  /** True until Python has loaded once on this device. */
  firstTime: boolean;
}

/** What to tell the learner about Python itself, or null when there is nothing to say. */
export function statusText(status: PythonStatus): string | null {
  switch (status.phase) {
    case 'idle':
      return status.firstTime
        ? `Python needs about ${PYTHON_DOWNLOAD_MB} MB, once. It downloads the first time your code runs.`
        : null;
    case 'downloading':
      return `Downloading Python, about ${PYTHON_DOWNLOAD_MB} MB, once. This takes a few seconds.`;
    case 'starting':
      return 'Starting Python. Nearly there.';
    case 'restarting':
      return 'Restarting Python after the stop. This takes a few seconds.';
    case 'ready':
    case 'running':
      return null;
  }
}
