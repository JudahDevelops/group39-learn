import { useMemo } from 'react';
import {
  buildComments,
  buildProgressGrid,
  buildProjects,
  buildQuizScores,
  buildRatings,
  findStuck,
} from './aggregate';
import { FeedbackSection } from './FeedbackSection';
import { ProgressSection } from './ProgressSection';
import { ProjectsSection } from './ProjectsSection';
import { QuizSection } from './QuizSection';
import { StuckSection } from './StuckSection';
import { useAdminData, type AdminState } from './useAdminData';

function Dashboard({ state }: { state: Extract<AdminState, { status: 'ready' }> }) {
  const { curriculum, data, now } = state;
  const grid = useMemo(() => buildProgressGrid(curriculum, data, now), [curriculum, data, now]);
  const stuck = useMemo(() => findStuck(curriculum, data), [curriculum, data]);
  const quizzes = useMemo(() => buildQuizScores(curriculum, data), [curriculum, data]);
  const ratings = useMemo(() => buildRatings(curriculum, data), [curriculum, data]);
  const comments = useMemo(() => buildComments(curriculum, data), [curriculum, data]);
  const projects = useMemo(() => buildProjects(curriculum, data), [curriculum, data]);
  return (
    <>
      <ProgressSection grid={grid} />
      <StuckSection entries={stuck} now={now} />
      <QuizSection scores={quizzes} />
      <FeedbackSection ratings={ratings} comments={comments} />
      <ProjectsSection rows={projects} />
    </>
  );
}

/** The admin's view of the whole group: progress, who is stuck, quiz scores, feedback, projects. */
export function AdminDashboard() {
  const state = useAdminData();
  return (
    <div className="page page-admin">
      <h1>Admin</h1>
      {state.status === 'loading' && <p aria-busy="true">Loading the dashboard.</p>}
      {state.status === 'error' && (
        <p role="alert" className="form-error">
          The dashboard could not be loaded. Check your connection, then reload the page.
        </p>
      )}
      {state.status === 'ready' && <Dashboard state={state} />}
    </div>
  );
}
