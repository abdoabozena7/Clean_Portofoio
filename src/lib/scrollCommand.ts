import { FAST_SCROLL_RETURN_CONFIG as config } from "./fastScrollReturn";

/** Translate current intent, not story state or a delayed animation queue. */
export function scrollCommand(delta: number, elapsedMs: number | null, viewport: number, recentSpeed: number, wheel = false) {
  const instant = elapsedMs !== null && elapsedMs > 0 && elapsedMs <= 240
    ? delta * 1000 / elapsedMs / viewport : 0;
  const strongFirstWheel = wheel && elapsedMs === null && delta >= viewport * .35;
  const reverse = delta > 0 && (strongFirstWheel ||
    instant >= config.speedViewportsPerSecond &&
    (recentSpeed >= config.speedViewportsPerSecond * .7 || delta >= viewport * .04));
  return { reverse, delta: reverse ? -delta : delta };
}
