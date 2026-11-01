import { useLayoutEffect, type RefObject } from "react";
import { autonomousProgress, clamp01, textFrame, type TextLine } from "@/lib/construction";

type Kind = "text" | "asset" | "structure";
type Target = {
  el: HTMLElement; section: HTMLElement; kind: Kind; top: number; left: number; width: number; height: number;
  lines: TextLine[]; count: number; progress: number; elapsed: number; visibleSince: number | null;
  duration: number; delay: number; order: number;
};
type Position = { x: number; y: number; angle: number; initialized: boolean; target: Target | null };

function measureLines(el: HTMLElement): TextLine[] {
  const origin = el.getBoundingClientRect();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const lines: TextLine[] = [];
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue;
    const range = document.createRange(); range.selectNodeContents(walker.currentNode);
    for (const rect of Array.from(range.getClientRects())) {
      if (!rect.width || !rect.height) continue;
      const y = rect.top - origin.top, x = rect.left - origin.left;
      const line = lines.find(item => Math.abs(item.y - y) < 3);
      if (line) {
        const right = Math.max(line.x + line.width, x + rect.width);
        line.x = Math.min(line.x, x); line.width = right - line.x; line.height = Math.max(line.height, rect.height);
      } else lines.push({ x, y, width: rect.width, height: rect.height });
    }
  }
  return lines.sort((a, b) => a.y - b.y);
}

const typedProgress = (p: number, count: number) => {
  // Two brief, deterministic writing pauses. Real strings never change.
  const held = p < .30 ? p : p < .34 ? .30 : p < .68 ? p - .04 : p < .71 ? .64 : (p - .07) / .93;
  return Math.floor(clamp01(held) * count) / count;
};

/** Visible tasks advance autonomously. Scroll changes the work area, never the mouse.
 * Large jumps still finish visible content immediately instead of accumulating a queue. */
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
    const carets = Array.from(layer.querySelectorAll<HTMLElement>("[data-caret]"));
    const positions: Position[] = cursors.map(() => ({ x: 0, y: 0, angle: 0, initialized: false, target: null }));
    let frame = 0, dirty = true, stopped = false, jump = !!location.hash || scrollY > 20;
    let lastY = scrollY, lastScrollTime = performance.now(), lastTick = performance.now(), velocity = 0;

    for (const section of sections) {
      const candidates = new Set<HTMLElement>(section.querySelectorAll<HTMLElement>("[data-construction],h1,h2,h3,h4,p,img,a,button,input,textarea,span"));
      // Existing containers reserve their exact space while their surfaces are built.
      for (const child of Array.from(section.children)) {
        if (child instanceof HTMLElement && child.tagName === "DIV" && !child.classList.contains("absolute")) candidates.add(child);
      }
      let order = 0;
      for (const el of candidates) {
        if (el.closest("[data-agent-layer],.animate-marquee,.animate-marquee-reverse")) continue;
        if (el.closest("[data-construction-skip]") && !el.dataset.construction) continue;
        if (el.tagName === "SPAN" && (el.children.length || !el.textContent?.trim() || el.parentElement?.closest("h1,h2,h3,h4,p,[data-construction='text']"))) continue;
        // A media/interactive parent reveals its icon and text together.
        const assetParent = el.parentElement?.closest("a,button,[data-construction='asset']");
        if (assetParent && section.contains(assetParent)) continue;
        const kind = el.dataset.construction || (/^H[1234]$|^P$/.test(el.tagName) ? "text" : el.tagName === "DIV" ? "structure" : "asset");
        if (!["text", "asset", "structure"].includes(kind)) continue;
        const count = el.textContent?.trim().length || 1;
        targets.push({ el, section, kind: kind as Kind, top: 0, left: 0, width: 0, height: 0, lines: [], count,
          progress: 0, elapsed: 0, visibleSince: null, order: order++,
          duration: kind === "structure" ? 1050 : kind === "asset" ? 1100 : Math.max(2000, Math.min(4400, count * 24)),
          delay: kind === "structure" ? 0 : kind === "text" ? 450 : 220 });
      }
    }

    const measure = () => {
      for (const t of targets) {
        const rect = t.el.getBoundingClientRect();
        t.top = rect.top + scrollY; t.left = rect.left; t.width = rect.width; t.height = rect.height;
        if (t.kind === "text") t.lines = measureLines(t.el);
      }
      dirty = false;
    };
    const finish = (t: Target) => {
      t.progress = 1; delete t.el.dataset.building;
      t.el.style.removeProperty("--construction-clip"); t.el.style.removeProperty("--construction-opacity");
      t.el.dataset.constructed = "true";
    };
    const paint = (t: Target) => {
      if (t.progress === 1) return;
      t.el.dataset.building = t.kind;
      if (t.kind === "text") t.el.style.setProperty("--construction-clip", textFrame(t.lines, t.width, t.height, typedProgress(t.progress, t.count)).clip);
      else if (t.kind === "asset") t.el.style.setProperty("--construction-clip", `inset(0 ${100 - t.progress * 100}% 0 0)`);
      else t.el.style.setProperty("--construction-opacity", String(t.progress));
    };
    const hideAgents = () => {
      cursors.forEach(c => { c.style.opacity = "0"; });
      guides.forEach(g => g.setAttribute("opacity", "0"));
      carets.forEach(c => { c.style.opacity = "0"; });
    };
    const point = (t: Target, index: number) => {
      const rect = t.el.getBoundingClientRect();
      let x = rect.left, y = rect.top;
      if (t.kind === "text") {
        const text = textFrame(t.lines, rect.width, rect.height, typedProgress(t.progress, t.count));
        x += text.x + 3; y += text.y + text.height * .75;
      } else if (t.kind === "asset") {
        x += rect.width * Math.max(.04, t.progress); y += Math.min(26, rect.height * .3);
      } else {
        // Trace an actual edge while another agent can work on its contents.
        x += rect.width * (index % 2 ? 1 - t.progress : t.progress);
        y += index % 2 ? Math.min(rect.height, 32) : 0;
      }
      return { rect, x: Math.max(10, Math.min(innerWidth - 112, x)), y: Math.max(78, Math.min(innerHeight - 42, y)) };
    };
    const schedule = () => { if (!frame && !stopped && !document.hidden) frame = requestAnimationFrame(tick); };
    const tick = (now: number) => {
      frame = 0;
      if (stopped || document.hidden) return;
      const dt = Math.min(50, Math.max(0, now - lastTick)); lastTick = now;
      const repaint = dirty;
      if (dirty) measure();
      if (reduced.matches) { targets.forEach(finish); hideAgents(); return; }
      const simplified = coarse.matches || innerWidth < 768;
      const fast = velocity > 1.65;
      const work: Target[] = [];
      for (const t of targets) {
        if (t.progress === 1) continue;
        const top = t.top - scrollY;
        const visible = t.width > 0 && t.height > 0 && top < innerHeight * .98 && top + t.height > 76;
        if ((!t.width || !t.height) || top + t.height < 76 || (visible && (jump || fast))) { finish(t); continue; }
        if (visible) {
          t.visibleSince ??= now;
          // Bounded visible work is fail-open; offscreen tasks never keep running.
          if (now - t.visibleSince > (simplified ? 1200 : 9500)) { finish(t); continue; }
          work.push(t);
        }
        if (repaint || !t.el.dataset.building) paint(t);
      }
      hideAgents();
      const used = new Set<Target>();
      for (let index = 0; index < cursors.length; index++) {
        const cursor = cursors[index], position = positions[index];
        const role = cursor.dataset.role;
        const previous = position.target;
        const available = work.filter(t => !used.has(t));
        const target = previous && available.includes(previous) ? previous : available.sort((a, b) => {
          const rank = (t: Target) => (t.kind === role ? 0 : 1000) + (t.elapsed > 0 ? -100 : 0) + Math.abs(t.top - scrollY - innerHeight * .45) * .08 + t.order * .1;
          return rank(a) - rank(b);
        })[0];
        if (!target) continue;
        used.add(target); position.target = target;
        const aim = point(target, index);
        if (!position.initialized) {
          position.x = Math.max(10, Math.min(innerWidth - 112, aim.rect.left + Math.min(100, aim.rect.width * .4) + index * 5));
          position.y = Math.max(78, aim.rect.top - 66 - index * 5); position.initialized = true;
        }
        const dx = aim.x - position.x, dy = aim.y - position.y;
        const distance = Math.hypot(dx, dy);
        const step = Math.min(distance, (fast ? 1400 : 420) * dt / 1000);
        if (distance > .2) {
          position.x += dx / distance * step; position.y += dy / distance * step;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
          position.angle += ((angle - position.angle + 540) % 360 - 180) * Math.min(1, dt / 160);
        }
        // Text waits for its editor to arrive, including a deliberate move to a new line.
        if (simplified || target.kind !== "text" || distance < 48 || target.elapsed < target.delay) {
          target.elapsed += dt * (simplified ? 4 : velocity > .6 ? 1.5 : 1);
          target.progress = autonomousProgress(target.progress, target.elapsed, target.delay, target.duration);
          if (target.progress >= 1) { finish(target); continue; } else paint(target);
        }
        if (!simplified) {
          cursor.style.opacity = "1";
          cursor.style.transform = `translate3d(${position.x}px,${position.y}px,0)`;
          cursor.querySelector<SVGElement>("svg")!.style.transform = `rotate(${position.angle}deg)`;
          cursor.dataset.click = String(target.progress > .05 && Math.floor(target.progress * 16) % 6 === 0);
          cursor.querySelector<HTMLElement>(".agent-action")!.textContent = target.kind === "text" ? "type" : target.kind === "asset" ? "place" : "trace";
          const guide = guides[index], rect = aim.rect;
          const selection = guide.querySelector("rect")!;
          selection.setAttribute("x", String(rect.left - 3)); selection.setAttribute("y", String(rect.top - 3));
          selection.setAttribute("width", String(rect.width + 6)); selection.setAttribute("height", String(rect.height + 6));
          selection.style.strokeDashoffset = String(1 - Math.min(1, target.progress * 2));
          guide.setAttribute("opacity", String(Math.min(.65, (1 - target.progress) * 4)));
          const l = rect.left - 5, r = rect.right + 5, top = rect.top - 5, b = rect.bottom + 5;
          guide.querySelector("path")!.setAttribute("d", `M${l + 6},${top}h-6v6 M${r - 6},${top}h6v6 M${l},${b - 6}v6h6 M${r - 6},${b}h6v-6`);
          if (target.kind === "text" && target.progress > 0 && target.progress < 1) {
            const text = textFrame(target.lines, rect.width, rect.height, typedProgress(target.progress, target.count));
            carets[index].style.cssText = `background:${getComputedStyle(cursor).getPropertyValue("--agent-color")};transform:translate3d(${rect.left + text.x}px,${rect.top + text.y + text.height * .14}px,0);height:${Math.max(12, text.height * .73)}px;opacity:${Math.floor(now / 430) % 2 ? .3 : .9}`;
          }
        }
      }
      jump = false; velocity *= .85;
      if (work.some(t => t.progress < 1)) schedule();
    };
    const onScroll = () => {
      const now = performance.now(), delta = Math.abs(scrollY - lastY);
      velocity = delta / Math.max(8, now - lastScrollTime);
      if (delta > innerHeight * .6) jump = true;
      lastY = scrollY; lastScrollTime = now; schedule();
    };
    const onMeasure = () => { dirty = true; schedule(); };
    const onJump = () => { jump = true; schedule(); };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) onJump(); };
    const onFocus = (event: FocusEvent) => {
      const focused = event.target as HTMLElement;
      targets.filter(t => t.el.contains(focused) || focused.contains(t.el)).forEach(finish); schedule();
    };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else { lastTick = performance.now(); dirty = true; jump = true; schedule(); }
    };
    const observer = new ResizeObserver(onMeasure);
    sections.forEach(section => observer.observe(section));
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onMeasure, { passive: true });
    window.addEventListener("hashchange", onJump); window.addEventListener("popstate", onJump); window.addEventListener("pageshow", onPageShow);
    document.addEventListener("focusin", onFocus); document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMeasure); coarse.addEventListener("change", onMeasure);
    document.fonts.ready.then(() => { if (!stopped) onMeasure(); });
    sections.forEach(s => s.querySelectorAll("img").forEach(img => img.addEventListener("load", onMeasure)));
    measure(); targets.forEach(paint); tick(performance.now());
    return () => {
      stopped = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onMeasure);
      window.removeEventListener("hashchange", onJump); window.removeEventListener("popstate", onJump); window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("focusin", onFocus); document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMeasure); coarse.removeEventListener("change", onMeasure);
      sections.forEach(s => s.querySelectorAll("img").forEach(img => img.removeEventListener("load", onMeasure)));
      targets.forEach(t => { finish(t); delete t.el.dataset.constructed; });
    };
  }, [layerRef]);
}
