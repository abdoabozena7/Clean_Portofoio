import { useEffect } from "react";

/** Warm the actual inline assets during the introduction, including on phones.
 * Low fetch priority leaves fonts/the hero first; decoding stays asynchronous. */
export function usePortfolioMediaPreload() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.querySelectorAll<HTMLImageElement>("section img").forEach(image => {
        if (image.closest("[data-agent-layer]")) return;
        image.decoding = "async";
        if (image.loading === "lazy") { image.fetchPriority = "low"; image.loading = "eager"; }
      });
    }, 160);
    return () => clearTimeout(timer);
  }, []);
}
