import { describe, it, expect } from "vitest";
import { scrollCommand } from "@/lib/scrollCommand";
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
