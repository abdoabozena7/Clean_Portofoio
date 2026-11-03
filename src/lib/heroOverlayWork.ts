export type HeroOverlayJob = {
  index: number;
  x: number;
  y: number;
  kind: string;
  operation: string;
  box?: { left: number; top: number; width: number; height: number };
};

let owner: SVGSVGElement | null = null;
let jobs: readonly HeroOverlayJob[] = [];

/** Viewport-space jobs consumed by the existing portfolio creator cursor pool. */
export const getHeroOverlayWork = () => ({ active: jobs.length > 0, jobs });
export function publishHeroOverlayWork(source: SVGSVGElement, next: readonly HeroOverlayJob[]) {
  owner = source; jobs = next;
  window.dispatchEvent(new Event("portfolio:hero-overlay-work"));
}
export function releaseHeroOverlayWork(source: SVGSVGElement) {
  if (owner !== source) return;
  owner = null; jobs = [];
  window.dispatchEvent(new Event("portfolio:hero-overlay-work"));
}
