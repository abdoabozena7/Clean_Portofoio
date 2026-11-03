import { useEffect, type RefObject } from "react";
import { FAST_SCROLL_RETURN_CONFIG as config } from "@/lib/fastScrollReturn";
import { initialScrollVelocity, sampleScrollVelocity, wheelPixels } from "@/lib/scrollVelocity";
import { getScrollIntent, navigateForScrollReturn, requestDetailedView, subscribeScrollIntent } from "@/lib/scrollIntent";

/** A local, section-aware experiment. Exposure never proves reading. */
export function useFastScrollReturn(cueRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    if (!config.enabled) return;
    const sections = [...document.querySelectorAll<HTMLElement>('section[id]')].filter(el => !['hero', 'contact'].includes(el.id));
    const entered = new Set<HTMLElement>(), returned = new Set<HTMLElement>();
    let previousY = scrollY, bounds = sections.map(el => el.getBoundingClientRect());
    let velocity = initialScrollVelocity(), inputAt = -Infinity;
    let source: "wheel" | "touch" | "none" = "none";
    const rootFont = getComputedStyle(document.documentElement);
    let lineHeight = parseFloat(rootFont.lineHeight) || parseFloat(rootFont.fontSize) * 1.2 || 20;
    let target: HTMLElement | null = null, reversing = false, arrived = false, qualifiedUntil = 0;
    let cueTimer: ReturnType<typeof setTimeout> | undefined;
    const cue = cueRef.current;
    const hide = () => { if (cue) cue.dataset.visible = 'false'; };
    const show = () => {
      if (!cue || !target) return;
      if (cue.dataset.visible !== 'true') cue.style.setProperty('--return-color', ['#2bbaa5','#93d3ae','#faecb6','#f9a822','#f96635'][Math.floor(Math.random() * 5)]);
      cue.dataset.visible = 'true'; cue.dataset.section = target.id;
      const label = cue.querySelector('[data-return-section]');
      if (label) label.textContent = target.querySelector('h2')?.textContent?.trim() || target.id;
      clearTimeout(cueTimer); cueTimer = setTimeout(hide, 1100);
    };
    const resetBounds = () => { previousY = scrollY; bounds = sections.map(el => el.getBoundingClientRect()); };
    const cancel = () => { target = null; reversing = false; arrived = false; qualifiedUntil = 0; velocity = initialScrollVelocity(); source = "none"; entered.clear(); hide(); resetBounds(); };
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
    const hasExposure = (section: HTMLElement) => [...section.querySelectorAll<HTMLElement>('[data-discovery-id]')].some(el => Number(el.dataset.quality || 0) >= 60 && Number(el.dataset.qualityCoverage || 0) >= 75);
    const returnStep = (delta: number) => {
      if (!target) return;
      requestDetailedView(); // Restore adaptive geometry before measuring destination.
      const stopY = Math.max(0, scrollY + target.getBoundingClientRect().top - 96);
      const from = scrollY, to = Math.max(stopY, from - Math.min(delta, innerHeight * 1.25));
      navigateForScrollReturn(Math.min(from, to)); resetBounds(); show();
      if (scrollY <= stopY + 2) { arrived = true; returned.add(target); }
      window.dispatchEvent(new CustomEvent('portfolio:fast-scroll-return', { detail: { phase: 'reverse', from, to: scrollY, section: target.id, arrived } }));
    };
    const onIntent = () => {
      const now = performance.now(), intent = getScrollIntent(), y = scrollY;
      const next = sections.map(el => el.getBoundingClientRect());
      const nativeForward = y > previousY + .5 && !intent.automatic && !intent.hardJump && intent.userDriven && now - inputAt < 900;
      if (nativeForward && !target && !blocked(null)) {
        sections.forEach((section, i) => {
          const before = bounds[i], after = next[i];
          if (before.top >= 76 && after.top < innerHeight) entered.add(section);
          if (entered.has(section) && before.bottom > 96 && after.bottom <= 96 && !returned.has(section) && !hasExposure(section) && (now < qualifiedUntil || Math.abs(intent.speed) * 1000 / innerHeight > 1.8)) {
            target = section; arrived = false;
          }
        });
      }
      previousY = y; bounds = next;
    };
    const wheel = (event: WheelEvent) => {
      const now = performance.now(); inputAt = now;
      const delta = wheelPixels(event.deltaY, event.deltaMode, innerHeight, lineHeight);
      const eligible = !event.defaultPrevented && !event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) >= Math.abs(event.deltaX) && !blocked(event.target);
      if (!eligible) { reversing = false; qualifiedUntil = 0; velocity = initialScrollVelocity(); return; }
      if (target && hasExposure(target)) cancel();
      if (source !== "wheel") { velocity = initialScrollVelocity(); qualifiedUntil = 0; source = "wheel"; }
      const result = sampleScrollVelocity(velocity, now, delta, innerHeight);
      velocity = result.state;
      if (reversing && (delta <= 0 || result.recentSpeed < config.speedViewportsPerSecond * .75)) {
        reversing = false;
        if (arrived) { target = null; arrived = false; show(); }
      }
      if (result.qualified) qualifiedUntil = now + 350;
      if (target && delta > 0 && (reversing || result.qualified) && event.cancelable) {
        event.preventDefault(); reversing = true; returnStep(delta);
      }
    };
    // Touch remains native while held; its fast native momentum can return only
    // after an actual skipped section, using the same bounded destination.
    let touchY = 0;
    const touchStart = (event: TouchEvent) => { if (event.touches.length !== 1) { cancel(); return; } inputAt = performance.now(); touchY = event.touches[0]?.clientY || 0; reversing = false; qualifiedUntil = 0; velocity = initialScrollVelocity(); source = "touch"; };
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) { velocity = initialScrollVelocity(); qualifiedUntil = 0; return; }
      const now = performance.now(), y = event.touches[0]?.clientY || touchY;
      const result = sampleScrollVelocity(velocity, now, touchY - y, innerHeight);
      inputAt = now; touchY = y;
      velocity = result.state;
      if (blocked(event.target) || result.recentSpeed < config.speedViewportsPerSecond * .75) { qualifiedUntil = 0; if (blocked(event.target)) velocity = initialScrollVelocity(); }
      else if (result.qualified) qualifiedUntil = now + 350;
    };
    const touchEnd = () => { if (target && performance.now() < qualifiedUntil && !blocked(null)) returnStep(innerHeight * .75); };
    const jump = () => cancel();
    const unsubscribe = subscribeScrollIntent(onIntent);
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('touchstart', touchStart, { passive: true }); window.addEventListener('touchmove', touchMove, { passive: true }); window.addEventListener('touchend', touchEnd, { passive: true });
    window.addEventListener('touchcancel', cancel, { passive: true });
    window.addEventListener('keydown', jump); window.addEventListener('hashchange', jump); window.addEventListener('popstate', jump); window.addEventListener('blur', jump);
    // A resize callback can run between native scroll and its intent frame.
    // Updating the previous bounds there would erase a real section crossing.
    const onResize = () => { if (performance.now() - inputAt > 500) resetBounds(); };
    const onViewportResize = () => { const style = getComputedStyle(document.documentElement); lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20; cancel(); };
    window.addEventListener('resize', onViewportResize);
    const resize = new ResizeObserver(onResize); sections.forEach(el => resize.observe(el));
    return () => {
      unsubscribe(); resize.disconnect(); clearTimeout(cueTimer); hide();
      window.removeEventListener('resize', onViewportResize);
      window.removeEventListener('wheel', wheel); window.removeEventListener('touchstart', touchStart); window.removeEventListener('touchmove', touchMove); window.removeEventListener('touchend', touchEnd);
      window.removeEventListener('touchcancel', cancel);
      window.removeEventListener('keydown', jump); window.removeEventListener('hashchange', jump); window.removeEventListener('popstate', jump); window.removeEventListener('blur', jump);
    };
  }, [cueRef]);
}
