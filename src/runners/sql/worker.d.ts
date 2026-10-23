/** Types for the parts of worker.js that tests import. The worker itself is plain JavaScript. */

export interface SqlErrorInfo {
  message: string;
  code?: string;
  detail?: string;
  hint?: string;
  constraint?: string;
  table?: string;
  column?: string;
  schema?: string;
  /** 1-based character position in the SQL text that was sent. */
  position?: number;
}

export type RunReply =
  | {
      ok: true;
      empty: boolean;
      table: {
        columns: string[];
        rows: (string | null)[][];
        rowCount: number;
        numeric: boolean[];
      } | null;
    }
  | { ok: false; phase: 'setup' | 'code'; error: SqlErrorInfo };

export interface QueryField {
  name: string;
  dataTypeID: number;
}

export interface Engine {
  open(): Promise<void>;
  run(input: { setup: string | null; code: string; maxRows: number }): Promise<RunReply>;
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[]; fields: QueryField[] }>;
}

/** `PGlite` is the class from `@electric-sql/pglite`. */
export function createEngine(PGlite: { create(): Promise<unknown> }): Engine;
export function errorInfo(error: unknown): SqlErrorInfo;
export function isBlank(sql: string): boolean;
