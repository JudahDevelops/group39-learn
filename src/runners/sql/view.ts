import type { ResultTable, RunOutput } from '../types';

/** What the Results panel shows after a run. */
export interface ResultsView {
  /** The last statement that returned rows, or null when none did. */
  table: ResultTable | null;
  /** True when the code held no statement to run. */
  empty: boolean;
  /** The plain-text reason the code could not run, or null. */
  error: string | null;
}

export function viewOf(output: RunOutput): ResultsView {
  return {
    table: output.sql?.table ?? null,
    empty: output.sql?.empty ?? false,
    error: output.error ?? null,
  };
}

/** "1 row", "3 rows", "1,250 rows". */
export function rowsText(count: number): string {
  return `${count.toLocaleString('en')} ${count === 1 ? 'row' : 'rows'}`;
}

/** The count under the table: how many rows came back, and how many of them are shown. */
export function countText(table: ResultTable): string {
  if (table.rowCount > table.rows.length) {
    return `${rowsText(table.rowCount)}. Showing the first ${table.rows.length.toLocaleString('en')}.`;
  }
  return rowsText(table.rowCount);
}
