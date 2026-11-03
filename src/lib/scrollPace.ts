/** Viewport-relative, sustained intent. A single wheel notch never starts scan. */
export type ScrollPace = { scanning: boolean; fastSince: number | null; slowSince: number | null };
export const initialScrollPace = (): ScrollPace => ({ scanning: false, fastSince: null, slowSince: null });
export function advanceScrollPace(previous: ScrollPace, speed: number, now: number, travel: number): ScrollPace {
  const next = { ...previous };
  if (!next.scanning) {
    next.fastSince = speed >= 1.8 ? next.fastSince ?? now : null;
    if (next.fastSince !== null && now - next.fastSince >= 120 && travel >= .65) {
      next.scanning = true; next.slowSince = null;
    }
  } else {
    next.slowSince = speed < 1.1 ? next.slowSince ?? now : null;
    if (next.slowSince !== null && now - next.slowSince >= 100) {
      next.scanning = false; next.fastSince = null;
    }
  }
  return next;
}
