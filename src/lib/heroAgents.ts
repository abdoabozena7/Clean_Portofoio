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
  const pen = svg.querySelector<SVGGElement>("[data-drawing-pen]")!;
  const celebration = svg.querySelector<SVGGElement>("[data-hero-celebration]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  let layout: Layout | null = null, length = 0, frame = 0, elapsed = 0, last = 0;
  let visible = false, fontsReady = false, stopped = false, started = false;
  const duration = 6200;
  const setPose = (node: SVGElement, point: Point, scale: number, angle = 0) => {
    node.setAttribute("transform", `translate(${point.x.toFixed(3)} ${point.y.toFixed(3)}) rotate(${angle.toFixed(2)}) scale(${scale})`);
  };

  const measure = () => {
    const origin = container.getBoundingClientRect();
    if (!origin.width || !origin.height) return;
    svg.setAttribute("viewBox", `0 0 ${origin.width} ${origin.height}`);
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
    const perches = [glyph(0, 0, 1), glyph(0, 7, 8), glyph(0, 10, 11)].map(g => ({ x: g.x + g.width * .5, y: g.y + 1 }));
    const left = first.x + size * .16, right = first.x + first.width - size * .13;
    const lineY = (first.y + first.height + surname.y) / 2;
    const codePoint = { x: first.x + first.width * .30, y: lineY + 2 * scale };
    const terminalPoint = { x: first.x + first.width * .65, y: lineY - scale };
    const start = { x: left + size * .05, y: first.y + first.height * .38 };
    const end = { x: right, y: first.y + first.height * .77 };
    const n = (v: number) => v.toFixed(3);
    cable.setAttribute("d", `M${n(start.x)},${n(start.y)} C${n(left-43*scale)},${n(lineY-36*scale)} ${n(left-18*scale)},${n(lineY+24*scale)} ${n(left+51*scale)},${n(lineY+4*scale)} S${n(codePoint.x-58*scale)},${n(lineY-17*scale)} ${n(codePoint.x)},${n(codePoint.y)} S${n(terminalPoint.x-120*scale)},${n(lineY-24*scale)} ${n(terminalPoint.x)},${n(terminalPoint.y)} S${n(right+8*scale)},${n(lineY+32*scale)} ${n(end.x)},${n(end.y)}`);
    length = cable.getTotalLength();
    for (const [i, fraction] of [.16, .49, .82].entries()) {
      const p = cable.getPointAtLength(length * fraction); junctions[i].setAttribute("cx", String(p.x)); junctions[i].setAttribute("cy", String(p.y)); junctions[i].setAttribute("r", String(4.3 * scale));
    }
    for (const [side, x, y] of [["left", surname.x - 10 * scale, surname.y + 19 * scale], ["right", surname.x + surname.width + 12 * scale, surname.y + surname.height - 10 * scale]] as const) {
      svg.querySelector(`[data-celebration-${side}]`)!.setAttribute("d", `M${x},${y}l${-7*scale},${-5*scale} M${x-3*scale},${y+9*scale}h${-9*scale} M${x+5*scale},${y-8*scale}l${-2*scale},${-8*scale}`);
    }
    layout = { scale, perches, code: codePoint, terminal: terminalPoint, left, right, lineY };
    paint(); wake();
  };

  const paint = () => {
    if (!layout || !fontsReady) return;
    const ready = heading.dataset.constructed === "true";
    if (!ready) { svg.style.opacity = "0"; svg.dataset.state = "waiting"; return; }
    if (reduced.matches) elapsed = duration;
    const t = elapsed / 1000, done = elapsed >= duration, s = layout.scale;
    svg.style.opacity = "1";
    svg.dataset.state = done ? "settled" : "building";
    svg.dataset.elapsed = String(Math.round(elapsed));
    svg.dataset.phase = done ? "settled" : t < .5 ? "arrive" : t < 3.8 ? "draw-and-carry" : "perch";
    const draw = phase(t, .5, 3.8), point = cable.getPointAtLength(length * draw);
    cable.style.strokeDasharray = String(length);
    cable.style.strokeDashoffset = String(length * (1 - draw));
    svg.dataset.drawProgress = String(draw);
    const initial = cable.getPointAtLength(0);
    let teal: Point = t < .5 ? travel({ x: layout.left + 15*s, y: layout.lineY+46*s }, initial, phase(t,0,.5), 18*s) : point;
    if (t > 3.9) teal = travel(point, layout.perches[0], phase(t,3.9,5.8), 100*s);
    setPose(actors[0], teal, s, t > .5 && t < 3.8 ? -8 : 0);
    actors[0].dataset.action = t < .5 ? "arrive" : t < 3.8 ? "draw" : done ? "perched" : "return";
    pen.style.opacity = t >= .5 && t < 3.8 ? "1" : "0";

    const placeTool = (node: SVGGElement, actor: SVGGElement, destination: Point, start: Point, from: number, to: number, perch: Point) => {
      const progress = phase(t, from, to), released = t >= to;
      const prop = travel(start, destination, progress, 39*s);
      const grip = { x: prop.x - 28*s, y: prop.y + 5*s };
      const leave = phase(t, to + .25, 6.05);
      const position = released ? travel(grip, perch, leave, 74*s) : grip;
      setPose(node, prop, s, released ? 0 : Math.sin(progress * Math.PI)*-8);
      node.style.opacity = t >= from ? "1" : "0";
      node.dataset.placed = String(released);
      setPose(actor, position, s);
      actor.style.opacity = t >= from ? "1" : "0";
      actor.dataset.action = t < from ? "waiting" : !released ? "carry" : leave < 1 ? "return" : "perched";
    };
    placeTool(code, actors[1], layout.code, {x: layout.left+39*s, y:layout.lineY+60*s}, .9, 3.05, layout.perches[1]);
    placeTool(terminal, actors[2], layout.terminal, {x:layout.right-3*s,y:layout.lineY+70*s}, 2.15, 4.6, layout.perches[2]);
    junctions.forEach((node, i) => { node.style.opacity = draw > [.16,.49,.82][i] ? "1" : "0"; });
    celebration.style.opacity = String(phase(t,5.65,6.2));
  };

  const active = () => visible && !document.hidden;
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
    if (!active()) { cancelAnimationFrame(frame); frame = 0; last = 0; return; }
    paint();
    if (!frame && layout && fontsReady && heading.dataset.constructed === "true" && elapsed < duration && !reduced.matches) {
      last = 0; frame = requestAnimationFrame(tick);
    }
  }
  const mutations = new MutationObserver(wake);
  mutations.observe(heading, { attributes:true, attributeFilter:["data-constructed"] });
  const resize = new ResizeObserver(measure); resize.observe(heading); resize.observe(container);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }); visibility.observe(heading);
  const onPreference = () => { if (reduced.matches) { elapsed=duration; cancelAnimationFrame(frame); frame=0; } wake(); };
  window.addEventListener("resize", measure);
  window.addEventListener("portfolio:layout-settled", measure);
  document.addEventListener("visibilitychange", wake);
  reduced.addEventListener("change", onPreference);
  document.fonts.ready.then(() => { if (!stopped) { fontsReady=true; measure(); } });
  measure();
  return () => {
    stopped=true; cancelAnimationFrame(frame); mutations.disconnect(); resize.disconnect(); visibility.disconnect();
    window.removeEventListener("resize",measure); window.removeEventListener("portfolio:layout-settled",measure);
    document.removeEventListener("visibilitychange",wake); reduced.removeEventListener("change",onPreference);
    if (started) svg.dataset.active="false";
  };
}
