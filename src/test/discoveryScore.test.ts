import { describe, expect, it } from "vitest";
import { discoveryScore, earnExposure } from "@/lib/discoveryScore";

describe("discovery score", () => {
  it("retains earned exposure while a new missed story lowers and then restores the score", () => {
    const route = [{ id: "reviewed", credit: 1, gap: false }, { id: "next", credit: 0, gap: false }];
    expect(discoveryScore(route)).toBe(50);
    route[1].gap = true;
    expect(discoveryScore(route)).toBe(22.2);
    route[1].credit = .5;
    expect(discoveryScore(route)).toBe(46.2);
    route[1].credit = 1;
    expect(discoveryScore(route)).toBe(100);
    expect(route[0].credit).toBe(1);
  });
  it("cannot take repeated penalties from an already completed story or exceed full exposure", () => {
    expect(discoveryScore([{ id: "done", credit: 1, gap: true }])).toBe(100);
    expect(earnExposure(.9, 1000, 3000)).toBe(1);
    expect(earnExposure(.5, -1000, 3000)).toBe(.5);
    expect(discoveryScore([])).toBe(0);
  });
});
