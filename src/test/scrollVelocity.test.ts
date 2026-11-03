import { describe, it, expect } from "vitest";
import { initialScrollVelocity, sampleScrollVelocity, wheelPixels } from "@/lib/scrollVelocity";

function run(step: number, pxPerSecond: number, duration = 800) {
  let state = initialScrollVelocity(), result = sampleScrollVelocity(state, 0, 0, 900);
  state = result.state;
  for (let t = step; t <= duration; t += step) { result = sampleScrollVelocity(state, t, pxPerSecond * step / 1000, 900); state = result.state; }
  return result;
}
describe("time-weighted scroll measurement", () => {
  it("measures the same real travel at low/high/coalesced input frequencies", () => {
    for (const step of [2, 4, 8, 16, 40, 60]) {
      const fast = run(step, 6000), ordinary = run(step, 600);
      expect(fast.speed).toBeCloseTo(6000 / 900, 5); expect(fast.qualified).toBe(true);
      expect(ordinary.speed).toBeCloseTo(600 / 900, 5); expect(ordinary.qualified).toBe(false);
    }
  });
  it("rejects an isolated huge notch and a spike among slow samples", () => {
    expect(sampleScrollVelocity(initialScrollVelocity(), 100, 6000, 900).qualified).toBe(false);
    let state = initialScrollVelocity();
    for (let t = 0; t <= 800; t += 8) {
      const result = sampleScrollVelocity(state, t, t === 400 ? 5000 : 5, 900);
      expect(result.qualified).toBe(false); state = result.state;
    }
  });
  it("recognizes slowdown promptly and resets direction or idle history", () => {
    const fast = run(8, 6000);
    let result = fast;
    for (let t = 808; t <= 904; t += 8) result = sampleScrollVelocity(result.state, t, 4, 900);
    expect(result.recentSpeed).toBeLessThan(1); expect(result.qualified).toBe(false);
    expect(sampleScrollVelocity(fast.state, 808, -100, 900).qualified).toBe(false);
    expect(sampleScrollVelocity(fast.state, 1200, 6000, 900).qualified).toBe(false);
  });
  it("normalizes line/page deltas and safely handles coalesced/invalid samples", () => {
    expect(wheelPixels(3, 1, 900, 24)).toBe(72); expect(wheelPixels(1, 2, 900, 24)).toBe(900);
    let result = sampleScrollVelocity(initialScrollVelocity(), 0, 20, 900);
    result = sampleScrollVelocity(result.state, 0, 10, 900);
    result = sampleScrollVelocity(result.state, 10, 10, 900);
    expect(Number.isFinite(result.speed)).toBe(true);
    expect(sampleScrollVelocity(result.state, 20, NaN, 900).qualified).toBe(false);
  });
});
