/** SVG points up at zero degrees. Use a shortest turn, never a full spin. */
export function agentHeading(previous: number | undefined, dx: number, dy: number, elapsedMs: number) {
  if (Math.hypot(dx, dy) < .25) return previous ?? 0;
  const target = Math.atan2(dy, dx) * 180 / Math.PI + 90;
  if (previous === undefined) return target;
  const difference = ((target - previous + 540) % 360 + 360) % 360 - 180;
  return previous + difference * (1 - Math.exp(-Math.max(0, elapsedMs) / 65));
}

/** Varied per return, stable between frames: no random jitter or wandering. */
export function rendezvousPoint(index: number, visit: number, width: number, height: number) {
  const seed = Math.sin((index + 1) * 12.9898 + visit * 78.233) * 43758.5453;
  const fraction = seed - Math.floor(seed);
  const angle = index * 2.399963 + (fraction - .5) * .45;
  const radius = Math.min(width * .12, 46 + index % 3 * 18 + fraction * 12);
  return { x: width * .5 + Math.cos(angle) * radius, y: height * .52 + Math.sin(angle) * radius * .7 };
}
