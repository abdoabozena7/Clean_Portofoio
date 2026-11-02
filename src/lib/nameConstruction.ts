import { clamp01 } from "./construction";
import { constructionAgents } from "./agentConfig";

type Glyph = {
  node: HTMLSpanElement; x: number; top: number; offsetX: number; offsetY: number;
  size: number; width: number; height: number; index: number; owner: number;
  start: number; duration: number; operation: number;
};
const operations = ["pull", "grow", "shrink", "turn", "slide", "unfold", "drop", "lift"];
const smooth = (p: number) => p * p * (3 - 2 * p);

/** Each pointer owns a succession of measured glyphs. The accessible h1 never changes. */
export function createNameConstruction(heading: HTMLElement, layer: HTMLElement) {
  const root = document.createElement("div");
  root.className = "construction-letters"; root.dataset.nameAssembly = ""; layer.append(root);
  let glyphs: Glyph[] = [], agents = constructionAgents.map((_, i) => i);
  const measure = () => {
    root.replaceChildren(); glyphs = [];
    agents = matchMedia("(pointer: coarse)").matches || innerWidth < 768 ? [0, 2, 5] : constructionAgents.map((_, i) => i);
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode, parent = text.parentElement!, style = getComputedStyle(parent);
      for (let i = 0; i < (text.textContent?.length || 0); i++) {
        const character = text.textContent![i]; if (!character.trim()) continue;
        const range = document.createRange(); range.setStart(text, i); range.setEnd(text, i + 1);
        const rect = range.getBoundingClientRect(); if (!rect.width) continue;
        const index = glyphs.length, owner = agents[index % agents.length];
        const node = document.createElement("span"); node.textContent = character;
        node.dataset.letterOwner = String(owner); node.dataset.letterOperation = operations[index % operations.length];
        node.style.cssText = `font:${style.font};letter-spacing:${style.letterSpacing};color:${style.color};line-height:${rect.height}px;opacity:0;outline-offset:3px`;
        root.append(node);
        const own = document.createRange(); own.selectNodeContents(node);
        const ownRect = own.getBoundingClientRect(), box = node.getBoundingClientRect();
        glyphs.push({ node, x: rect.left, top: rect.top + scrollY, offsetX: ownRect.left - box.left, offsetY: ownRect.top - box.top,
          size: parseFloat(style.fontSize), width: rect.width, height: rect.height, index, owner, start: 0, duration: 0, operation: index % operations.length });
      }
    }
    // No cursor operates two letters at once. Small offsets prevent a synchronized wave.
    const rounds = Math.ceil(glyphs.length / agents.length), slot = .83 / rounds;
    glyphs.forEach(g => { g.start = Math.floor(g.index / agents.length) * slot + agents.indexOf(g.owner) * .012; g.duration = slot * .83; });
  };
  const position = (g: Glyph, p: number) => {
    const flight = clamp01((p - g.start) / g.duration), t = smooth(flight), remaining = 1 - t;
    const pulse = Math.sin(Math.PI * t), size = g.size;
    let dx = 0, dy = 0, scaleX = 1, scaleY = 1, angle = 0;
    switch (g.operation) {
      case 0: dx = size * .05 * remaining; dy = -size * .9 * remaining; break;
      case 1: dx = -size * .14 * remaining; dy = size * .25 * remaining; scaleX = scaleY = .16 + .84 * t + .12 * pulse; break;
      case 2: dx = size * .12 * remaining; dy = -size * .15 * remaining; scaleX = scaleY = 1 + .65 * remaining; angle = -6 * remaining; break;
      case 3: dx = -size * .5 * remaining; dy = size * .16 * remaining; angle = -42 * remaining; scaleX = scaleY = .8 + .2 * t; break;
      case 4: dx = size * .62 * remaining; dy = -size * .06 * remaining + size * .12 * pulse; break;
      case 5: dx = -size * .12 * remaining; dy = size * .35 * remaining; scaleX = .23 + .77 * t; scaleY = 1 + .13 * remaining; angle = 7 * remaining; break;
      case 6: dx = size * .16 * remaining; dy = -size * .75 * remaining + size * .13 * Math.sin(t * Math.PI * 2) * remaining; scaleY = 1 - .18 * pulse; break;
      case 7: dx = -size * .25 * remaining; dy = size * .7 * remaining; angle = 19 * remaining; scaleX = scaleY = 1 + .12 * remaining; break;
    }
    return { x: g.x + dx, y: g.top - scrollY + dy, flight, scaleX, scaleY, angle };
  };
  const paint = (p: number) => {
    root.style.opacity = p < 1 ? "1" : "0";
    glyphs.forEach(g => {
      const at = position(g, p), active = at.flight > .02 && at.flight < .92;
      g.node.style.opacity = String(clamp01(at.flight / .12));
      g.node.style.transform = `translate3d(${at.x - g.offsetX}px,${at.y - g.offsetY}px,0) rotate(${at.angle}deg) scale(${at.scaleX},${at.scaleY})`;
      g.node.style.outline = active ? `1px solid ${constructionAgents[g.owner].color}` : "none";
      g.node.dataset.letterActive = String(active);
    });
  };
  const point = (p: number, agent: number) => {
    const members = glyphs.filter(g => g.owner === agent), g = members.find(g => p < g.start + g.duration) || members.at(-1);
    if (!g || p > g.start + g.duration + .025) return null;
    const at = position(g, p);
    const grip = (glyph: Glyph, progress: number) => {
      const at = position(glyph, progress), angle = at.angle * Math.PI / 180;
      // Pointer tip stays on the transformed glyph's lower-right handle, including resize/rotation.
      const localX = Math.max(7, glyph.width * .85) * at.scaleX, localY = Math.min(glyph.height * .8, glyph.size * .88) * at.scaleY;
      return { x: at.x + localX * Math.cos(angle) - localY * Math.sin(angle), y: at.y + localX * Math.sin(angle) + localY * Math.cos(angle) };
    };
    const destination = grip(g, p), previous = members[members.indexOf(g) - 1];
    if (previous && p < g.start) {
      const origin = grip(previous, 1), t = smooth(clamp01((p - previous.start - previous.duration) / (g.start - previous.start - previous.duration)));
      destination.x = origin.x + (destination.x - origin.x) * t;
      destination.y = origin.y + (destination.y - origin.y) * t - Math.sin(Math.PI * t) * g.size * .13;
    }
    return { ...destination,
      operation: p < g.start ? "pick" : at.flight > .88 ? "align" : operations[g.operation], letter: g.index, moving: p >= g.start && at.flight < 1 };
  };
  return { measure, paint, point, hide: () => { root.style.opacity = "0"; }, dispose: () => root.remove() };
}
