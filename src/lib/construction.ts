/** Pure scroll math: progress follows position, never an animation queue. */
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const stageProgress = (progress: number, start: number, end: number) =>
  clamp01((progress - start) / (end - start));

export function visibilityProgress(top: number, viewport: number) {
  // Finish before the element reaches the main reading area.
  return clamp01((viewport * 0.98 - top) / (viewport * 0.42));
}

export function advanceProgress(previous: number, next: number, synchronize: boolean) {
  return Math.max(previous, synchronize ? 1 : clamp01(next));
}

export type TextLine = { x: number; y: number; width: number; height: number };

/** A staircase clip reveals complete lines followed by part of the current line.
 * The real text nodes and their wrapping are never edited or duplicated. */
export function textFrame(lines: TextLine[], width: number, height: number, progress: number) {
  if (!lines.length) return { clip: `inset(0 ${100 - progress * 100}% 0 0)`, x: width * progress, y: 0, height };
  const total = lines.reduce((sum, line) => sum + line.width, 0);
  let remaining = total * clamp01(progress);
  let index = 0;
  while (index < lines.length - 1 && remaining > lines[index].width) remaining -= lines[index++].width;
  const line = lines[index];
  const x = line.x + Math.min(line.width, remaining);
  const boundary = index ? (lines[index - 1].y + lines[index - 1].height + line.y) / 2 : Math.min(0, line.y);
  const bottom = index < lines.length - 1 ? (line.y + line.height + lines[index + 1].y) / 2 : Math.max(height, line.y + line.height);
  return {
    clip: `polygon(0px ${Math.min(0, lines[0].y)}px, ${width}px ${Math.min(0, lines[0].y)}px, ${width}px ${boundary}px, ${x}px ${boundary}px, ${x}px ${bottom}px, 0px ${bottom}px)`,
    x, y: line.y, height: line.height,
  };
}
