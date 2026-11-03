import { clamp01 } from "./construction";
import { constructionAgents } from "./agentConfig";
import "@/styles/name-construction.css";

type Piece = { node: HTMLSpanElement; x: number; y: number; width: number; height: number; offsetX: number; offsetY: number; color: string; size: number };
type Box = { x: number; y: number; width: number; height: number };
const smooth = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const between = (p: number, from: number, to: number) => smooth((p - from) / (to - from));
const mix = (from: number, to: number, t: number) => from + (to - from) * t;
const ns = "http://www.w3.org/2000/svg";

/** A directed word workshop: carry, pin + resize, duplicate, replace, punctuate, align.
 * The real h1 is never split or changed. Every destination is a native text Range. */
export function createNameConstruction(heading: HTMLElement, layer: HTMLElement) {
  const root = document.createElement("div"); root.className = "construction-letters name-workshop"; root.dataset.nameAssembly = ""; layer.append(root);
  const pieceNodes = new Map<string, HTMLSpanElement>();
  const svg = document.createElementNS(ns, "svg"); svg.classList.add("name-workshop-guides"); root.append(svg);
  const frames = [0, 5, 2].map((agent, index) => {
    const group = document.createElementNS(ns, "g"), rect = document.createElementNS(ns, "rect"), handles = document.createElementNS(ns, "path");
    group.dataset.nameFrame = String(index); group.style.color = constructionAgents[agent].color; group.append(rect, handles); svg.append(group);
    const label = document.createElement("span"); label.className = "name-workshop-readout"; label.dataset.nameReadout = String(index); label.style.background = constructionAgents[agent].color; root.append(label);
    return { group, rect, handles, label };
  });
  const alignment = document.createElementNS(ns, "path"); svg.append(alignment);
  let pieces: Piece[] = [], template: Piece | null = null, mobile = false, center = 0;
  const measure = () => {
    mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 768;
    const headingBox = heading.getBoundingClientRect();
    const offset = scrollY;
    center = headingBox.left + headingBox.width / 2;
    const destinations: { kind: string; content: string; rect: DOMRect; font: string; color: string; size: number }[] = [];
    const range = document.createRange();
    const read = (text: Text, from: number, to: number, kind: string, style: CSSStyleDeclaration) => {
      range.setStart(text, from); range.setEnd(text, to);
      const rect = range.getBoundingClientRect();
      if (!rect.width) return;
      destinations.push({
        kind, content: text.data.slice(from, to), rect, color: style.color, size: parseFloat(style.fontSize),
        font: `font:${style.font};letter-spacing:${style.letterSpacing};color:${style.color};line-height:${rect.height}px;font-kerning:${style.fontKerning};font-feature-settings:${style.fontFeatureSettings};font-variation-settings:${style.fontVariationSettings};text-transform:${style.textTransform};-webkit-text-stroke:${style.webkitTextStrokeWidth} ${style.webkitTextStrokeColor};opacity:0`,
      });
    };
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode as Text, from = text.data.search(/\S/);
      if (from < 0) continue;
      const end = text.data.trimEnd().length, punctuation = text.data[end - 1] === ".";
      const style = getComputedStyle(text.parentElement!);
      read(text, from, punctuation ? end - 1 : end, destinations.length ? "surname" : "first", style);
      if (punctuation) read(text, end - 1, end, "period", style);
    }
    const first = destinations[0];
    const nodes = [...destinations, ...(first ? [{ ...first, kind: "duplicate" }] : [])].map(destination => {
      let node = pieceNodes.get(destination.kind);
      if (!node) {
        node = document.createElement("span"); node.className = "name-workshop-piece"; node.dataset.namePiece = destination.kind;
        root.insertBefore(node, svg);
        pieceNodes.set(destination.kind, node);
      }
      if (node.textContent !== destination.content) node.textContent = destination.content;
      node.style.cssText = destination.font;
      return { node, destination };
    });
    // All copies are untransformed for this single layout read, then repositioned by paint().
    const measured = nodes.map(({ node, destination: { rect, color, size } }) => {
      range.selectNodeContents(node);
      const ownRect = range.getBoundingClientRect(), box = node.getBoundingClientRect();
      return { node, x: rect.left, y: rect.top + offset, width: rect.width, height: rect.height, offsetX: ownRect.left - box.left, offsetY: ownRect.top - box.top, color, size };
    });
    template = first ? measured.pop()! : null;
    pieces = measured;
  };
  const scene = (p: number, offset: number) => {
    if (pieces.length < 3) return null;
    const [first, surname, dot] = pieces, target = { x: first.x, y: first.y - offset, width: first.width, height: first.height };
    const small = mobile ? .48 : .36;
    const drag = between(p, .12, .31), resize = between(p, .35, .56), scale = mix(small, 1, resize);
    const carry = { x: mix(Math.max(18, first.x - first.width * .1), target.x, drag), y: mix(target.y + first.height * .62, target.y, drag), width: first.width * scale, height: first.height * scale };
    const copy = between(p, .56, .76);
    const second: Box = { x: mix(target.x, surname.x, copy), y: mix(target.y, surname.y - offset, copy), width: mix(first.width, surname.width, copy), height: mix(first.height, surname.height, copy) };
    // The copy travels as the actual first word, then becomes the actual surname.
    const replace = between(p, .705, .78), punctuate = between(p, .81, .89);
    const period: Box = { x: mix(dot.x + dot.size * .42, dot.x, punctuate), y: mix(dot.y - offset - dot.size * .24, dot.y - offset, punctuate), width: dot.width * mix(.55, 1, punctuate), height: dot.height * mix(.55, 1, punctuate) };
    return { carry, second, period, replace, scale, punctuate, guideOpacity: 1 - between(p, .93, .98) };
  };
  const place = (piece: Piece, box: Box, opacity: number, ink = false) => {
    piece.node.style.opacity = String(opacity);
    const sx = box.width / piece.width, sy = box.height / piece.height;
    piece.node.style.transform = `translate3d(${box.x - piece.offsetX * sx}px,${box.y - piece.offsetY * sy}px,0) scale(${sx},${sy})`;
    piece.node.style.color = ink ? "#111920" : piece.color;
  };
  const outline = (index: number, box: Box, opacity: number, label: string, viewportWidth: number, dashed = false) => {
    const frame = frames[index], { x, y, width: w, height: h } = box, l = x - 4, top = y - 3, r = x + w + 4, b = y + h + 3, half = 3;
    frame.group.style.opacity = String(opacity); frame.rect.setAttribute("x", String(l)); frame.rect.setAttribute("y", String(top)); frame.rect.setAttribute("width", String(w + 8)); frame.rect.setAttribute("height", String(h + 6)); frame.rect.style.strokeDasharray = dashed ? "5 4" : "none";
    frame.handles.setAttribute("d", [[l, top], [r, top], [l, b], [r, b]].map(([x, y]) => `M${x-half},${y-half}h6v6h-6Z`).join(" "));
    if (frame.label.textContent !== label) frame.label.textContent = label;
    frame.label.style.opacity = label ? String(opacity) : "0";
    frame.label.style.transform = `translate3d(${Math.max(8, Math.min(viewportWidth - 150, l))}px,${index === 1 ? b + 8 : top - 24}px,0)`;
  };
  const paint = (p: number, offset: number, viewportWidth: number) => {
    const s = scene(p, offset); if (!s || !template) return;
    root.style.opacity = p < 1 ? "1" : "0";
    root.dataset.nameShot = p < .32 ? "carry" : p < .56 ? "resize" : p < .78 ? "duplicate" : p < .9 ? "punctuate" : "align";
    root.dataset.nameProgress = String(p);
    place(pieces[0], s.carry, clamp01((p - .025) / .025));
    place(template, s.second, p >= .54 ? (1 - s.replace) * .42 : 0);
    place(pieces[1], s.second, s.replace, p < .88);
    place(pieces[2], s.period, clamp01((p - .80) / .025), p < .91);
    const finishInk = between(p, .86, .94);
    for (const piece of pieces.slice(1)) piece.node.style.color = p >= .94 ? piece.color : `color-mix(in srgb, #111920 ${(1-finishInk)*100}%, ${piece.color} ${finishInk*100}%)`;
    const firstOpacity = p > .03 && p < .60 ? s.guideOpacity : p >= .88 ? s.guideOpacity * .55 : 0;
    outline(0, s.carry, firstOpacity, p < .32 ? "pick up → place" : p < .56 ? `resize · ${Math.round(s.scale * 100)}%` : "position locked", viewportWidth);
    outline(1, s.second, p >= .54 ? s.guideOpacity : 0, p < .705 ? "duplicate → move" : p < .78 ? "replace text" : "", viewportWidth, p < .705);
    outline(2, s.period, p > .80 && p < .93 ? s.guideOpacity : 0, "", viewportWidth);
    if (alignment) {
      const first = pieces[0], surname = pieces[1];
      alignment.setAttribute("d", `M${center},${first.y-offset-12}V${surname.y-offset+surname.height+12} M${surname.x-12},${surname.y-offset+surname.height}H${pieces[2].x+pieces[2].width+12}`);
      alignment.style.opacity = p >= .86 ? String(s.guideOpacity * .7) : "0";
    }
  };
  const point = (p: number, agent: number, offset: number) => {
    const s = scene(p, offset); if (!s) return null;
    // The actual SVG arrow tip is at(10,.625) in the20px pointer box.
    const grip = (box: Box, side: "start" | "end") => ({ x: (side === "start" ? box.x - 4 : box.x + box.width + 4) - 10, y: (side === "start" ? box.y - 3 : box.y + box.height + 3) - .625 });
    if (agent === 0 && p >= .025 && p <= .60) return { ...grip(s.carry, "start"), letter: 0, operation: p < .32 ? "drag word" : "pin corner", moving: p < .32 };
    if (agent === 2 && p >= .30 && p <= .60) return { ...grip(s.carry, "end"), letter: 0, operation: p < .35 ? "grab handle" : "resize", moving: p >= .35 && p <= .56 };
    if (agent === 5 && p >= .54 && p <= .81) return { ...grip(s.second, "end"), letter: 1, operation: p < .705 ? "duplicate" : p < .78 ? "replace" : "place", moving: p <= .78 };
    if (agent === (mobile ? 2 : 7) && p >= .80 && p <= .89) return { ...grip(s.period, "end"), letter: 2, operation: "place period", moving: p <= .89 };
    if (agent === (mobile ? 0 : 6) && p >= .9 && p <= .97) return { x: mix(s.second.x, s.period.x + s.period.width, between(p, .9, .96)) - 10, y: s.second.y + s.second.height - .625, letter: 1, operation: "align baseline", moving: p <= .96 };
    return null;
  };
  return { measure, paint, point, hide: () => { root.style.opacity = "0"; }, dispose: () => root.remove() };
}
