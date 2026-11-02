/** One input-driven signal shared by construction and mobile regrouping. No React frames. */
export type ScrollIntent = { speed: number; direction: number; scan: boolean; active: boolean; hardJump: boolean; userDriven: boolean };
const listeners = new Set<() => void>();
let speed = 0, direction = 1, scan = false, hardJump = false, lastY = 0, lastAt = 0;
let inputAt = -Infinity, burstAt = 0, travel = 0, samples = 0, slowAt = 0;
let idle: ReturnType<typeof setTimeout> | undefined, frame = 0, stop: (() => void) | undefined;
let compensatedY: number | null = null, held = false;
let userDriven = false;
const publish = () => { listeners.forEach(listener => listener()); };

export function getScrollIntent(): ScrollIntent {
  const elapsed = performance.now() - lastAt;
  return { speed: speed * Math.exp(-Math.max(0, elapsed - 60) / 180), direction, scan: scan && !held, active: elapsed < 220, hardJump, userDriven };
}

/** Our anchor corrections are geometry bookkeeping, never evidence of user speed. */
export function compensateScroll(top: number) {
  const y = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, top));
  compensatedY = y; lastY = y;
  window.scrollTo({ top: y, behavior: "instant" });
}

export function requestDetailedView() {
  held = true; scan = false; speed = 0; hardJump = false; userDriven = false; publish();
}

function start() {
  lastY = scrollY; lastAt = performance.now();
  const input = (event: Event) => {
    if (event instanceof KeyboardEvent && !["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) return;
    if (event instanceof WheelEvent && event.ctrlKey) return;
    inputAt = performance.now(); compensatedY = null; held = false;
  };
  const onScroll = () => {
    const now = performance.now(), y = scrollY;
    if (compensatedY !== null && Math.abs(y - compensatedY) < 2) { compensatedY = null; lastY = y; return; }
    const delta = y - lastY, gap = now - lastAt;
    if (Math.abs(delta) < .5) return;
    const gesture = now - inputAt < 650 || (userDriven && gap < 140 && now - inputAt < 2500);
    const newGesture = gesture && !userDriven;
    if (gap > 180 || newGesture) { burstAt = now; travel = 0; samples = 0; slowAt = 0; }
    const sample = delta / Math.max(8, Math.min(80, gap));
    speed = newGesture || Math.sign(sample) !== Math.sign(speed) || gap > 180 ? sample : speed * .45 + sample * .55;
    direction = Math.sign(delta); lastY = y; lastAt = now; travel += Math.abs(delta); samples++;
    userDriven = !held && (gesture || (samples >= 3 && gap < 120 && travel > innerHeight * .35));
    hardJump = !gesture && Math.abs(delta) > innerHeight * .6;
    if (gesture && !held && Math.abs(speed) > .75 && now - burstAt >= 120 && travel > innerHeight * .35 && samples >= 3) scan = true;
    if (Math.abs(speed) < .25) { slowAt ||= now; if (now - slowAt > 150) scan = false; } else slowAt = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { frame = 0; publish(); });
    clearTimeout(idle);
    idle = setTimeout(() => { speed = 0; scan = false; hardJump = false; userDriven = false; publish(); }, 340);
  };
  const jump = () => { requestDetailedView(); };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", input, { passive: true }); window.addEventListener("touchmove", input, { passive: true });
  window.addEventListener("keydown", input); window.addEventListener("hashchange", jump); window.addEventListener("popstate", jump);
  stop = () => {
    cancelAnimationFrame(frame); clearTimeout(idle);
    window.removeEventListener("scroll", onScroll); window.removeEventListener("wheel", input); window.removeEventListener("touchmove", input);
    window.removeEventListener("keydown", input); window.removeEventListener("hashchange", jump); window.removeEventListener("popstate", jump);
    speed = 0; scan = false; held = false; compensatedY = null; stop = undefined;
  };
}

export function subscribeScrollIntent(listener: () => void) {
  if (!listeners.size) start();
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) stop?.(); };
}
