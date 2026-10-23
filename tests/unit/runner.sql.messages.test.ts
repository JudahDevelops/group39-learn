/** The sentences the sql runner shows (src/runners/sql/messages.ts, view.ts) and the status store. */
import { describe, expect, it } from 'vitest';
import { LOADED_FLAG_KEY } from '../../src/runners/sql/config';
import {
  describeSetupError,
  describeSqlError,
  failureMessage,
  lineAt,
  statusText,
  timeoutText,
} from '../../src/runners/sql/messages';
import { createStatusStore } from '../../src/runners/sql/status';
import { countText, rowsText, viewOf } from '../../src/runners/sql/view';

describe('sql messages: errors', () => {
  it('lineAt turns a 1-based character position into a line', () => {
    const code = 'select 1;\n\nselect nope';
    expect(lineAt(code, 1)).toBe(1);
    expect(lineAt(code, 10)).toBe(1);
    expect(lineAt(code, 11)).toBe(2);
    expect(lineAt(code, 19)).toBe(3);
  });

  it("keeps PostgreSQL's own message and names the line", () => {
    const text = describeSqlError(
      { message: 'column "nope" does not exist', position: 19 },
      'query.sql',
      'select 1;\n\nselect nope',
    );
    expect(text).toBe('column "nope" does not exist. Line 3 of query.sql.');
  });

  it('adds the detail and the hint when PostgreSQL gives them', () => {
    const text = describeSqlError(
      {
        message: 'duplicate key value violates unique constraint "rooms_pkey"',
        detail: 'Key (id)=(1) already exists.',
        hint: 'Use a different id',
        position: 1,
      },
      'query.sql',
      'insert into rooms values (1)',
    );
    expect(text).toBe(
      'duplicate key value violates unique constraint "rooms_pkey". Line 1 of query.sql. Detail: Key (id)=(1) already exists. Hint: Use a different id.',
    );
  });

  it('leaves out the line when PostgreSQL gave no position', () => {
    expect(describeSqlError({ message: 'division by zero' }, 'query.sql', 'select 1/0')).toBe(
      'division by zero.',
    );
  });

  it('says when it was setup.sql that failed', () => {
    const text = describeSetupError(
      { message: 'syntax error at end of input', position: 22 },
      'create table broken (',
      'setup.sql',
    );
    expect(text).toBe(
      'The set-up for this exercise failed. syntax error at end of input. Line 1 of setup.sql.',
    );
  });

  it('the stop message names the limit and the usual cause', () => {
    expect(timeoutText(5000)).toBe(
      'Your query ran for more than 5 seconds, so it was stopped. Check for a join with no condition: it pairs every row with every other row.',
    );
    expect(timeoutText(1000)).toContain('more than 1 second,');
  });
});

describe('sql messages: failed tests', () => {
  it("keeps the test's hint when no query failed", () => {
    expect(failureMessage('Return <code>3</code> rows.', null)).toBe('Return <code>3</code> rows.');
  });

  it("adds PostgreSQL's words, escaped, when a query in the test failed", () => {
    const message = failureMessage('Create the table.', 'relation "<rooms>" does not exist');
    expect(message.startsWith('Create the table. <span class="sql-reason">')).toBe(true);
    expect(message).toContain(
      'PostgreSQL said: relation &quot;&lt;rooms&gt;&quot; does not exist.',
    );
  });
});

describe('sql messages: the note about PostgreSQL', () => {
  const firstTime = (phase: Parameters<typeof statusText>[0]['phase']) =>
    statusText({ phase, firstTime: true });

  it('says the size before the first download, and nothing after it', () => {
    expect(firstTime('idle')).toBe(
      'PostgreSQL needs about 5.3 MB, once. It downloads the first time your query runs.',
    );
    expect(statusText({ phase: 'idle', firstTime: false })).toBeNull();
  });

  it('says what it is doing while it loads or restarts, and nothing while ready or running', () => {
    expect(firstTime('downloading')).toContain('Downloading PostgreSQL, about 5.3 MB, once.');
    expect(firstTime('starting')).toBe('Starting PostgreSQL. Nearly there.');
    expect(firstTime('restarting')).toContain('Restarting PostgreSQL');
    expect(firstTime('ready')).toBeNull();
    expect(firstTime('running')).toBeNull();
  });

  it('the status store remembers the first download in storage', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    };
    const store = createStatusStore(storage);
    expect(store.get()).toEqual({ phase: 'idle', firstTime: true });
    store.markLoaded();
    expect(store.get().firstTime).toBe(false);
    expect(data.get(LOADED_FLAG_KEY)).toBe('1');
    expect(createStatusStore(storage).get().firstTime).toBe(false);
  });

  it('the status store copes with storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const store = createStatusStore(broken);
    expect(store.get().firstTime).toBe(true);
    expect(() => store.markLoaded()).not.toThrow();
    expect(store.get().firstTime).toBe(false);
  });
});

describe('sql view', () => {
  const table = {
    columns: ['n'],
    rows: [['1'], ['2']],
    rowCount: 2,
    numeric: [true],
  };

  it('counts rows in words', () => {
    expect(rowsText(0)).toBe('0 rows');
    expect(rowsText(1)).toBe('1 row');
    expect(rowsText(1250)).toBe('1,250 rows');
    expect(countText(table)).toBe('2 rows');
    expect(countText({ ...table, rowCount: 1200 })).toBe('1,200 rows. Showing the first 2.');
  });

  it('viewOf reads the sql part of a run, and the error', () => {
    const base = { results: [], firstFailure: null, logs: [] };
    expect(viewOf({ ...base, sql: { table, empty: false } })).toEqual({
      table,
      empty: false,
      error: null,
    });
    expect(viewOf({ ...base, error: 'boom' })).toEqual({
      table: null,
      empty: false,
      error: 'boom',
    });
    expect(viewOf({ ...base, sql: { table: null, empty: true } }).empty).toBe(true);
  });
});
