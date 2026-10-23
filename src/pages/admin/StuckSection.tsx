import { useEffect, useState } from 'react';
import { Html } from '../../components/Html';
import { fetchBlock } from '../../content/loader';
import type { Block } from '../../content/schema';
import { failingTestMessage, lastActiveLabel, STUCK_AFTER, type StuckEntry } from './aggregate';
import { Caption, ScrollTable } from './ScrollTable';

/** Block content by slug; null when the block could not be loaded. */
type Blocks = ReadonlyMap<string, Block | null>;

const NONE: Blocks = new Map();

/**
 * Loads only the blocks that appear in the stuck list, so the test messages can be read from their
 * built content. A block that fails to load leaves its messages unavailable, not the whole list.
 */
function useStuckBlocks(entries: readonly StuckEntry[]): Blocks {
  const [loaded, setLoaded] = useState<{ entries: readonly StuckEntry[]; blocks: Blocks }>({
    entries: [],
    blocks: NONE,
  });

  useEffect(() => {
    let cancelled = false;
    const slugs = [...new Set(entries.map((e) => e.slug))];
    Promise.all(
      slugs.map((slug) =>
        fetchBlock(slug).then(
          (block): [string, Block | null] => [slug, block],
          (): [string, Block | null] => [slug, null],
        ),
      ),
    ).then((pairs) => {
      if (!cancelled) setLoaded({ entries, blocks: new Map(pairs) });
    });
    return () => {
      cancelled = true;
    };
  }, [entries]);

  return loaded.entries === entries ? loaded.blocks : NONE;
}

function Message({ entry, blocks }: { entry: StuckEntry; blocks: Blocks }) {
  if (entry.testIndex === null) {
    return <p className="admin-message">The code failed before any test ran.</p>;
  }
  const label = <span className="admin-sub">Test {entry.testIndex + 1}</span>;
  if (!blocks.has(entry.slug)) {
    return (
      <>
        {label}
        <p className="admin-message admin-muted">Loading the test message.</p>
      </>
    );
  }
  const block = blocks.get(entry.slug);
  const html = block ? failingTestMessage(block, entry.itemId, entry.testIndex) : null;
  return (
    <>
      {label}
      {html ? (
        <Html html={html} className="admin-message" />
      ) : (
        <p className="admin-message admin-muted">The test message could not be loaded.</p>
      )}
    </>
  );
}

/** Steps where a member has failed the check at least five times in a row without a pass. */
export function StuckSection({ entries, now }: { entries: StuckEntry[]; now: Date }) {
  const blocks = useStuckBlocks(entries);
  return (
    <section className="admin-section">
      <h2 id="admin-stuck">Stuck steps</h2>
      {entries.length === 0 ? (
        <p className="empty-state">No one is stuck.</p>
      ) : (
        <ScrollTable labelledBy="admin-stuck" className="admin-stuck">
          <Caption>
            Steps with at least {STUCK_AFTER} failed checks and no pass since. The failing test is
            the one that failed most often.
          </Caption>
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Step</th>
              <th scope="col">Failed checks</th>
              <th scope="col">Last check</th>
              <th scope="col">Failing test</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={`${entry.userId}:${entry.itemId}`}>
                <th scope="row">{entry.name}</th>
                <td>
                  <span className="admin-title">{entry.blockTitle}</span>
                  <span className="admin-sub">
                    {entry.step === null ? 'Lab' : `Step ${entry.step}`}
                  </span>
                </td>
                <td>{entry.failed}</td>
                <td>{lastActiveLabel(entry.lastFailedAt, now)}</td>
                <td className="admin-message-cell">
                  <Message entry={entry} blocks={blocks} />
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )}
    </section>
  );
}
