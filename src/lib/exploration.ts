import type { AttentionItem } from "@/data/attentionContent";

export type ExplorationSnapshot = { explored: string[]; total: number; items: AttentionItem[]; suggestedId: string | null; score: number; gaps: number; credits: Record<string, number> };
const empty: ExplorationSnapshot = { explored: [], total: 0, items: [], suggestedId: null, score: 0, gaps: 0, credits: {} };
let snapshot = empty;
const listeners = new Set<() => void>();
export const getExploration = () => snapshot;
export const subscribeExploration = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function publishExploration(value: ExplorationSnapshot) {
  if (JSON.stringify(snapshot) === JSON.stringify(value)) return;
  snapshot = value; listeners.forEach(listener => listener());
}
export function resetExploration() { publishExploration(empty); }
