import { useEffect, useState } from "react";
import { FAST_SCROLL_RETURN_CONFIG as config } from "@/lib/fastScrollReturn";
import { initialScrollVelocity, sampleScrollVelocity, wheelPixels } from "@/lib/scrollVelocity";
import { createScrollBurst, scrollBurstIdleMs, scrollCommand } from "@/lib/scrollCommand";
import { endScrollReturn, navigateForScrollReturn } from "@/lib/scrollIntent";

const inputTime = (event: Event) => {
  const timestamp = event.timeStamp;
  return timestamp > performance.timeOrigin ? timestamp - performance.timeOrigin : timestamp || performance.now();
};

/** Interpret eligible commands before page movement. No section/exposure gate. */
export function useFastScrollReturn() {
  const [cue, setCue] = useState({ activation: 0, visible: false });
  useEffect(() => {
    if (!config.enabled) return;
    const burst = createScrollBurst();
    let velocity = initialScrollVelocity();
    let source: "wheel" | "touch" | "none" = "none";
    let timer: ReturnType<typeof setTimeout> | undefined, frame = 0;
    let touching = false, owned = false;
    let x = 0, y = 0, touchAt = 0, releaseVelocity = 0, lastMove = 0;
    let lastReverse = false;
    let cueVisible = false;
    let touchOrigin: EventTarget | null = null, touchOriginBlocked = false, touchOriginDirty = true;
    let gestureHeight = 1;
    let lineHeight: number | undefined;
    const wheelLineHeight = () => {
      if (lineHeight === undefined) {
        const style = getComputedStyle(document.documentElement);
        lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20;
      }
      return lineHeight;
    };
    const hide = () => {
      if (!cueVisible) return;
      cueVisible = false;
      setCue(previous => ({ ...previous, visible: false }));
    };
    const announce = () => {
      cueVisible = true;
      setCue(previous => ({ activation: previous.activation + 1, visible: true }));
      clearTimeout(timer); timer = setTimeout(hide, 900);
    };
    const stopInertia = () => { cancelAnimationFrame(frame); frame = 0; };
    const setSource = (next: typeof source) => {
      if (next === source) return;
      source = next; burst.reset(); velocity = initialScrollVelocity();
    };
    const cancel = () => {
      stopInertia(); setSource('none'); touching = false; owned = false;
      releaseVelocity = 0; lastReverse = false; endScrollReturn(); hide();
    };
    const blockedByPage = () => document.hidden || !document.hasFocus() ||
      !!document.querySelector('[role="dialog"],[data-exploration-map]') ||
      !!document.activeElement?.matches('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
    const blockedByOrigin = (origin: EventTarget | null) => {
      let el = origin instanceof Element ? origin : null;
      if (el?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"]')) return true;
      for (; el && el !== document.body; el = el.parentElement) {
        if (el.scrollHeight > el.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return true;
      }
      return false;
    };
    const blocked = (origin: EventTarget | null) => blockedByPage() || blockedByOrigin(origin);
    const invalidateTouchOrigin = () => { touchOriginDirty = true; };
    const apply = (delta: number, reverse: boolean, input: "wheel" | "touch" | "momentum", entered = false) => {
      const from = scrollY;
      if (reverse) navigateForScrollReturn(Math.max(0, from + delta), entered);
      else window.scrollTo({ top: Math.max(0, from + delta), behavior: 'instant' });
      const to = scrollY;
      window.dispatchEvent(new CustomEvent('portfolio:scroll-command', { detail: { input, reverse, from, to, delta } }));
      return to - from;
    };
    const readCommand = (delta: number, at: number, viewport: number, gap: number | null, wheel = false) => {
      const sample = sampleScrollVelocity(velocity, at, delta, viewport); velocity = sample.state;
      const strong = scrollCommand(delta, gap, viewport, sample.recentSpeed, wheel).reverse;
      const command = burst.move(delta, at, viewport, gap, strong);
      if (command.announce) announce();
      if (!command.reverse) { endScrollReturn(); hide(); }
      return command;
    };
    const wheel = (event: WheelEvent) => {
      stopInertia();
      if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || blocked(event.target)) { cancel(); return; }
      const viewport = innerHeight, at = inputTime(event);
      const mode = event.deltaMode, delta = wheelPixels(event.deltaY, mode, viewport, mode === 1 ? wheelLineHeight() : 20);
      if (!delta) return;
      setSource('wheel');
      const elapsed = velocity.at === null ? Infinity : at - velocity.at;
      const gap = elapsed < 0 || elapsed >= scrollBurstIdleMs ? null : elapsed;
      const command = readCommand(delta, at, viewport, gap, true);
      if (command.reverse) { event.preventDefault(); apply(-delta, true, 'wheel', command.entered); }
    };
    const touchStart = (event: TouchEvent) => {
      stopInertia(); touching = false; owned = false; releaseVelocity = 0; lastReverse = false;
      if (event.touches.length !== 1 || blocked(event.target)) { cancel(); return; }
      touchOrigin = event.target; touchOriginBlocked = false; touchOriginDirty = false;
      gestureHeight = innerHeight;
      setSource('touch'); touching = true;
      x = event.touches[0].clientX; y = event.touches[0].clientY; touchAt = inputTime(event);
      // A timestamp anchor lets the first movement carry its own command.
      velocity = { ...initialScrollVelocity(), at: touchAt, direction: 1 };
    };
    const touchMove = (event: TouchEvent) => {
      if (!touching) return;
      if (event.touches.length !== 1 || blockedByPage()) { cancel(); return; }
      if (touchOriginDirty || event.target !== touchOrigin) {
        touchOrigin = event.target; touchOriginDirty = false;
        touchOriginBlocked = blockedByOrigin(touchOrigin);
      }
      if (touchOriginBlocked) { cancel(); return; }
      const point = event.touches[0], at = inputTime(event), delta = y - point.clientY, dx = point.clientX - x;
      if (!owned && Math.abs(delta) < 4 && Math.abs(dx) < 4) return;
      if (!owned && Math.abs(dx) > Math.abs(delta) * 1.2) { cancel(); return; }
      // Cancel the FIRST vertical move, before native momentum takes ownership.
      // Taps, horizontal gestures, nested scrolling and pinch keep native behavior.
      if (!event.cancelable) { cancel(); return; }
      event.preventDefault(); owned = true;
      if (!delta) return;
      const elapsed = at - touchAt;
      const { reverse, entered } = readCommand(delta, at, gestureHeight, elapsed, false);
      const movement = reverse ? -delta : delta;
      apply(movement, reverse, 'touch', entered);
      lastReverse = reverse; releaseVelocity = movement / Math.max(1, elapsed); lastMove = at;
      touchAt = at; y = point.clientY; x = point.clientX;
    };
    const touchEnd = (event: TouchEvent) => {
      touching = false;
      if (!owned) return;
      owned = false;
      const pause = inputTime(event) - lastMove, now = performance.now();
      const releasedSpeed = releaseVelocity * Math.exp(-Math.max(0, pause - 16) / 100);
      if (pause >= scrollBurstIdleMs || Math.abs(releasedSpeed) < .05 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let previous = now, elapsed = 0, pending = 0, speed = Math.max(-6, Math.min(6, releasedSpeed));
      const reverse = lastReverse;
      const coast = (at: number) => {
        frame = 0;
        if (touching || blocked(null)) return;
        const dt = Math.min(32, at - previous); previous = at; elapsed += dt;
        speed *= Math.exp(-dt / 180);
        pending += speed * dt;
        let boundary = false;
        if (Math.abs(pending) >= .5) {
          pending -= apply(pending, reverse, 'momentum');
          // Fractional scroll coordinates can round by a pixel. A larger
          // remainder means the browser clamped the step at a document edge.
          boundary = Math.abs(pending) > 1;
        }
        if (Math.abs(speed) > .05 && elapsed < 700 && !boundary) frame = requestAnimationFrame(coast);
      };
      frame = requestAnimationFrame(coast);
    };
    const resize = () => { lineHeight = undefined; cancel(); };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('portfolio:layout-start', invalidateTouchOrigin);
    window.addEventListener('portfolio:layout-settled', invalidateTouchOrigin);
    window.addEventListener('touchstart', touchStart, { passive: true }); window.addEventListener('touchmove', touchMove, { passive: false }); window.addEventListener('touchend', touchEnd, { passive: true }); window.addEventListener('touchcancel', cancel, { passive: true });
    window.addEventListener('keydown', cancel); window.addEventListener('hashchange', cancel); window.addEventListener('popstate', cancel); window.addEventListener('blur', cancel); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', visibility);
    return () => {
      cancel(); clearTimeout(timer);
      window.removeEventListener('wheel', wheel); window.removeEventListener('touchstart', touchStart); window.removeEventListener('touchmove', touchMove); window.removeEventListener('touchend', touchEnd); window.removeEventListener('touchcancel', cancel);
      window.removeEventListener('portfolio:layout-start', invalidateTouchOrigin);
      window.removeEventListener('portfolio:layout-settled', invalidateTouchOrigin);
      window.removeEventListener('keydown', cancel); window.removeEventListener('hashchange', cancel); window.removeEventListener('popstate', cancel); window.removeEventListener('blur', cancel); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return cue;
}
