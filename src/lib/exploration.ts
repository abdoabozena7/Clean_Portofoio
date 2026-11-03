import type { AttentionItem } from "@/data/attentionContent";

export type EvidenceConfidence = "low" | "medium" | "high";
export type ExplorationSnapshot = {
  explored: string[]; total: number; items: AttentionItem[]; suggestedId: string | null;
  score: number; gaps: number; credits: Record<string, number>;
  encountered: string[]; coverage: number; confidence: Record<string, EvidenceConfidence>;
};
const empty: ExplorationSnapshot = { explored: [], total: 0, items: [], suggestedId: null, score: 0, gaps: 0, credits: {}, encountered: [], coverage: 0, confidence: {} };
let snapshot = empty;
const listeners = new Set<() => void>();
export const getExploration = () => snapshot;
export const subscribeExploration = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const sameList = <T,>(a: T[], b: T[]) => a === b || a.length === b.length && a.every((item, index) => item === b[index]);
export function publishExploration(value: ExplorationSnapshot) {
  if (value.total === snapshot.total && value.score === snapshot.score &&
      value.gaps === snapshot.gaps && value.coverage === snapshot.coverage &&
      value.suggestedId === snapshot.suggestedId && sameList(value.items, snapshot.items) &&
      sameList(value.explored, snapshot.explored) && sameList(value.encountered, snapshot.encountered) &&
      value.items.every(({ id }) => value.credits[id] === snapshot.credits[id] &&
        value.confidence[id] === snapshot.confidence[id])) return;
  snapshot = value; listeners.forEach(listener => listener());
}
export function resetExploration() { publishExploration(empty); }
