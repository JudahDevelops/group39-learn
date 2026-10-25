import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { CheckIcon, CrossIcon, InfoIcon } from '../../screens/Icons';
import type { HttpOutcome, HttpRequest } from '../types';
import './fastapi.css';
import { METHODS } from './config';
import { requestHistory, useHistory, type HistoryEntry, type HistoryStore } from './history';
import { STOPPED_TEXT, bodyProblem, normalizePath } from './messages';
import { routesText, shownBody, statusKind, type AppView, type StatusKind } from './view';

/** Sends through the real runner. Imported on first use, so the panel costs nothing until then. */
async function sendWithRunner(request: HttpRequest): Promise<HttpOutcome> {
  const { fastapiRunner } = await import('./runner');
  return fastapiRunner.send(request);
}

interface RequestsPanelProps {
  /** What the last Run or Check found. Null until the code has run once. */
  view: AppView | null;
  running: boolean;
  /** Replaced in tests. */
  send?: (request: HttpRequest) => Promise<HttpOutcome>;
  history?: HistoryStore;
  className?: string;
}

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function StatusIcon({ kind }: { kind: StatusKind }) {
  if (kind === 'ok') return <CheckIcon size={16} />;
  if (kind === 'error') return <CrossIcon size={16} />;
  return <InfoIcon />;
}

const KIND_WORDS: Record<StatusKind, string> = {
  ok: 'Worked. Status ',
  redirect: 'Redirect. Status ',
  error: 'Error. Status ',
};

/** The status code on a plate: a number with an icon, so colour never carries it alone. */
function Plate({ status, small }: { status: number; small?: boolean }) {
  const kind = statusKind(status);
  return (
    <span className={`fa-plate fa-plate-${kind}${small ? ' fa-plate-small' : ''}`}>
      <StatusIcon kind={kind} />
      <span className="fa-sr-only">{KIND_WORDS[kind]}</span>
      <span className="fa-code">{status}</span>
    </span>
  );
}

function Printed({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="fa-printed">
      <p className="fa-small">Printed by your app</p>
      <pre className="fa-pre" tabIndex={0}>
        {lines.join('\n')}
      </pre>
    </div>
  );
}

/**
 * The Requests panel, a small Swagger: pick a method, type a path, add a JSON body, press Send, and
 * read the status code and the reply. It talks to the app the last Run (or Check) loaded. It sits
 * on the dark bench surface in the workshop pane and in Try it boxes (docs/design.md).
 */
export function RequestsPanel({
  view,
  running,
  send = sendWithRunner,
  history: historyStore = requestHistory,
  className,
}: RequestsPanelProps) {
  const ids = useId();
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState('/');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<HttpOutcome | null>(null);
  const [gone, setGone] = useState(false);
  const history = useHistory(historyStore);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A new Run starts a new app: the last reply belongs to the old one.
  useEffect(() => {
    setGone(false);
    setOutcome(null);
  }, [view]);

  const started = view?.state === 'started' && !gone;
  const showBody = BODY_METHODS.has(method);
  const problem = showBody ? bodyProblem(body) : null;
  const canSend = started && !sending && !running && problem === null;

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    const request: HttpRequest = {
      method,
      path: normalizePath(path),
      body: showBody ? body : '',
    };
    setPath(request.path);
    setSending(true);
    let result: HttpOutcome;
    try {
      result = await send(request);
    } catch (error) {
      result = {
        kind: 'notice',
        text: error instanceof Error ? error.message : 'The request could not be sent.',
        appGone: false,
      };
    }
    if (!mounted.current) return;
    historyStore.add({
      method: request.method,
      path: request.path,
      body: request.body,
      status: result.kind === 'reply' ? result.status : null,
    });
    if (result.kind === 'notice' && result.appGone) setGone(true);
    setOutcome(result);
    setSending(false);
  }

  function onKeyDown(event: KeyboardEvent) {
    // Ctrl+Enter sends from the body box. The page's own Ctrl+Enter (check the code) leaves it alone.
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submit();
    }
  }

  function use(entry: Pick<HistoryEntry, 'method' | 'path' | 'body'>) {
    setMethod(entry.method);
    setPath(entry.path);
    setBody(entry.body);
  }

  let band: ReactNode;
  if (running && !view) {
    band = <p className="fa-band">Starting your app.</p>;
  } else if (!view) {
    band = (
      <p className="fa-band">
        Your app has not started. Press Run to start it, then send it a request here.
      </p>
    );
  } else if (view.state === 'error') {
    band = (
      <p className="fa-error">
        <span className="fa-sr-only">Error. </span>
        {view.error}
      </p>
    );
  } else if (gone) {
    band = <p className="fa-band fa-band-stop">{STOPPED_TEXT}</p>;
  } else {
    band = (
      <p className="fa-band fa-band-ok">
        <CheckIcon size={16} /> Your app started with {routesText(view.routes.length)}.
      </p>
    );
  }

  const routes = started && view ? view.routes : [];

  return (
    <div
      className={className ? `fa-panel ${className}` : 'fa-panel'}
      aria-busy={running || sending}
      data-testid="requests-panel"
    >
      <div role="status" aria-live="polite">
        {band}
      </div>
      {view?.state === 'started' && <Printed lines={view.logs} />}

      {routes.length > 0 && (
        <ul className="fa-routes" aria-label="Routes in your app">
          {routes.map((route) => (
            <li key={`${route.method} ${route.path}`}>
              <button
                type="button"
                className="fa-route"
                onClick={() => use({ method: route.method, path: route.path, body: '' })}
              >
                <span className="fa-route-method">{route.method}</span>{' '}
                <span className="fa-route-path">{route.path}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="fa-form" onSubmit={(e) => void submit(e)} onKeyDown={onKeyDown}>
        <div className="fa-line">
          <select
            className="fa-method"
            aria-label="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className="fa-path"
            type="text"
            aria-label="Path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-secondary fa-send" disabled={!canSend}>
            Send
          </button>
        </div>
        {showBody && (
          <div className="fa-field">
            <label htmlFor={`${ids}-body`} className="fa-small">
              Body (JSON, optional)
            </label>
            <textarea
              id={`${ids}-body`}
              className="fa-body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-invalid={problem !== null}
              aria-describedby={problem ? `${ids}-problem` : undefined}
            />
            {problem && (
              <p id={`${ids}-problem`} className="fa-problem">
                {problem}
              </p>
            )}
          </div>
        )}
      </form>

      <section className="fa-reply" aria-label="Reply" aria-live="polite" aria-busy={sending}>
        <Reply outcome={outcome} sending={sending} />
      </section>

      {history.length > 0 && (
        <section className="fa-history" aria-label="History">
          <h3 className="fa-heading">History</h3>
          <ul className="fa-history-list">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="fa-history-item"
                  onClick={() => use(entry)}
                  aria-label={`${entry.method} ${entry.path}, ${entry.status ?? 'no reply'}. Use again.`}
                >
                  <span className="fa-route-method">{entry.method}</span>{' '}
                  <span className="fa-route-path">{entry.path}</span>
                  {entry.status !== null ? <Plate status={entry.status} small /> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Reply({ outcome, sending }: { outcome: HttpOutcome | null; sending: boolean }) {
  if (sending && !outcome) return <p className="fa-quiet">Sending.</p>;
  if (!outcome) {
    return (
      <p className="fa-quiet">
        The reply appears here. Choose a method and a path, then press Send.
      </p>
    );
  }
  if (outcome.kind === 'notice') {
    return (
      <p className="fa-error">
        <span className="fa-sr-only">Not sent. </span>
        {outcome.text}
      </p>
    );
  }
  const shown = shownBody(outcome);
  return (
    <div className="fa-answer">
      <div className="fa-status">
        <Plate status={outcome.status} />
        {outcome.reason && <span className="fa-status-text">{outcome.reason}</span>}
        <span className="fa-ms">{outcome.ms} ms</span>
      </div>
      {outcome.error && (
        <p className="fa-error">
          <span className="fa-sr-only">Error. </span>
          {outcome.error}
        </p>
      )}
      {outcome.location && <p className="fa-small">Location: {outcome.location}</p>}
      {shown.text !== '' ? (
        <>
          <pre className="fa-pre fa-reply-body" tabIndex={0} aria-label="Reply body">
            {shown.text}
          </pre>
          {shown.cut && (
            <p className="fa-small">The reply is longer than this. Only the start is shown.</p>
          )}
        </>
      ) : (
        <p className="fa-quiet">The reply has no body.</p>
      )}
      <Printed lines={outcome.logs} />
    </div>
  );
}
