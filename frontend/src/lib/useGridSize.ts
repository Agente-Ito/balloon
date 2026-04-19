import { useEffect, useState } from "react";

/** Height threshold (px) above which the grid tile is considered "large" */
export const GRID_LG_HEIGHT = 600;
/** Width threshold (px) above which the grid tile is considered "large" */
export const GRID_LG_WIDTH = 480;

/**
 * Returns true when the iframe (or window) is large enough to show
 * secondary content expanded by default.
 *
 * Inside a LUKSO Universal Profile Grid, window.innerHeight/Width reflect
 * the dimensions of the iframe tile — so this correctly tracks the tile
 * size regardless of the user's device screen.
 *
 * Reacts to tile resizes via ResizeObserver on document.body.
 */
export function useGridSize(): boolean {
  const [large, setLarge] = useState<boolean>(
    () =>
      window.innerHeight >= GRID_LG_HEIGHT &&
      window.innerWidth >= GRID_LG_WIDTH
  );

  useEffect(() => {
    const check = () => {
      setLarge(
        window.innerHeight >= GRID_LG_HEIGHT &&
          window.innerWidth >= GRID_LG_WIDTH
      );
    };
    const ro = new ResizeObserver(check);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  return large;
}
