import { useEffect, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { Html } from '../components/Html';
import type { ReferenceIndex, ReferencePage } from '../content/reference';
import { fetchReferenceIndex, fetchReferencePage } from '../content/loader';
import '../styles/reference.css';
import '../styles/review.css';

type PageState =
  { status: 'loading' } | { status: 'missing' } | { status: 'ready'; page: ReferencePage };

/** /reference lists the pages; /reference/:page shows one. */
export function Reference() {
  const { page: slug } = useParams<{ page: string }>();
  const [index, setIndex] = useState<ReferenceIndex | null>(null);
  const [indexFailed, setIndexFailed] = useState(false);
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchReferenceIndex().then(
      (list) => {
        if (!cancelled) setIndex(list);
      },
      () => {
        if (!cancelled) setIndexFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setState({ status: 'loading' });
    fetchReferencePage(slug).then(
      (page) => {
        if (!cancelled) setState({ status: 'ready', page });
      },
      () => {
        if (!cancelled) setState({ status: 'missing' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="page page-reference">
      <h1>Reference</h1>
      {indexFailed && (
        <p role="alert" className="form-error">
          The reference pages could not be loaded. Check your connection, then reload the page.
        </p>
      )}

      {!slug && index && (
        <ul className="ref-list">
          {index.pages.map((p) => (
            <li key={p.slug}>
              <Link to={`/reference/${p.slug}`}>{p.title}</Link>
            </li>
          ))}
        </ul>
      )}

      {slug && index && (
        <nav className="ref-nav" aria-label="Reference pages">
          <ul>
            {index.pages.map((p) => (
              <li key={p.slug}>
                <NavLink to={`/reference/${p.slug}`}>{p.title}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {slug && state.status === 'ready' && (
        <article className="ref-article">
          <h2>{state.page.title}</h2>
          <Html html={state.page.html} className="ref-body prose" />
        </article>
      )}
      {slug && state.status === 'missing' && !indexFailed && (
        <p>There is no reference page called “{slug}”. Pick one from the list above.</p>
      )}
    </div>
  );
}
