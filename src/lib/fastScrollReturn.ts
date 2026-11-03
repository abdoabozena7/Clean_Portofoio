/** Experimental behavior explicitly requested by the owner. Disable here to
 * restore unrestricted native downward browsing at every speed. */
type FastReturnConfig = {
  enabled: boolean; destination: "skipped-section";
  speedViewportsPerSecond: number; sustainedMs: number; minTravelViewports: number;
  minSamples: number;
};
export const FAST_SCROLL_RETURN_CONFIG: FastReturnConfig = {
  enabled: true,
  destination: "skipped-section",
  speedViewportsPerSecond: 4.5,
  sustainedMs: 180,
  minTravelViewports: 1,
  minSamples: 3,
};
