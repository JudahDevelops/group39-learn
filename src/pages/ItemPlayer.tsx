import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBlock } from '../content/loader';
import type { Block } from '../content/schema';
import { LessonPlayer } from '../players/lesson/LessonPlayer';
import { LabPlayer } from '../players/workshop/LabPlayer';
import { WorkshopPlayer } from '../players/workshop/WorkshopPlayer';

/**
 * /learn/:blockSlug/:itemId — loads the block and hands it to the player for its type.
 * itemId is a step id for workshops and the block id for every other type.
 */
export function ItemPlayer() {
  const { blockSlug = '', itemId = '' } = useParams<{ blockSlug: string; itemId: string }>();
  const navigate = useNavigate();
  const [block, setBlock] = useState<Block | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBlock(null);
    setFailed(false);
    fetchBlock(blockSlug).then(
      (b) => {
        if (!cancelled) setBlock(b);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [blockSlug]);

  if (failed) {
    return (
      <div className="page">
        <h1>This page could not be loaded</h1>
        <p>Check your connection, then go back to the map and open it again.</p>
      </div>
    );
  }
  if (!block) return null;

  const onExit = () => navigate('/learn');
  const onNavigate = (next: string) => navigate(`/learn/${blockSlug}/${next}`);

  switch (block.type) {
    case 'lesson':
      return <LessonPlayer block={block} itemId={itemId} onExit={onExit} onNavigate={onNavigate} />;
    case 'workshop':
      return (
        <WorkshopPlayer
          key={itemId}
          block={block}
          itemId={itemId}
          onExit={onExit}
          onNavigate={onNavigate}
        />
      );
    case 'lab':
      return <LabPlayer block={block} itemId={itemId} onExit={onExit} onNavigate={onNavigate} />;
    default:
      return (
        <div className="page">
          <h1>{block.meta.title}</h1>
          <p>This part of the course opens in a later update.</p>
        </div>
      );
  }
}
