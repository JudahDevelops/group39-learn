import { useParams } from 'react-router-dom';

export function ItemPlayer() {
  const { blockSlug, itemId } = useParams<{ blockSlug: string; itemId: string }>();
  return (
    <div className="page">
      <h1>Player</h1>
      <p>
        Block <code>{blockSlug}</code>, item <code>{itemId}</code>.
      </p>
      <div className="placeholder-panel">
        Lesson / workshop / lab / quiz / project / exam players host here — WP 1.4, 1.5, 1.6, 3.4.
      </div>
    </div>
  );
}
