import { accentPalette } from "./palette";
/** Owner's five-color palette; names distinguish the eight collaborating builders. */
export const constructionAgents = [
  { name: "layout.ai", task: "layout", role: "structure", color: accentPalette[0] },
  { name: "frame.ai", task: "frame", role: "structure", color: accentPalette[1] },
  { name: "type.ai", task: "text", role: "text", color: accentPalette[3] },
  { name: "copy.ai", task: "copy", role: "text", color: accentPalette[4] },
  { name: "style.ai", task: "style", role: "structure", color: accentPalette[2] },
  { name: "asset.ai", task: "asset", role: "asset", color: accentPalette[0] },
  { name: "detail.ai", task: "detail", role: "asset", color: accentPalette[3] },
  { name: "polish.ai", task: "polish", role: "asset", color: accentPalette[4] },
] as const;
