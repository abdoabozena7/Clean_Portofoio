import { useEffect } from "react";
import { attentionContent, type AttentionItem } from "@/data/attentionContent";
import { getScrollIntent, subscribeScrollIntent } from "@/lib/scrollIntent";
import { publishExploration, resetExploration, type EvidenceConfidence } from "@/lib/exploration";
import { discoveryScore, earnExposure, exposureRate } from "@/lib/discoveryScore";

type Line = { x: number; y: number; width: number; height: number; elapsed: number; seen: boolean };
type Block = { el: Element; kind: "text" | "media"; weight: number; requiredMs: number; lines: Line[]; credit: number; coverage: number; clips: Element[] };
type Story = {
  item: AttentionItem; el: HTMLElement; heading: HTMLElement; blocks: Block[]; details: HTMLElement[];
  top: number; previousTop: number; headingTop: number; headingBottom: number; measuredAt: number;
  credit: number; exposure: number; coverage: number; encountered: boolean;
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
    let regrouping = false, measureDirty = true, clock = 0, revision = 0;
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
      return { item: known || { id, selector: `[data-discovery-id="${id}"]`, title, message: `There’s more to ${title}. Take a closer look.` }, el, heading, blocks: makeBlocks(el, heading), details: [...el.querySelectorAll<HTMLElement>("[data-scan-detail]")],
        top: 0, previousTop: 0, headingTop: 0, headingBottom: 0, measuredAt: -1,
        credit: 0, exposure: 0, coverage: 0, encountered: false, gap: false, hadLeft: false, qualifiedMs: 0, returnAt: null, actions: new Set<string>(), confidence: "low" };
    });
    const storiesByElement = new Map(records.map(story => [story.el, story]));
    const items = records.map(story => story.item);
    const dirty = new Set(records);
    for (const story of records) story.el.dataset.discoveryId = story.item.id;

    // Share browser reads within a sample. Discard the cache before DOM writes
    // so transitions, clipping and dialogs are always evaluated at their current state.
    const reads = () => {
      const styles = new Map<Element, CSSStyleDeclaration>(), rectangles = new Map<Element, DOMRect>();
      const visibility = new Map<Element, boolean>();
      const style = (el: Element) => {
        let value = styles.get(el);
        if (!value) { value = getComputedStyle(el); styles.set(el, value); }
        return value;
      };
      const rect = (el: Element) => {
        let value = rectangles.get(el);
        if (!value) { value = el.getBoundingClientRect(); rectangles.set(el, value); }
        return value;
      };
      const painted = (el: Element | null): boolean => {
        if (!el || el === document.body) return !el?.matches(unavailable);
        const cached = visibility.get(el);
        if (cached !== undefined) return cached;
        const css = style(el);
        const value = !el.matches(unavailable) && css.display !== "none" && css.visibility === "visible" &&
          Number(css.opacity) >= .99 && (css.clipPath === "none" || css.clipPath === "inset(0px)") && painted(el.parentElement);
        visibility.set(el, value);
        return value;
      };
      return { style, rect, painted, x: scrollX, y: scrollY, width: innerWidth, height: innerHeight };
    };
    type Reads = ReturnType<typeof reads>;
    const completeSurface = (story: Story) => !story.el.closest('[data-building],[data-scene-building]') && !story.el.querySelector('[data-building],[data-scene-building]');
    const expanded = (story: Story, frame: Reads) => completeSurface(story) && frame.painted(story.el) && story.details.every(detail => !detail.inert && detail.getAttribute("aria-hidden") !== "true" && Number(frame.style(detail).opacity) >= .99);
    const canObserve = (dialog: Element | null) => !document.hidden && document.hasFocus() && !getScrollIntent().automatic && !dialog;

    const measureBounds = (frame: Reads) => {
      for (const story of records) {
        story.top = frame.rect(story.el).top + frame.y;
        const heading = frame.rect(story.heading);
        story.headingTop = heading.top + frame.y;
        story.headingBottom = heading.bottom + frame.y;
        story.previousTop = story.top - frame.y;
      }
      measureDirty = false;
      revision++;
    };
    const measureStory = (story: Story, frame: Reads) => {
      if (story.measuredAt === revision) return;
      const range = document.createRange();
      for (const block of story.blocks) {
          const lines: Line[] = [];
          const append = (rect: DOMRect) => {
            if (rect.width <= 0 || rect.height <= 0) return;
            const x = rect.left + frame.x, y = rect.top + frame.y;
            const previous = lines.find(line => Math.abs(line.y - y) < 2);
            if (previous) { const right = Math.max(previous.x + previous.width, x + rect.width); previous.x = Math.min(previous.x, x); previous.width = right - previous.x; previous.height = Math.max(previous.height, rect.height); }
            else lines.push({ x, y, width: rect.width, height: rect.height, elapsed: block.credit * block.requiredMs, seen: false });
          };
          if (block.kind === "media") append(frame.rect(block.el));
          else {
            const walker = document.createTreeWalker(block.el, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              if (!walker.currentNode.textContent?.trim()) continue;
              range.selectNodeContents(walker.currentNode);
              Array.from(range.getClientRects()).forEach(append);
            }
          }
          lines.sort((a, b) => a.y - b.y);
          lines.forEach((line, index) => { line.seen = index < Math.round(block.coverage * lines.length); });
          block.lines = lines; block.clips = [];
          for (let parent = block.el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const style = frame.style(parent);
            if (/(hidden|clip|auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) block.clips.push(parent);
          }
      }
      story.measuredAt = revision;
    };
    const lineVisibility = (block: Block, line: Line, frame: Reads) => {
      let left = Math.max(0, line.x - frame.x), right = Math.min(frame.width, line.x + line.width - frame.x);
      let top = Math.max(76, line.y - frame.y), bottom = Math.min(frame.height - 56, line.y + line.height - frame.y);
      for (const parent of block.clips) {
        const rect = frame.rect(parent);
        left = Math.max(left, rect.left); right = Math.min(right, rect.right); top = Math.max(top, rect.top); bottom = Math.min(bottom, rect.bottom);
      }
      if (right <= left || bottom <= top) return 0;
      const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
      if (!hit || !(block.el === hit || block.el.contains(hit))) return 0;
      return Math.min(1, (right - left) / Math.min(line.width, frame.width)) * Math.min(1, (bottom - top) / Math.min(line.height, frame.height - 132));
    };
    const encounter = (story: Story) => {
      if (story.encountered) return false;
      story.encountered = true; dirty.add(story); return true;
    };
    const publish = () => {
      if (!dirty.size) return;
      const covered = records.filter(story => story.exposure >= .6 && story.coverage >= .75);
      const fullyExposed = records.filter(story => story.credit >= .995 && story.coverage >= .95);
      dirty.forEach(story => {
        const values = { quality: String(Math.round(story.credit * 1000) / 10), qualityCoverage: String(Math.round(story.coverage * 100)), qualityEncountered: String(story.encountered), qualityConfidence: story.confidence };
        Object.entries(values).forEach(([key, value]) => { if (story.el.dataset[key] !== value) story.el.dataset[key] = value; });
        if (story.el.matches("[data-experience-item],[data-certificate],[data-project]")) {
          const progress = String(Math.round(story.credit * 1000) / 1000);
          if (story.el.style.getPropertyValue("--exploration-evidence") !== progress) story.el.style.setProperty("--exploration-evidence", progress);
          const complete = String(story.credit >= .995 && story.coverage >= .95);
          if (story.el.dataset.explorationComplete !== complete) story.el.dataset.explorationComplete = complete;
        }
      });
      dirty.clear();
      publishExploration({ explored: fullyExposed.map(story => story.item.id), total: records.length, items,
        suggestedId: records.find(story => story.item.critical && story.credit < .995)?.item.id || null,
        score: discoveryScore(records.map(story => ({ id: story.item.id, credit: story.credit, encountered: story.encountered }))), gaps: records.filter(story => story.gap && story.exposure < .6).length,
        credits: Object.fromEntries(records.map(story => [story.item.id, Math.round(story.credit * 1000) / 1000])), encountered: records.filter(story => story.encountered).map(story => story.item.id), coverage: covered.length,
        confidence: Object.fromEntries(records.map(story => [story.item.id, story.confidence])) });
    };
    const scoreStory = (story: Story, frame: Reads) => {
      const { credit, coverage, exposure, confidence, gap } = story;
      const availableBlocks = story.blocks.filter(block => frame.style(block.el).display !== "none");
      const weight = availableBlocks.reduce((sum, block) => sum + block.weight, 0) || 1;
      story.exposure = Math.max(story.exposure, availableBlocks.reduce((sum, block) => sum + block.credit * block.weight, 0) / weight);
      story.coverage = Math.max(story.coverage, availableBlocks.reduce((sum, block) => sum + (block.coverage * block.weight), 0) / weight);
      const qualifies = story.qualifiedMs >= 1000 && story.exposure >= .2 && story.coverage >= .6;
      const bonus = qualifies ? Math.min(.1, [...story.actions].reduce((sum, action) => sum + (action === "inspect" ? .05 : .025), 0)) : 0;
      story.credit = Math.max(story.credit, Math.min(1, story.exposure + bonus));
      story.confidence = story.exposure >= .85 && story.coverage >= .9 && (story.actions.size > 0 || story.qualifiedMs >= 8000) ? "high" : story.exposure >= .35 && story.coverage >= .6 ? "medium" : "low";
      if (story.exposure >= .6 && story.coverage >= .75) story.gap = false;
      if (credit !== story.credit || coverage !== story.coverage || exposure !== story.exposure ||
          confidence !== story.confidence || gap !== story.gap) dirty.add(story);
    };
    const stopClock = () => { clearInterval(clock); clock = 0; };
    const sample = () => {
      const now = performance.now(), dt = Math.min(250, now - lastAt); lastAt = now;
      const frame = reads();
      const dialog = document.querySelector('[role="dialog"]');
      if (measureDirty && !regrouping) measureBounds(frame);
      if (inspection && now - inspection.started > 1000 && !dialog) inspection = null;
      if (inspection) {
        const image = dialog?.querySelector<HTMLImageElement>('img');
        if (!document.hidden && document.hasFocus() && image?.complete && image.naturalWidth > 0 && now - inspection.started >= 600 && inspection.story.qualifiedMs >= 1000) {
          inspection.story.actions.add("inspect"); scoreStory(inspection.story, frame); inspection = null;
        }
      }
      if (canObserve(dialog ?? document.querySelector('[data-exploration-map]')) && !regrouping) {
        const intent = getScrollIntent(), rate = exposureRate((intent.active ? Math.abs(intent.speed) : 0) * 1000 / frame.height);
        visible.forEach(story => {
          const heading = frame.rect(story.heading);
          if (heading.bottom > 76 && heading.top < frame.height - 56 && frame.painted(story.heading)) encounter(story);
          if (story.exposure >= 1 && story.coverage >= 1 && story.confidence === "high" && story.returnAt === null || !expanded(story, frame)) return;
          measureStory(story, frame);
          let observed = false;
          story.blocks.forEach(block => {
            if (!frame.painted(block.el) || block.el instanceof HTMLImageElement && (!block.el.complete || !block.el.naturalWidth) || block.el.matches('[data-construction-scene="activity"]') && !block.el.hasAttribute("data-activity-ready")) return;
            if (block.kind === "media" && !block.lines.length) { story.measuredAt = -1; return; }
            block.lines.forEach(line => {
              const fraction = lineVisibility(block, line, frame);
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
            scoreStory(story, frame);
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
        const story = storiesByElement.get(entry.target as HTMLElement); if (!story) return;
        if (entry.isIntersecting) { visible.add(story); if (story.hadLeft && getScrollIntent().userDriven && getScrollIntent().direction < 0) story.returnAt ??= story.qualifiedMs; }
        else { if (visible.has(story) && story.encountered) story.hadLeft = true; visible.delete(story); }
      });
      if (visible.size) startClock(); else stopClock();
    }, { rootMargin: "-76px 0px -56px 0px", threshold: [0, .25, .5, 1] });
    records.forEach(story => observer.observe(story.el));
    const onIntent = () => {
      const intent = getScrollIntent(), now = performance.now();
      let changed = false;
      const userPass = intent.active && intent.inputDriven && intent.userDriven && !intent.hardJump && now >= suppressSweepUntil &&
        canObserve(document.querySelector('[role="dialog"],[data-exploration-map]'));
      const frame = userPass ? reads() : null;
      const y = frame?.y ?? scrollY;
      const quick = !!frame && Math.abs(intent.speed) * 1000 / frame.height >= 1.2;
      records.forEach(story => {
        const top = story.top - y;
        const heading = frame && (measureDirty || regrouping) ? frame.rect(story.heading) : null;
        const currentlyVisible = (heading?.bottom ?? story.headingBottom - y) > 76 &&
          (heading?.top ?? story.headingTop - y) < (frame?.height ?? 0) - 56;
        const crossed = intent.direction > 0 ? story.previousTop >= 76 && top < 76 : story.previousTop <= innerHeight - 56 && top > innerHeight - 56;
        // A painted heading can be encountered before the rest of a story is
        // ready. Only infer crossed positions when layout measurements are stable.
        const passed = currentlyVisible || (!regrouping && !measureDirty && crossed);
        const newGap = quick && story.exposure < .6 && !story.gap;
        const revisit = intent.direction < 0 && story.hadLeft && currentlyVisible && story.returnAt === null;
        if (frame && passed && (!story.encountered || newGap || revisit) && frame.painted(story.heading)) {
          changed = encounter(story) || changed;
          if (newGap) { changed = true; dirty.add(story); story.gap = true; }
          if (revisit) story.returnAt = story.qualifiedMs;
        }
        story.previousTop = top;
      });
      if (changed) publish();
      if (visible.size || inspection || measureDirty) startClock();
    };
    const invalidate = () => { measureDirty = true; startClock(); };
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const control = target.closest("a,button"); if (!control) return;
      const story = records.find(story => story.el.contains(control)); if (!story) return;
      if (control.matches("[data-scan-toggle]")) story.actions.add("expand");
      else if (control.matches("a[href]")) story.actions.add("source");
      else if (control.matches("button") && (control.hasAttribute("aria-haspopup") || control.closest(".project-media") || /zoom/i.test(control.getAttribute("aria-label") || ""))) inspection = { story, started: performance.now() };
      scoreStory(story, reads()); publish(); startClock();
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
    document.fonts.addEventListener("loadingdone", invalidate);
    window.addEventListener("keydown", keyboardJump);
    window.addEventListener("resize", invalidate, { passive: true });
    window.addEventListener("portfolio:layout-start", onLayoutStart); window.addEventListener("portfolio:layout-settled", onLayoutSettled); window.addEventListener("portfolio:activity-ready", activityReady);
    document.addEventListener("click", click, true); document.addEventListener("visibilitychange", visibility); window.addEventListener("focus", visibility); window.addEventListener("blur", visibility);
    publish(); startClock();
    return () => {
      unsubscribe(); observer.disconnect(); resize.disconnect(); stopClock();
      window.removeEventListener("keydown", keyboardJump); window.removeEventListener("resize", invalidate);
      window.removeEventListener("portfolio:layout-start", onLayoutStart); window.removeEventListener("portfolio:layout-settled", onLayoutSettled); window.removeEventListener("portfolio:activity-ready", activityReady);
      document.fonts.removeEventListener("loadingdone", invalidate);
      document.removeEventListener("click", click, true); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("focus", visibility); window.removeEventListener("blur", visibility);
      records.forEach(story => { delete story.el.dataset.discoveryId; delete story.el.dataset.quality; delete story.el.dataset.qualityCoverage; delete story.el.dataset.qualityEncountered; delete story.el.dataset.qualityConfidence; delete story.el.dataset.explorationComplete; story.el.style.removeProperty("--exploration-evidence"); }); resetExploration();
    };
  }, []);
}
