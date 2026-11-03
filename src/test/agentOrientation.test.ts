import { describe, it, expect } from "vitest";
import { agentHeading, rendezvousPoint } from "@/lib/agentOrientation";
describe("directional construction crew", () => {
  it("faces movement instead of always up, turns by the short arc and holds at rest", () => {
    expect(agentHeading(undefined, 10, 0, 16)).toBe(90);
    expect(agentHeading(undefined, 0, 10, 16)).toBe(180);
    expect(agentHeading(undefined, -10, 0, 16)).toBe(270);
    expect(agentHeading(175, -1, 10, 16)).toBeGreaterThan(175);
    expect(Math.abs(agentHeading(359, 0, -10, 16) - 359)).toBeLessThan(2);
    expect(agentHeading(75, 0, 0, 16)).toBe(75);
  });
  it("parks centrally with distinct stable spots that vary across returns", () => {
    const points = Array.from({ length: 8 }, (_, i) => rendezvousPoint(i, 1, 1440, 900));
    expect(new Set(points.map(p => `${p.x}:${p.y}`)).size).toBe(8);
    expect(points.every(p => Math.abs(p.x - 720) < 100 && Math.abs(p.y - 468) < 75)).toBe(true);
    expect(rendezvousPoint(2, 1, 1440, 900)).toEqual(points[2]);
    expect(rendezvousPoint(2, 2, 1440, 900)).not.toEqual(points[2]);
  });
});
