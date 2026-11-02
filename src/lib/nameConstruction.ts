import { clamp01 } from "./construction";

/** Decorative glyphs use actual character ranges; the accessible heading stays untouched. */
export function createNameConstruction(heading: HTMLElement, layer: HTMLElement) {
  const root = document.createElement("div"); root.className = "construction-letters"; root.dataset.nameAssembly = ""; layer.append(root);
  type Glyph = { node: HTMLSpanElement; x: number; top: number; offsetX: number; offsetY: number; size: number; row: number; order: number; total: number };
  let glyphs: Glyph[] = [];
  const measure = () => {
    root.replaceChildren(); glyphs = [];
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    let firstY = Infinity;
    while (walker.nextNode()) {
      const text = walker.currentNode, parent = text.parentElement!, style = getComputedStyle(parent);
      for (let i = 0; i < (text.textContent?.length || 0); i++) {
        const character = text.textContent![i]; if (!character.trim()) continue;
        const range = document.createRange(); range.setStart(text, i); range.setEnd(text, i + 1);
        const rect = range.getBoundingClientRect(); if (!rect.width) continue;
        firstY = Math.min(firstY, rect.top);
        const node = document.createElement("span"); node.textContent = character;
        node.style.cssText = `font:${style.font};letter-spacing:${style.letterSpacing};color:${style.color};line-height:${rect.height}px;opacity:0`;
        root.append(node);
        const own = document.createRange(); own.selectNodeContents(node);
        const ownRect = own.getBoundingClientRect(), box = node.getBoundingClientRect();
        glyphs.push({ node, x: rect.left, top: rect.top + scrollY, offsetX: ownRect.left - box.left, offsetY: ownRect.top - box.top, size: parseFloat(style.fontSize), row: rect.top > firstY + rect.height * .5 ? 1 : 0, order: 0, total: 0 });
      }
    }
    for (const row of [0, 1]) { const members = glyphs.filter(g => g.row === row); members.forEach((g, i) => { g.order = row ? members.length - 1 - i : i; g.total = members.length; }); }
  };
  const position = (g: Glyph, p: number) => {
    const start = g.order / Math.max(1, g.total) * .42 + g.row * .06;
    const flight = clamp01((p - start) / .42), eased = flight * flight * (3 - 2 * flight);
    const rect = heading.getBoundingClientRect(), sourceX = rect.left + rect.width * (g.row ? .72 : .25) + (g.order % 3 - 1) * g.size * .25;
    const destinationY = g.top - scrollY;
    return { x: sourceX + (g.x - sourceX) * eased, y: destinationY + (g.row ? 1 : -1) * g.size * .65 * (1 - eased), flight, scale: .72 + .28 * eased };
  };
  const paint = (p: number) => {
    root.style.opacity = p < 1 ? "1" : "0";
    glyphs.forEach(g => { const at = position(g, p); g.node.style.opacity = String(clamp01(at.flight / .12)); g.node.style.transform = `translate3d(${at.x - g.offsetX}px,${at.y - g.offsetY}px,0) scale(${at.scale})`; });
  };
  const point = (p: number, row: number) => {
    const members = glyphs.filter(g => g.row === row);
    const g = members.reduce<Glyph | null>((best, glyph) => !best || Math.abs(position(glyph, p).flight - .5) < Math.abs(position(best, p).flight - .5) ? glyph : best, null);
    if (!g) return null;
    const at = position(g, p); return { x: at.x + g.size * .3, y: at.y + g.size * .6 };
  };
  return { measure, paint, point, hide: () => { root.style.opacity = "0"; }, dispose: () => root.remove() };
}
