import { describe, expect, it } from "vitest";
import { advanceProgress, stageProgress, textFrame, visibilityProgress } from "@/lib/construction";

describe("scroll construction contract", () => {
  it("finishes before content reaches the reading area and clamps offscreen positions", () => {
    expect(visibilityProgress(1000, 900)).toBe(0);
    expect(visibilityProgress(693, 900)).toBeCloseTo(0.5);
    expect(visibilityProgress(504, 900)).toBe(1);
    expect(visibilityProgress(-200, 900)).toBe(1);
  });
  it("never destroys completed content on reverse scroll and synchronizes a jump immediately", () => {
    expect(advanceProgress(1, 0, false)).toBe(1);
    expect(advanceProgress(0.7, 0.2, false)).toBe(0.7);
    expect(advanceProgress(0, 0.05, true)).toBe(1);
    expect(stageProgress(0.5, 0.25, 0.75)).toBe(0.5);
  });
  it("types through natural line breaks without changing any string or flow box", () => {
    const lines = [{ x: 0, y: 0, width: 100, height: 20 }, { x: 0, y: 24, width: 60, height: 20 }];
    const first = textFrame(lines, 100, 44, 0.5);
    expect(first.x).toBe(80);
    expect(first.y).toBe(0);
    const second = textFrame(lines, 100, 44, 0.8125);
    expect(second.x).toBe(30);
    expect(second.y).toBe(24);
    expect(second.clip).toContain("100px 22px, 30px 22px, 30px 44px");
  });
});
