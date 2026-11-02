/** A deterministic exposure game, not a reading detector.
 * Earned exposure is retained. New fast-skipped stories add recoverable gaps. */
export type DiscoveryCredit = { id: string; credit: number; gap: boolean };
export const earnExposure = (credit: number, elapsedMs: number, requiredMs: number) => Math.min(1, Math.max(0, credit) + Math.max(0, elapsedMs) / Math.max(1, requiredMs));
export function discoveryScore(stories: DiscoveryCredit[]) {
  if (!stories.length) return 0;
  const earned = stories.reduce((sum, story) => sum + Math.min(1, Math.max(0, story.credit)), 0);
  const unfinishedGaps = stories.reduce((sum, story) => sum + (story.gap ? (1 - Math.min(1, Math.max(0, story.credit))) * 2.5 : 0), 0);
  return Math.round(1000 * earned / (stories.length + unfinishedGaps)) / 10;
}
