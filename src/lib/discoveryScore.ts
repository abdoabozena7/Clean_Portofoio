/** Local evidence of exploration, never a claim of reading or comprehension. */
export type DiscoveryCredit = { id: string; credit: number; encountered: boolean; gap?: boolean };
export const earnExposure = (credit: number, elapsedMs: number, requiredMs: number) => Math.min(1, Math.max(0, credit) + Math.max(0, elapsedMs) / Math.max(1, requiredMs));
/** Speed is viewport heights/second so the same gesture has comparable meaning on phones. */
export const exposureRate = (viewportSpeed: number) => Math.max(0, Math.min(1, (1.2 - Math.abs(viewportSpeed)) / 1));
export function discoveryScore(stories: DiscoveryCredit[]) {
  const encountered = stories.filter(story => story.encountered);
  if (!encountered.length) return 0;
  const earned = encountered.reduce((sum, story) => sum + Math.min(1, Math.max(0, story.credit)), 0);
  return Math.round(1000 * earned / encountered.length) / 10;
}
