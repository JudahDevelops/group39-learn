import { useId } from 'react';
import './sql.css';
import { countText, type ResultsView } from './view';

interface SqlResultsProps {
  /** Null until the code has run once. */
  view: ResultsView | null;
  running: boolean;
  /** Said before the first run. */
  emptyText?: string;
  className?: string;
}

/**
 * The Results panel: the rows of the last statement that returned rows, as a table with a row
 * count under it, or a short note, or the error PostgreSQL gave. It sits on the dark bench surface
 * in the workshop pane and in Try it boxes (docs/design.md). The table scrolls inside the panel.
 */
export function SqlResults({
  view,
  running,
  emptyText = 'No results yet. Press Run to see what your query returns.',
  className,
}: SqlResultsProps) {
  const countId = useId();
  const table = view?.table ?? null;
  const error = view?.error ?? null;

  let note: string | null = null;
  if (running && !table && !error) note = 'Running your query.';
  else if (!view) note = emptyText;
  else if (!table && !error) {
    note = view.empty
      ? 'Nothing to run yet. Write a query in query.sql, then press Run.'
      : 'Query ran. No rows to show.';
  }

  return (
    <div className={className ? `sql-results ${className}` : 'sql-results'} aria-busy={running}>
      <div className="sql-scroll" role="region" aria-label="Query results" tabIndex={0}>
        {table && (
          <table className="sql-table" aria-describedby={countId}>
            <caption className="sql-sr-only">Rows returned by your query</caption>
            <thead>
              <tr>
                {table.columns.map((name, c) => (
                  <th key={c} scope="col" className={table.numeric[c] ? 'sql-num' : undefined}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className={table.numeric[c] ? 'sql-num' : undefined}>
                      {cell === null ? <span className="sql-null">NULL</span> : cell}
                    </td>
                  ))}
                </tr>
              ))}
              {table.rows.length === 0 && (
                <tr>
                  <td colSpan={Math.max(1, table.columns.length)} className="sql-none">
                    No rows match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {error && (
          <p className="sql-error">
            <span className="sql-sr-only">Error. </span>
            {error}
          </p>
        )}
        {note && <p className="sql-empty">{note}</p>}
      </div>
      {table && (
        <p id={countId} className="sql-count" role="status">
          {countText(table)}
        </p>
      )}
    </div>
  );
}
