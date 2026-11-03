import { profileContent } from "@/data/profileContent";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Occupies the original badge's 34px height; width may grow without moving h1. */
export default function MicrosoftHeadline() {
  const badge = useRef<HTMLAnchorElement>(null);
  const [engaged, setEngaged] = useState(false);
  const [autoReady, setAutoReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [constructed, setConstructed] = useState(false);
  const tip = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);
  const positionTip = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    const node = badge.current;
    if (!node) return;
    const nav = document.querySelector("nav");
    let geometry: { top: number; right: number; height: number; navBottom: number } | undefined;
    let offset = 0, wasVisible = true;
    const position = () => {
      if (!geometry) return;
      const { top, right, height, navBottom } = geometry;
      const naturalTop = top - scrollY;
      const nextOffset = top >= 0 && top < navBottom ? navBottom + 4 - top : 0;
      if (offset !== nextOffset) {
        offset = nextOffset;
        node.style.setProperty("--badge-offset", `${offset}px`);
      }
      const shown = naturalTop + offset + height > navBottom && naturalTop + offset < innerHeight;
      if (shown !== wasVisible) { wasVisible = shown; setVisible(shown); }
      if (!shown || !tip.current) return;
      const rightEdge = right - scrollX;
      const side = rightEdge + 152 < innerWidth - 12;
      tip.current.style.left = `${side ? rightEdge + 10 : Math.max(12, Math.min(innerWidth - 154, rightEdge - 142))}px`;
      tip.current.style.top = `${Math.max(navBottom + 6, naturalTop + offset + (side ? 4 : -31))}px`;
    };
    const measure = () => {
      const rect = node.getBoundingClientRect();
      geometry = { top: rect.top + scrollY - offset, right: rect.right + scrollX, height: rect.height,
        navBottom: nav?.getBoundingClientRect().bottom || 0 };
      position();
    };
    // The browser has already laid out the new page before delivering this.
    // Measuring synchronously in React's mount forced layout of the whole tree.
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.parentElement) observer.observe(node.parentElement);
    if (nav) observer.observe(nav);
    positionTip.current = position;
    window.addEventListener("scroll", position, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      positionTip.current = null;
      window.removeEventListener("scroll", position);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    const ready = window.setTimeout(() => setAutoReady(true), 1400);
    return () => clearTimeout(ready);
  }, []);
  useEffect(() => {
    const node = badge.current; if (!node) return;
    const update = () => setConstructed(node.dataset.constructed === "true" && !node.querySelector("[data-building]"));
    const observer = new MutationObserver(update); observer.observe(node, { attributes: true, subtree: true, attributeFilter: ["data-constructed"] }); update();
    return () => observer.disconnect();
  }, []);
  const showTip = visible && !dismissed && (engaged || (autoReady && constructed));
  useLayoutEffect(() => { if (showTip) positionTip.current?.(); }, [showTip]);
  return (
    <>
    <a ref={badge} href={profileContent.microsoftStoryUrl} target="_blank" rel="noopener noreferrer" aria-label="SWE Intern at Microsoft — read my story on LinkedIn"
      aria-describedby={showTip ? "microsoft-story-tip" : undefined}
      onMouseEnter={() => { setEngaged(true); setDismissed(false); }} onMouseLeave={() => setEngaged(false)} onFocus={() => { setEngaged(true); setDismissed(false); }} onBlur={() => setEngaged(false)}
      onKeyDown={event => { if (event.key === "Escape") { setEngaged(false); setDismissed(true); } }}
      data-microsoft-headline data-construction="structure" className="microsoft-headline inline-flex items-center gap-2 px-4 py-2 mb-8 border border-foreground/30 bg-background/80 backdrop-blur-md shadow-sm h-[34px] whitespace-nowrap">
      <img data-construction="asset" src={`${import.meta.env.BASE_URL}images/microsoft-symbol.svg`} width="14" height="14" alt="" className="w-3.5 h-3.5 shrink-0" />
      <span data-construction="text" className="font-mono text-xs text-foreground/90 tracking-[0.08em] font-medium">
        {profileContent.headline}
      </span>
    </a>
    {showTip && createPortal(<span ref={tip} id="microsoft-story-tip" className="microsoft-story-tip"><a href={profileContent.microsoftStoryUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-label="Want the story? Read my Microsoft internship story">Want the story? <span aria-hidden="true">↗</span></a></span>, document.body)}
    </>
  );
}
