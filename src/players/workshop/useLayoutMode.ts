import { useEffect, useState } from 'react';
import { layoutModeFor, type LayoutMode } from './panes';

/** The layout for the current window width. Updates when the window is resized. */
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(() => layoutModeFor(window.innerWidth));
  useEffect(() => {
    const update = () => setMode(layoutModeFor(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return mode;
}
