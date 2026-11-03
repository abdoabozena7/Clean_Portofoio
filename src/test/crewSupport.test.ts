import { describe, it, expect } from "vitest";
import { crewEdge } from "@/lib/crewSupport";
describe("whole-crew structural assistance", () => {
  it("assigns every worker a distinct measured edge segment with real movement", () => {
    const box = { left: 100, top: 120, width: 800, height: 300 };
    const ends = Array.from({ length: 10 }, (_, i) => {
      const start = crewEdge(box, 0, i, 10), end = crewEdge(box, 1, i, 10);
      expect(Math.hypot(end.point.x - start.point.x, end.point.y - start.point.y)).toBeGreaterThan(50);
      expect(end.point.x === 100 || end.point.x === 900 || end.point.y === 120 || end.point.y === 420).toBe(true);
      return `${end.point.x}:${end.point.y}`;
    });
    expect(new Set(ends).size).toBe(10);
  });
});
