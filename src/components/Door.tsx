import '../styles/map.css';

export type DoorState = 'default' | 'next' | 'done';

interface DoorProps {
  roomCode: string;
  /** `next` is the next-up door (lighter green, brass outline); `done` hangs a key tag on the knob. */
  state: DoorState;
  /** Double size, for the home hero. */
  large?: boolean;
  /** Drop the key tag onto the knob and swing it once. Ignored under reduced motion. */
  celebrate?: boolean;
}

/**
 * One block's door: the room plate with its code, a brass knob and, once the block is done, a key
 * tag. The code is real text, so a link wrapping a door gets it in its accessible name. The tag is
 * a picture only: the page says "Done" in words next to it.
 */
export function Door({ roomCode, state, large = false, celebrate = false }: DoorProps) {
  const classes = ['door'];
  if (state === 'next') classes.push('door-next');
  if (large) classes.push('door-large');
  return (
    <div className={classes.join(' ')}>
      <span className="door-plate">{roomCode}</span>
      <span className="door-knob" aria-hidden="true" />
      {state === 'done' && (
        <span className={`door-tag${celebrate ? ' door-tag-drop' : ''}`} aria-hidden="true">
          ✓
        </span>
      )}
    </div>
  );
}
