import type { SceneBox } from "./constructionScene";

/** Assign distinct segments of real component edges; no orbiting or wandering. */
export function crewEdge(box: SceneBox, progress: number, lane: number, count: number) {
  const edge = lane % 4, rank = Math.floor(lane / 4), parts = Math.ceil((count - edge) / 4);
  const start = rank / parts, end = (rank + .8) / parts;
  const p = Math.max(0, Math.min(1, progress));
  const at = start + (end - start) * p;
  const point = (t: number) => edge === 0 ? { x: box.left + box.width * t, y: box.top }
    : edge === 1 ? { x: box.left + box.width, y: box.top + box.height * t }
    : edge === 2 ? { x: box.left + box.width * (1 - t), y: box.top + box.height }
    : { x: box.left, y: box.top + box.height * (1 - t) };
  return { start: point(start), point: point(at), edge };
}
