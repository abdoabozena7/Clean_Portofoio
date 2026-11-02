import type { AttentionItem } from "@/data/attentionContent";

export type ExplorationSnapshot = { explored: string[]; total: number; items: AttentionItem[]; suggestedId: string | null };
const empty: ExplorationSnapshot = { explored: [], total: 5, items: [], suggestedId: null };
let snapshot = empty;
const listeners = new Set<() => void>();
export const getExploration = () => snapshot;
export const subscribeExploration = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function publishExploration(value: ExplorationSnapshot) {
  if (JSON.stringify(snapshot) === JSON.stringify(value)) return;
  snapshot = value; listeners.forEach(listener => listener());
}
export function resetExploration() { publishExploration(empty); }
