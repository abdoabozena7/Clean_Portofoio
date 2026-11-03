import { describe, expect, it } from "vitest";
import { advanceScrollPace, initialScrollPace } from "@/lib/scrollPace";

describe("native browsing pace", () => {
  it("keeps ordinary wheel cadence detailed even after crossing a viewport", () => {
    let pace = initialScrollPace();
    for (let t = 0; t < 2400; t += 140) pace = advanceScrollPace(pace, .7, t, t / 140 * 80 / 900);
    expect(pace.scanning).toBe(false);
  });
  it("requires sustained fast travel and recovers without waiting for a new section", () => {
    let pace = advanceScrollPace(initialScrollPace(), 4, 0, .4);
    expect(pace.scanning).toBe(false);
    pace = advanceScrollPace(pace, 4, 180, .9);
    expect(pace.scanning).toBe(true);
    pace = advanceScrollPace(pace, .6, 260, 1);
    expect(pace.scanning).toBe(true);
    pace = advanceScrollPace(pace, .6, 400, 1.1);
    expect(pace.scanning).toBe(false);
  });
  it("does not mistake one accidental fast notch for an intentional scan", () => {
    let pace = advanceScrollPace(initialScrollPace(), 8, 10, .8);
    pace = advanceScrollPace(pace, .5, 140, .9);
    expect(pace.scanning).toBe(false);
  });
});
