import { clamp01, stageProgress } from "./construction";

export type SceneBox = { left: number; top: number; width: number; height: number };
const smooth = (p: number) => p * p * (3 - 2 * p);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** All coordinates are current DOM measurements. Only choreography ratios are fixed. */
export function constructionScene(destination: SceneBox, source: SceneBox, progress: number) {
  const carry = smooth(stageProgress(progress, .16, .60));
  const resize = smooth(stageProgress(progress, .60, .86));
  const scale = mix(.58, 1, resize);
  const width = destination.width * scale, height = destination.height * scale;
  const left = mix(source.left, destination.left, carry);
  const top = mix(source.top, destination.top, carry) - Math.sin(carry * Math.PI) * Math.min(38, destination.height * .18);
  const phase = progress < .16 ? "pick" : progress < .60 ? "carry" : progress < .86 ? "resize" : "align";
  return {
    left, top, width, height, scale, phase,
    // The cursor grips the top edge, then deliberately takes the resize handle.
    gripX: left + width * (progress < .60 ? .22 : .98),
    gripY: top + height * (progress < .60 ? .06 : .98),
    replacement: smooth(stageProgress(progress, .56, .73)),
    opacity: Math.min(1, clamp01(progress / .07)),
    handoff: smooth(stageProgress(progress, .94, 1)),
  };
}
