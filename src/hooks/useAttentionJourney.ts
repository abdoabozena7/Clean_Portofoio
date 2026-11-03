import { useEffect } from "react";
import { attentionContent, type AttentionItem } from "@/data/attentionContent";
import { getScrollIntent, subscribeScrollIntent } from "@/lib/scrollIntent";
import { publishExploration, resetExploration, type EvidenceConfidence } from "@/lib/exploration";
import { discoveryScore, earnExposure, exposureRate } from "@/lib/discoveryScore";

type Line = { x: number; y: number; width: number; height: number; elapsed: number; seen: boolean };
type Block = { el: Element; kind: "text" | "media"; weight: number; requiredMs: number; lines: Line[]; credit: number; coverage: number; clips: Element[] };
type Story = {
  item: AttentionItem; el: HTMLElement; heading: HTMLElement; blocks: Block[]; details: HTMLElement[];
  top: number; previousTop: number; credit: number; exposure: number; coverage: number; encountered: boolean;
  gap: boolean; hadLeft: boolean;
  qualifiedMs: number; returnAt: number | null; actions: Set<string>; confidence: EvidenceConfidence;
};
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const cleanTitle = (el: HTMLElement) => (el.textContent || "").replace(/\d+ skills ↗/g, "").replace(/\s+/g, " ").trim();
const unavailable = '[aria-hidden="true"],[inert],[data-building],[data-scene-building]';
const sampleIntervalMs = 100;

/** In-memory evidence of expanded exposure. No reading claims, storage or telemetry. */
export function useAttentionJourney() {
  useEffect(() => {
    let disposed = false, regrouping = false, measureDirty = true, clock = 0;
    let lastAt = performance.now(), suppressSweepUntil = 0;
    let inspection: { story: Story; started: number } | null = null;
    const visible = new Set<Story>();
    const candidates = [...document.querySelectorAll<HTMLElement>("[data-scan-item],[data-project],.skill-category,#about > div,#hero .text-center,[data-construction-scene='activity']")];

    const makeBlocks = (el: HTMLElement, heading: HTMLElement) => {
      const blocks: Block[] = [], added = new Set<Element>();
      const add = (elements: Element[], weight: number, kind: Block["kind"], metadata = false) => {
        const unique = [...new Set(elements)].filter(node => !added.has(node));
        unique.forEach(node => {
          added.add(node);
          const words = (node.textContent || "").trim().split(/\s+/).filter(Boolean).length;
          blocks.push({ el: node, kind, weight: weight / unique.length, requiredMs: kind === "media" ? 2000 : metadata ? 800 : clamp(words / 4, 1.2, 8) * 1000, lines: [], credit: 0, coverage: 0, clips: [] });
        });
      };
      add([heading], .15, "text");
      const body = [...el.querySelectorAll("p")];
      const skills = [...el.querySelectorAll(".palette-tag")];
      const introduction = [...el.querySelectorAll("[data-microsoft-headline] > span,.mt-6[data-construction='text'],.palette-tag")];
      add(el.closest("#hero") ? introduction : el.matches(".skill-category") ? skills : body, .45, "text");
      add([...el.querySelectorAll(".experience-role,.credential-copy > div")], .1, "text", true);
      const media: Element[] = [...el.querySelectorAll("img,.harrtest-flow")];
      if (el.matches("[data-construction-scene='activity']")) media.push(el);
      add(media, .3, "media");
      // A brief-less record still has inspectable real metadata, not invented filler.
      if (blocks.length === 1) add([...el.querySelectorAll("[data-scan-detail]")].filter(node => !node.querySelector("[data-scan-detail]")), .45, "text");
      return blocks;
    };
    const records: Story[] = candidates.map((el, index) => {
      const known = attentionContent.find(item => el.matches(item.selector)), section = el.closest("section")!;
      const heading = el.querySelector<HTMLElement>("h3,h1") || el.parentElement?.querySelector<HTMLElement>("h3") || section.querySelector<HTMLElement>("h2")!;
      const title = section.id === "hero" ? "Introduction" : section.id === "about" ? "About me" : el.dataset.constructionScene === "activity" ? "GitHub Activity" : cleanTitle(heading);
      const id = known?.id || `story-${section.id}-${index}`;
      el.dataset.discoveryId = id;
      const top = el.getBoundingClientRect().top + scrollY;
      return { item: known || { id, selector: `[data-discovery-id="${id}"]`, title, message: `There’s more to ${title}. Take a closer look.` }, el, heading, blocks: makeBlocks(el, heading), details: [...el.querySelectorAll<HTMLElement>("[data-scan-detail]")],
        top, previousTop: top - scrollY, credit: 0, exposure: 0, coverage: 0, encountered: false, gap: false, hadLeft: false, qualifiedMs: 0, returnAt: null, actions: new Set<string>(), confidence: "low" };
    });

    const painted = (el: Element) => {
      if (el.closest(unavailable)) return false;
      for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity) < .99 || (style.clipPath !== "none" && style.clipPath !== "inset(0px)")) return false;
      }
      return true;
    };
    const completeSurface = (story: Story) => !story.el.closest('[data-building],[data-scene-building]') && !story.el.querySelector('[data-building],[data-scene-building]');
    const expanded = (story: Story) => completeSurface(story) && painted(story.el) && story.details.every(detail => !detail.inert && detail.getAttribute("aria-hidden") !== "true" && Number(getComputedStyle(detail).opacity) >= .99);
    const canObserve = () => !document.hidden && document.hasFocus() && !getScrollIntent().automatic && !document.querySelector('[role="dialog"],[data-exploration-map]');

    const measure = () => {
      records.forEach(story => {
        story.top = story.el.getBoundingClientRect().top + scrollY; story.previousTop = story.top - scrollY;
        story.blocks.forEach(block => {
          const lines: Line[] = [];
          const append = (rect: DOMRect) => {
            if (rect.width <= 0 || rect.height <= 0) return;
            const x = rect.left + scrollX, y = rect.top + scrollY;
            const previous = lines.find(line => Math.abs(line.y - y) < 2);
            if (previous) { const right = Math.max(previous.x + previous.width, x + rect.width); previous.x = Math.min(previous.x, x); previous.width = right - previous.x; previous.height = Math.max(previous.height, rect.height); }
            else lines.push({ x, y, width: rect.width, height: rect.height, elapsed: block.credit * block.requiredMs, seen: false });
          };
          if (block.kind === "media") append(block.el.getBoundingClientRect());
          else {
            const walker = document.createTreeWalker(block.el, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              if (!walker.currentNode.textContent?.trim()) continue;
              const range = document.createRange(); range.selectNodeContents(walker.currentNode);
              Array.from(range.getClientRects()).forEach(append);
            }
          }
          lines.sort((a, b) => a.y - b.y);
          lines.forEach((line, index) => { line.seen = index < Math.round(block.coverage * lines.length); });
          block.lines = lines; block.clips = [];
          for (let parent = block.el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            if (/(hidden|clip|auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) block.clips.push(parent);
          }
        });
      });
      measureDirty = false;
    };
    const lineVisibility = (block: Block, line: Line) => {
      let left = Math.max(0, line.x - scrollX), right = Math.min(innerWidth, line.x + line.width - scrollX);
      let top = Math.max(76, line.y - scrollY), bottom = Math.min(innerHeight - 56, line.y + line.height - scrollY);
      for (const parent of block.clips) {
        const rect = parent.getBoundingClientRect();
        left = Math.max(left, rect.left); right = Math.min(right, rect.right); top = Math.max(top, rect.top); bottom = Math.min(bottom, rect.bottom);
      }
      if (right <= left || bottom <= top) return 0;
      const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
      if (!hit || !(block.el === hit || block.el.contains(hit))) return 0;
      return Math.min(1, (right - left) / Math.min(line.width, innerWidth)) * Math.min(1, (bottom - top) / Math.min(line.height, innerHeight - 132));
    };
    const encounter = (story: Story) => {
      if (story.encountered) return false;
      story.encountered = true; return true;
    };
    const publish = () => {
      const covered = records.filter(story => story.exposure >= .6 && story.coverage >= .75);
      const fullyExposed = records.filter(story => story.credit >= .995 && story.coverage >= .95);
      records.forEach(story => {
        const values = { quality: String(Math.round(story.credit * 1000) / 10), qualityCoverage: String(Math.round(story.coverage * 100)), qualityEncountered: String(story.encountered), qualityConfidence: story.confidence };
        Object.entries(values).forEach(([key, value]) => { if (story.el.dataset[key] !== value) story.el.dataset[key] = value; });
        if (story.el.matches("[data-experience-item],[data-certificate],[data-project]")) {
          const progress = String(Math.round(story.credit * 1000) / 1000);
          if (story.el.style.getPropertyValue("--exploration-evidence") !== progress) story.el.style.setProperty("--exploration-evidence", progress);
          const complete = String(story.credit >= .995 && story.coverage >= .95);
          if (story.el.dataset.explorationComplete !== complete) story.el.dataset.explorationComplete = complete;
        }
      });
      publishExploration({ explored: fullyExposed.map(story => story.item.id), total: records.length, items: records.map(story => story.item),
        suggestedId: records.find(story => story.item.critical && story.credit < .995)?.item.id || null,
        score: discoveryScore(records.map(story => ({ id: story.item.id, credit: story.credit, encountered: story.encountered }))), gaps: records.filter(story => story.gap && story.exposure < .6).length,
        credits: Object.fromEntries(records.map(story => [story.item.id, Math.round(story.credit * 1000) / 1000])), encountered: records.filter(story => story.encountered).map(story => story.item.id), coverage: covered.length,
        confidence: Object.fromEntries(records.map(story => [story.item.id, story.confidence])) });
    };
    const scoreStory = (story: Story) => {
      const availableBlocks = story.blocks.filter(block => getComputedStyle(block.el).display !== "none");
      const weight = availableBlocks.reduce((sum, block) => sum + block.weight, 0) || 1;
      story.exposure = Math.max(story.exposure, availableBlocks.reduce((sum, block) => sum + block.credit * block.weight, 0) / weight);
      story.coverage = Math.max(story.coverage, availableBlocks.reduce((sum, block) => sum + (block.coverage * block.weight), 0) / weight);
      const qualifies = story.qualifiedMs >= 1000 && story.exposure >= .2 && story.coverage >= .6;
      const bonus = qualifies ? Math.min(.1, [...story.actions].reduce((sum, action) => sum + (action === "inspect" ? .05 : .025), 0)) : 0;
      story.credit = Math.max(story.credit, Math.min(1, story.exposure + bonus));
      story.confidence = story.exposure >= .85 && story.coverage >= .9 && (story.actions.size > 0 || story.qualifiedMs >= 8000) ? "high" : story.exposure >= .35 && story.coverage >= .6 ? "medium" : "low";
      if (story.exposure >= .6 && story.coverage >= .75) story.gap = false;
    };
    const stopClock = () => { clearInterval(clock); clock = 0; };
    const sample = () => {
      const now = performance.now(), dt = Math.min(250, now - lastAt); lastAt = now;
      if (measureDirty && !regrouping) measure();
      if (inspection && now - inspection.started > 1000 && !document.querySelector('[role="dialog"]')) inspection = null;
      if (inspection && document.querySelector('[role="dialog"] img')) {
        const image = document.querySelector<HTMLImageElement>('[role="dialog"] img');
        if (!document.hidden && document.hasFocus() && image?.complete && image.naturalWidth > 0 && now - inspection.started >= 600 && inspection.story.qualifiedMs >= 1000) {
          inspection.story.actions.add("inspect"); scoreStory(inspection.story); inspection = null;
        }
      }
      if (canObserve() && !regrouping) {
        const intent = getScrollIntent(), rate = exposureRate((intent.active ? Math.abs(intent.speed) : 0) * 1000 / innerHeight);
        visible.forEach(story => {
          const heading = story.heading.getBoundingClientRect();
          if (heading.bottom > 76 && heading.top < innerHeight - 56 && painted(story.heading)) encounter(story);
          if (!expanded(story)) return;
          let observed = false;
          story.blocks.forEach(block => {
            if (!painted(block.el) || block.el instanceof HTMLImageElement && (!block.el.complete || !block.el.naturalWidth) || block.el.matches('[data-construction-scene="activity"]') && !block.el.hasAttribute("data-activity-ready")) return;
            if (block.kind === "media" && !block.lines.length) { measureDirty = true; return; }
            block.lines.forEach(line => {
              const fraction = lineVisibility(block, line);
              if (fraction < .6) return;
              observed = true;
              if (rate > 0) {
                line.elapsed = Math.min(block.requiredMs, line.elapsed + dt * rate * fraction);
                if (line.elapsed >= Math.min(400, block.requiredMs)) line.seen = true;
              }
            });
            const width = block.lines.reduce((sum, line) => sum + line.width, 0) || 1;
            block.credit = Math.max(block.credit, block.lines.reduce((sum, line) => sum + earnExposure(0, line.elapsed, block.requiredMs) * line.width, 0) / width);
            block.coverage = Math.max(block.coverage, block.lines.reduce((sum, line) => sum + (line.seen ? line.width : 0), 0) / width);
          });
          if (observed) {
            encounter(story); story.qualifiedMs += dt * rate;
            if (story.returnAt !== null && story.qualifiedMs - story.returnAt >= 1000) { story.actions.add("revisit"); story.returnAt = null; }
            scoreStory(story);
          }
        });
      }
      publish();
      // Keep the last qualified sample alive until the evidence is actually
      // saturated; a near-complete99.9% logo must not freeze just before its end.
      if (![...visible].some(story => story.credit < 1) && !inspection) stopClock();
    };
    const startClock = () => { if (!clock && !document.hidden && document.hasFocus()) { lastAt = performance.now(); clock = window.setInterval(sample, sampleIntervalMs); } };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const story = records.find(story => story.el === entry.target); if (!story) return;
        if (entry.isIntersecting) { visible.add(story); if (story.hadLeft && getScrollIntent().userDriven && getScrollIntent().direction < 0) story.returnAt ??= story.qualifiedMs; }
        else { if (visible.has(story) && story.encountered) story.hadLeft = true; visible.delete(story); }
      });
      if (visible.size) startClock(); else stopClock();
    }, { rootMargin: "-76px 0px -56px 0px", threshold: [0, .25, .5, 1] });
    records.forEach(story => observer.observe(story.el));
    const onIntent = () => {
      const intent = getScrollIntent(), now = performance.now();
      let changed = false;
      const userPass = intent.active && intent.inputDriven && intent.userDriven && !intent.hardJump && now >= suppressSweepUntil && canObserve();
      records.forEach(story => {
        const top = story.top - scrollY;
        const heading = story.heading.getBoundingClientRect();
        const currentlyVisible = heading.bottom > 76 && heading.top < innerHeight - 56;
        const crossed = intent.direction > 0 ? story.previousTop >= 76 && top < 76 : story.previousTop <= innerHeight - 56 && top > innerHeight - 56;
        // A painted heading can be encountered before the rest of a story is
        // ready. Only infer crossed positions when layout measurements are stable.
        const passed = currentlyVisible || (!regrouping && !measureDirty && crossed);
        if (userPass && passed && painted(story.heading)) {
          changed = encounter(story) || changed;
          if (Math.abs(intent.speed) * 1000 / innerHeight >= 1.2 && story.exposure < .6) {
            changed ||= !story.gap; story.gap = true;
          }
          if (intent.direction < 0 && story.hadLeft && currentlyVisible) story.returnAt ??= story.qualifiedMs;
        }
        story.previousTop = top;
      });
      if (changed) publish(); startClock();
    };
    const invalidate = () => { measureDirty = true; startClock(); };
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const control = target.closest("a,button"); if (!control) return;
      const story = records.find(story => story.el.contains(control)); if (!story) return;
      if (control.matches("[data-scan-toggle]")) story.actions.add("expand");
      else if (control.matches("a[href]")) story.actions.add("source");
      else if (control.matches("button") && (control.hasAttribute("aria-haspopup") || control.closest(".project-media") || /zoom/i.test(control.getAttribute("aria-label") || ""))) inspection = { story, started: performance.now() };
      scoreStory(story); publish(); startClock();
    };
    const keyboardJump = (event: KeyboardEvent) => {
      if (["Home", "End", "PageDown", "PageUp"].includes(event.key)) suppressSweepUntil = performance.now() + 800;
    };
    const visibility = () => { lastAt = performance.now(); if (document.hidden || !document.hasFocus()) stopClock(); else startClock(); };
    const onLayoutStart = () => { regrouping = true; };
    const onLayoutSettled = () => { regrouping = false; invalidate(); };
    const activityReady = () => { const story = records.find(record => record.el.matches('[data-construction-scene="activity"]')); if (story) story.blocks = makeBlocks(story.el, story.heading); invalidate(); };
    const unsubscribe = subscribeScrollIntent(onIntent);
    const resize = new ResizeObserver(invalidate); records.forEach(story => resize.observe(story.el));
    document.fonts.ready.then(() => { if (!disposed) invalidate(); });
    window.addEventListener("keydown", keyboardJump);
    window.addEventListener("resize", invalidate, { passive: true });
    window.addEventListener("portfolio:layout-start", onLayoutStart); window.addEventListener("portfolio:layout-settled", onLayoutSettled); window.addEventListener("portfolio:activity-ready", activityReady);
    document.addEventListener("click", click, true); document.addEventListener("visibilitychange", visibility); window.addEventListener("focus", visibility); window.addEventListener("blur", visibility);
    measure(); publish(); startClock();
    return () => {
      disposed = true; unsubscribe(); observer.disconnect(); resize.disconnect(); stopClock();
      window.removeEventListener("keydown", keyboardJump); window.removeEventListener("resize", invalidate);
      window.removeEventListener("portfolio:layout-start", onLayoutStart); window.removeEventListener("portfolio:layout-settled", onLayoutSettled); window.removeEventListener("portfolio:activity-ready", activityReady);
      document.removeEventListener("click", click, true); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("focus", visibility); window.removeEventListener("blur", visibility);
      records.forEach(story => { delete story.el.dataset.discoveryId; delete story.el.dataset.quality; delete story.el.dataset.qualityCoverage; delete story.el.dataset.qualityEncountered; delete story.el.dataset.qualityConfidence; delete story.el.dataset.explorationComplete; story.el.style.removeProperty("--exploration-evidence"); }); resetExploration();
    };
  }, []);
}
