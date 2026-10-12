import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Door, type DoorState } from '../components/Door';
import '../styles/map.css';
import { blockMetaLine, blockPath, type Course, type CourseBlock } from './course';
import { newlyDone, readSeenDone, writeSeenDone } from './seenDone';
import { useCourse } from './useCourse';

const NONE: ReadonlySet<string> = new Set();

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function Room({
  block,
  state,
  celebrate,
}: {
  block: CourseBlock;
  state: DoorState;
  celebrate: boolean;
}) {
  const { summary } = block;
  return (
    <li className="room">
      <Link to={blockPath(block)} className="room-link">
        <Door roomCode={summary.roomCode} state={state} celebrate={celebrate} />
        <span className="room-title">{summary.title}</span>
        <span className="room-meta">{blockMetaLine(summary)}</span>
        {summary.optional && <span className="room-meta">Optional</span>}
        {state === 'done' && <span className="sr-only">Done</span>}
        {state === 'next' && <span className="sr-only">Next up</span>}
      </Link>
    </li>
  );
}

function CourseMap({ course, celebrating }: { course: Course; celebrating: ReadonlySet<string> }) {
  return (
    <>
      {course.tracks.map((track) => (
        <section key={track.id} className="map-track" aria-labelledby={`track-${track.id}`}>
          <div className="map-head map-head-track">
            <h2 id={`track-${track.id}`}>
              Track {track.id}: {track.title}
            </h2>
            <p className="map-count map-count-track">
              {track.done} of {track.total} done
            </p>
          </div>
          {track.chapters.map((chapter) => (
            <section
              key={chapter.id}
              className="map-chapter"
              aria-labelledby={`chapter-${chapter.id}`}
            >
              <div className="map-head map-head-chapter">
                <h3 id={`chapter-${chapter.id}`}>
                  Chapter {chapter.id}: {chapter.title}
                </h3>
                <p className="map-count">
                  {chapter.done} of {chapter.total} done
                </p>
              </div>
              <ol className="corridor">
                {chapter.blocks.map((block) => (
                  <Room
                    key={block.summary.id}
                    block={block}
                    state={block.done ? 'done' : block === course.nextUp ? 'next' : 'default'}
                    celebrate={celebrating.has(block.summary.id)}
                  />
                ))}
              </ol>
            </section>
          ))}
        </section>
      ))}
    </>
  );
}

/** /learn: every block as a door in its chapter's corridor. Nothing is locked. */
export function Learn() {
  const state = useCourse();
  const [celebrating, setCelebrating] = useState<ReadonlySet<string>>(NONE);
  // The course object changes only when data reloads; this makes the comparison run once per load
  // even though React StrictMode runs effects twice in development.
  const handled = useRef<Course | null>(null);

  useEffect(() => {
    if (state.status !== 'ready' || handled.current === state.course) return;
    handled.current = state.course;
    const doneIds = state.course.blocks.filter((b) => b.done).map((b) => b.summary.id);
    const fresh = newlyDone(readSeenDone(), doneIds);
    setCelebrating(prefersReducedMotion() ? NONE : new Set(fresh));
    writeSeenDone(doneIds);
  }, [state]);

  return (
    <div className="page page-map">
      <h1>Learn</h1>
      {state.status === 'loading' && <p aria-busy="true">Loading the map.</p>}
      {state.status === 'error' && (
        <p role="alert" className="form-error">
          The map could not be loaded. Check your connection, then reload the page.
        </p>
      )}
      {state.status === 'ready' && <CourseMap course={state.course} celebrating={celebrating} />}
    </div>
  );
}
