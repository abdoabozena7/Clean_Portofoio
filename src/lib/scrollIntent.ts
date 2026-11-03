/** One input-driven signal shared by construction and mobile regrouping. No React frames. */
import { advanceScrollPace, initialScrollPace } from "./scrollPace";
export type ScrollIntent = { speed: number; direction: number; scan: boolean; active: boolean; hardJump: boolean; leap: boolean; automatic: boolean; userDriven: boolean; inputDriven: boolean };
const listeners = new Set<() => void>();
let speed = 0, direction = 1, scan = false, hardJump = false, lastY = 0, lastAt = 0;
let inputAt = -Infinity, travel = 0, samples = 0;
let idle: ReturnType<typeof setTimeout> | undefined, frame = 0, stop: (() => void) | undefined;
let compensatedY: number | null = null, held = false;
let userDriven = false;
let pace = initialScrollPace();
let lastDelta = 0, keyboardJump = false;
let automaticUntil = 0;
let commandScan = false;
let commandIdle: ReturnType<typeof setTimeout> | undefined;
const publish = () => { listeners.forEach(listener => listener()); };

export function getScrollIntent(): ScrollIntent {
  const elapsed = performance.now() - lastAt;
  return { speed: speed * Math.exp(-Math.max(0, elapsed - 60) / 180), direction, scan: (scan || commandScan) && !held, active: elapsed < 220, hardJump, leap: elapsed < 220 && Math.abs(lastDelta) > innerHeight * .95, automatic: performance.now() < automaticUntil, userDriven, inputDriven: performance.now() - inputAt < 900 };
}

/** A repeated fast command can use the existing scan layout while it lasts. */
export function continueFastBrowsing() {
  const changed = !commandScan || held || automaticUntil !== 0;
  held = false; automaticUntil = 0; commandScan = true;
  clearTimeout(commandIdle);
  commandIdle = setTimeout(endFastBrowsing, 280);
  if (changed) publish();
}

export function endFastBrowsing() {
  if (!commandScan) return;
  clearTimeout(commandIdle);
  commandScan = false; scan = false; pace = initialScrollPace();
  publish();
}

/** Our anchor corrections are geometry bookkeeping, never evidence of user speed. */
export function compensateScroll(top: number) {
  const y = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, top));
  compensatedY = y; lastY = y;
  window.scrollTo({ top: y, behavior: "instant" });
}

export function requestDetailedView() {
  clearTimeout(commandIdle); commandScan = false;
  held = true; scan = false; pace = initialScrollPace(); speed = 0; hardJump = false; userDriven = false; publish();
}

/** Authorized experimental navigation. Automatic movement earns no user-speed
 * or exposure evidence; destination content is available like an explicit jump. */
export function navigateForScrollReturn(top: number) {
  automaticUntil = performance.now() + 320;
  window.dispatchEvent(new Event("portfolio:fast-return-start"));
  requestDetailedView(); compensateScroll(top);
  hardJump = true; lastDelta = 0; lastAt = performance.now(); userDriven = false;
  publish();
}

function start() {
  lastY = scrollY; lastAt = performance.now();
  const input = (event: Event) => {
    if (event instanceof KeyboardEvent && !["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) return;
    if (event instanceof WheelEvent && event.ctrlKey) return;
    keyboardJump = event instanceof KeyboardEvent && ["PageDown", "PageUp", "Home", "End", " "].includes(event.key);
    inputAt = performance.now(); compensatedY = null; held = false;
  };
  const onScroll = () => {
    const now = performance.now(), y = scrollY;
    if (compensatedY !== null && Math.abs(y - compensatedY) < 2) { compensatedY = null; lastY = y; return; }
    const delta = y - lastY, gap = now - lastAt;
    if (Math.abs(delta) < .5) return;
    const gesture = now - inputAt < 650 || (userDriven && gap < 140 && now - inputAt < 2500);
    const newGesture = gesture && !userDriven;
    if (gap > 180 || newGesture) { travel = 0; samples = 0; }
    // Capping the interval at80ms inflated ordinary mouse-wheel velocity.
    // Use its real elapsed time; only a sustained burst can switch presentation.
    const sample = delta / Math.max(16, newGesture ? Math.min(120, gap) : gap);
    speed = newGesture || Math.sign(sample) !== Math.sign(speed) || gap > 180 ? sample : speed * .45 + sample * .55;
    direction = Math.sign(delta); lastDelta = delta; lastY = y; lastAt = now; travel += Math.abs(delta); samples++;
    userDriven = !held && (gesture || (samples >= 3 && gap < 120 && travel > innerHeight * .35));
    hardJump = keyboardJump || !gesture && Math.abs(delta) > innerHeight * .6;
    if (gesture && !held) {
      pace = advanceScrollPace(pace, Math.abs(speed) * 1000 / innerHeight, now, travel / innerHeight);
      scan = pace.scanning;
    } else { pace = initialScrollPace(); scan = false; }
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; publish(); });
    clearTimeout(idle);
    idle = setTimeout(() => { speed = 0; scan = false; pace = initialScrollPace(); hardJump = false; userDriven = false; publish(); }, 280);
  };
  const jump = () => { requestDetailedView(); };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", input, { passive: true }); window.addEventListener("touchmove", input, { passive: true });
  window.addEventListener("keydown", input); window.addEventListener("hashchange", jump); window.addEventListener("popstate", jump);
  stop = () => {
    cancelAnimationFrame(frame); clearTimeout(idle); clearTimeout(commandIdle); commandScan = false;
    window.removeEventListener("scroll", onScroll); window.removeEventListener("wheel", input); window.removeEventListener("touchmove", input);
    window.removeEventListener("keydown", input); window.removeEventListener("hashchange", jump); window.removeEventListener("popstate", jump);
    speed = 0; scan = false; pace = initialScrollPace(); held = false; compensatedY = null; automaticUntil = 0; stop = undefined;
  };
}

export function subscribeScrollIntent(listener: () => void) {
  if (!listeners.size) start();
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) stop?.(); };
}
