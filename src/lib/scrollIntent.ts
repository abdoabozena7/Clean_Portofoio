/** One input-driven signal shared by construction and mobile regrouping. No React frames. */
import { advanceScrollPace, initialScrollPace } from "./scrollPace";
export type ScrollIntent = { speed: number; direction: number; scan: boolean; active: boolean; hardJump: boolean; leap: boolean; automatic: boolean; userDriven: boolean; inputDriven: boolean };
const listeners = new Set<() => void>();
let speed = 0, direction = 1, scan = false, hardJump = false, lastAt = 0;
let lastY: number | null = null;
let inputAt = -Infinity, travel = 0, samples = 0;
let idle: ReturnType<typeof setTimeout> | undefined, frame = 0, stop: (() => void) | undefined;
let compensatedY: number | null = null, held = false;
let userDriven = false;
let pace = initialScrollPace();
let lastDelta = 0, keyboardJump = false;
let automaticUntil = 0;
const publish = () => { listeners.forEach(listener => listener()); };
const schedulePublish = () => {
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; publish(); });
};
let viewportHeight = 0;
const height = () => viewportHeight || (viewportHeight = innerHeight);

export function getScrollIntent(): ScrollIntent {
  const now = performance.now(), elapsed = now - lastAt, automatic = now < automaticUntil;
  return { speed: speed * Math.exp(-Math.max(0, elapsed - 60) / 180), direction, scan: scan && !held, active: elapsed < 220, hardJump: hardJump && (!automaticUntil || automatic), leap: elapsed < 220 && lastDelta !== 0 && Math.abs(lastDelta) > height() * .95, automatic, userDriven, inputDriven: now - inputAt < 900 };
}

export function endScrollReturn() {
  if (automaticUntil) hardJump = false;
  automaticUntil = 0;
}

/** Our anchor corrections are geometry bookkeeping, never evidence of user speed. */
export function compensateScroll(top: number) {
  window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  const y = scrollY;
  compensatedY = y; lastY = y;
}

export function requestDetailedView() {
  const changed = !held || scan || speed !== 0 || hardJump || userDriven;
  held = true; scan = false; pace = initialScrollPace(); speed = 0; hardJump = false; userDriven = false;
  if (changed) publish();
}

/** Authorized experimental navigation. Automatic movement earns no user-speed
 * or exposure evidence; destination content is available like an explicit jump. */
export function navigateForScrollReturn(top: number, entered: boolean) {
  automaticUntil = performance.now() + 320;
  if (entered) {
    window.dispatchEvent(new Event("portfolio:fast-return-start"));
    requestDetailedView();
  }
  // Each step is still automatic, but only the first needs to restore layout.
  held = true;
  compensateScroll(top);
  hardJump = true; lastDelta = 0; lastAt = performance.now(); userDriven = false;
  if (entered) publish();
  else schedulePublish();
}

function start() {
  // The first real input or scroll supplies the offset. Reading scrollY
  // during the initial React commit can force layout of the entire page.
  lastY = null; lastDelta = 0; lastAt = performance.now();
  const input = (event: Event) => {
    if (event instanceof KeyboardEvent && !["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) return;
    if (event instanceof WheelEvent && event.ctrlKey) return;
    lastY ??= scrollY;
    keyboardJump = event instanceof KeyboardEvent && ["PageDown", "PageUp", "Home", "End", " "].includes(event.key);
    inputAt = performance.now(); compensatedY = null; held = false;
  };
  const onScroll = () => {
    const now = performance.now(), y = scrollY;
    if (compensatedY !== null && Math.abs(y - compensatedY) < 2) { compensatedY = null; lastY = y; return; }
    const delta = y - (lastY ?? 0), gap = now - lastAt;
    if (Math.abs(delta) < .5) return;
    const gesture = now - inputAt < 650 || (userDriven && gap < 140 && now - inputAt < 2500);
    const newGesture = gesture && !userDriven;
    if (gap > 180 || newGesture) { travel = 0; samples = 0; }
    // Capping the interval at80ms inflated ordinary mouse-wheel velocity.
    // Use its real elapsed time; only a sustained burst can switch presentation.
    const sample = delta / Math.max(16, newGesture ? Math.min(120, gap) : gap);
    speed = newGesture || Math.sign(sample) !== Math.sign(speed) || gap > 180 ? sample : speed * .45 + sample * .55;
    direction = Math.sign(delta); lastDelta = delta; lastY = y; lastAt = now; travel += Math.abs(delta); samples++;
    userDriven = !held && (gesture || (samples >= 3 && gap < 120 && travel > height() * .35));
    hardJump = keyboardJump || !gesture && Math.abs(delta) > height() * .6;
    if (gesture && !held) {
      pace = advanceScrollPace(pace, Math.abs(speed) * 1000 / height(), now, travel / height());
      scan = pace.scanning;
    } else { pace = initialScrollPace(); scan = false; }
    schedulePublish();
    clearTimeout(idle);
    idle = setTimeout(() => { speed = 0; scan = false; pace = initialScrollPace(); hardJump = false; userDriven = false; publish(); }, 280);
  };
  const jump = () => { requestDetailedView(); };
  const resize = () => { viewportHeight = 0; };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", input, { passive: true }); window.addEventListener("touchmove", input, { passive: true });
  window.addEventListener("keydown", input); window.addEventListener("hashchange", jump); window.addEventListener("popstate", jump);
  window.addEventListener("resize", resize, { passive: true });
  stop = () => {
    cancelAnimationFrame(frame); clearTimeout(idle);
    window.removeEventListener("scroll", onScroll); window.removeEventListener("wheel", input); window.removeEventListener("touchmove", input);
    window.removeEventListener("keydown", input); window.removeEventListener("hashchange", jump); window.removeEventListener("popstate", jump);
    window.removeEventListener("resize", resize); viewportHeight = 0;
    speed = 0; scan = false; pace = initialScrollPace(); held = false; compensatedY = null; automaticUntil = 0; stop = undefined;
  };
}

export function subscribeScrollIntent(listener: () => void) {
  if (!listeners.size) start();
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) stop?.(); };
}
