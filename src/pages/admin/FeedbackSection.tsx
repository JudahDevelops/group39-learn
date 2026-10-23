import {
  formatLagosDate,
  ratingLabel,
  RATINGS,
  type BlockRatings,
  type FeedbackComment,
} from './aggregate';
import { Caption, ScrollTable } from './ScrollTable';

/** How members rated each lesson, and what they wrote. */
export function FeedbackSection({
  ratings,
  comments,
}: {
  ratings: BlockRatings[];
  comments: FeedbackComment[];
}) {
  return (
    <section className="admin-section">
      <h2 id="admin-feedback">Lesson feedback</h2>
      {ratings.length === 0 ? (
        <p className="empty-state">No lesson feedback yet.</p>
      ) : (
        <>
          <ScrollTable labelledBy="admin-feedback">
            <Caption>Number of times each rating was chosen at the end of a lesson.</Caption>
            <thead>
              <tr>
                <th scope="col">Lesson</th>
                {RATINGS.map((r) => (
                  <th scope="col" key={r.value}>
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ratings.map((row) => (
                <tr key={row.blockId}>
                  <th scope="row">
                    <span className="admin-title">{row.title}</span>
                    <span className="admin-sub">{row.roomCode}</span>
                  </th>
                  {RATINGS.map((r) => (
                    <td key={r.value} className={row.counts[r.value] === 0 ? 'admin-muted' : ''}>
                      {row.counts[r.value]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </ScrollTable>
          <h3 id="admin-comments">Comments</h3>
          {comments.length === 0 ? (
            <p className="empty-state">No comments yet.</p>
          ) : (
            <ul className="admin-comments" aria-labelledby="admin-comments">
              {comments.map((c, i) => (
                <li key={`${c.userId}:${c.blockId}:${c.createdAt}:${i}`} className="admin-comment">
                  <p className="admin-comment-text">{c.comment}</p>
                  <p className="admin-comment-meta">
                    <span className="admin-comment-name">{c.name}</span>,{' '}
                    <time dateTime={c.createdAt}>{formatLagosDate(c.createdAt)}</time>
                  </p>
                  <p className="admin-comment-meta">
                    {c.title}, rated {ratingLabel(c.rating).toLowerCase()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
