/** Experimental behavior explicitly requested by the owner. Disable here to
 * restore unrestricted native downward browsing at every speed. */
type FastReturnConfig = {
  enabled: boolean; destination: "burst-start" | "page-top";
  speedViewportsPerSecond: number; sustainedMs: number; minTravelViewports: number;
  minSamples: number; cooldownMs: number;
};
export const FAST_SCROLL_RETURN_CONFIG: FastReturnConfig = {
  enabled: true,
  destination: "burst-start",
  speedViewportsPerSecond: 4.5,
  sustainedMs: 300,
  minTravelViewports: 1.5,
  minSamples: 5,
  cooldownMs: 1200,
};

export type FastReturnBurst = { since: number | null; startY: number; travel: number; samples: number };
export const initialFastReturnBurst = (): FastReturnBurst => ({ since: null, startY: 0, travel: 0, samples: 0 });
type Sample = { now: number; previousY: number; delta: number; viewportHeight: number; speed: number; eligible: boolean };

/** Pure qualification only. This model never scrolls, persists or infers reading. */
export function observeFastReturn(burst: FastReturnBurst, sample: Sample) {
  const config = FAST_SCROLL_RETURN_CONFIG;
  if (!sample.eligible || sample.delta <= 0 || sample.speed < config.speedViewportsPerSecond) {
    return { burst: initialFastReturnBurst(), qualified: false };
  }
  const next = burst.since === null
    ? { since: sample.now, startY: sample.previousY, travel: sample.delta, samples: 1 }
    : { ...burst, travel: burst.travel + sample.delta, samples: burst.samples + 1 };
  return { burst: next, qualified: sample.now - next.since >= config.sustainedMs &&
    next.samples >= config.minSamples && next.travel >= sample.viewportHeight * config.minTravelViewports };
}
