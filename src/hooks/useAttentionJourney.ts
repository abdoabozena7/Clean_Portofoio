import { useEffect, useRef, useState } from "react";
import { attentionContent, type AttentionItem } from "@/data/attentionContent";
import { compensateScroll, getScrollIntent, requestDetailedView, subscribeScrollIntent } from "@/lib/scrollIntent";

type Phase = "idle" | "warning" | "relocating" | "reviewing" | "complete";
export type AttentionView = { phase: Phase; item: AttentionItem | null; cue: AttentionItem | null; progress: number; seconds: number };
type Record = { item: AttentionItem; el: HTMLElement; heading: HTMLElement; exposure: number; previousTop: number; seen: boolean; dismissed: boolean; entered: boolean };
const empty: AttentionView = { phase: "idle", item: null, cue: null, progress: 0, seconds: 3 };

/** Explicitly requested highlight stops; ordinary reminders never take over scrolling. */
export function useAttentionJourney() {
  const [view, setView] = useState<AttentionView>(empty);
  const controls = useRef({ revisit: (_id?: string) => {}, dismiss: () => {}, escape: () => {} });
  useEffect(() => {
    const records: Record[] = attentionContent.flatMap(item => {
      const el = document.querySelector<HTMLElement>(item.selector), heading = el?.querySelector<HTMLElement>("h3");
      return el && heading ? [{ item, el, heading, exposure: 0, previousTop: heading.getBoundingClientRect().top, seen: false, dismissed: false, entered: false }] : [];
    });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const visible = new Set<Record>(), missed = new Set<Record>();
    let current = empty, active: Record | null = null, lockedY: number | null = null;
    let elapsed = 0, lastTick = performance.now(), timer = 0, settleTimer = 0, completedTimer = 0, alive = true;
    const emit = (patch: Partial<AttentionView>) => {
      current = { ...current, ...patch }; setView(current);
      document.documentElement.dataset.attentionPhase = current.phase;
      window.dispatchEvent(new CustomEvent("portfolio:attention-status", { detail: current }));
    };
    const readable = (record: Record) => {
      const r = record.heading.getBoundingClientRect();
      return r.top >= 76 && r.bottom < innerHeight - 56 && !record.el.closest('[aria-hidden="true"],[inert],[data-building]') && !record.el.querySelector('[data-building]') && !document.querySelector('[role="dialog"]');
    };
    const markSeen = (record: Record) => {
      record.seen = true; missed.delete(record); record.el.dataset.attentionSeen = "true";
      if (current.cue?.id === record.item.id) emit({ cue: null });
    };
    const finish = () => {
      if (active) markSeen(active);
      records.forEach(r => { r.previousTop = r.heading.getBoundingClientRect().top; });
      lockedY = null; emit({ phase: "complete", progress: 1, seconds: 0, cue: null });
      clearTimeout(completedTimer);
      completedTimer = window.setTimeout(() => { active = null; emit({ phase: "idle", item: null, progress: 0 }); }, 1600);
    };
    const clock = () => {
      const now = performance.now(), dt = Math.min(250, now - lastTick); lastTick = now;
      if (document.hidden) return;
      if (current.phase === "warning") {
        elapsed += dt; emit({ seconds: Math.max(0, Math.ceil((3000 - elapsed) / 1000)), progress: Math.min(1, elapsed / 3000) });
        if (elapsed >= 3000) revisit(active?.item.id);
        return;
      }
      if (current.phase === "relocating") return;
      if (current.phase === "reviewing" && active) {
        if (readable(active)) elapsed += dt; else elapsed = 0;
        emit({ progress: Math.min(1, elapsed / 3000), seconds: Math.max(0, Math.ceil((3000 - elapsed) / 1000)) });
        if (elapsed >= 3000) finish();
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      visible.forEach(record => {
        if (record.seen || !readable(record)) return;
        const detailed = !record.el.closest("[data-scan-active]") || record.el.dataset.attentionCritical === "true";
        if (!detailed) return;
        record.exposure += dt;
        if (record.entered && missed.has(record) && current.cue?.id === record.item.id) emit({ cue: null });
        if (record.exposure >= (record.item.critical ? 3000 : 1800)) markSeen(record);
      });
      updateClock();
    };
    const updateClock = () => {
      const needed = ["warning", "relocating", "reviewing"].includes(current.phase) || [...visible].some(r => !r.seen);
      if (needed && !timer) { lastTick = performance.now(); timer = window.setInterval(clock, 100); }
      else if (!needed && timer) { clearInterval(timer); timer = 0; }
    };
    const centerTarget = () => {
      if (!active || !alive) return;
      const r = active.el.getBoundingClientRect();
      compensateScroll(scrollY + r.top - Math.min(140, innerHeight * .17));
      active.heading.setAttribute("tabindex", "-1"); active.heading.focus({ preventScroll: true });
      records.forEach(record => { record.previousTop = record.heading.getBoundingClientRect().top; });
      elapsed = 0; lastTick = performance.now();
      if (active.item.critical) { lockedY = scrollY; emit({ phase: "reviewing", progress: 0, seconds: 3 }); }
      else { markSeen(active); active = null; emit({ phase: "idle", item: null }); }
      updateClock();
    };
    function revisit(id?: string) {
      if (current.phase === "reviewing") return;
      const record = records.find(r => r.item.id === (id || current.cue?.id || active?.item.id));
      if (!record) return;
      clearTimeout(settleTimer); clearTimeout(completedTimer);
      active = record; lockedY = null; elapsed = 0;
      emit({ phase: "relocating", item: record.item, cue: null, progress: 0, seconds: 3 });
      requestDetailedView();
      window.dispatchEvent(new CustomEvent("portfolio:attention-focus", { detail: record.item.id }));
      settleTimer = window.setTimeout(centerTarget, reduced.matches ? 50 : 380);
      updateClock();
    }
    const escape = () => {
      if (active) { active.dismissed = true; missed.delete(active); }
      clearTimeout(settleTimer); clearTimeout(completedTimer); lockedY = null; active = null;
      emit({ phase: "idle", item: null, cue: null, progress: 0 });
      window.dispatchEvent(new Event("portfolio:attention-release"));
      updateClock();
    };
    controls.current = { revisit, escape, dismiss: () => {
      const record = records.find(r => r.item.id === current.cue?.id); if (record) { record.dismissed = true; missed.delete(record); }
      emit({ cue: null });
    } };
    const onIntent = () => {
      if (current.phase !== "idle") return;
      const intent = getScrollIntent();
      records.forEach(record => {
        const top = record.heading.getBoundingClientRect().top;
        if (intent.inputDriven && intent.userDriven && intent.active && Math.abs(intent.speed) > .75 && intent.direction > 0 && record.previousTop >= 76 && top < 76 && !record.seen && !record.dismissed) missed.add(record);
        if (top >= 76 && top < innerHeight - 100) {
          if (missed.has(record) && intent.direction < 0) { missed.delete(record); if (current.cue?.id === record.item.id) emit({ cue: null }); }
          record.entered = true;
        }
        record.previousTop = top;
      });
      if (document.querySelector('[role="dialog"]')) return;
      const critical = [...missed].find(r => r.item.critical && !r.seen && !r.dismissed && r.heading.getBoundingClientRect().top < 76);
      if (critical && intent.inputDriven && intent.userDriven && intent.direction > 0) {
        active = critical; elapsed = 0; lastTick = performance.now(); emit({ phase: "warning", item: critical.item, cue: null, progress: 0, seconds: 3 }); updateClock(); return;
      }
      const cue = [...missed].find(r => !r.item.critical && !r.seen && !r.dismissed);
      if (current.cue?.id !== cue?.item.id) emit({ cue: cue?.item || null });
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const record = records.find(r => r.heading === entry.target); if (!record) return;
        if (entry.isIntersecting) { visible.add(record); record.entered = true; } else visible.delete(record);
      }); updateClock();
    }, { rootMargin: "-76px 0px -56px 0px", threshold: [0, 1] });
    records.forEach(r => observer.observe(r.heading));
    const blockInput = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") { if (active) escape(); return; }
      if (current.phase !== "reviewing" && current.phase !== "relocating") return;
      if (event instanceof KeyboardEvent && ![" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) return;
      if (event.cancelable) event.preventDefault();
    };
    const maintainPosition = () => { if (lockedY !== null && Math.abs(scrollY - lockedY) > 1) compensateScroll(lockedY); };
    const returnEvent = () => revisit();
    const stopForNavigation = () => { if (active) escape(); };
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const record = records.find(r => r.el.contains(target));
      if (record && target.closest("a,button") && !record.item.critical) markSeen(record);
    };
    const unsubscribe = subscribeScrollIntent(onIntent);
    window.addEventListener("wheel", blockInput, { passive: false, capture: true }); window.addEventListener("touchmove", blockInput, { passive: false, capture: true });
    window.addEventListener("keydown", blockInput, true); window.addEventListener("scroll", maintainPosition, { passive: true });
    window.addEventListener("portfolio:attention-return", returnEvent); window.addEventListener("hashchange", stopForNavigation); window.addEventListener("popstate", stopForNavigation); document.addEventListener("click", click, true);
    return () => {
      alive = false; observer.disconnect(); unsubscribe(); clearInterval(timer); clearTimeout(settleTimer); clearTimeout(completedTimer);
      window.removeEventListener("wheel", blockInput, true); window.removeEventListener("touchmove", blockInput, true); window.removeEventListener("keydown", blockInput, true); window.removeEventListener("scroll", maintainPosition);
      window.removeEventListener("portfolio:attention-return", returnEvent); window.removeEventListener("hashchange", stopForNavigation); window.removeEventListener("popstate", stopForNavigation); document.removeEventListener("click", click, true);
      delete document.documentElement.dataset.attentionPhase;
      records.forEach(r => { delete r.el.dataset.attentionSeen; r.heading.removeAttribute("tabindex"); });
    };
  }, []);
  return { ...view, revisit: (id?: string) => controls.current.revisit(id), dismiss: () => controls.current.dismiss(), escape: () => controls.current.escape() };
}
