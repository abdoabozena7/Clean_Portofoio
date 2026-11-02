import { useEffect, useRef, useState } from "react";
import { attentionContent, type AttentionItem } from "@/data/attentionContent";
import { getScrollIntent, requestDetailedView, subscribeScrollIntent } from "@/lib/scrollIntent";
import { publishExploration, resetExploration } from "@/lib/exploration";

type Record = { item: AttentionItem; el: HTMLElement; heading: HTMLElement; previousTop: number; exposure: number; resolved: boolean; dismissed: boolean; explored: boolean };
type Reminder = { cue: AttentionItem | null; count: number };

/** Optional session-only invitations. No input interception, locks or automatic navigation. */
export function useAttentionJourney() {
  const [view, setView] = useState<Reminder>({ cue: null, count: 0 });
  const controls = useRef({ revisit: (_id?: string) => {}, dismiss: () => {} });
  useEffect(() => {
    const records: Record[] = attentionContent.flatMap(item => {
      const el = document.querySelector<HTMLElement>(item.selector), heading = el?.querySelector<HTMLElement>("h3");
      return el && heading ? [{ item, el, heading, previousTop: heading.getBoundingClientRect().top, exposure: 0, resolved: false, dismissed: false, explored: false }] : [];
    });
    const pending = new Set<Record>(), visible = new Set<Record>();
    let current: Record | null = null, clock = 0, lastAt = performance.now(), revisitFrame = 0, disposed = false;
    const readable = (r: Record) => {
      const box = r.heading.getBoundingClientRect();
      const surface = r.el.getBoundingClientRect(), visibleHeight = Math.max(0, Math.min(surface.bottom, innerHeight - 56) - Math.max(surface.top, 76));
      return box.top >= 76 && box.bottom < innerHeight - 56 && visibleHeight >= Math.min(surface.height, innerHeight - 132) * .65 && !r.el.closest('[aria-hidden="true"],[inert],[data-building]') && !r.el.querySelector('[data-building]') && [...r.el.querySelectorAll<HTMLElement>("[data-scan-detail]")].every(el => !el.inert && el.getAttribute("aria-hidden") !== "true");
    };
    const publish = () => {
      if (current && (current.resolved || current.dismissed || !pending.has(current))) current = null;
      current ||= [...pending].reverse().find(r => !r.resolved && !r.dismissed) || null;
      setView(previous => previous.cue?.id === current?.item.id && previous.count === pending.size ? previous : { cue: current?.item || null, count: pending.size });
      publishExploration({ explored: records.filter(r => r.explored).map(r => r.item.id), total: records.filter(r => r.item.critical).length,
        items: records.map(r => r.item), suggestedId: current?.item.id || records.find(r => r.item.critical && !r.explored)?.item.id || null });
    };
    const resolve = (record: Record) => { record.resolved = true; pending.delete(record); publish(); };
    const stopClock = () => { clearInterval(clock); clock = 0; };
    const sampleExposure = () => {
      const now = performance.now(), dt = Math.min(250, now - lastAt); lastAt = now;
      if (document.hidden || document.querySelector('[role="dialog"],[data-exploration-map]')) return;
      visible.forEach(record => {
        if (record.explored || !readable(record)) return;
        record.exposure += dt;
        if (record.exposure >= (record.item.critical ? 3000 : 1800)) { record.explored = true; resolve(record); }
      });
      if (![...visible].some(r => !r.explored)) stopClock();
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const record = records.find(r => r.heading === entry.target); if (!record) return;
        if (entry.isIntersecting) visible.add(record); else visible.delete(record);
      });
      if ([...visible].some(r => !r.explored) && !clock) { lastAt = performance.now(); clock = window.setInterval(sampleExposure, 150); }
      else if (!visible.size) stopClock();
    }, { rootMargin: "-76px 0px -56px 0px", threshold: [0, 1] });
    records.forEach(record => observer.observe(record.heading));
    publish();
    const onIntent = () => {
      const intent = getScrollIntent(); let changed = false;
      records.forEach(record => {
        const top = record.heading.getBoundingClientRect().top;
        if (intent.inputDriven && intent.userDriven && intent.active && intent.direction > 0 && Math.abs(intent.speed) > .75 && record.previousTop >= 76 && top < 76 && !record.resolved && !record.dismissed) { pending.add(record); changed = true; }
        if (intent.direction < 0 && pending.has(record) && top >= 76 && top < innerHeight - 100) { record.resolved = true; pending.delete(record); changed = true; }
        record.previousTop = top;
      });
      if (changed) publish();
    };
    const cancelRevisit = () => { cancelAnimationFrame(revisitFrame); revisitFrame = 0; };
    controls.current = {
      dismiss: () => { pending.forEach(record => { record.dismissed = true; }); pending.clear(); current = null; publish(); },
      revisit: id => {
        const record = records.find(r => r.item.id === (id || current?.item.id)); if (!record) return;
        cancelRevisit(); resolve(record); requestDetailedView();
        // Restore ordinary detail first. Only this explicit button click navigates.
        window.dispatchEvent(new CustomEvent("portfolio:attention-focus", { detail: record.item.id }));
        revisitFrame = requestAnimationFrame(() => { revisitFrame = requestAnimationFrame(() => {
          if (disposed) return;
          record.el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
          record.heading.setAttribute("tabindex", "-1"); record.heading.focus({ preventScroll: true });
          records.forEach(r => { r.previousTop = r.heading.getBoundingClientRect().top; });
        }); });
      },
    };
    const unsubscribe = subscribeScrollIntent(onIntent);
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("a,button")) return;
      const record = records.find(r => r.el.contains(target)); if (record) { record.explored = true; resolve(record); }
    };
    const revisit = (event: Event) => controls.current.revisit((event as CustomEvent<string>).detail);
    const visibility = () => { lastAt = performance.now(); };
    // A new gesture cancels a not-yet-started explicit return; it is never swallowed.
    window.addEventListener("wheel", cancelRevisit, { passive: true }); window.addEventListener("touchstart", cancelRevisit, { passive: true }); window.addEventListener("keydown", cancelRevisit);
    document.addEventListener("click", click, true);
    window.addEventListener("portfolio:explore-highlight", revisit);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true; unsubscribe(); observer.disconnect(); stopClock(); cancelRevisit();
      window.removeEventListener("wheel", cancelRevisit); window.removeEventListener("touchstart", cancelRevisit); window.removeEventListener("keydown", cancelRevisit); document.removeEventListener("click", click, true);
      window.removeEventListener("portfolio:explore-highlight", revisit); resetExploration();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return { ...view, revisit: (id?: string) => controls.current.revisit(id), dismiss: () => controls.current.dismiss() };
}
