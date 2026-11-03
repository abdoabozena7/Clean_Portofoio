import { describe, expect, it } from "vitest";
import { initialFastReturnBurst, observeFastReturn } from "@/lib/fastScrollReturn";

const sample = (now: number, delta: number, speed: number, eligible = true) => ({ now, previousY: now * 3, delta, speed, eligible, viewportHeight: 900 });
describe("high-threshold scroll-return experiment", () => {
  it("does not qualify ordinary, moderate or one accidental large input", () => {
    for (const speed of [.7, 3.8]) {
      let burst = initialFastReturnBurst();
      for (let t = 0; t <= 1000; t += 50) {
        const result = observeFastReturn(burst, sample(t, 200, speed));
        expect(result.qualified).toBe(false); burst = result.burst;
      }
    }
    expect(observeFastReturn(initialFastReturnBurst(), sample(0, 3000, 25)).qualified).toBe(false);
  });
  it("requires sustained speed, distance and samples together", () => {
    let burst = initialFastReturnBurst(), qualified = false;
    for (let t = 0; t <= 180; t += 60) {
      const result = observeFastReturn(burst, sample(t, 350, 6));
      if (t < 180) expect(result.qualified).toBe(false);
      burst = result.burst; qualified = result.qualified;
    }
    expect(qualified).toBe(true);
    expect(burst.startY).toBe(0);
  });
  it("resets for a slowdown, reverse direction or ineligible control", () => {
    const started = observeFastReturn(initialFastReturnBurst(), sample(0, 700, 8)).burst;
    for (const input of [sample(100, 80, .7), sample(100, -700, 8), sample(100, 700, 8, false)]) {
      expect(observeFastReturn(started, input).burst.since).toBe(null);
    }
  });
});
