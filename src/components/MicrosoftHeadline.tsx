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
  useLayoutEffect(() => {
    const update = () => {
      const rect = badge.current?.getBoundingClientRect();
      if (!rect) return;
      const navBottom = document.querySelector("nav")?.getBoundingClientRect().bottom || 0;
      // A paint-only adjustment keeps the badge clear of the fixed nav on short screens.
      const naturalTop = rect.top - Number(badge.current?.style.getPropertyValue("--badge-offset").replace("px", "") || 0);
      const documentTop = naturalTop + scrollY;
      const offset = documentTop >= 0 && documentTop < navBottom ? Math.max(0, navBottom + 4 - documentTop) : 0;
      badge.current?.style.setProperty("--badge-offset", `${offset}px`);
      const right = rect.right + 10;
      const side = right + 142 < innerWidth - 12;
      if (tip.current) {
        tip.current.style.left = `${side ? right : Math.max(12, Math.min(innerWidth - 154, rect.right - 142))}px`;
        tip.current.style.top = `${side ? Math.max(navBottom + 6, naturalTop + offset + 4) : Math.max(navBottom + 6, naturalTop + offset - 31)}px`;
      }
      setVisible(rect.bottom > navBottom && rect.top < innerHeight);
    };
    update();
    window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    const observer = new ResizeObserver(update); if (badge.current) observer.observe(badge.current);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); observer.disconnect(); };
  }, [engaged, visible, autoReady, dismissed, constructed]);
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
