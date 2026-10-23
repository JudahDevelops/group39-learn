import { CheckIcon, CrossIcon } from '../../screens/Icons';
import type { QuizScore } from './aggregate';
import { Caption, ScrollTable } from './ScrollTable';

/** Each member's best score on each quiz or exam they have tried. */
export function QuizSection({ scores }: { scores: QuizScore[] }) {
  return (
    <section className="admin-section">
      <h2 id="admin-quizzes">Quiz scores</h2>
      {scores.length === 0 ? (
        <p className="empty-state">No quiz attempts yet.</p>
      ) : (
        <ScrollTable labelledBy="admin-quizzes">
          <Caption>
            Best score for each member on each quiz or exam they have tried. Passed means at least
            one attempt reached the pass mark.
          </Caption>
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Quiz</th>
              <th scope="col">Best score</th>
              <th scope="col">Attempts</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => (
              <tr key={`${s.userId}:${s.quizId}`}>
                <th scope="row">{s.name}</th>
                <td>
                  <span className="admin-title">{s.title}</span>
                  <span className="admin-sub">{s.roomCode}</span>
                </td>
                <td>
                  {s.bestScore} of {s.bestTotal}
                </td>
                <td>{s.attempts}</td>
                <td>
                  {s.passed ? (
                    <span className="admin-status is-pass">
                      <CheckIcon size={16} /> Passed
                    </span>
                  ) : (
                    <span className="admin-status is-fail">
                      <CrossIcon size={16} /> Not passed
                    </span>
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
