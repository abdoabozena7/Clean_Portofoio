import { useEffect, useState } from "react";
import { FAST_SCROLL_RETURN_CONFIG as config } from "@/lib/fastScrollReturn";
import { initialScrollVelocity, sampleScrollVelocity, wheelPixels } from "@/lib/scrollVelocity";
import { scrollCommand } from "@/lib/scrollCommand";
import { continueFastBrowsing, endFastBrowsing, navigateForScrollReturn } from "@/lib/scrollIntent";

const repeatWindowMs = 3000;
const attemptsToContinue = 3;

/** Interpret eligible commands before page movement. No section/exposure gate. */
export function useFastScrollReturn() {
  const [cue, setCue] = useState({ activation: 0, message: 0, visible: false, showMessage: false });
  useEffect(() => {
    if (!config.enabled) return;
    let velocity = initialScrollVelocity(), wheelAt: number | null = null;
    let source: "wheel" | "touch" | "none" = "none";
    let timer: ReturnType<typeof setTimeout> | undefined, frame = 0;
    let touching = false, owned = false, allowed = false;
    let x = 0, y = 0, touchAt = 0, releaseVelocity = 0, lastMove = 0;
    let attempts = 0, lastAttempt = -Infinity, gestureAttempt = false, passFast = false, lastReverse = false;
    let lineHeight = 20;
    const font = () => { const s = getComputedStyle(document.documentElement); lineHeight = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2 || 20; };
    font();
    const hide = () => setCue(previous => previous.visible ? { ...previous, visible: false } : previous);
    const fastAttempt = (now: number) => {
      if (!gestureAttempt) {
        gestureAttempt = true;
        attempts = now - lastAttempt <= repeatWindowMs ? attempts + 1 : 1;
        lastAttempt = now;
        passFast = attempts >= attemptsToContinue;
        const showMessage = !passFast;
        setCue(previous => ({ activation: previous.activation + 1, message: previous.message + Number(showMessage), visible: true, showMessage }));
        clearTimeout(timer); timer = setTimeout(hide, 900);
      }
      if (passFast) continueFastBrowsing();
      return passFast;
    };
    const stopInertia = () => { cancelAnimationFrame(frame); frame = 0; };
    const stopGesture = () => { stopInertia(); velocity = initialScrollVelocity(); source = 'none'; wheelAt = null; touching = false; owned = false; allowed = false; releaseVelocity = 0; gestureAttempt = false; passFast = false; lastReverse = false; };
    const cancel = () => { stopGesture(); attempts = 0; lastAttempt = -Infinity; endFastBrowsing(); hide(); };
    const ordinaryInput = () => {
      if (passFast) { passFast = false; gestureAttempt = false; attempts = 0; endFastBrowsing(); }
      hide();
    };
    const blocked = (origin: EventTarget | null) => {
      if (document.hidden || !document.hasFocus() || document.querySelector('[role="dialog"],[data-exploration-map]')) return true;
      if (document.activeElement?.matches('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return true;
      let el = origin instanceof Element ? origin : null;
      if (el?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"]')) return true;
      for (; el && el !== document.body; el = el.parentElement) {
        if (el.scrollHeight > el.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return true;
      }
      return false;
    };
    const apply = (delta: number, reverse: boolean, input: "wheel" | "touch" | "momentum") => {
      const from = scrollY;
      if (reverse) navigateForScrollReturn(Math.max(0, from + delta));
      else window.scrollTo({ top: Math.max(0, from + delta), behavior: 'instant' });
      window.dispatchEvent(new CustomEvent('portfolio:scroll-command', { detail: { input, reverse, from, to: scrollY, delta } }));
    };
    const wheel = (event: WheelEvent) => {
      stopInertia();
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || blocked(event.target)) { velocity = initialScrollVelocity(); wheelAt = null; return; }
      const now = performance.now(), delta = wheelPixels(event.deltaY, event.deltaMode, innerHeight, lineHeight);
      if (source !== 'wheel') { velocity = initialScrollVelocity(); wheelAt = null; source = 'wheel'; }
      const gap = wheelAt === null || now - wheelAt > 240 ? null : now - wheelAt;
      if (gap === null) { gestureAttempt = false; passFast = false; }
      wheelAt = now;
      const sample = sampleScrollVelocity(velocity, now, delta, innerHeight); velocity = sample.state;
      const command = scrollCommand(delta, gap, innerHeight, sample.recentSpeed, true);
      if (command.reverse && event.cancelable) {
        if (!fastAttempt(now)) { event.preventDefault(); apply(command.delta, true, 'wheel'); }
      } else ordinaryInput();
    };
    const touchStart = (event: TouchEvent) => {
      stopGesture();
      if (event.touches.length !== 1 || blocked(event.target)) return;
      source = 'touch'; touching = true; allowed = true;
      x = event.touches[0].clientX; y = event.touches[0].clientY; touchAt = performance.now();
      // A timestamp anchor lets the first movement carry its own command.
      velocity = { ...initialScrollVelocity(), at: touchAt, direction: 1 };
    };
    const touchMove = (event: TouchEvent) => {
      if (!touching || !allowed) return;
      if (event.touches.length !== 1 || blocked(event.target)) { cancel(); return; }
      const point = event.touches[0], now = performance.now(), delta = y - point.clientY, dx = point.clientX - x;
      if (!owned && Math.abs(delta) < 4 && Math.abs(dx) < 4) return;
      if (!owned && Math.abs(dx) > Math.abs(delta) * 1.2) { cancel(); return; }
      // Cancel the FIRST vertical move, before native momentum takes ownership.
      // Taps, horizontal gestures, nested scrolling and pinch keep native behavior.
      if (!event.cancelable) { cancel(); return; }
      event.preventDefault(); owned = true;
      const dt = Math.max(1, now - touchAt);
      const sample = sampleScrollVelocity(velocity, now, delta, innerHeight); velocity = sample.state;
      const command = scrollCommand(delta, dt, innerHeight, sample.recentSpeed);
      const reverse = command.reverse && !fastAttempt(now);
      if (!command.reverse) ordinaryInput();
      const movement = reverse ? command.delta : delta;
      apply(movement, reverse, 'touch');
      lastReverse = reverse; releaseVelocity = movement / dt; lastMove = now;
      touchAt = now; y = point.clientY; x = point.clientX;
    };
    const touchEnd = () => {
      touching = false;
      if (!owned || !allowed) return;
      owned = false;
      const now = performance.now();
      const releasedSpeed = releaseVelocity * Math.exp(-Math.max(0, now - lastMove - 16) / 100);
      if (now - lastMove > 240 || Math.abs(releasedSpeed) < .05 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let previous = now, elapsed = 0, pending = 0, speed = Math.max(-6, Math.min(6, releasedSpeed));
      const reverse = lastReverse;
      const coast = (at: number) => {
        frame = 0;
        if (touching || blocked(null)) return;
        const dt = Math.min(32, at - previous); previous = at; elapsed += dt;
        speed *= Math.exp(-dt / 180);
        pending += speed * dt;
        if (Math.abs(pending) >= .5) {
          const before = scrollY; apply(pending, reverse, 'momentum'); pending -= scrollY - before;
        }
        const boundary = speed < 0 ? scrollY <= 0 : scrollY >= document.documentElement.scrollHeight - innerHeight - 1;
        if (Math.abs(speed) > .05 && elapsed < 700 && !boundary) frame = requestAnimationFrame(coast);
      };
      frame = requestAnimationFrame(coast);
    };
    const resize = () => { font(); cancel(); };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('touchstart', touchStart, { passive: true }); window.addEventListener('touchmove', touchMove, { passive: false }); window.addEventListener('touchend', touchEnd, { passive: true }); window.addEventListener('touchcancel', cancel, { passive: true });
    window.addEventListener('keydown', cancel); window.addEventListener('hashchange', cancel); window.addEventListener('popstate', cancel); window.addEventListener('blur', cancel); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', visibility);
    return () => {
      cancel(); clearTimeout(timer);
      window.removeEventListener('wheel', wheel); window.removeEventListener('touchstart', touchStart); window.removeEventListener('touchmove', touchMove); window.removeEventListener('touchend', touchEnd); window.removeEventListener('touchcancel', cancel);
      window.removeEventListener('keydown', cancel); window.removeEventListener('hashchange', cancel); window.removeEventListener('popstate', cancel); window.removeEventListener('blur', cancel); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return cue;
}
