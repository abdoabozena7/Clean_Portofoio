import { useEffect } from "react";

/** Warm near media without decoding or competing with the initial viewport. */
export function usePortfolioMediaPreload() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const visible = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const image = entry.target as HTMLImageElement;
        image.fetchPriority = "high";
        image.loading = "eager";
        visible.unobserve(image);
        nearby.unobserve(image);
      }
    });
    const nearby = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const image = entry.target as HTMLImageElement;
        if (image.loading === "lazy") {
          image.fetchPriority = "low";
          image.loading = "eager";
        }
        nearby.unobserve(image);
      }
    }, { rootMargin: "700px 0px" });

    document.querySelectorAll<HTMLImageElement>("section img[loading=lazy]").forEach(image => {
      visible.observe(image);
      nearby.observe(image);
    });
    return () => { visible.disconnect(); nearby.disconnect(); };
  }, []);
}
