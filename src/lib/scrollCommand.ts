import { FAST_SCROLL_RETURN_CONFIG as config } from "./fastScrollReturn";

export const scrollBurstIdleMs = 240;

/** Translate current intent, not story state or a delayed animation queue. */
export function scrollCommand(delta: number, elapsedMs: number | null, viewport: number, recentSpeed: number, wheel = false) {
  const instant = elapsedMs !== null && elapsedMs > 0 && elapsedMs < scrollBurstIdleMs
    ? delta * 1000 / elapsedMs / viewport : 0;
  const strongFirstWheel = wheel && elapsedMs === null && delta >= viewport * .35;
  const reverse = delta > 0 && (strongFirstWheel ||
    instant >= config.speedViewportsPerSecond &&
    (recentSpeed >= config.speedViewportsPerSecond * .7 || delta >= viewport * .04));
  return { reverse, delta: reverse ? -delta : delta };
}

/** Input-only history. A touch release can coast, but only a new finger move
 * can add distance here. The ring covers even high-rate inputs without churn. */
export function createScrollBurst() {
  const capacity = 256;
  const times = new Float64Array(capacity), distances = new Float64Array(capacity);
  let count = 0, next = 0, lastAt = -Infinity, slowSince: number | null = null;
  let reversing = false, announced = false;

  const reset = () => {
    count = 0; next = 0; lastAt = -Infinity; slowSince = null;
    reversing = false; announced = false;
  };

  const move = (delta: number, at: number, viewport: number, elapsed: number | null, strong: boolean) => {
    if (delta < 0 || at - lastAt >= scrollBurstIdleMs || at < lastAt) reset();
    if (delta <= 0) return { reverse: false, entered: false, announce: false };
    lastAt = at;
    if (reversing && elapsed !== null && elapsed > 0 && delta * 1000 <= viewport * .6 * elapsed) {
      slowSince ??= at - elapsed;
      if (elapsed >= 65 || at - slowSince >= 120) {
        // Resume detail immediately. A new burst must earn its own distance.
        count = 0; next = 0; reversing = false;
      }
    } else slowSince = null;

    times[next] = at; distances[next] = delta;
    next = (next + 1) % capacity; count = Math.min(count + 1, capacity);
    let burst = false;
    if (!strong && !reversing) {
      let distance = 0;
      for (let i = 1; i <= count; i++) {
        const index = (next - i + capacity) % capacity, age = at - times[index];
        if (age > 1000) break;
        distance += distances[index];
        if (i >= 4 && (distance >= viewport * .85 || age <= 300 && distance >= viewport * .5)) {
          burst = true; break;
        }
      }
    }
    const entered = !reversing && (strong || burst);
    reversing ||= entered;
    const announce = entered && !announced;
    announced ||= announce;
    return { reverse: reversing, entered, announce };
  };
  return { move, reset };
}
