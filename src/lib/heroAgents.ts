type Point = { x: number; y: number };
type Glyph = Point & { width: number; height: number };
type Layout = { scale: number; perches: Point[]; code: Point; terminal: Point; left: number; right: number; lineY: number };

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const p = clamp(n); return p * p * (3 - 2 * p); };
const phase = (time: number, start: number, end: number) => ease((time - start) / (end - start));
const mix = (a: Point, b: Point, p: number): Point => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p });
const travel = (a: Point, b: Point, p: number, arc: number): Point => {
  const at = mix(a, b, p); at.y -= Math.sin(p * Math.PI) * arc; return at;
};

/** One visibility-aware clock. All carried props and the drawing nib share the
 * same measured coordinates as the real text; resizing never restarts the story. */
export function animateHeroAgents(svg: SVGSVGElement, heading: HTMLHeadingElement) {
  const container = svg.parentElement!;
  const cable = svg.querySelector<SVGPathElement>("[data-agent-cable]")!;
  const actors = [...svg.querySelectorAll<SVGGElement>("[data-hero-agent]")];
  const code = svg.querySelector<SVGGElement>('[data-hero-tool="code"]')!;
  const terminal = svg.querySelector<SVGGElement>('[data-hero-tool="terminal"]')!;
  const junctions = [...svg.querySelectorAll<SVGCircleElement>("[data-cable-junction]")];
  const celebration = svg.querySelector<SVGGElement>("[data-hero-celebration]")!;
  const accents = [...celebration.querySelectorAll<SVGPathElement>("path")];
  const coarse = matchMedia("(pointer: coarse)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  let layout: Layout | null = null, layoutDirty = true, accentLengths: number[] = [], length = 0, frame = 0, elapsed = 0, last = 0;
  let visible = false, fontsReady = false, stopped = false, started = false;
  const duration = 5600;
  let layoutPaused = false;
  const objects = [...actors, code, terminal];
  const readVectors = () => new Map(objects.map(group => {
    const parts = [...group.querySelectorAll<SVGGeometryElement>("path,rect,ellipse,circle")].map(node => ({
      node, length: node.getTotalLength(), stroke: getComputedStyle(node).stroke,
    }));
    return [group, { parts, total: parts.reduce((sum, part) => sum + part.length, 0), painted: -1 }];
  }));
  let vectors: ReturnType<typeof readVectors> | undefined;
  const setPose = (node: SVGElement, point: Point, scale: number, angle = 0) => {
    const transform = `translate(${point.x.toFixed(3)} ${point.y.toFixed(3)}) rotate(${angle.toFixed(2)}) scale(${scale})`;
    if (node.getAttribute("transform") !== transform) node.setAttribute("transform", transform);
  };

  const measure = () => {
    const origin = container.getBoundingClientRect();
    if (!origin.width || !origin.height) return;
    const words: { text: Text; start: number; end: number }[] = [];
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode as Text, content = text.textContent || "", start = content.search(/\S/);
      if (start >= 0) words.push({ text, start, end: content.trimEnd().length });
    }
    if (words.length < 2) return;
    const style = getComputedStyle(heading), size = parseFloat(style.fontSize);
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const glyph = (word: number, from = 0, to?: number): Glyph => {
      const part = words[word], range = document.createRange();
      range.setStart(part.text, part.start + from); range.setEnd(part.text, to === undefined ? part.end : part.start + to);
      const box = range.getBoundingClientRect(), metrics = context.measureText(range.toString());
      const ascent = metrics.fontBoundingBoxAscent ?? size;
      return { x: box.left - origin.left, y: box.top - origin.top + ascent - metrics.actualBoundingBoxAscent,
        width: box.width, height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent };
    };
    const first = glyph(0), surname = glyph(1), scale = Math.max(.58, Math.min(1, size / 130));
    // A character's logical box includes empty space: h's upper stem sits well
    // left of its box centre. Find its actual top ink run without altering text.
    const perch = (index: number): Point => {
      const g = glyph(0, index, index + 1), char = words[0].text.textContent!.trim()[index];
      canvas.width = Math.ceil(size * 2); canvas.height = Math.ceil(size * 2);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.fillText(char, size * .25, size * 1.3);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height), w = canvas.width;
      let top = -1;
      for (let y = 0; y < pixels.height && top < 0; y++) for (let x = 0; x < w; x++) {
        if (pixels.data[(y*w+x)*4+3] > 150) { top=y; break; }
      }
      const row = Math.min(pixels.height-1, top + Math.max(1, Math.round(size*.012)));
      let start = -1, bestStart = 0, bestWidth = 0;
      for (let x = 0; x <= w; x++) {
        const ink = x < w && pixels.data[(row*w+x)*4+3] > 110;
        if (ink && start < 0) start=x;
        if (!ink && start >= 0) { if (x-start > bestWidth) { bestStart=start; bestWidth=x-start; } start=-1; }
      }
      return {x:g.x + (bestWidth ? bestStart+bestWidth/2-size*.25 : g.width/2),y:g.y+1};
    };
    const perches = [0,7,10].map(perch);
    const left = first.x + size * .16, right = first.x + first.width - size * .13;
    const lineY = (first.y + first.height + surname.y) / 2;
    const codePoint = { x: first.x + first.width * .30, y: lineY + 2 * scale };
    const terminalPoint = { x: first.x + first.width * .65, y: lineY - scale };
    const start = { x: left + size * .05, y: first.y + first.height * .38 };
    const end = { x: right, y: first.y + first.height * .77 };
    const n = (v: number) => v.toFixed(3);
    cable.setAttribute("d", `M${n(start.x)},${n(start.y)} C${n(left-43*scale)},${n(lineY-36*scale)} ${n(left-18*scale)},${n(lineY+24*scale)} ${n(left+51*scale)},${n(lineY+4*scale)} S${n(codePoint.x-58*scale)},${n(lineY-17*scale)} ${n(codePoint.x)},${n(codePoint.y)} S${n(terminalPoint.x-120*scale)},${n(lineY-24*scale)} ${n(terminalPoint.x)},${n(terminalPoint.y)} S${n(right+8*scale)},${n(lineY+32*scale)} ${n(end.x)},${n(end.y)}`);
    for (const [side, x, y] of [["left", surname.x - 10 * scale, surname.y + 19 * scale], ["right", surname.x + surname.width + 12 * scale, surname.y + surname.height - 10 * scale]] as const) {
      const direction=side==="left"?-1:1;
      svg.querySelector(`[data-celebration-${side}]`)!.setAttribute("d", `M${x},${y}l${direction*7*scale},${-5*scale} M${x+direction*3*scale},${y+9*scale}h${direction*9*scale} M${x-direction*5*scale},${y-8*scale}l${direction*2*scale},${-8*scale}`);
    }
    layout = { scale, perches, code: codePoint, terminal: terminalPoint, left, right, lineY };
    svg.setAttribute("viewBox", `0 0 ${origin.width} ${origin.height}`);
    length = cable.getTotalLength();
    const points = [.16, .49, .82].map(fraction => cable.getPointAtLength(length * fraction));
    accentLengths = accents.map(node => node.getTotalLength());
    points.forEach((point, i) => {
      junctions[i].setAttribute("cx", String(point.x)); junctions[i].setAttribute("cy", String(point.y)); junctions[i].setAttribute("r", String(4.3 * scale));
    });
    layoutDirty = false;
  };

  const viewportPoint = (node: SVGGraphicsElement, point: Point): Point => {
    const matrix = node.getScreenCTM();
    return matrix ? new DOMPoint(point.x, point.y).matrixTransform(matrix) : point;
  };
  const vectorTip = (group: SVGGElement, progress: number): Point => {
    const { parts, total } = vectors!.get(group)!;
    let remaining = progress * total;
    for (const { node, length } of parts) {
      if (remaining < length) return viewportPoint(node, node.getPointAtLength(remaining));
      remaining -= length;
    }
    return { x: 0, y: 0 };
  };
  const paintVector = (group: SVGGElement, progress: number) => {
    const vector = vectors!.get(group)!;
    if (vector.painted === progress) return;
    let remaining = progress * vector.total;
    for (const { node, length: partLength, stroke } of vector.parts) {
      const p = clamp(remaining / (partLength || 1)); remaining -= partLength;
      node.style.stroke = p < 1 ? "#111920" : stroke;
      node.style.strokeDasharray = String(partLength);
      node.style.strokeDashoffset = String(partLength * (1 - p));
      node.style.strokeOpacity = p > 0 ? "1" : "0";
      node.style.fillOpacity = String(phase(p, .82, 1));
    }
    group.dataset.buildProgress = String(progress);
    vector.painted = progress;
  };
  const paint = () => {
    if (!fontsReady) return;
    const ready = heading.dataset.constructed === "true";
    if (!ready) { svg.style.opacity = "0"; svg.dataset.state = "waiting"; releaseHeroOverlayWork(svg); return; }
    if (svg.hasAttribute("data-awaiting-name")) svg.removeAttribute("data-awaiting-name");
    if (layoutDirty) measure();
    if (!layout) return;
    vectors ??= readVectors();
    if (reduced.matches) elapsed = duration;
    // Keep every construction beat readable, with a modest pause for each handoff.
    const t = elapsed / 1000 * (7000 / duration), done = elapsed >= duration, s = layout.scale;
    const helpers = innerWidth >= 768 && !coarse.matches;
    const projecting = active() && !done && !reduced.matches;
    const writes: (() => void)[] = [];
    const reads: (() => void)[] = [];
    const jobs: HeroOverlayJob[] = [];
    const boxes = new Map<SVGGElement, DOMRect>();
    const addJob = (index: number, kind: string, operation: string, resolvePoint: () => Point, object?: SVGGElement) => {
      if (!projecting) return;
      reads.push(() => {
        const point = resolvePoint();
        let box = object && boxes.get(object);
        if (object && !box) { box = object.getBoundingClientRect(); boxes.set(object, box); }
        jobs.push({ index, kind, operation, x: point.x, y: point.y, ...(box ? { box: { left: box.left, top: box.top, width: box.width, height: box.height } } : {}) });
      });
    };
    const buildAndPlace = (group:SVGGElement,index:number,name:string,destination:Point,staging:Point,from:number,drawUntil:number,carryFrom:number,placedAt:number) => {
      const build=phase(t,from,drawUntil),carry=phase(t,carryFrom,placedAt);
      const position=travel(staging,destination,carry,26*s);
      setPose(group,position,s);
      writes.push(() => {
        group.style.opacity = "1";
        const placed = String(t >= placedAt);
        const action = t < from ? "waiting" : t < drawUntil ? "create" : t < carryFrom ? "grip" : t < placedAt ? "carry" : "perched";
        if (group.dataset.placed !== placed) group.dataset.placed = placed;
        if (group.dataset.action !== action) group.dataset.action = action;
        paintVector(group, build);
      });
      const helperIndex=({0:1,2:3,5:7} as Record<number,number>)[index];
      if (t>=from && t<drawUntil) {
        const step=build<.45?"outline":build<.6?"add eyes":build<.75?"draw sparks":"draw hands";
        addJob(index,`draw-${name}`,`${step} · ${name}`,() => vectorTip(group, build),group);
        if(helpers)addJob(helperIndex,`pin-${name}`,"pin drawing",() => viewportPoint(group,{x:-19,y:-35}),group);
      } else if (t>=drawUntil && t<placedAt) {
        addJob(index,`place-${name}`,carry>.8?"align → snap":`carry ${name}`,() => viewportPoint(group,{x:18,y:-7}),group);
        if(helpers)addJob(helperIndex,`pin-${name}`,"hold corner",() => viewportPoint(group,{x:-18,y:-7}),group);
      } else if(helpers&&t>=placedAt&&t<placedAt+.25) {
        const p=phase(t,placedAt,placedAt+.25);
        addJob(helperIndex,`align-${name}`,"align edges",() => viewportPoint(group,{x:-18+36*p,y:-35}),group);
      }
      if(helpers&&t>=placedAt+.3&&t<placedAt+.52) {
        const p=phase(t,placedAt+.3,placedAt+.52);
        addJob(9,`inspect-${name}`,"check placement",() => viewportPoint(group,{x:-18+36*p,y:2}),group);
      }
    };
    const offsets=[[-30,52],[28,62],[-30,50]];
    actors.forEach((actor,i)=>{
      const destination=layout!.perches[i], from=i*.3;
      buildAndPlace(actor,[0,2,5][i],["teal","amber","coral"][i],destination,
        {x:destination.x+offsets[i][0]*s,y:destination.y+offsets[i][1]*s},from,from+1.25,from+1.3,from+2.4);
    });
    const draw = phase(t, 3.2, 5.65);
    if(t>=3.2 && t<5.65) addJob(0,"draw-cable","draw cable",() => viewportPoint(cable,cable.getPointAtLength(length*draw)));
    buildAndPlace(code,2,"code",layout.code,{x:layout.code.x-50*s,y:layout.lineY+57*s},3.2,4.1,4.15,5.25);
    buildAndPlace(terminal,5,"terminal",layout.terminal,{x:layout.right-14*s,y:layout.lineY+61*s},3.75,4.65,4.7,5.8);
    junctions.forEach((node,i)=>{
      const at=[.16,.49,.82][i];
      writes.push(() => { node.style.opacity=String(helpers?phase(draw,at+.025,at+.09):clamp((draw-at)*40)); });
      if(helpers&&draw>at&&draw<at+.1) {
        addJob(8,"seat-junction","connect node",() => viewportPoint(node,{x:+node.getAttribute("cx")!,y:+node.getAttribute("cy")!}));
      }
    });
    accents.forEach((node,i)=>{
      const progress=phase(t,6+i*.3,6.4+i*.3),l=accentLengths[i];
      writes.push(() => {
        node.style.strokeDasharray=String(l);node.style.strokeDashoffset=String(l*(1-progress));node.style.opacity=progress>0?"1":"0";
      });
      if(progress>0&&progress<1)addJob(i===0?2:5,"details","draw details",() => viewportPoint(node,node.getPointAtLength(l*progress)));
    });

    // Pose all groups together, read native SVG geometry, then paint strokes.
    reads.forEach(read => read());
    writes.forEach(write => write());
    svg.style.opacity = "1";
    const state = done ? "settled" : "building";
    if (svg.dataset.state !== state) svg.dataset.state = state;
    svg.dataset.elapsed = String(Math.round(elapsed));
    const beat = done ? "settled" : t < 1.3 ? "create-mascots" : t < 3.2 ? "place-mascots" : t < 5.85 ? "build-cable" : "perch";
    if (svg.dataset.phase !== beat) svg.dataset.phase = beat;
    cable.style.strokeDasharray = String(length);
    cable.style.strokeDashoffset = String(length * (1 - draw));
    svg.dataset.drawProgress = String(draw);
    celebration.style.opacity = "1";
    if(projecting) publishHeroOverlayWork(svg,jobs); else releaseHeroOverlayWork(svg);
  };

  const active = () => visible && !document.hidden && !layoutPaused;
  const tick = (now: number) => {
    frame = 0;
    if (stopped || !active() || !layout || !fontsReady || heading.dataset.constructed !== "true") { last = 0; return; }
    started = true;
    if (last) elapsed = Math.min(duration, elapsed + Math.min(64, now-last));
    last = now; paint();
    if (elapsed < duration && !reduced.matches) frame = requestAnimationFrame(tick);
  };
  function wake() {
    if (stopped) return;
    svg.dataset.active = String(active());
    if (!active()) { cancelAnimationFrame(frame); frame = 0; last = 0; releaseHeroOverlayWork(svg); return; }
    paint();
    if (!frame && layout && fontsReady && heading.dataset.constructed === "true" && elapsed < duration && !reduced.matches) {
      last = 0; frame = requestAnimationFrame(tick);
    }
  }
  const mutations = new MutationObserver(wake);
  mutations.observe(heading, { attributes:true, attributeFilter:["data-constructed"] });
  const onMeasure = () => { layoutDirty = true; wake(); };
  let fontWaitStarted = false;
  const resize = new ResizeObserver(() => {
    if (!fontWaitStarted) {
      fontWaitStarted = true;
      // Reading FontFaceSet.ready can flush styles. Start waiting after the
      // browser's first layout, rather than inside React's synchronous commit.
      void document.fonts.ready.then(() => {
        if (!stopped) { fontsReady = true; onMeasure(); }
      });
    }
    onMeasure();
  });
  resize.observe(heading);
  resize.observe(container);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }); visibility.observe(heading);
  const onPreference = () => { if (reduced.matches) { elapsed=duration; cancelAnimationFrame(frame); frame=0; } wake(); };
  const onLayoutStart=()=>{layoutPaused=true;wake();};
  const onLayoutSettled=()=>{layoutPaused=false;onMeasure();};
  window.addEventListener("resize", onMeasure);
  window.addEventListener("portfolio:layout-start",onLayoutStart);
  window.addEventListener("portfolio:layout-settled", onLayoutSettled);
  document.addEventListener("visibilitychange", wake);
  reduced.addEventListener("change", onPreference);
  return () => {
    stopped=true; cancelAnimationFrame(frame); mutations.disconnect(); resize.disconnect(); visibility.disconnect();
    window.removeEventListener("resize",onMeasure); window.removeEventListener("portfolio:layout-start",onLayoutStart); window.removeEventListener("portfolio:layout-settled",onLayoutSettled);
    document.removeEventListener("visibilitychange",wake); reduced.removeEventListener("change",onPreference);
    if (started) svg.dataset.active="false";
    releaseHeroOverlayWork(svg);
  };
}
import { publishHeroOverlayWork, releaseHeroOverlayWork, type HeroOverlayJob } from "./heroOverlayWork";

