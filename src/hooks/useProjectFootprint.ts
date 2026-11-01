import { useLayoutEffect, type RefObject } from "react";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { projectLayoutBaseline } from "@/data/projectLayoutBaseline";

/** Reserve the original project's natural responsive footprint, even after its
 * content changes. A short-lived invisible sizing fixture is read and removed
 * before paint. It never enters document flow or the accessibility tree. */
export function useProjectFootprint(ref: RefObject<HTMLDivElement>, count: number) {
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    let disposed = false;
    let frame = 0;
    let previousWidth = -1;
    const element = (tag: string, className: string, text?: string) => {
      const el = document.createElement(tag);
      el.className = className;
      if (text) el.textContent = text;
      return el;
    };
    const measure = () => {
      frame = 0;
      if (disposed) return;
      const width = grid.getBoundingClientRect().width;
      if (!width) return;
      previousWidth = width;
      const fixture = element("div", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6");
      fixture.setAttribute("aria-hidden", "true");
      fixture.inert = true;
      Object.assign(fixture.style, { position: "absolute", left: "0", top: "0", width: `${width}px`, visibility: "hidden", pointerEvents: "none", contain: "layout style paint" });
      for (const project of projectLayoutBaseline) {
        const card = element("div", "group relative border-2 border-black p-5 flex flex-col justify-between transition-all duration-300 bg-white");
        const copy = element("div", "");
        copy.append(element("h3", "text-xl font-black text-foreground break-words", project.title));
        copy.append(element("p", "body-text mt-4 text-sm font-normal", project.description));
        const tags = element("div", "flex flex-wrap gap-2 mt-4");
        for (const tag of project.tags) tags.append(element("div", cn(badgeVariants({ variant: "secondary" }), "font-mono text-[10px] font-bold border border-black/10 px-1.5 py-0"), tag));
        copy.append(tags); card.append(copy);
        if (project.actions) {
          const actions = element("div", "flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-black/10");
          for (const label of ["Source", "View Repo"]) {
            const action = element("a", "flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-white text-[10px] font-black uppercase tracking-wider transition-all duration-300");
            const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            icon.setAttribute("class", "w-3.5 h-3.5");
            action.append(icon, document.createTextNode(label)); actions.append(action);
          }
          card.append(actions);
        }
        fixture.append(card);
      }
      document.body.append(fixture);
      try {
        const styles = getComputedStyle(fixture);
        const columns = styles.gridTemplateColumns.split(" ").length;
        const rows = styles.gridTemplateRows;
        const originalHeight = fixture.getBoundingClientRect().height;
        const gap = parseFloat(styles.rowGap);
        // Original 8 and current 7 items share desktop/tablet row counts. Mobile
        // distributes the same total footprint across the requested seven cards.
        const rowCount = Math.ceil(count / columns);
        const available = originalHeight - (rowCount - 1) * gap;
        // CSS layout quantizes to 1/64px. Carry the remainder into the last row
        // rather than losing a fraction on each of seven equal mobile rows.
        const rowHeight = Math.floor(available / rowCount * 64) / 64;
        grid.style.gridTemplateRows = rowCount === Math.ceil(projectLayoutBaseline.length / columns)
          ? rows : Array.from({ length: rowCount }, (_, index) => `${index === rowCount - 1 ? available - rowHeight * index : rowHeight}px`).join(" ");
      } finally {
        fixture.remove();
      }
    };
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(() => { if (Math.abs(grid.getBoundingClientRect().width - previousWidth) > 0.1) schedule(); });
    measure();
    observer.observe(grid);
    window.addEventListener("resize", schedule, { passive: true });
    document.fonts.addEventListener("loadingdone", schedule);
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("resize", schedule);
      document.fonts.removeEventListener("loadingdone", schedule);
      grid.style.removeProperty("grid-template-rows");
    };
  }, [ref, count]);
}
