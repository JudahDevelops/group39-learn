import { CheckIcon, CrossIcon } from '../../screens/Icons';
import { formatLagosDateTime, repoLabel, safeWebUrl, type ProjectRow } from './aggregate';
import { Caption, ScrollTable } from './ScrollTable';

function Status({ status }: { status: ProjectRow['status'] }) {
  if (status === 'passed') {
    return (
      <span className="admin-status is-pass">
        <CheckIcon size={16} /> Passed
      </span>
    );
  }
  if (status === 'failing') {
    return (
      <span className="admin-status is-fail">
        <CrossIcon size={16} /> Failing
      </span>
    );
  }
  return <span className="admin-muted">Not submitted</span>;
}

function Repo({ url }: { url: string | null }) {
  if (url === null) return <span className="admin-muted">None</span>;
  const href = safeWebUrl(url);
  // A member typed this address. Only a web address becomes a link.
  if (href === null) return <span className="admin-repo-text">{url}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="admin-link">
      {repoLabel(url)}
    </a>
  );
}

/** Each member's repo and check result for each project. */
export function ProjectsSection({ rows }: { rows: ProjectRow[] }) {
  return (
    <section className="admin-section">
      <h2 id="admin-projects">Projects</h2>
      {rows.length === 0 ? (
        <p className="empty-state">No projects in the course yet.</p>
      ) : (
        <ScrollTable labelledBy="admin-projects">
          <Caption>Repo check for each member and project, from the latest check.</Caption>
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Project</th>
              <th scope="col">Status</th>
              <th scope="col">Repo</th>
              <th scope="col">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.userId}:${row.projectId}`}>
                <th scope="row">{row.name}</th>
                <td>
                  <span className="admin-title">{row.title}</span>
                  <span className="admin-sub">{row.roomCode}</span>
                </td>
                <td>
                  <Status status={row.status} />
                </td>
                <td>
                  <Repo url={row.repoUrl} />
                </td>
                <td>
                  {row.checkedAt ? (
                    <time dateTime={row.checkedAt}>{formatLagosDateTime(row.checkedAt)}</time>
                  ) : (
                    <span className="admin-muted">Not checked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )}
    </section>
  );
}
