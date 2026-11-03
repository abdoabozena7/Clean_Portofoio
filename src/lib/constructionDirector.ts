import { clamp01, textFrame } from "./construction";
import { operationPose, type SceneBox } from "./constructionScene";
import { compileRecipe, discoverScenes, readBox, semanticSurfaces, type PaintElement, type RuntimeScene, type SceneUnit, type Surface, type TimedJob } from "./constructionRecipes";
import { getScrollIntent, type ScrollIntent } from "./scrollIntent";

type DirectorOptions = { layer: HTMLDivElement; sections: HTMLElement[]; pointers: HTMLElement[]; guides: SVGGElement[]; carets: HTMLElement[]; enabled: boolean; wake: () => void };
type Prop = { el: HTMLDivElement; target: string; source: string; clone?: HTMLElement };
const styleProperties = ["box-sizing", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-transform", "text-align", "text-decoration", "color", "background-color", "border-top", "border-right", "border-bottom", "border-left", "border-radius", "padding", "object-fit", "object-position", "filter", "opacity", "white-space", "overflow", "display", "align-items", "justify-content", "gap"];
const stage = (elapsed: number, job: TimedJob) => clamp01((elapsed - job.start) / Math.max(1, job.durationMs));
const viewportBox = (box: SceneBox): SceneBox => ({ ...box, left: box.left - scrollX, top: box.top - scrollY });
const visibleBox = (box: SceneBox) => box.top - scrollY < innerHeight && box.top + box.height - scrollY > 76;

function measureLines(el: PaintElement) {
  const origin = el.getBoundingClientRect(), lines: Surface["lines"] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue;
    const range = document.createRange(); range.selectNodeContents(walker.currentNode);
    for (const rect of range.getClientRects()) {
      if (!rect.width || !rect.height) continue;
      const x = rect.left - origin.left, y = rect.top - origin.top;
      const line = lines.find(l => Math.abs(l.y - y) < 3);
      if (line) { const right = Math.max(line.x + line.width, x + rect.width); line.x = Math.min(x, line.x); line.width = right - line.x; }
      else lines.push({ x, y, width: rect.width, height: rect.height });
    }
  }
  return lines.sort((a, b) => a.y - b.y);
}

/** One director, called by the hero controller's existing rAF. No React frame state. */
export function createConstructionDirector(options: DirectorOptions) {
  const { layer, sections, pointers, guides, carets, wake } = options;
  const stageLayer = layer.querySelector<HTMLElement>("[data-scene-layer]")!;
  const props: Prop[] = pointers.map(() => {
    const el = document.createElement("div"); el.className = "scene-actor";
    const prop = document.createElement("div"); prop.className = "scene-prop"; prop.dataset.sceneProp = "";
    el.append(prop); stageLayer.append(el);
    return { el: prop, target: "", source: "" };
  });
  let scenes: RuntimeScene[] = [], enabled = false, disposed = false, paused = false, dirty = false;
  const surfaces = new Map<PaintElement, Surface>();
  const histories = new Map<string, string>();
  const decoded = new WeakSet<HTMLImageElement>(), requested = new WeakSet<HTMLImageElement>(), failed = new WeakSet<HTMLImageElement>();
  const copyOrigins = new Map<string, SceneBox>();
  const activityFailed = (scene: RuntimeScene) => scene.root.querySelector<HTMLElement>("[data-construction-scene='activity']")?.textContent?.includes("Error – Fetching GitHub contribution data") || false;
  const activityObserver = new MutationObserver(() => {
    for (const scene of scenes.filter(s => s.kind === "activity")) {
      if (activityFailed(scene)) finish(scene);
    }
    dirty = true; wake();
  });

  function imageReady(surface: Surface) {
    if (!(surface.el instanceof HTMLImageElement)) return true;
    const image = surface.el;
    if (decoded.has(image) || failed.has(image)) return true;
    if (!requested.has(image)) {
      requested.add(image); image.fetchPriority = "high"; image.loading = "eager";
      void image.decode().then(() => { decoded.add(image); dirty = true; wake(); }, () => { failed.add(image); wake(); });
    }
    return false;
  }

  function release(s: Surface) {
    s.progress = 1; s.populated = true;
    delete s.el.dataset.building; delete s.el.dataset.sceneShell; delete s.el.dataset.sceneSvgPaint; delete s.el.dataset.sceneEdge;
    s.el.style.removeProperty("--construction-clip"); s.el.style.removeProperty("--construction-opacity");
    s.el.style.removeProperty("--scene-paint"); s.el.style.removeProperty("--scene-path-length"); s.el.style.removeProperty("--scene-path-offset");
    s.el.dataset.constructed = "true";
  }

  function hide(s: Surface) {
    s.populated = false;
    if (s.el instanceof SVGElement) {
      s.el.dataset.sceneSvgPaint = ""; s.el.style.setProperty("--scene-paint", "0");
      s.el.dataset.building = s.kind === "text" ? "text" : "asset";
      s.el.style.setProperty("--construction-clip", "none");
    } else if (s.kind === "shell") s.el.dataset.sceneShell = "";
    else {
      s.el.dataset.building = s.kind === "text" ? "text" : "asset";
      s.el.style.setProperty("--construction-clip", "inset(0 100% 0 0)");
    }
  }

  function paint(s: Surface, progress: number) {
    if (s.progress >= 1) return;
    const p = clamp01(progress);
    if (p >= 1) { release(s); return; }
    if (p <= s.progress && s.progress > 0) return;
    s.progress = p;
    if (s.el instanceof SVGElement) {
      s.el.style.setProperty("--scene-paint", String(p));
      if (s.kind === "edge" && s.el instanceof SVGPathElement) {
        const length = s.el.getTotalLength(); s.el.dataset.sceneEdge = "";
        s.el.style.setProperty("--scene-path-length", String(length)); s.el.style.setProperty("--scene-path-offset", String(length * (1 - p)));
      }
    } else if (s.kind !== "shell") {
      const clip = s.kind === "text" && s.lines.length ? textFrame(s.lines, s.box.width, s.box.height, Math.floor(p * Math.max(1, s.el.textContent?.length || 1)) / Math.max(1, s.el.textContent?.length || 1)).clip : `inset(0 ${(1 - p) * 100}% 0 0)`;
      s.el.style.setProperty("--construction-clip", clip);
    }
  }

  function finishUnit(u: SceneUnit) {
    u.surfaces.forEach(release); u.complete = true;
    u.root.dataset.sceneState = "complete"; delete u.root.dataset.sceneBuilding;
  }
  function finish(scene: RuntimeScene) {
    scene.bypassed = false;
    scene.units.forEach(finishUnit); scene.progress = 1; scene.elapsed = scene.duration; scene.state = "complete";
    scene.units.forEach(u => { delete u.root.dataset.sceneBypassed; });
    if (scene.kind === "activity") {
      const host = scene.root.querySelector<HTMLElement>("[data-scene-pending]");
      if (host) { delete host.dataset.building; host.style.removeProperty("--construction-clip"); }
    }
  }

  function bypass(scene: RuntimeScene) {
    finish(scene); scene.bypassed = true;
    scene.units.forEach(u => { u.root.dataset.sceneBypassed = "true"; });
  }

  function rearm(scene: RuntimeScene) {
    scene.bypassed = false; scene.state = "unstarted"; scene.elapsed = 0; scene.progress = 0; scene.entered = false; scene.lastAt = 0;
    scene.timeline.forEach(job => copyOrigins.delete(job.id));
    for (const u of scene.units) {
      u.complete = false; u.root.dataset.sceneState = "unstarted"; delete u.root.dataset.sceneBypassed;
      for (const s of u.surfaces) {
        s.progress = 0; s.populated = false;
        // Retain a visible heading for orientation, then actually rebuild the
        // current item's unfinished body/media instead of declaring it all read.
        if (s.part === "heading" && visibleBox(s.box)) release(s); else hide(s);
      }
    }
  }

  function configure(next: boolean) {
    if (next === enabled || disposed) return;
    enabled = next;
    if (!enabled) { scenes.forEach(finish); hideActors(); return; }
    if (!scenes.length) {
      scenes = discoverScenes(sections);
      // Read all final geometry/style before applying any paint-only masks.
      for (const scene of scenes) for (const unit of scene.units) {
        for (const target of semanticSurfaces(unit)) {
          let s = surfaces.get(target.el);
          if (!s) {
            s = { id: `${unit.id}-surface-${unit.surfaces.length}`, ...target, box: readBox(target.el), lines: target.kind === "text" ? measureLines(target.el) : [], originalStyle: "", progress: 0, populated: false };
            const style = getComputedStyle(target.el);
            s.originalStyle = styleProperties.map(p => `${p}:${style.getPropertyValue(p)}`).join(";");
            surfaces.set(target.el, s); target.el.dataset.sceneTargetId = s.id;
          }
          unit.surfaces.push(s);
        }
      }
      scenes.forEach(compileRecipe);
      surfaces.forEach(hide);
      scenes.filter(s => s.kind === "activity").forEach(scene => {
        const host = scene.root.querySelector<HTMLElement>("[data-construction-scene='activity']");
        if (host && !host.hasAttribute("data-activity-ready")) { host.dataset.scenePending = ""; host.dataset.building = "asset"; host.style.setProperty("--construction-clip", "inset(0 100% 0 0)"); }
        if (host) activityObserver.observe(host, { childList: true, subtree: true });
      });
    }
    dirty = true;
  }

  function measure() {
    if (!enabled) return;
    for (const scene of scenes) {
      for (const u of scene.units) {
        u.box = readBox(u.root);
        for (const s of u.surfaces) {
          s.box = readBox(s.el); if (s.kind === "text") s.lines = measureLines(s.el);
          if (u.complete) { const style = getComputedStyle(s.el); s.originalStyle = styleProperties.map(p => `${p}:${style.getPropertyValue(p)}`).join(";"); }
        }
      }
      scene.top = Math.min(...scene.units.map(u => u.box.top));
      scene.bottom = Math.max(...scene.units.map(u => u.box.top + u.box.height));
      if (scene.kind === "activity") refreshActivity(scene);
    }
    dirty = false;
  }

  function refreshActivity(scene: RuntimeScene) {
    const unit = scene.units[0];
    const activity = unit.root.querySelector<HTMLElement>("[data-activity-ready]");
    if (!activity) return;
    let added = false;
    const weeks = [...new Set([...activity.querySelectorAll("rect[data-date]")].map(rect => rect.parentElement!))];
    for (const [i, el] of weeks.entries()) {
      if (surfaces.has(el)) continue;
      const s: Surface = { id: `${unit.id}-week-${i}`, el, kind: "asset", part: "cell", box: readBox(el), lines: [], originalStyle: "", progress: 0, populated: false };
      surfaces.set(el, s); unit.surfaces.push(s); el.dataset.sceneTargetId = s.id; hide(s); added = true;
    }
    for (const el of activity.querySelectorAll<SVGTextElement>("svg text")) {
      if (surfaces.has(el)) continue;
      const s: Surface = { id: `${unit.id}-label-${unit.surfaces.length}`, el, kind: "text", part: "metadata", box: readBox(el), lines: measureLines(el), originalStyle: "", progress: 0, populated: false };
      surfaces.set(el, s); unit.surfaces.push(s); el.dataset.sceneTargetId = s.id; hide(s); added = true;
    }
    if (added) {
      compileRecipe(scene);
      if (scene.state === "complete" && !scene.bypassed) { scene.state = "building"; unit.complete = false; unit.root.dataset.sceneState = "building"; unit.root.dataset.sceneBuilding = ""; scene.elapsed = 750; scene.dataWait = true; }
      scene.lastAt = performance.now();
      delete activity.dataset.scenePending; delete activity.dataset.building; activity.style.removeProperty("--construction-clip");
    }
  }

  function hideActors(preservePointerPaint = false) {
    for (const [i, prop] of props.entries()) {
      prop.el.parentElement!.style.opacity = "0";
      const pointer = pointers[i];
      if (!preservePointerPaint && pointer.hasAttribute("data-scene-operation")) pointer.style.opacity = "0";
      pointer.classList.remove("scene-pointer");
      for (const el of [pointer, prop.el, prop.el.parentElement!, guides[i]]) {
        delete el.dataset.sceneId; delete el.dataset.sceneOperation; delete el.dataset.sceneTarget;
      }
    }
  }

  function snapshot(u: SceneUnit, empty: boolean) {
    const root = document.createElement("div"); root.className = "scene-snapshot";
    root.style.width = `${u.box.width}px`; root.style.height = `${u.box.height}px`;
    for (const s of u.surfaces) {
      if (s.part === "frame" || s.kind === "edge" || s.el instanceof SVGElement) continue;
      let clone: HTMLElement;
      if (empty || s.kind === "shell") {
        clone = document.createElement("div");
        clone.style.cssText = s.kind === "shell" ? s.originalStyle : "border:1px solid #11192028;background:#93d3ae18";
      } else {
        clone = s.el.cloneNode(true) as HTMLElement;
        clone.style.cssText = s.originalStyle;
        for (const el of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
          for (const attribute of [...el.attributes]) if (attribute.name === "id" || attribute.name.startsWith("data-") || ["tabindex", "autofocus", "name", "href", "for", "aria-labelledby", "aria-describedby"].includes(attribute.name)) el.removeAttribute(attribute.name);
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = "";
          el.setAttribute("tabindex", "-1");
        }
      }
      clone.style.position = "absolute"; clone.style.margin = "0";
      clone.style.left = `${s.box.left - u.box.left}px`; clone.style.top = `${s.box.top - u.box.top}px`;
      clone.style.width = `${s.box.width}px`; clone.style.height = `${s.box.height}px`;
      clone.style.transform = "none"; clone.style.animation = "none"; clone.style.transition = "none";
      root.append(clone);
    }
    return root;
  }

  function assetCopy(s: Surface) {
    const clone = s.el.cloneNode(true) as PaintElement;
    for (const el of [clone, ...clone.querySelectorAll("*")]) {
      for (const a of [...el.attributes]) if (a.name === "id" || a.name.startsWith("data-") || ["tabindex", "autofocus", "name", "href", "for"].includes(a.name)) el.removeAttribute(a.name);
      el.setAttribute("tabindex", "-1");
    }
    clone.style.cssText = s.originalStyle;
    clone.style.position = "absolute"; clone.style.inset = "0"; clone.style.width = "100%"; clone.style.height = "100%";
    clone.style.margin = "0"; clone.style.transform = "none"; clone.style.animation = "none"; clone.style.transition = "none";
    return clone;
  }

  function showActor(job: TimedJob, scene: RuntimeScene, progress: number, index: number) {
    const s = job.surface, pointer = pointers[index], prop = props[index];
    const destination = viewportBox(s.box), u = job.unit;
    let source = destination;
    const sourceUnit = u.source;
    const capturedSource = copyOrigins.get(job.id);
    const templateReady = sourceUnit?.surfaces.find(s => s.part === "frame")?.populated;
    const sourceAvailable = sourceUnit && (capturedSource || visibleBox(sourceUnit.box) && (templateReady || sourceUnit.complete || scene.units.includes(sourceUnit)));
    let operation = job.operation;
    if (operation === "duplicate") {
      if (s.kind === "token") {
        const first = u.surfaces.find(t => t.kind === "token"); source = viewportBox(first?.box || s.box);
      } else if (sourceAvailable) { if (!capturedSource) copyOrigins.set(job.id, { ...sourceUnit.box }); source = viewportBox(copyOrigins.get(job.id)!); }
      else operation = "create-slot";
    } else if (operation === "drag") {
      // The source is an empty measured local slot, not unrelated offscreen content.
      source = { ...destination, left: destination.left + destination.width * .12, top: destination.top + Math.min(36, destination.height * .12), width: destination.width * .72, height: destination.height * .72 };
    }
    // Give placement a short, exact-size landing hold before atomic handoff.
    const pose = operationPose(operation, destination, source, operation === "drag" ? clamp01(progress / .82) : progress);
    let x = pose.x, y = pose.y;
    if (["create-slot", "resize", "trace"].includes(operation) && y > innerHeight - 18 && pose.box.top >= 76 && pose.box.top < innerHeight - 18) {
      // Tall cards extend below the viewport. Work at their visible top-right
      // handle instead of leaving the entire team below the fold.
      x = pose.box.left + pose.box.width; y = pose.box.top;
    }
    if (y < 76 && pose.box.top + pose.box.height > 76 && pose.box.top + pose.box.height < innerHeight) { x = pose.box.left + pose.box.width; y = pose.box.top + pose.box.height; }
    if (operation === "type" && s.lines.length) {
      const text = textFrame(s.lines, s.box.width, s.box.height, progress);
      x = destination.left + text.x + 2; y = destination.top + text.y + text.height * .75;
      carets[index].style.cssText = `background:${getComputedStyle(pointer).getPropertyValue("--agent-color")};height:${Math.max(10, text.height * .75)}px;transform:translate3d(${destination.left + text.x}px,${destination.top + text.y}px,0);opacity:${Math.floor(performance.now() / 380) % 2 ? .35 : .85}`;
    } else if (s.kind === "edge" && s.el instanceof SVGPathElement) {
      const point = s.el.getPointAtLength(s.el.getTotalLength() * progress), matrix = s.el.getScreenCTM();
      if (matrix) { const at = new DOMPoint(point.x, point.y).matrixTransform(matrix); x = at.x; y = at.y; }
    } else if (s.part === "cell") { x = destination.left + destination.width; y = destination.top + destination.height * progress; }
    // Keep the contact point exact. Move only the tiny label when near an edge.
    pointer.style.opacity = "1"; pointer.style.transform = `translate3d(${x}px,${y}px,0)`;
    pointer.classList.add("scene-pointer"); pointer.dataset.edge = x > innerWidth - 135 ? "right" : "left";
    pointer.dataset.click = String(operation === "duplicate" && progress < .15 || operation === "align" && progress > .7);
    pointer.querySelector<SVGElement>("svg")!.style.transform = "none";
    const action = pointer.querySelector<HTMLElement>(".agent-action")!; action.textContent = ` · ${operation}`; action.style.display = "inline";
    const actor = prop.el.parentElement!;
    prop.el.style.clipPath = "none";
    for (const el of [pointer, actor, prop.el, guides[index]]) {
      el.dataset.sceneId = scene.id; el.dataset.sceneOperation = operation; el.dataset.sceneTarget = s.id;
    }
    const guide = guides[index], selection = guide.querySelector("rect")!, handles = guide.querySelector("path")!;
    guide.dataset.sceneGuide = "";
    const box = pose.box;
    selection.setAttribute("x", String(box.left)); selection.setAttribute("y", String(box.top));
    selection.setAttribute("width", String(box.width)); selection.setAttribute("height", String(box.height));
    selection.style.strokeDashoffset = String(operation === "trace" ? 1 - progress : 0);
    guide.setAttribute("opacity", ["type", "populate", "replace"].includes(operation) ? ".23" : ".65");
    const r = box.left + box.width, b = box.top + box.height;
    handles.setAttribute("d", `M${box.left + 5},${box.top}h-5v5 M${r - 5},${box.top}h5v5 M${box.left},${b - 5}v5h5 M${r - 5},${b}h5v-5`);
    if (operation === "duplicate" && s.kind === "shell" && sourceAvailable) {
      const key = `${scene.id}:${u.id}:${sourceUnit.id}`;
      if (prop.target !== key) { prop.el.replaceChildren(snapshot(sourceUnit, scene.kind !== "project")); prop.target = key; }
      actor.style.opacity = String(1 - clamp01((progress - .82) / .18));
      prop.el.style.width = `${sourceUnit.box.width}px`; prop.el.style.height = `${sourceUnit.box.height}px`;
      prop.el.style.transform = `translate3d(${box.left}px,${box.top}px,0) scale(${box.width / sourceUnit.box.width},${box.height / sourceUnit.box.height})`;
      prop.el.style.setProperty("--agent-color", getComputedStyle(pointer).getPropertyValue("--agent-color"));
    } else if (operation === "drag" || operation === "replace") {
      const key = `asset:${s.id}`;
      if (prop.target !== key) { prop.el.replaceChildren(assetCopy(s)); prop.target = key; }
      actor.style.opacity = "1";
      prop.el.style.width = `${destination.width}px`; prop.el.style.height = `${destination.height}px`;
      prop.el.style.transform = `translate3d(${box.left}px,${box.top}px,0) scale(${box.width / Math.max(1, destination.width)},${box.height / Math.max(1, destination.height)})`;
      prop.el.style.setProperty("--agent-color", getComputedStyle(pointer).getPropertyValue("--agent-color"));
      prop.el.style.clipPath = operation === "replace" ? `inset(0 ${(1 - progress) * 100}% 0 0)` : "none";
    } else if (["trace", "create-slot", "resize"].includes(operation) || s.kind === "token" && operation === "duplicate") {
      if (prop.target !== "empty") { prop.el.replaceChildren(); prop.target = "empty"; }
      actor.style.opacity = String(operation === "trace" ? .2 : .6);
      prop.el.style.width = `${destination.width}px`; prop.el.style.height = `${destination.height}px`;
      prop.el.style.transform = `translate3d(${box.left}px,${box.top}px,0) scale(${box.width / Math.max(1, destination.width)},${box.height / Math.max(1, destination.height)})`;
      prop.el.style.setProperty("--agent-color", getComputedStyle(pointer).getPropertyValue("--agent-color"));
    }
  }

  function tick(now: number, intent: ScrollIntent, heroOwnsPointers: boolean) {
    if (!enabled || disposed || paused) return false;
    try {
      if (dirty) measure();
      hideActors(true);
      const velocity = Math.abs(intent.speed), fast = intent.active && intent.userDriven && intent.scan;
      const leap = intent.active && intent.userDriven && intent.leap;
      const lead = fast ? Math.min(innerHeight * 2.5, velocity * 650) : 0;
      const activeJobs: { job: TimedJob; scene: RuntimeScene; p: number }[] = [];
      let working = false;
      for (const scene of scenes) {
        const top = scene.top - scrollY, bottom = scene.bottom - scrollY;
        const reading = top < innerHeight && bottom > 76;
        if (intent.hardJump && reading) { finish(scene); continue; }
        if (leap && reading) { bypass(scene); continue; }
        if (scene.bypassed && !fast && !leap && !intent.hardJump && reading) {
          rearm(scene);
        }
        if (scene.state === "complete") continue;
        const approaching = fast && (intent.direction > 0 ? top < innerHeight + lead && bottom > 76 : bottom > 76 - lead && top < innerHeight);
        if (bottom <= 76 || approaching) { bypass(scene); continue; }
        if (!reading) { scene.lastAt = 0; continue; }
        // Media slots get their own visible work window; headers above them can
        // become readable without completing an offscreen image animation.
        const media = scene.units.flatMap(u => u.surfaces).filter(s => s.part === "media");
        const workTop = media.length ? Math.min(...media.map(s => s.box.top)) - scrollY : top;
        const workBottom = media.length ? Math.max(...media.map(s => s.box.top + s.box.height)) - scrollY : bottom;
        const reverse = intent.direction < 0;
        const canWatch = reverse ? workBottom > 76 : workTop < innerHeight * .98;
        if (!canWatch) {
          for (const u of scene.units) for (const s of u.surfaces) if (s.kind === "text" && s.box.top - scrollY < innerHeight * .6) release(s);
          scene.lastAt = 0; continue;
        }
        if (!scene.entered) { scene.entered = true; scene.state = "building"; scene.lastAt = now; scene.units.forEach(u => { u.root.dataset.sceneState = "building"; u.root.dataset.sceneBuilding = ""; }); }
        const dt = Math.min(50, Math.max(0, now - (scene.lastAt || now))) * 1.15; scene.lastAt = now;
        // Ordinary movement must not teleport the job clock to a viewport floor.
        // Actual fast intent has already prepared content in the branch above.
        const tempo = 1 + Math.min(.35, Math.max(0, velocity * 1000 / innerHeight - .8) * .2);
        const desired = scene.elapsed + dt * tempo;
        let limit = Infinity;
        for (const job of scene.timeline) {
          if (["drag", "replace"].includes(job.operation) && !imageReady(job.surface)) limit = Math.min(limit, job.start);
          if (job.operation === "duplicate" && job.surface.kind === "shell" && job.unit.source && visibleBox(job.unit.source.box) && !job.unit.source.surfaces.find(s => s.part === "frame")?.populated) limit = Math.min(limit, job.start);
        }
        if (scene.kind === "activity" && !scene.root.querySelector("[data-activity-ready]") && !activityFailed(scene)) limit = Math.min(limit, 750);
        const waiting = desired > limit;
        if (waiting && (scene.timeline.some(job => ["drag", "replace"].includes(job.operation) && !imageReady(job.surface)) || scene.kind === "activity")) scene.dataWait = true;
        scene.elapsed = Math.max(scene.elapsed, Math.min(desired, limit));
        scene.progress = clamp01(scene.elapsed / scene.duration);
        working ||= !waiting;
        for (const u of scene.units) {
          if (u.complete) continue;
          // Release surfaces only once they have left the reading area. The
          // current visible text/image retains its full construction timeline.
          for (const s of u.surfaces) {
            const b = viewportBox(s.box), inReadingBand = b.top + b.height <= 76;
            if (s.kind !== "shell" && inReadingBand && (s.kind === "text" || !scene.dataWait || intent.active) && imageReady(s)) release(s);
          }
          if (scene.elapsed >= u.end) { finishUnit(u); continue; }
          for (const job of scene.timeline.filter(j => j.unit === u)) {
            const p = stage(scene.elapsed, job); if (p <= 0) continue;
            const s = job.surface;
            if (job.operation === "commit") continue;
            if (s.kind === "shell") {
              const outstandingSlot = scene.timeline.some(other => other.surface === s && ["create-slot", "duplicate", "resize"].includes(other.operation) && other.end > scene.elapsed);
              if (p >= 1 && ["trace", "create-slot", "duplicate", "resize"].includes(job.operation) && !outstandingSlot) release(s);
            }
            else if (s.kind === "token") { if (job.operation === "populate") paint(s, p); }
            else if ((job.operation === "drag" || job.operation === "replace") && p < 1 && !s.populated) {
              // A moving asset owns the pixels until its measured destination
              // is reached; the real image never appears behind a smaller copy.
              s.progress = p;
            } else if (!(s.kind === "text" && ["trace", "create-slot", "align"].includes(job.operation))) paint(s, p);
            const meaningful = p < 1 && visibleBox(s.box) && (!s.populated || ["trace", "create-slot", "align", "duplicate"].includes(job.operation));
            if (meaningful && !waiting) activeJobs.push({ job, scene, p });
          }
        }
        if (scene.units.every(u => u.complete)) finish(scene);
      }
      {
        const occupied = new Set<string>();
        // Persistent assignments avoid job thrashing; layout and content can
        // work simultaneously without two agents gripping the same surface.
        for (const [i, pointer] of pointers.entries()) {
          // The approved hero may still occupy the upper viewport while About
          // enters below. Its active editors retain ownership; unused members
          // of the same eight-agent pool can construct the newly visible scene.
          if (heroOwnsPointers && Number(pointer.style.opacity) > .1) continue;
          const role = pointer.dataset.role === "text" ? "content" : pointer.dataset.role === "asset" ? "asset" : "layout";
          const prior = histories.get(`agent-${i}`);
          const candidates = activeJobs.filter(a => !occupied.has(a.job.surface.id));
          const selected = candidates.find(a => a.job.id === prior) || candidates.sort((a, b) =>
            (a.job.agentRole === role ? 0 : 2) - (b.job.agentRole === role ? 0 : 2) || a.job.start - b.job.start)[0];
          if (!selected) continue;
          occupied.add(selected.job.surface.id);
          histories.set(`agent-${i}`, selected.job.id);
          showActor(selected.job, selected.scene, selected.p, i);
        }
      }
      return working;
    } catch (error) {
      console.error("Construction scene released to real content", error);
      scenes.forEach(finish); hideActors(); enabled = false;
      return false;
    }
  }

  function expose(target: Element) {
    for (const scene of scenes) if (scene.units.some(u => u.root.contains(target) || target.contains(u.root))) finish(scene);
  }
  const interaction = (event: Event) => { if (event.target instanceof Element) expose(event.target); };
  document.addEventListener("focusin", interaction, true); document.addEventListener("pointerdown", interaction, true);
  configure(options.enabled);
  return {
    tick, configure, invalidate() { dirty = true; wake(); },
    pause() {
      // A scan summary needs readable real surfaces, but completion is only
      // provisional: restoration resumes current visible assembly in place.
      const scanning = getScrollIntent().scan;
      scenes.filter(s => s.top - scrollY < innerHeight && s.bottom - scrollY > 76 &&
        (s.state !== "complete" || scanning && s.units.some(u => Number(u.root.dataset.quality || 0) < 85))).forEach(bypass);
      paused = true; hideActors();
    },
    resume() { paused = false; dirty = true; scenes.forEach(s => { s.lastAt = 0; }); wake(); },
    jump() { if (enabled) { measure(); scenes.filter(s => s.bottom - scrollY > 76 && s.top - scrollY < innerHeight).forEach(finish); hideActors(); } },
    dispose() {
      disposed = true; scenes.forEach(finish); hideActors();
      document.removeEventListener("focusin", interaction, true); document.removeEventListener("pointerdown", interaction, true);
      surfaces.forEach(s => { delete s.el.dataset.sceneTargetId; });
      scenes.forEach(s => s.units.forEach(u => { delete u.root.dataset.sceneId; delete u.root.dataset.sceneState; delete u.root.dataset.sceneBypassed; }));
      layer.ownerDocument.querySelectorAll<HTMLElement>("[data-scene-pending]").forEach(el => { delete el.dataset.scenePending; delete el.dataset.building; el.style.removeProperty("--construction-clip"); });
      props.forEach(p => p.el.parentElement!.remove()); surfaces.clear();
      activityObserver.disconnect();
    },
  };
}
