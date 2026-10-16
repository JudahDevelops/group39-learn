import { describe, expect, it } from 'vitest';
import {
  BOOT_FAILED_TEXT,
  describeError,
  escapeHtml,
  failureMessage,
  reasonText,
  statusText,
  timeoutText,
  whereText,
  type PyError,
} from '../../src/runners/python/messages';

const error = (over: Partial<PyError>): PyError => ({
  type: 'NameError',
  message: '',
  file: 'main.py',
  line: 4,
  source: null,
  syntax: false,
  ...over,
});

describe('timeoutText', () => {
  it('says the stop in plain words, with the seconds', () => {
    expect(timeoutText(5000)).toBe(
      'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.',
    );
  });
  it('uses the singular for one second and rounds other values', () => {
    expect(timeoutText(1000)).toMatch(/more than 1 second,/);
    expect(timeoutText(250)).toMatch(/more than 1 second,/);
    expect(timeoutText(2400)).toMatch(/more than 2 seconds,/);
  });
});

describe('whereText', () => {
  it('names the line, the file and the code on that line', () => {
    expect(whereText(error({ source: 'print(totl)' }))).toBe(
      ' on line 4 of main.py, which reads print(totl)',
    );
  });
  it('names only the file when there is no line, and nothing when there is no file', () => {
    expect(whereText(error({ line: null }))).toBe(' in main.py');
    expect(whereText(error({ file: null, line: null }))).toBe('');
  });
  it('shortens a very long line of code', () => {
    const where = whereText(error({ source: 'x'.repeat(200) }));
    expect(where.length).toBeLessThan(100);
    expect(where).toContain('…');
  });
});

describe('reasonText', () => {
  const cases: [Partial<PyError>, RegExp][] = [
    [
      { type: 'NameError', message: "name 'totl' is not defined. Did you mean: 'total'?" },
      /^Python does not know the name "totl"\. .*Did you mean "total"\?$/,
    ],
    [
      { type: 'NameError', message: "name 'totl' is not defined" },
      /name "totl"\. Check the spelling/,
    ],
    [
      { type: 'TypeError', message: 'can only concatenate str (not "int") to str' },
      /cannot join text and a whole number with \+\. Turn the number into text with str\(\)/,
    ],
    [
      { type: 'TypeError', message: "unsupported operand type(s) for +: 'int' and 'str'" },
      /cannot use "\+" between a whole number and text/,
    ],
    [
      { type: 'TypeError', message: 'f() takes 1 positional argument but 2 were given' },
      /wrong number of values/,
    ],
    [
      { type: 'ValueError', message: "invalid literal for int() with base 10: 'abc'" },
      /^int\(\) cannot turn "abc" into a number\.$/,
    ],
    [{ type: 'ZeroDivisionError', message: 'division by zero' }, /cannot divide by zero/],
    [{ type: 'IndexError', message: 'list index out of range' }, /Positions start at 0/],
    [{ type: 'KeyError', message: "'urgent'" }, /no key "urgent"/],
    [
      { type: 'AttributeError', message: "'str' object has no attribute 'push'" },
      /^text has no "push"\./,
    ],
    [
      { type: 'ModuleNotFoundError', message: "No module named 'requests'" },
      /cannot find the module "requests"/,
    ],
    [
      { type: 'EOFError', message: 'EOF when reading a line' },
      /^input\(\) waits for you to type.*name = "Amina"/,
    ],
    [
      { type: 'RecursionError', message: 'maximum recursion depth exceeded' },
      /keeps calling itself/,
    ],
    [
      {
        type: 'UnboundLocalError',
        message: "cannot access local variable 'n' where it is not associated with a value",
      },
      /variable "n" is used inside a function before it has a value/,
    ],
    [
      { type: 'AssertionError', message: 'n must be positive' },
      /assert in your code failed: n must be positive\./,
    ],
    [{ type: 'OverflowError', message: 'too big' }, /^Python reported OverflowError: too big\.$/],
  ];
  it.each(cases)('%j', (over, pattern) => {
    expect(reasonText(error(over))).toMatch(pattern);
  });

  const syntax: [string, RegExp][] = [
    ["expected ':'", /^A colon \(:\) is missing at the end of the line\.$/],
    ["'(' was never closed", /bracket \( is opened here but never closed/],
    ['unterminated string literal (detected at line 3)', /starts with a quote but never ends/],
    [
      'expected an indented block after function definition on line 2',
      /indented, pushed in by 4 spaces/,
    ],
    ['unexpected indent', /indented but should not be/],
    ['unindent does not match any outer indentation level', /do not line up/],
    ["unmatched ')'", /closing \) with no opening one/],
    ['invalid syntax. Perhaps you forgot a comma?', /A comma may be missing/],
    ['invalid syntax', /missing quote, bracket, comma or colon/],
    ['something new', /^Python says: something new\.$/],
  ];
  it.each(syntax)('syntax error: %s', (message, pattern) => {
    expect(reasonText(error({ type: 'SyntaxError', message, syntax: true }))).toMatch(pattern);
  });
});

describe('describeError', () => {
  it('a runtime stop names the line and the code, then the cause', () => {
    expect(
      describeError(
        error({ type: 'NameError', message: "name 'totl' is not defined", source: 'print(totl)' }),
      ),
    ).toBe(
      'Your code stopped on line 4 of main.py, which reads print(totl). Python does not know the name "totl". Check the spelling, or give it a value before this line.',
    );
  });

  it('a syntax error says Python cannot read the code and how to go on', () => {
    expect(
      describeError(
        error({
          type: 'SyntaxError',
          message: "expected ':'",
          syntax: true,
          line: 2,
          source: 'def f()',
        }),
      ),
    ).toBe(
      'Python cannot read your code on line 2 of main.py, which reads def f(). A colon (:) is missing at the end of the line. Fix it, then run again.',
    );
  });

  it('an error with no learner file still reads as a sentence', () => {
    expect(describeError(error({ type: 'ZeroDivisionError', file: null, line: null }))).toBe(
      'Your code stopped. Python cannot divide by zero. Check the number you divide by.',
    );
  });

  it("a stop while a test ran says the check was running, not the learner's code alone", () => {
    expect(describeError(error({ type: 'ZeroDivisionError', line: 7 }), 'test')).toBe(
      'Python stopped while checking your code on line 7 of main.py. Python cannot divide by zero. Check the number you divide by.',
    );
  });

  it('a missing main.py is its own message', () => {
    expect(describeError(error({ type: 'NoEntry', message: 'There is no main.py to run.' }))).toBe(
      'There is no main.py to run.',
    );
  });
});

describe('failureMessage', () => {
  it('a failed assert shows the hint as written', () => {
    expect(failureMessage('Define <code>f</code>.', null)).toBe('Define <code>f</code>.');
  });

  it('any other error keeps the hint and adds what Python said, with the text escaped', () => {
    const message = failureMessage(
      'Return 24.',
      error({ type: 'KeyError', message: "'<b>'", file: null, line: null }),
    );
    expect(message.startsWith('Return 24. <span class="py-reason">')).toBe(true);
    expect(message).toContain('Python stopped while checking your code.');
    expect(message).toContain('&lt;b&gt;');
    expect(message).not.toContain('<b>');
  });

  it('escapes the characters HTML cares about', () => {
    expect(escapeHtml('a < b & "c" > d')).toBe('a &lt; b &amp; &quot;c&quot; &gt; d');
  });
});

describe('statusText', () => {
  it('before the first download it says the size once', () => {
    expect(statusText({ phase: 'idle', firstTime: true })).toBe(
      'Python needs about 6 MB, once. It downloads the first time your code runs.',
    );
  });

  it('after Python has loaded on this device the note is gone', () => {
    expect(statusText({ phase: 'idle', firstTime: false })).toBeNull();
    expect(statusText({ phase: 'ready', firstTime: false })).toBeNull();
    expect(statusText({ phase: 'running', firstTime: false })).toBeNull();
  });

  it('shows progress in words while it loads', () => {
    expect(statusText({ phase: 'downloading', firstTime: true })).toMatch(
      /^Downloading Python, about 6 MB, once\./,
    );
    expect(statusText({ phase: 'starting', firstTime: true })).toBe(
      'Starting Python. Nearly there.',
    );
    expect(statusText({ phase: 'restarting', firstTime: false })).toMatch(/^Restarting Python/);
  });

  it('the load failure message tells the learner what to check', () => {
    expect(BOOT_FAILED_TEXT).toMatch(/internet connection/);
  });
});
