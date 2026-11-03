import { FAST_SCROLL_RETURN_CONFIG as config } from "./fastScrollReturn";

type Segment = { start: number; end: number; distance: number };
export type ScrollVelocity = { at: number | null; direction: number; segments: Segment[]; pending: number };
export const initialScrollVelocity = (): ScrollVelocity => ({ at: null, direction: 0, segments: [], pending: 0 });
const WINDOW = 240, IDLE = 240;

/** Integrate distance over real elapsed time, independent of event frequency.
 * Unknown first-event time earns no speed; tiny/coalesced samples are accumulated.
 * Fast-time coverage rejects one large spike surrounded by ordinary input. */
export function sampleScrollVelocity(previous: ScrollVelocity, now: number, delta: number, viewport: number) {
  const direction = Math.sign(delta), gap = previous.at === null ? Infinity : now - previous.at;
  let state: ScrollVelocity;
  if (!Number.isFinite(delta) || viewport <= 0 || !Number.isFinite(now)) {
    state = initialScrollVelocity();
  } else if (previous.at === null || gap > IDLE || gap < 0 || direction && direction !== previous.direction) {
    state = { at: now, direction, segments: [], pending: 0 };
  } else if (gap === 0) {
    state = { ...previous, pending: previous.pending + delta };
  } else {
    state = { at: now, direction: direction || previous.direction, pending: 0,
      segments: [...previous.segments.filter(s => s.end > now - WINDOW),
        { start: previous.at!, end: now, distance: delta + previous.pending }] };
  }
  const since = Math.max(now - WINDOW, state.segments[0]?.start ?? now);
  const duration = Math.max(0, now - since);
  let distance = 0, fastMs = 0, recentDistance = 0;
  for (const segment of state.segments) {
    const length = segment.end - segment.start;
    const overlap = Math.max(0, segment.end - Math.max(since, segment.start));
    distance += segment.distance * overlap / length;
    if (segment.distance * 1000 / length / viewport >= config.speedViewportsPerSecond) fastMs += overlap;
    const recentOverlap = Math.max(0, segment.end - Math.max(now - 80, segment.start));
    recentDistance += segment.distance * recentOverlap / length;
  }
  const speed = distance * 1000 / Math.max(80, duration) / viewport;
  const recentSpeed = recentDistance * 1000 / Math.max(1, Math.min(80, duration)) / viewport;
  const fastFraction = duration ? fastMs / duration : 0;
  return { state, speed, recentSpeed, fastFraction,
    qualified: duration >= config.sustainedMs && distance >= viewport * config.minTravelViewports &&
      speed >= config.speedViewportsPerSecond && fastFraction >= .7 && state.segments.length >= config.minSamples };
}

/** Wheel line units follow the actual page font; page units follow its viewport. */
export function wheelPixels(delta: number, mode: number, viewport: number, lineHeight: number) {
  return delta * (mode === 1 ? lineHeight : mode === 2 ? viewport : 1);
}
