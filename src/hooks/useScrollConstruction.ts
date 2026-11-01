import { useLayoutEffect, type RefObject } from "react";
import { advanceProgress, clamp01, stageProgress, textFrame, visibilityProgress, type TextLine } from "@/lib/construction";

type Target = {
  el: HTMLElement; section: HTMLElement; kind: "text" | "asset" | "structure";
  top: number; left: number; width: number; height: number;
  lines: TextLine[]; count: number; progress: number; hero: boolean; order: number;
};

function measureLines(el: HTMLElement): TextLine[] {
  const origin = el.getBoundingClientRect();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const lines: TextLine[] = [];
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(walker.currentNode);
    for (const rect of Array.from(range.getClientRects())) {
      if (!rect.width || !rect.height) continue;
      const y = rect.top - origin.top;
      const line = lines.find(item => Math.abs(item.y - y) < 3);
      const x = rect.left - origin.left;
      if (line) {
        const right = Math.max(line.x + line.width, x + rect.width);
        line.x = Math.min(line.x, x);
        line.width = right - line.x;
        line.height = Math.max(line.height, rect.height);
      } else lines.push({ x, y, width: rect.width, height: rect.height });
    }
  }
  return lines.sort((a, b) => a.y - b.y);
}

export function useScrollConstruction(layerRef: RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-construction-section]"));
    const targets: Target[] = [];
    const cursors = Array.from(layer.querySelectorAll<HTMLElement>("[data-agent]"));
    const guides = Array.from(layer.querySelectorAll<SVGGElement>("[data-guide]"));
    const caret = layer.querySelector<HTMLElement>(".construction-caret")!;
    let frame = 0, dirty = true, stopped = false, jump = !!location.hash || scrollY > 20;
    let lastY = scrollY, lastTime = performance.now(), velocity = 0;
    const started = performance.now();
    const positions = cursors.map(() => ({ x: 0, y: 0, target: null as Target | null }));

    for (const section of sections) {
      const elements = section.querySelectorAll<HTMLElement>("[data-construction], h1, h2, h3, p, img, a");
      let order = 0;
      for (const el of elements) {
        if (el.closest("[data-construction-skip]") || el.closest("[data-agent-layer]")) continue;
        const kind = el.dataset.construction || (/^H[123]$|^P$/.test(el.tagName) ? "text" : "asset");
        if (!["text", "asset", "structure"].includes(kind)) continue;
        targets.push({ el, section, kind: kind as Target["kind"], top: 0, left: 0, width: 0, height: 0,
          lines: [], count: el.textContent?.trim().length || 1, progress: reduced.matches ? 1 : 0,
          hero: section.id === "hero", order: order++ });
      }
    }

    const measure = () => {
      // Read all geometry before writing any masks. Re-measured on font/image/resize changes.
      for (const target of targets) {
        const rect = target.el.getBoundingClientRect();
        target.top = rect.top + scrollY; target.left = rect.left;
        target.width = rect.width; target.height = rect.height;
        if (target.kind === "text") target.lines = measureLines(target.el);
      }
      dirty = false;
    };

    const finish = (target: Target) => {
      target.progress = 1;
      delete target.el.dataset.building;
      target.el.style.removeProperty("--construction-clip");
      target.el.style.removeProperty("--construction-opacity");
      target.el.dataset.constructed = "true";
    };

    const hideAgents = () => {
      cursors.forEach(cursor => { cursor.style.opacity = "0"; });
      guides.forEach(guide => guide.setAttribute("opacity", "0"));
      caret.style.opacity = "0";
    };

    const tick = (now: number) => {
      frame = 0;
      if (stopped || document.hidden) return;
      const repaint = dirty;
      if (dirty) measure();
      if (reduced.matches) {
        targets.forEach(finish); hideAgents(); return;
      }
      const y = scrollY, vh = innerHeight;
      const heroTime = clamp01((now - started) / 2450);
      const fast = velocity > 1.65;
      const active: Target[] = [];
      for (const target of targets) {
        if (target.progress === 1) continue;
        const top = target.top - y;
        const onscreen = top < vh && top + target.height > 60 && target.width > 0 && target.height > 0;
        // Large cards/sections reveal their structure at entry; each text/media child has its own visibility progress.
        let p = visibilityProgress(top, vh);
        if (target.hero && y < vh * 0.2 && !jump) {
          const badge = !!target.el.closest("[data-microsoft-headline]");
          const start = badge ? (target.kind === "structure" ? 0.01 : target.kind === "asset" ? 0.09 : 0.21) : target.kind === "text" ? 0.28 : 0.50;
          const end = badge ? (target.kind === "structure" ? 0.14 : target.kind === "asset" ? 0.24 : 0.61) : 0.98;
          p = stageProgress(heroTime, start, end);
        } else if (target.kind === "structure") p = stageProgress(p, 0, 0.22);
        const synchronize = top + target.height < 70 || (onscreen && (jump || fast)) || (target.hero && y > vh * 0.2);
        const next = advanceProgress(target.progress, p, synchronize);
        if (next >= 1) { finish(target); continue; }
        if (repaint || next !== target.progress || !target.el.dataset.building) {
          target.progress = next;
          target.el.dataset.building = target.kind;
          if (target.kind === "text") {
            // Integer glyph steps with two deterministic short holds; no layout-changing string edits.
            const held = next < 0.30 ? next : next < 0.34 ? 0.30 : next < 0.68 ? next - 0.04 : next < 0.71 ? 0.64 : (next - 0.07) / 0.93;
            const step = Math.floor(clamp01(held) * target.count) / target.count;
            target.el.style.setProperty("--construction-clip", textFrame(target.lines, target.width, target.height, step).clip);
          } else if (target.kind === "asset") {
            target.el.style.setProperty("--construction-clip", `inset(0 ${100 - next * 100}% 0 0)`);
          } else target.el.style.setProperty("--construction-opacity", String(next));
        }
        if (onscreen && next > 0 && next < 1) active.push(target);
      }
      // At most four current tasks. Nothing queues or continues building offscreen.
      hideAgents();
      if (!coarse.matches && innerWidth >= 768) {
        const ranked = [...active].sort((a, b) => Math.abs(a.top - y - vh * 0.52) - Math.abs(b.top - y - vh * 0.52));
        const text = ranked.find(t => t.kind === "text");
        const asset = ranked.find(t => t.kind === "asset");
        const structure = ranked.find(t => t.kind === "structure");
        const choices = [structure || text || asset, text, structure || asset || text, asset || ranked.find(t => t !== text)];
        choices.forEach((target, index) => {
          if (!target) return;
          const rect = target.el.getBoundingClientRect();
          const p = target.progress;
          let x = rect.left, cy = rect.top;
          if (index === 1) {
            const held = p < 0.30 ? p : p < 0.34 ? 0.30 : p < 0.68 ? p - 0.04 : p < 0.71 ? 0.64 : (p - 0.07) / 0.93;
            const text = textFrame(target.lines, rect.width, rect.height, Math.floor(clamp01(held) * target.count) / target.count);
            x += text.x + 3; cy += text.y + text.height * 0.75;
            caret.style.cssText = `transform:translate3d(${x - 2}px,${rect.top + text.y + text.height * 0.14}px,0);height:${Math.max(12, text.height * 0.73)}px;opacity:${Math.floor(now / 350) % 2 ? 0.25 : 0.8}`;
          } else if (index === 0) {
            const distance = p * 4;
            if (distance < 1) x += rect.width * distance;
            else if (distance < 2) { x += rect.width; cy += rect.height * (distance - 1); }
            else if (distance < 3) { x += rect.width * (3 - distance); cy += rect.height; }
            else cy += rect.height * (4 - distance);
          } else if (index === 2) { x += rect.width * (1 - p); cy += rect.height; }
          else { x += rect.width * p; cy += Math.min(25, rect.height * 0.25); }
          x = Math.max(8, Math.min(innerWidth - 110, x)); cy = Math.max(78, Math.min(vh - 44, cy));
          const position = positions[index];
          if (!position.target || jump || fast) { position.x = x - (index === 1 ? 24 : 14); position.y = cy - 18; }
          position.x += (x - position.x) * 0.38; position.y += (cy - position.y) * 0.38; position.target = target;
          const cursor = cursors[index];
          cursor.style.opacity = "1";
          cursor.style.transform = `translate3d(${position.x + Math.sin(now / 370 + index) * 0.6}px,${position.y}px,0)`;
          cursor.dataset.click = String(Math.floor(p * 14) % 5 === 0);
          const guide = guides[index];
          const r = guide.querySelector("rect")!;
          r.setAttribute("x", String(rect.left - 3)); r.setAttribute("y", String(rect.top - 3));
          r.setAttribute("width", String(rect.width + 6)); r.setAttribute("height", String(rect.height + 6));
          r.style.strokeDashoffset = String(1 - Math.min(1, p * 2.5));
          guide.setAttribute("opacity", String(Math.min(0.65, (1 - p) * 3)));
          const left = rect.left - 5, right = rect.right + 5, top = rect.top - 5, bottom = rect.bottom + 5;
          guide.querySelector("path")!.setAttribute("d", `M${left + 6},${top}h-6v6 M${right - 6},${top}h6v6 M${left},${bottom - 6}v6h6 M${right - 6},${bottom}h6v-6`);
        });
      }
      jump = false;
      // Velocity is measured from input, and decays while waiting for further scroll input.
      velocity *= 0.85;
      // On touch/small screens masks repaint on input only; there are no visible
      // pointers/caret to animate while the user is idle.
      if (heroTime < 1 || (active.length && !coarse.matches && innerWidth >= 768)) schedule();
    };

    const schedule = () => { if (!frame && !stopped && !document.hidden) frame = requestAnimationFrame(tick); };
    const onScroll = () => {
      const now = performance.now();
      const delta = Math.abs(scrollY - lastY);
      velocity = delta / Math.max(8, now - lastTime);
      if (delta > innerHeight * 0.6) jump = true;
      lastY = scrollY; lastTime = now; schedule();
    };
    const onMeasure = () => { dirty = true; schedule(); };
    const onJump = () => { jump = true; schedule(); };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) onJump(); };
    const onFocus = (event: FocusEvent) => {
      const focused = event.target as HTMLElement;
      // Reveal masked ancestors too, so keyboard navigation never reaches an invisible control.
      targets.filter(t => t.el.contains(focused) || focused.contains(t.el)).forEach(finish);
      schedule();
    };
    const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { dirty = true; jump = true; schedule(); } };
    const observer = new ResizeObserver(onMeasure);
    sections.forEach(section => observer.observe(section));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onMeasure, { passive: true });
    window.addEventListener("hashchange", onJump);
    window.addEventListener("popstate", onJump);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMeasure);
    coarse.addEventListener("change", onMeasure);
    document.fonts.ready.then(() => { if (!stopped) onMeasure(); });
    sections.forEach(section => section.querySelectorAll("img").forEach(img => img.addEventListener("load", onMeasure)));
    measure();
    tick(performance.now());
    return () => {
      stopped = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onMeasure);
      window.removeEventListener("hashchange", onJump); window.removeEventListener("popstate", onJump); window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("focusin", onFocus); document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMeasure); coarse.removeEventListener("change", onMeasure);
      sections.forEach(section => section.querySelectorAll("img").forEach(img => img.removeEventListener("load", onMeasure)));
      targets.forEach(target => { finish(target); delete target.el.dataset.constructed; });
    };
  }, [layerRef]);
}
