import { describe, expect, it } from "vitest";
import { discoveryScore, earnExposure, exposureRate } from "@/lib/discoveryScore";

describe("exploration quality", () => {
  it("averages encountered evidence without treating unvisited content as a deficit", () => {
    const route = [{ id: "reviewed", credit: 1, encountered: true }, { id: "next", credit: 0, encountered: false }];
    expect(discoveryScore(route)).toBe(100);
    route[1].encountered = true;
    expect(discoveryScore(route)).toBe(50);
    route[1].credit = .5;
    expect(discoveryScore(route)).toBe(75);
    route[1].credit = 1;
    expect(discoveryScore(route)).toBe(100);
    expect(route[0].credit).toBe(1);
  });
  it("does not add artificial gap debt or erase previous evidence", () => {
    expect(discoveryScore([{ id: "done", credit: 1, encountered: true, gap: true }, { id: "new", credit: 0, encountered: true, gap: true }])).toBe(50);
    expect(earnExposure(.9, 1000, 3000)).toBe(1);
    expect(earnExposure(.5, -1000, 3000)).toBe(.5);
    expect(discoveryScore([])).toBe(0);
    expect(discoveryScore([{ id: "not encountered", credit: 1, encountered: false }])).toBe(0);
  });
  it("normalizes evidence to viewport speed and smoothly stops credit during fast scrolling", () => {
    expect(exposureRate(0)).toBe(1);
    expect(exposureRate(.2)).toBe(1);
    expect(exposureRate(.7)).toBeCloseTo(.5);
    expect(exposureRate(-.7)).toBeCloseTo(.5);
    expect(exposureRate(1.2)).toBe(0);
    expect(exposureRate(5)).toBe(0);
  });
});
