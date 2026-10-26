import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Html } from '../../components/Html';
import { checkRepo, parseRepoUrl, type CheckOutcome } from '../../lib/github';
import { completeItem } from '../../lib/progress';
import { CheckIcon, CrossIcon } from '../../screens/Icons';
import { useCurrentUser, useStore } from '../../store/StoreContext';
import type { ProgressEntry, ProjectSubmission } from '../../store/types';
import '../../styles/project.css';
import type { PlayerProps } from '../types';
import { checkedWhen } from './format';
import { describeOutcome, labelJob, URL_MESSAGES, type JobLabel } from './messages';
import { githubLink, outcomeFromSubmission, toRecord } from './saved';

/** A result on the page: one check, fresh or read back from the saved submission. */
interface Shown {
  /** Null when a saved row cannot be read back; then only `passed` is known. */
  outcome: CheckOutcome | null;
  passed: boolean;
  repoUrl: string;
  checkedAt: string;
  /** XP this check paid. Only the first pass pays. */
  earned: number;
}

/** The current time, refreshed every half minute so "Checked 2 minutes ago" stays true while the page is open. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function repoName(url: string): string {
  return url.replace(/^https:\/\/github\.com\//, '');
}

function PendingIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 10h8" />
    </svg>
  );
}

function JobIcon({ tone }: { tone: JobLabel['tone'] }) {
  if (tone === 'pass') return <CheckIcon />;
  if (tone === 'fail') return <CrossIcon />;
  return <PendingIcon />;
}

/** This project's job first, then the other jobs of the run in GitHub's order. */
function JobList({
  outcome,
  ciJob,
}: {
  outcome: Extract<CheckOutcome, { kind: 'passed' | 'failed' | 'job-missing' }>;
  ciJob: string;
}) {
  const own = outcome.kind === 'job-missing' ? null : outcome.job;
  const rows = [
    { name: ciJob, job: own, mine: true },
    ...outcome.jobs
      .filter((j) => j.name !== ciJob)
      .map((job) => ({ name: job.name, job, mine: false })),
  ];
  const runLink = githubLink(outcome.run.url);
  return (
    <>
      <div className="pj-jobs-head">
        <h3 id="pj-jobs-title">Jobs in the latest run on main</h3>
        {runLink && (
          <a href={runLink} target="_blank" rel="noopener noreferrer" className="pj-link">
            View the run on GitHub
          </a>
        )}
      </div>
      <ul className="pj-jobs" aria-labelledby="pj-jobs-title">
        {rows.map(({ name, job, mine }) => {
          const label = labelJob(job, mine);
          const href = githubLink(job?.url ?? null) ?? runLink;
          return (
            <li key={name} className={`pj-job is-${label.tone}`}>
              <span className="pj-job-icon">
                <JobIcon tone={label.tone} />
              </span>
              <span className="pj-job-name">
                {name}
                {mine && <span className="pj-job-note">This project</span>}
              </span>
              <span className="pj-job-status">{label.text}</span>
              {href && (
                <a href={href} target="_blank" rel="noopener noreferrer" className="pj-link">
                  View on GitHub<span className="pj-sr"> for {name}</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** A paper block with a 3 px rule that carries the state. Green and red also carry an icon. */
function Message({
  tone,
  lead,
  rest,
  children,
}: {
  tone: 'pass' | 'fix' | 'wait';
  lead: string;
  rest: string;
  children?: ReactNode;
}) {
  return (
    <div className={`pj-band is-${tone}`}>
      {tone !== 'wait' && (
        <span className="pj-band-icon">{tone === 'pass' ? <CheckIcon /> : <CrossIcon />}</span>
      )}
      <div className="pj-band-body">
        <p>
          <strong>{lead}</strong> {rest}
        </p>
        {children}
      </div>
    </div>
  );
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  return (
    <button type="button" className="btn btn-primary" onClick={onContinue}>
      Continue
    </button>
  );
}

/** The message for one outcome. A pass also offers Continue; a first pass says what it paid. */
function OutcomeMessage({
  outcome,
  ciJob,
  earned,
  onContinue,
}: {
  outcome: CheckOutcome;
  ciJob: string;
  earned: number;
  onContinue: () => void;
}) {
  const message = describeOutcome(outcome, ciJob);
  return (
    <Message {...message}>
      {message.tone === 'pass' && earned > 0 && (
        <p className="pj-earned">You earned {earned} XP.</p>
      )}
      {message.tone === 'pass' && <ContinueButton onContinue={onContinue} />}
    </Message>
  );
}

function Result({
  shown,
  ciJob,
  now,
  onContinue,
}: {
  shown: Shown;
  ciJob: string;
  now: Date;
  onContinue: () => void;
}) {
  const { outcome } = shown;
  const when = checkedWhen(shown.checkedAt, now);
  const run = outcome && 'run' in outcome ? outcome.run : null;
  return (
    <section className="pj-result" aria-label="Result of your last check">
      {outcome ? (
        <OutcomeMessage
          outcome={outcome}
          ciJob={ciJob}
          earned={shown.earned}
          onContinue={onContinue}
        />
      ) : shown.passed ? (
        <Message tone="pass" lead="Your project passes." rest="Your last check passed.">
          <ContinueButton onContinue={onContinue} />
        </Message>
      ) : (
        <Message
          tone="wait"
          lead="Your last check did not pass."
          rest="Press Check my repo to run it again."
        />
      )}
      {when && <p className="pj-meta">Checked {when}</p>}
      <p className="pj-meta">
        Repository {repoName(shown.repoUrl)}
        {run && `, commit ${run.sha.slice(0, 7)}`}
      </p>
      {outcome && 'jobs' in outcome && <JobList outcome={outcome} ciJob={ciJob} />}
    </section>
  );
}

export function ProjectPage({ block, onExit }: PlayerProps<'project'>) {
  const { meta, project } = block;
  const store = useStore();
  const userId = useCurrentUser()?.id;
  const now = useNow();

  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [value, setValue] = useState('');
  const [urlError, setUrlError] = useState<keyof typeof URL_MESSAGES | null>(null);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);
  /** The newest check that said nothing about the repo (rate limit, network). Shown above the saved result. */
  const [notice, setNotice] = useState<CheckOutcome | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  // Open with the saved result, the repo link of the latest submission to any project, and whether
  // the project is already done.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let own: ProjectSubmission | null = null;
      let latest: ProjectSubmission | null = null;
      let done: ProgressEntry[] = [];
      try {
        [own, latest, done] = await Promise.all([
          store.getProjectSubmission(meta.id),
          store.getLatestProjectSubmission(),
          userId ? store.listCompleted(userId) : Promise.resolve([]),
        ]);
      } catch {
        // Nothing saved could be read. The page still works: it opens with an empty field.
      }
      if (cancelled) return;
      if (own) {
        setShown({
          outcome: outcomeFromSubmission(own, project.ciJob),
          passed: own.passed,
          repoUrl: own.repoUrl,
          checkedAt: own.checkedAt,
          earned: 0,
        });
      }
      setValue(latest?.repoUrl ?? '');
      setCompleted(done.some((e) => e.itemId === meta.id));
      setReady(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [store, userId, meta.id, project.ciJob]);

  async function onCheck(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const parsed = parseRepoUrl(value);
    if (!parsed.ok) {
      setUrlError(parsed.reason);
      return;
    }
    setUrlError(null);
    setSaveFailed(false);
    setBusy(true);
    try {
      const outcome = await checkRepo(
        (url, init) => window.fetch(url, init),
        parsed.repo,
        project.ciJob,
      );
      const record = toRecord(outcome);
      if (!record) {
        setNotice(outcome);
        return;
      }
      const saved = await store.saveProjectSubmission(meta.id, parsed.repo.url, record);
      let earned = 0;
      if (outcome.kind === 'passed') {
        earned = await completeItem(store, meta.id, meta.id, ['project']);
        setCompleted(true);
      }
      setNotice(null);
      setShown({
        outcome,
        passed: record.passed,
        repoUrl: saved.repoUrl,
        checkedAt: saved.checkedAt,
        earned,
      });
    } catch {
      setSaveFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const error = urlError ? URL_MESSAGES[urlError] : null;
  const noticeMessage = notice ? describeOutcome(notice, project.ciJob) : null;

  return (
    <div className="pj">
      <div className="pj-column">
        <button type="button" className="btn btn-text pj-back" onClick={onExit}>
          Back to the map
        </button>
        <h1>{meta.title}</h1>
        {completed && (
          <p className="pj-complete">
            <CheckIcon /> Project complete
          </p>
        )}

        <h2>User stories</h2>
        <ol className="pj-stories">
          {project.userStories.map((story, i) => (
            <Html key={i} as="li" html={story} />
          ))}
        </ol>

        <h2>Instructions</h2>
        <Html html={project.instructions} className="pj-text" />

        {ready && (
          <section className="pj-check" aria-labelledby="pj-check-title">
            <h2 id="pj-check-title">Check your repo</h2>
            <form onSubmit={(e) => void onCheck(e)} noValidate>
              <div className="field">
                <label htmlFor="pj-repo">Repository link</label>
                <p id="pj-repo-hint" className="pj-hint">
                  For example https://github.com/your-name/your-repo
                </p>
                <div className="pj-row">
                  <input
                    id="pj-repo"
                    className="text-input pj-input"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? 'pj-repo-hint pj-repo-error' : 'pj-repo-hint'}
                  />
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Check my repo
                  </button>
                </div>
                {error && (
                  <p id="pj-repo-error" role="alert" className="form-error">
                    {error}
                  </p>
                )}
              </div>
            </form>

            <div aria-live="polite" aria-busy={busy}>
              {busy && <p className="pj-working">Checking your repo on GitHub</p>}
              {saveFailed && (
                <p role="alert" className="form-error pj-save-error">
                  Your result could not be saved. Check your connection, then press Check my repo
                  again.
                </p>
              )}
              {noticeMessage && <Message {...noticeMessage} />}
              {shown && (
                <Result shown={shown} ciJob={project.ciJob} now={now} onContinue={onExit} />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
