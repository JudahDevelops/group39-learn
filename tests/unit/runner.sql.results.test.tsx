/** The Results panel (src/runners/sql/Results.tsx): the table, the count, the notes and the error. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SqlResults } from '../../src/runners/sql/Results';
import type { ResultsView } from '../../src/runners/sql/view';

const rooms: ResultsView = {
  table: {
    columns: ['room_number', 'beds', 'note'],
    rows: [
      ['A-101', '4', null],
      ['B-214', '6', 'Near the stairs'],
    ],
    rowCount: 2,
    numeric: [false, true, false],
  },
  empty: false,
  error: null,
};

afterEach(cleanup);

describe('SqlResults', () => {
  it('shows an accessible table: caption, column headers with scope, one row per row', () => {
    render(<SqlResults view={rooms} running={false} />);
    const table = screen.getByRole('table', { name: 'Rows returned by your query' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual(['room_number', 'beds', 'note']);
    for (const h of headers) expect(h).toHaveAttribute('scope', 'col');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2
    expect(
      within(rows[2]!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['B-214', '6', 'Near the stairs']);
  });

  it('says how many rows came back, and the table is described by that count', () => {
    render(<SqlResults view={rooms} running={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 rows');
    expect(screen.getByRole('table')).toHaveAccessibleDescription('2 rows');
  });

  it('says when only the first rows are shown', () => {
    const view: ResultsView = {
      ...rooms,
      table: { ...rooms.table!, rowCount: 1200 },
    };
    render(<SqlResults view={view} running={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('1,200 rows. Showing the first 2.');
  });

  it('shows NULL as NULL and lines numbers up on the right', () => {
    render(<SqlResults view={rooms} running={false} />);
    expect(screen.getByText('NULL')).toHaveClass('sql-null');
    expect(screen.getByRole('columnheader', { name: 'beds' })).toHaveClass('sql-num');
    expect(screen.getByRole('cell', { name: '6' })).toHaveClass('sql-num');
    expect(screen.getByRole('cell', { name: 'A-101' })).not.toHaveClass('sql-num');
  });

  it('a select that matched nothing keeps its columns and says 0 rows', () => {
    const view: ResultsView = {
      table: { columns: ['id'], rows: [], rowCount: 0, numeric: [true] },
      empty: false,
      error: null,
    };
    render(<SqlResults view={view} running={false} />);
    expect(screen.getByRole('columnheader', { name: 'id' })).toBeInTheDocument();
    expect(screen.getByText('No rows match.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 rows');
  });

  it('a result that scrolls is a focusable region', () => {
    render(<SqlResults view={rooms} running={false} />);
    expect(screen.getByRole('region', { name: 'Query results' })).toHaveAttribute('tabindex', '0');
  });

  it('a statement with no rows says "Query ran. No rows to show." and has no table', () => {
    render(<SqlResults view={{ table: null, empty: false, error: null }} running={false} />);
    expect(screen.getByText('Query ran. No rows to show.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('empty code asks for a query', () => {
    render(<SqlResults view={{ table: null, empty: true, error: null }} running={false} />);
    expect(screen.getByText(/Nothing to run yet/)).toBeInTheDocument();
  });

  it('shows the error as PostgreSQL gave it, and no table', () => {
    render(
      <SqlResults
        view={{
          table: null,
          empty: false,
          error: 'relation "x" does not exist. Line 1 of query.sql.',
        }}
        running={false}
      />,
    );
    expect(screen.getByText(/relation "x" does not exist/)).toHaveClass('sql-error');
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByText('Query ran. No rows to show.')).toBeNull();
  });

  it('before the first run, invites a run; while running, says so', () => {
    const { rerender } = render(<SqlResults view={null} running={false} />);
    expect(
      screen.getByText('No results yet. Press Run to see what your query returns.'),
    ).toBeInTheDocument();
    rerender(<SqlResults view={null} running />);
    expect(screen.getByText('Running your query.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Query results' }).parentElement).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
