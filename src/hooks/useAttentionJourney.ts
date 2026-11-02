import { useEffect, useRef, useState } from "react";
import { attentionContent, type AttentionItem } from "@/data/attentionContent";
import { getScrollIntent, requestDetailedView, subscribeScrollIntent } from "@/lib/scrollIntent";
import { publishExploration, resetExploration } from "@/lib/exploration";
import { discoveryScore, earnExposure } from "@/lib/discoveryScore";

type Story = { item: AttentionItem; el: HTMLElement; heading: HTMLElement; top: number; previousTop: number; credit: number; gap: boolean; duration: number; resolved: boolean; dismissed: boolean; details: HTMLElement[] };
type Reminder = { cue: AttentionItem | null; count: number };
const cleanTitle = (el: HTMLElement) => (el.textContent || "").replace(/\d+ skills ↗/g, "").replace(/\s+/g, " ").trim();

/** Actual expanded exposure earns credit; new fast passes add recoverable gaps.
 * Optional reminders never intercept input or navigate without a click. */
export function useAttentionJourney() {
  const [view, setView] = useState<Reminder>({ cue: null, count: 0 });
  const controls = useRef({ revisit: (_id?: string) => {}, dismiss: () => {} });
  useEffect(() => {
    const candidates = [...document.querySelectorAll<HTMLElement>("[data-scan-item],[data-project],.skill-category,#about .flex-1,#hero .text-center,[data-construction-scene='activity']")];
    const records: Story[] = candidates.map((el, index) => {
      const known = attentionContent.find(item => el.matches(item.selector));
      const heading = el.querySelector<HTMLElement>("h3,h1") || el.closest("section")!.querySelector<HTMLElement>("h2")!;
      const section = el.closest("section")!, title = section.id === "hero" ? "Introduction" : section.id === "about" ? "About me" : el.dataset.constructionScene === "activity" ? "GitHub Activity" : cleanTitle(heading);
      const id = known?.id || `story-${section.id}-${index}`;
      el.dataset.discoveryId = id;
      const top = el.getBoundingClientRect().top + scrollY;
      return { item: known || { id, selector: `[data-discovery-id="${id}"]`, title, message: `There’s more to ${title}. Take a closer look.` }, el, heading, top, previousTop: top - scrollY,
        credit: 0, gap: false, duration: el.hasAttribute("data-project") || section.id === "hero" ? 3600 : 3000, resolved: false, dismissed: false, details: [...el.querySelectorAll<HTMLElement>("[data-scan-detail]")] };
    });
    const pending = new Set<Story>(), visible = new Set<Story>();
    let current: Story | null = null, clock = 0, lastAt = performance.now(), revisitFrame = 0, disposed = false, regrouping = false;
    const readable = (story: Story) => {
      const r = story.el.getBoundingClientRect(), visibleHeight = Math.max(0, Math.min(r.bottom, innerHeight - 56) - Math.max(r.top, 76));
      return visibleHeight >= Math.min(r.height, innerHeight - 132) * .55 && !story.el.closest('[aria-hidden="true"],[inert],[data-building]') && !story.el.querySelector('[data-building]') && story.details.every(detail => !detail.inert && detail.getAttribute("aria-hidden") !== "true" && Number(detail.style.opacity || 1) >= .99);
    };
    const publish = () => {
      if (current && (current.resolved || current.dismissed || !pending.has(current))) current = null;
      current ||= [...pending].reverse().find(story => !story.resolved && !story.dismissed) || null;
      setView(previous => previous.cue?.id === current?.item.id && previous.count === pending.size ? previous : { cue: current?.item || null, count: pending.size });
      publishExploration({ explored: records.filter(story => story.credit >= 1).map(story => story.item.id), total: records.length, items: records.map(story => story.item),
        suggestedId: current?.item.id || records.find(story => story.gap && story.credit < 1)?.item.id || records.find(story => story.item.critical && story.credit < 1)?.item.id || null,
        score: discoveryScore(records.map(story => ({ id: story.item.id, credit: story.credit, gap: story.gap }))), gaps: records.filter(story => story.gap && story.credit < 1).length,
        credits: Object.fromEntries(records.map(story => [story.item.id, Math.round(story.credit * 100) / 100])) });
    };
    const resolveReminder = (story: Story) => { story.resolved = true; pending.delete(story); };
    const stopClock = () => { clearInterval(clock); clock = 0; };
    const sample = () => {
      const now = performance.now(), dt = Math.min(250, now - lastAt); lastAt = now;
      if (document.hidden || regrouping || document.querySelector('[role="dialog"],[data-exploration-map]')) return;
      const intent = getScrollIntent(); if (intent.active && Math.abs(intent.speed) > .45) return;
      let changed = false;
      visible.forEach(story => {
        if (story.credit >= 1 || !readable(story)) return;
        story.credit = earnExposure(story.credit, dt, story.duration); changed = true;
        if (story.credit >= 1) { story.gap = false; resolveReminder(story); }
      });
      if (changed) publish();
      if (![...visible].some(story => story.credit < 1)) stopClock();
    };
    const startClock = () => { if (!clock && [...visible].some(story => story.credit < 1)) { lastAt = performance.now(); clock = window.setInterval(sample, 200); } };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { const story = records.find(story => story.el === entry.target); if (!story) return; if (entry.isIntersecting) visible.add(story); else visible.delete(story); });
      if (visible.size) startClock(); else stopClock();
    }, { rootMargin: "-76px 0px -56px 0px", threshold: [0, .5, 1] });
    records.forEach(story => observer.observe(story.el)); publish();
    const remeasure = () => {
      records.forEach(story => { story.top = story.el.getBoundingClientRect().top + scrollY; story.previousTop = story.top - scrollY; });
      lastAt = performance.now(); startClock();
    };
    const onIntent = () => {
      const intent = getScrollIntent(); let changed = false;
      records.forEach(story => {
        const top = story.top - scrollY;
        const crossed = intent.direction > 0 ? story.previousTop >= 76 && top < 76 : story.previousTop <= innerHeight - 56 && top > innerHeight - 56;
        if (!regrouping && intent.inputDriven && intent.userDriven && intent.active && Math.abs(intent.speed) > .9 && crossed && story.credit < 1) {
          if (!story.gap) { story.gap = true; changed = true; }
          if (intent.direction > 0 && !story.dismissed && !story.resolved) { pending.add(story); changed = true; }
        }
        if (intent.direction < 0 && pending.has(story) && top >= 76 && top < innerHeight - 100) { resolveReminder(story); changed = true; }
        story.previousTop = top;
      });
      if (changed) publish(); startClock();
    };
    const cancelRevisit = () => { cancelAnimationFrame(revisitFrame); revisitFrame = 0; };
    controls.current = {
      dismiss: () => { pending.forEach(story => { story.dismissed = true; }); pending.clear(); current = null; publish(); },
      revisit: id => {
        const story = records.find(story => story.item.id === (id || current?.item.id)); if (!story) return;
        cancelRevisit(); resolveReminder(story); publish(); requestDetailedView();
        window.dispatchEvent(new CustomEvent("portfolio:attention-focus", { detail: story.item.id }));
        revisitFrame = requestAnimationFrame(() => { revisitFrame = requestAnimationFrame(() => {
          if (disposed) return;
          story.el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
          story.heading.setAttribute("tabindex", "-1"); story.heading.focus({ preventScroll: true }); remeasure();
        }); });
      },
    };
    const unsubscribe = subscribeScrollIntent(onIntent);
    const click = (event: MouseEvent) => { const target = event.target as HTMLElement; if (!target.closest("a,button")) return; const story = records.find(story => story.el.contains(target)); if (story) { resolveReminder(story); publish(); } };
    const revisit = (event: Event) => controls.current.revisit((event as CustomEvent<string>).detail);
    const visibility = () => { lastAt = performance.now(); };
    const onLayoutStart = () => { regrouping = true; };
    const onLayoutSettled = () => { regrouping = false; remeasure(); };
    const onFonts = () => { if (!disposed) remeasure(); }; document.fonts.ready.then(onFonts);
    window.addEventListener("wheel", cancelRevisit, { passive: true }); window.addEventListener("touchstart", cancelRevisit, { passive: true }); window.addEventListener("keydown", cancelRevisit);
    window.addEventListener("portfolio:explore-highlight", revisit); window.addEventListener("resize", remeasure, { passive: true });
    window.addEventListener("portfolio:layout-start", onLayoutStart); window.addEventListener("portfolio:layout-settled", onLayoutSettled);
    document.addEventListener("click", click, true); document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true; unsubscribe(); observer.disconnect(); stopClock(); cancelRevisit();
      window.removeEventListener("wheel", cancelRevisit); window.removeEventListener("touchstart", cancelRevisit); window.removeEventListener("keydown", cancelRevisit); window.removeEventListener("portfolio:explore-highlight", revisit); window.removeEventListener("resize", remeasure);
      window.removeEventListener("portfolio:layout-start", onLayoutStart); window.removeEventListener("portfolio:layout-settled", onLayoutSettled);
      document.removeEventListener("click", click, true); document.removeEventListener("visibilitychange", visibility);
      records.forEach(story => { delete story.el.dataset.discoveryId; }); resetExploration();
    };
  }, []);
  return { ...view, revisit: (id?: string) => controls.current.revisit(id), dismiss: () => controls.current.dismiss() };
}
