import { describe, it, expect } from "vitest";
import { createScrollBurst, scrollCommand } from "@/lib/scrollCommand";
describe("immediate command translation", () => {
  it("inverts a strong first wheel command without waiting for a section", () => {
    expect(scrollCommand(500, null, 900, 0, true)).toEqual({ reverse: true, delta: -500 });
    expect(scrollCommand(80, null, 900, 0, true).delta).toBe(80);
  });
  it("inverts a strong first touch movement at its actual speed and magnitude", () => {
    expect(scrollCommand(120, 20, 844, 0)).toEqual({ reverse: true, delta: -120 });
    expect(scrollCommand(25, 60, 844, 0)).toEqual({ reverse: false, delta: 25 });
  });
  it("slow or upward commands override previously fast history immediately", () => {
    expect(scrollCommand(20, 80, 844, 20).reverse).toBe(false);
    expect(scrollCommand(-120, 10, 844, 20)).toEqual({ reverse: false, delta: -120 });
  });
});

describe("downward input bursts", () => {
  it("requires at least four movements even if the distance already qualifies", () => {
    const burst = createScrollBurst();
    for (const at of [0, 100, 200]) expect(burst.move(190, at, 1000, 100, false).reverse).toBe(false);
    expect(burst.move(10, 300, 1000, 100, false)).toEqual({ reverse: true, entered: true, announce: true });
  });

  it("accumulates slower subthreshold steps across the full second", () => {
    const burst = createScrollBurst();
    for (let i = 0; i < 15; i++) expect(burst.move(45, i * 63, 844, 63, false).reverse).toBe(false);
    expect(burst.move(45, 945, 844, 63, false).announce).toBe(true);
    expect(burst.move(45, 1008, 844, 63, false)).toEqual({ reverse: true, entered: false, announce: false });
  });

  it("expires older distance and discards history on a pause or upward input", () => {
    const burst = createScrollBurst();
    for (let i = 0; i < 12; i++) expect(burst.move(65, i * 110, 1000, 110, false).reverse).toBe(false);
    expect(burst.move(400, 1450, 1000, null, false).reverse).toBe(false);
    for (const at of [1500, 1550]) expect(burst.move(30, at, 1000, 50, false).reverse).toBe(false);
    expect(burst.move(-10, 1600, 1000, 50, false).reverse).toBe(false);
    expect(burst.move(80, 1650, 1000, 50, false).reverse).toBe(false);
  });

  it("releases on clear slowing and never waives reversal for repeated attempts", () => {
    const burst = createScrollBurst();
    for (const at of [0, 300, 600, 900]) expect(burst.move(350, at, 844, 16, true).announce).toBe(true);
    expect(burst.move(25, 990, 844, 90, false).reverse).toBe(false);
    expect(burst.move(350, 1006, 844, 16, true)).toEqual({ reverse: true, entered: true, announce: false });
  });
});
