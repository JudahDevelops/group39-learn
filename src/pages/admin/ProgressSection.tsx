import { formatLagosDateTime, type ProgressGrid } from './aggregate';
import { Caption, ScrollTable } from './ScrollTable';

/** Members down the side, modules across the top, and the share of each module they have finished. */
export function ProgressSection({ grid }: { grid: ProgressGrid }) {
  return (
    <section className="admin-section">
      <h2 id="admin-progress">Progress</h2>
      {grid.rows.length === 0 ? (
        <p className="empty-state">No members yet.</p>
      ) : (
        <ScrollTable labelledBy="admin-progress" className="admin-grid">
          <Caption>
            Share of each module&rsquo;s blocks finished. A workshop counts once every step is done.
            Optional blocks are not counted.
          </Caption>
          <thead>
            <tr>
              <th scope="col" className="admin-sticky">
                Member
              </th>
              <th scope="col">Last active</th>
              {grid.modules.map((m) => (
                <th scope="col" key={m.id} className="admin-module">
                  <span className="admin-module-code">{m.id}</span>
                  <span className="admin-module-title">{m.title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.userId}>
                <th scope="row" className="admin-sticky">
                  {row.name}
                </th>
                <td>
                  {row.lastActive ? (
                    <time dateTime={row.lastActive} title={formatLagosDateTime(row.lastActive)}>
                      {row.lastActiveLabel}
                    </time>
                  ) : (
                    <span className="admin-muted">{row.lastActiveLabel}</span>
                  )}
                </td>
                {row.cells.map((cell) => (
                  <td
                    key={cell.moduleId}
                    data-module={cell.moduleId}
                    title={`${cell.done} of ${cell.total} blocks`}
                    className={
                      cell.percent === 100
                        ? 'admin-pct-cell is-complete'
                        : cell.percent === 0
                          ? 'admin-pct-cell is-empty'
                          : 'admin-pct-cell'
                    }
                  >
                    <span className="admin-pct">{cell.percent}%</span>
                    <span className="admin-bar" aria-hidden="true">
                      <span style={{ width: `${cell.percent}%` }} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )}
    </section>
  );
}
