import { clamp01, stageProgress } from "./construction";

export type SceneBox = { left: number; top: number; width: number; height: number };
export type ConstructionOperation = "trace" | "create-slot" | "duplicate" | "drag" | "resize" | "populate" | "type" | "replace" | "align" | "commit";
export type ConstructionJob = {
  id: string;
  operation: ConstructionOperation;
  targetId: string;
  sourceId?: string;
  dependsOn: string[];
  agentRole: "layout" | "content" | "asset" | "style";
  durationMs: number;
};
export type ConstructionScene = { id: string; root: HTMLElement; jobs: ConstructionJob[]; state: "unstarted" | "building" | "complete" };
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

/** Semantic operations use the measured component as their coordinate system.
 * A resize keeps its top-left anchor, and every pointer stays on the active edge. */
export function operationPose(operation: ConstructionOperation, destination: SceneBox, source: SceneBox, progress: number) {
  const p = smooth(clamp01(progress));
  let box = { ...destination };
  let x = destination.left, y = destination.top;
  if (operation === "duplicate" || operation === "drag") {
    box = {
      left: mix(source.left, destination.left, p), top: mix(source.top, destination.top, p),
      width: mix(source.width, destination.width, p), height: mix(source.height, destination.height, p),
    };
    x = box.left + box.width * .2; y = box.top + Math.min(12, box.height * .1);
  } else if (operation === "resize" || operation === "create-slot") {
    box.width *= mix(.22, 1, p); box.height *= mix(.24, 1, p);
    x = box.left + box.width; y = box.top + box.height;
  } else if (operation === "trace") {
    const perimeter = (box.width + box.height) * 2;
    const d = clamp01(progress) * perimeter;
    if (d < box.width) x += d;
    else if (d < box.width + box.height) { x += box.width; y += d - box.width; }
    else if (d < box.width * 2 + box.height) { x += box.width * 2 + box.height - d; y += box.height; }
    else y += perimeter - d;
  } else if (operation === "align") {
    x += box.width; y += box.height * p;
  } else {
    x += box.width * p; y += Math.min(18, box.height * .5);
  }
  return { box, x, y };
}
