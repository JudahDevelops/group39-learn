import { useEffect, useState } from 'react';
import { Html } from '../../components/Html';
import { Tryit } from '../../editor/Tryit';
import { completeItem } from '../../lib/progress';
import '../../styles/review.css';
import { useCurrentUser, useStore } from '../../store/StoreContext';
import type { PlayerProps } from '../types';

/** A review is read, not graded. "Mark as read" records completion and gives no XP. */
export function ReviewPlayer({ block, onExit }: PlayerProps<'review'>) {
  const store = useStore();
  const userId = useCurrentUser()?.id;
  const blockId = block.meta.id;
  // null while we check whether this review was already marked.
  const [alreadyRead, setAlreadyRead] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    store.listCompleted(userId).then(
      (entries) => {
        if (!cancelled) setAlreadyRead(entries.some((e) => e.itemId === blockId));
      },
      () => {
        if (!cancelled) setAlreadyRead(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [store, userId, blockId]);

  async function markAsRead() {
    setSaving(true);
    setFailed(false);
    try {
      await completeItem(store, blockId, blockId, []);
      onExit();
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  return (
    <div className="review">
      <div className="review-column">
        <button type="button" className="btn btn-text review-back" onClick={onExit}>
          Back to the map
        </button>
        <h1>{block.meta.title}</h1>
        <div className="review-body">
          {block.review.body.map((segment, i) =>
            segment.type === 'html' ? (
              <Html key={i} html={segment.html} className="prose" />
            ) : (
              <Tryit key={i} tryit={segment.tryit} />
            ),
          )}
        </div>
        <div className="review-done">
          {alreadyRead === true ? (
            <p className="review-read" role="status">
              You marked this as read.
            </p>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={alreadyRead === null || saving}
                onClick={() => void markAsRead()}
              >
                Mark as read
              </button>
              {failed && (
                <p role="alert" className="form-error">
                  Your progress could not be saved. Check your connection, then press Mark as read
                  again.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
