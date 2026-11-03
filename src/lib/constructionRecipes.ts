import type { ConstructionJob, ConstructionOperation, ConstructionScene, SceneBox } from "./constructionScene";

export type PaintElement = HTMLElement | SVGElement;
export type SceneKind = "heading" | "about" | "experience" | "credential" | "project" | "skill" | "activity" | "contact" | "finale";
export type SurfaceKind = "shell" | "text" | "asset" | "token" | "edge";
export type Surface = {
  id: string; el: PaintElement; kind: SurfaceKind; part: string; box: SceneBox;
  lines: { x: number; y: number; width: number; height: number }[];
  originalStyle: string; progress: number; populated: boolean;
};
export type TimedJob = ConstructionJob & { start: number; end: number; surface: Surface; source?: Surface; unit: SceneUnit };
export type SceneUnit = { id: string; root: HTMLElement; kind: SceneKind; surfaces: Surface[]; end: number; complete: boolean; box: SceneBox; source?: SceneUnit };
export type RuntimeScene = ConstructionScene & { kind: SceneKind; units: SceneUnit[]; timeline: TimedJob[]; duration: number; elapsed: number; progress: number; lastAt: number; top: number; bottom: number; entered: boolean; bypassed?: boolean; dataWait?: boolean };

export function readBox(el: Element): SceneBox {
  const r = el.getBoundingClientRect();
  return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
}

/** Explicit semantic inventory; normal flow, content and component trees stay intact. */
export function discoverScenes(sections: HTMLElement[]): RuntimeScene[] {
  const scenes: RuntimeScene[] = [];
  let serial = 0;
  const unit = (root: HTMLElement, kind: SceneKind): SceneUnit => ({ id: `${root.closest("section")?.id || "finale"}-${kind}-${serial++}`, root, kind, surfaces: [], end: 0, complete: false, box: readBox(root) });
  const add = (kind: SceneKind, units: SceneUnit[]) => {
    if (!units.length) return;
    const id = `scene-${units[0].id}`;
    const scene: RuntimeScene = { id, root: units[0].root, kind, units, jobs: [], timeline: [], state: "unstarted", duration: 0, elapsed: 0, progress: 0, lastAt: 0, top: Math.min(...units.map(u => u.box.top)), bottom: Math.max(...units.map(u => u.box.top + u.box.height)), entered: false };
    units.forEach(u => { u.root.dataset.sceneId = id; u.root.dataset.sceneState = "unstarted"; });
    scenes.push(scene);
  };
  for (const section of sections.filter(s => s.id !== "hero")) {
    const heading = section.querySelector<HTMLElement>(":scope > h2");
    if (heading) add("heading", [unit(heading, "heading")]);
    if (section.id === "about") {
      const root = section.querySelector<HTMLElement>(":scope > div"); if (root) add("about", [unit(root, "about")]);
    } else if (section.id === "experience") {
      let previous: SceneUnit | undefined;
      section.querySelectorAll<HTMLElement>("[data-experience-item]").forEach(root => {
        const u = unit(root, "experience"); u.source = previous; add("experience", [u]); previous = u;
      });
      section.querySelectorAll<HTMLElement>("[data-scan-group] > div > h3").forEach(root => add("heading", [unit(root, "heading")]));
    } else if (section.id === "education" || section.id === "honors") {
      let previous: SceneUnit | undefined;
      section.querySelectorAll<HTMLElement>("[data-certificate]").forEach(root => {
        const u = unit(root, "credential"); u.source = previous; add("credential", [u]); previous = u;
      });
    } else if (section.id === "projects") {
      // Featured Hivo and skill rows really span the grid; group by measured rows.
      let row: SceneUnit[] = [];
      section.querySelectorAll<HTMLElement>("[data-project]").forEach(root => {
        const u = unit(root, "project");
        if (row.length && Math.abs(row[0].box.top - u.box.top) > 3) { add("project", row); row = []; }
        if (row.length) u.source = row[0];
        row.push(u);
      });
      add("project", row);
    } else if (section.id === "skills") {
      let previous: SceneUnit | undefined;
      section.querySelectorAll<HTMLElement>(".skill-category").forEach(root => {
        const u = unit(root, "skill"); u.source = previous; add("skill", [u]); previous = u;
      });
      const activity = section.querySelector<HTMLElement>("[data-construction-scene='activity']");
      if (activity) add("activity", [unit(activity.parentElement!, "activity")]);
      section.querySelectorAll<HTMLElement>("[data-scan-static] > div > div > h3").forEach(root => add("heading", [unit(root, "heading")]));
    } else if (section.id === "contact") {
      const grid = section.querySelector<HTMLElement>(":scope > .grid");
      if (grid) Array.from(grid.children).forEach(child => {
        if (child instanceof HTMLElement) add("contact", [unit(child, "contact")]);
      });
    } else {
      const main = section.querySelector<HTMLElement>(":scope > .max-w-6xl");
      if (main) Array.from(main.children).forEach(child => { if (child instanceof HTMLElement) add("finale", [unit(child, "finale")]); });
      const footer = section.querySelector<HTMLElement>(":scope > div:last-child");
      if (footer) add("finale", [unit(footer, "finale")]);
    }
  }
  return scenes;
}

export function semanticSurfaces(unit: SceneUnit): { el: PaintElement; kind: SurfaceKind; part: string }[] {
  const root = unit.root;
  const result: { el: PaintElement; kind: SurfaceKind; part: string }[] = [];
  const used = new Set<Element>();
  const add = (el: Element | null, kind: SurfaceKind, part: string) => {
    if (!el || used.has(el) || !(el instanceof HTMLElement || el instanceof SVGElement)) return;
    if (kind !== "shell" && result.some(s => s.kind !== "shell" && s.el.contains(el))) return;
    const r = el.getBoundingClientRect();
    // Auto-sized lazy certificate images can have zero intrinsic dimensions at
    // mount. Register their semantic slot now and measure on actual image load.
    if (!(el instanceof HTMLImageElement) && (kind === "edge" ? !r.width && !r.height : !r.width || !r.height)) return;
    used.add(el); result.push({ el, kind, part });
  };
  const all = (selector: string, kind: SurfaceKind, part: string) => root.querySelectorAll(selector).forEach(el => add(el, kind, part));
  if (unit.kind === "heading") { add(root, "text", "heading"); return result; }
  add(root, "shell", "frame");
  if (unit.kind === "project") {
    all(".project-building", "asset", "status");
    all(".project-copy h3", "text", "heading"); all(".project-copy p", "text", "body");
    all(".palette-tag", "token", "token");
    all(".project-media,.project-actions", "shell", "slot");
    all(".project-media img", "asset", "media");
    all(".project-actions > *", "asset", "action");
    all(".harrtest-flow > g[marker-end] > path", "edge", "connection");
    root.querySelectorAll(".harrtest-flow > g[data-construction]").forEach(node => {
      add(node.querySelector("rect"), "shell", "node");
      node.querySelectorAll("text").forEach(text => add(text, "text", "node-label"));
    });
    all(".harrtest-flow > text", "text", "caption");
  } else if (unit.kind === "experience") {
    all(".company-logo", "shell", "logo-slot"); all(".company-logo img,.company-logo > span", "asset", "logo");
    all(".experience-company", "text", "heading"); all(".experience-role", "text", "role");
  } else if (unit.kind === "credential") {
    all(".achievement-ribbon", "asset", "award"); all(".credential-copy h3", "text", "heading");
    all(".credential-copy > div > span", "text", "metadata"); all(".certificate-image-trigger", "shell", "media-slot");
    all(".certificate-thumb", "asset", "media"); all(".certificate-zoom", "asset", "action");
    all(".credential-description p", "text", "body"); all(".credential-story", "asset", "action");
  } else if (unit.kind === "skill") {
    add(root.firstElementChild, "shell", "category");
    all("h3", "text", "heading"); all(".palette-tag", "token", "token");
  } else if (unit.kind === "about") {
    const portrait = root.querySelector("img")?.parentElement;
    if (portrait) {
      add(portrait, "shell", "portrait-slot");
      add(portrait.previousElementSibling, "shell", "portrait-offset");
      add(portrait.querySelector("img"), "asset", "media");
      add(portrait.nextElementSibling, "asset", "status");
    }
    all(".flex-1 > p", "text", "body");
  } else if (unit.kind === "activity") {
    all("h3", "text", "heading");
    if (root.querySelector("[data-activity-ready]")) {
      [...new Set([...root.querySelectorAll("rect[data-date]")].map(rect => rect.parentElement))].forEach(el => add(el, "asset", "cell"));
      all("svg text", "text", "metadata");
    }
    all(":scope > div:last-child", "text", "caption");
  } else {
    // Contact and footer controls are grouped by their real semantic boundaries.
    all("input,textarea", "shell", "field"); all("label", "text", "field-label");
    all("h2,h3,p,a,button", "text", "content");
    all(":scope > div > span,:scope > div > div > span", "text", "label");
    root.querySelectorAll<HTMLElement>("div").forEach(el => {
      const s = getComputedStyle(el);
      if ((parseFloat(s.borderTopWidth) > 0 || s.backgroundColor !== "rgba(0, 0, 0, 0)") && !result.some(t => t.kind !== "shell" && t.el.contains(el))) add(el, "shell", "slot");
      if (el.children.length === 1 && el.firstElementChild?.tagName.toLowerCase() === "svg") add(el.firstElementChild, "asset", "icon");
    });
    // A finale sentence can itself be the scene root.
    if (!result.some(t => t.kind !== "shell") && root.textContent?.trim()) add(root, "text", "content");
  }
  return result;
}

/** Local dependency graph. No later scene ever waits on an offscreen predecessor. */
export function compileRecipe(scene: RuntimeScene) {
  scene.timeline = [];
  const append = (u: SceneUnit, surface: Surface, operation: ConstructionOperation, start: number, end: number, dependsOn: string[] = [], source?: Surface) => {
    const id = `${surface.id}-${operation}-${scene.timeline.length}`;
    scene.timeline.push({ id, targetId: surface.id, operation, start, end, dependsOn, sourceId: source?.id, durationMs: end - start,
      agentRole: operation === "type" ? "content" : ["replace", "populate", "drag"].includes(operation) ? "asset" : operation === "align" ? "style" : "layout", surface, source, unit: u });
    return id;
  };
  scene.units.forEach((u, unitIndex) => {
    const copy = scene.kind === "project" && unitIndex > 0;
    const offset = copy ? 1600 : 0;
    const frame = u.surfaces.find(s => s.part === "frame") || u.surfaces[0];
    if (!frame) { u.end = 0; return; }
    if (scene.kind === "heading") {
      const trace = append(u, frame, "trace", 0, 250);
      const text = append(u, frame, "type", 250, 700, [trace]);
      const align = append(u, frame, "align", 700, 800, [text]);
      append(u, frame, "commit", 800, 850, [align]); u.end = 850; return;
    }
    const trace = append(u, frame, "trace", offset, offset + (copy ? 100 : 300));
    const sourceFrame = u.source?.surfaces.find(s => s.part === "frame");
    const shell = append(u, frame, copy ? "duplicate" : "create-slot", offset + (copy ? 100 : 300), copy ? 2100 : 750, [trace], sourceFrame);
    if (!copy && u.source && scene.kind !== "project") {
      // Empty repeated structures are copied; professional facts are never cloned.
      scene.timeline.find(j => j.id === shell)!.operation = "duplicate";
      scene.timeline.find(j => j.id === shell)!.source = sourceFrame;
    }
    let token = 0, text = 0, cell = 0, edge = 0;
    for (const s of u.surfaces.filter(s => s !== frame)) {
      let operation: ConstructionOperation, start: number, end: number;
      if (s.kind === "shell") {
        operation = ["node", "logo-slot", "media-slot", "portrait-slot", "slot", "field"].includes(s.part) ? "create-slot" : "trace";
        start = copy ? 2100 : 300; end = copy ? 2290 : 750;
        if (s.part === "node") { start = copy ? 2110 : 520; end = start + 250 + edge++ * 65; }
      } else if (s.kind === "token") {
        operation = token === 0 ? "create-slot" : "duplicate";
        start = (copy ? 2220 : scene.kind === "skill" ? 480 : 1020) + token++ * 32; end = start + 220;
      } else if (s.kind === "edge") {
        operation = "trace"; start = (copy ? 2440 : 1000) + edge++ * 55; end = start + 240;
      } else if (s.kind === "text") {
        operation = "type";
        start = copy ? 2150 : s.part === "heading" ? 750 : ["metadata", "role", "field-label"].includes(s.part) ? 850 : s.part === "node-label" ? 1100 : 1000;
        if (scene.kind === "skill") start = 200;
        start += text++ * (scene.kind === "contact" ? 45 : 25);
        const duration = s.part === "body" ? 650 : s.part === "heading" ? 400 : 260;
        end = start + duration;
      } else {
        operation = copy ? "replace" : s.part === "cell" ? "populate" : "drag";
        start = copy ? 2180 : ["media", "logo", "award"].includes(s.part) ? 750 : 1000;
        if (s.part === "cell") { start = 750 + cell++ * 18; end = start + 180; }
        else end = start + (s.part === "media" ? 450 : 300);
      }
      const id = append(u, s, operation, start, end, [s.kind === "shell" && !copy ? trace : shell]);
      if (s.kind === "shell" && operation === "create-slot" && ["slot", "media-slot", "portrait-slot"].includes(s.part)) {
        const job = scene.timeline.find(j => j.id === id)!;
        const originalEnd = job.end;
        job.end -= 150; job.durationMs = job.end - job.start;
        append(u, s, "resize", job.end, originalEnd, [id]);
      }
      if (s.kind === "token") append(u, s, "populate", end, end + 190, [id]);
    }
    const contentEnd = Math.max(...scene.timeline.filter(j => j.unit === u).map(j => j.end));
    const end = copy ? Math.max(2850, contentEnd) : Math.max(scene.kind === "project" && scene.units.length > 1 ? 1450 : 1900, contentEnd);
    const align = append(u, frame, "align", end, end + 170, scene.timeline.filter(j => j.unit === u && j.surface !== frame).map(j => j.id));
    append(u, frame, "commit", end + 170, end + (copy ? 350 : 250), [align]);
    u.end = end + (copy ? 350 : 250);
  });
  // Resolve dependency times, rather than relying on overlapping preset clocks.
  // Empty child slots may follow the region trace; content follows its slot.
  const byId = new Map(scene.timeline.map(job => [job.id, job]));
  // Flowchart edges wait for the real node frames they connect; labels follow
  // their established node and its connections rather than floating in space.
  for (const u of scene.units) {
    const nodes = scene.timeline.filter(j => j.surface.part === "node" && j.unit === u);
    const connections = scene.timeline.filter(j => j.surface.kind === "edge" && j.unit === u);
    for (const edge of connections) edge.dependsOn.push(...nodes.map(j => j.id));
    for (const label of scene.timeline.filter(j => j.surface.part === "node-label" && j.unit === u)) {
      label.dependsOn.push(...nodes.filter(j => j.surface.el.parentElement === label.surface.el.parentElement).map(j => j.id), ...connections.map(j => j.id));
    }
  }
  for (const job of scene.timeline.filter(j => j.operation === "duplicate" && j.unit.source && scene.units.includes(j.unit.source))) {
    job.dependsOn.push(...scene.timeline.filter(j => j.unit === job.unit.source && j.surface.kind !== "shell" && ["populate", "type", "drag", "replace"].includes(j.operation)).map(j => j.id));
  }
  const resolved = new Set<string>();
  const resolve = (job: TimedJob, stack = new Set<string>()) => {
    if (resolved.has(job.id)) return;
    if (stack.has(job.id)) throw new Error(`Cyclic construction dependency: ${job.id}`);
    stack.add(job.id);
    for (const id of job.dependsOn) {
      const dependency = byId.get(id);
      if (!dependency) throw new Error(`Missing construction dependency: ${id}`);
      resolve(dependency, stack); job.start = Math.max(job.start, dependency.end);
    }
    job.end = job.start + job.durationMs;
    stack.delete(job.id); resolved.add(job.id);
  };
  scene.timeline.forEach(job => resolve(job));
  scene.units.forEach(u => { u.end = Math.max(0, ...scene.timeline.filter(j => j.unit === u).map(j => j.end)); });
  scene.duration = Math.max(1, ...scene.timeline.map(j => j.end));
  scene.jobs = scene.timeline;
}
