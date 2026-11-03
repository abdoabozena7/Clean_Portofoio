import { useEffect } from "react";
import { FAST_SCROLL_RETURN_CONFIG as config, initialFastReturnBurst, observeFastReturn } from "@/lib/fastScrollReturn";
import { getScrollIntent, navigateForScrollReturn, subscribeScrollIntent } from "@/lib/scrollIntent";

/** High-threshold opt-in experiment. Ordinary input remains passive/native. */
export function useFastScrollReturn() {
  useEffect(() => {
    if (!config.enabled) return;
    let burst = initialFastReturnBurst(), previousY = scrollY, cooldownUntil = 0;
    let kind: "wheel" | "touch" | "keyboard" | "none" = "none", inputAt = -Infinity;
    let allowed = false, touching = false, pendingTouch = false, reversing = false;
    let wheelAt = -Infinity, wheelDelta = 0, wheelSpeed = 0;
    let reverseIdle: ReturnType<typeof setTimeout> | undefined;
    const nestedScrollCache = new WeakMap<Element, { at: number; nested: boolean }>();
    const excluded = (target: EventTarget | null) => {
      if (document.hidden || !document.hasFocus() || document.querySelector('[role="dialog"],[data-exploration-map]')) return true;
      if (document.activeElement?.matches('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return true;
      let el = target instanceof Element ? target : null;
      if (el?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"]')) return true;
      const origin = el, now = performance.now(), cached = origin ? nestedScrollCache.get(origin) : undefined;
      if (cached && now - cached.at < 500) return cached.nested;
      // Scrolling a terminal, dialog or other nested viewport is not page intent.
      while (el && el !== document.body && el !== document.documentElement) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 2) {
          if (origin) nestedScrollCache.set(origin, { at: now, nested: true });
          return true;
        }
        el = el.parentElement;
      }
      if (origin) nestedScrollCache.set(origin, { at: now, nested: false });
      return false;
    };
    const endReverse = () => {
      reversing = false; pendingTouch = false; burst = initialFastReturnBurst();
      clearTimeout(reverseIdle); window.removeEventListener("wheel", reverseWheel);
    };
    const cancel = () => { endReverse(); kind = "none"; allowed = false; previousY = scrollY; };
    const recordReturn = (phase: "trigger" | "reverse", from: number, to: number, start: number) => {
      window.dispatchEvent(new CustomEvent("portfolio:fast-scroll-return", {
        detail: { phase, from, to, burstStart: start, destination: config.destination },
      }));
    };
    const keepArmed = () => { clearTimeout(reverseIdle); reverseIdle = setTimeout(endReverse, 260); };
    function reverseWheel(event: WheelEvent) {
      if (!reversing || !allowed || event.defaultPrevented) return;
      if (wheelDelta <= 0 || wheelSpeed < config.speedViewportsPerSecond) { endReverse(); return; }
      // The non-passive listener exists ONLY while a qualified fast burst is
      // reversing. Slow input removes it before the browser's default action.
      event.preventDefault();
      const from = scrollY, to = Math.max(0, from - Math.min(wheelDelta, innerHeight * 1.25));
      navigateForScrollReturn(to); previousY = scrollY;
      recordReturn("reverse", from, scrollY, 0); keepArmed();
    }
    const trigger = () => {
      const now = performance.now(), from = scrollY, start = burst.startY;
      const destination: "burst-start" | "page-top" = config.destination;
      const to = destination === "page-top" ? 0 : Math.max(0, Math.min(start, from));
      if (from - to < 24) { burst = initialFastReturnBurst(); return; }
      reversing = true; pendingTouch = false; cooldownUntil = now + config.cooldownMs;
      burst = initialFastReturnBurst();
      navigateForScrollReturn(to); previousY = scrollY;
      recordReturn("trigger", from, scrollY, start);
      if (kind === "wheel") window.addEventListener("wheel", reverseWheel, { passive: false });
      keepArmed();
    };
    const onIntent = () => {
      const now = performance.now(), y = scrollY, delta = y - previousY, intent = getScrollIntent();
      const before = previousY; previousY = y;
      if (reversing) return;
      const eligible = allowed && kind !== "none" && kind !== "keyboard" && now - inputAt < 900 &&
        intent.active && intent.userDriven && !intent.hardJump && intent.direction > 0 && now >= cooldownUntil;
      if (delta === 0 && eligible) return;
      const observed = observeFastReturn(burst, { now, previousY: before, delta, viewportHeight: innerHeight,
        speed: Math.abs(intent.speed) * 1000 / innerHeight, eligible });
      burst = observed.burst;
      if (!observed.qualified) pendingTouch = false;
      if (observed.qualified) { if (touching) pendingTouch = true; else trigger(); }
    };
    const wheel = (event: WheelEvent) => {
      const now = performance.now(), gap = now - wheelAt;
      wheelDelta = event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? innerHeight : 1);
      wheelSpeed = wheelDelta * 1000 / Math.max(16, gap) / innerHeight; wheelAt = now;
      kind = "wheel"; inputAt = now;
      allowed = !event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) >= Math.abs(event.deltaX) && !excluded(event.target);
      if (reversing && (!allowed || wheelDelta <= 0 || wheelSpeed < config.speedViewportsPerSecond)) endReverse();
      if (!allowed) burst = initialFastReturnBurst();
    };
    const touchStart = (event: TouchEvent) => {
      endReverse(); previousY = scrollY; kind = "touch"; inputAt = performance.now(); touching = true; allowed = !excluded(event.target);
    };
    const touchMove = (event: TouchEvent) => { kind = "touch"; inputAt = performance.now(); allowed = !excluded(event.target); };
    const touchEnd = () => { touching = false; if (pendingTouch && allowed) trigger(); };
    const keyboard = () => { cancel(); kind = "keyboard"; };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("touchstart", touchStart, { passive: true }); window.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("touchend", touchEnd, { passive: true }); window.addEventListener("touchcancel", cancel, { passive: true });
    window.addEventListener("keydown", keyboard); window.addEventListener("pointerdown", cancel, { passive: true });
    window.addEventListener("hashchange", cancel); window.addEventListener("popstate", cancel); window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", visibility);
    const unsubscribe = subscribeScrollIntent(onIntent);
    return () => {
      unsubscribe(); endReverse();
      window.removeEventListener("wheel", wheel); window.removeEventListener("touchstart", touchStart); window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd); window.removeEventListener("touchcancel", cancel); window.removeEventListener("keydown", keyboard);
      window.removeEventListener("pointerdown", cancel); window.removeEventListener("hashchange", cancel); window.removeEventListener("popstate", cancel);
      window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
}
