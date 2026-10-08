import { useParams } from 'react-router-dom';

export function Reference() {
  const { page } = useParams<{ page: string }>();
  return (
    <div className="page">
      <h1>Reference</h1>
      <p>
        Page: <code>{page}</code>
      </p>
      <div className="placeholder-panel">
        Glossary, group decisions, do's and don'ts, database schema — built from the Appendices.
      </div>
    </div>
  );
}
