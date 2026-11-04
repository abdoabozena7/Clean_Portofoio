import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { getExploration, subscribeExploration } from "@/lib/exploration";
import { profileContent } from "@/data/profileContent";
import "@/styles/score-popup.css";

const scoreSnapshot = () => {
  const { score, coverage, total } = getExploration();
  return `${score}/${coverage}/${total}`;
};

/** An optional visit-local score card. The score's underlying evidence stays unchanged. */
export default function ScrollToTop() {
  const snapshot = useSyncExternalStore(subscribeExploration, scoreSnapshot, scoreSnapshot);
  const [percentage, count, total] = snapshot.split("/").map(Number);
  const [visible, setVisible] = useState(false), [open, setOpen] = useState(false);
  const bestScore = useRef(percentage);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const best = Math.max(bestScore.current, percentage);
  // The owner supplies the profile URL. Until then use the existing verified
  // contact rather than inventing an Instagram username.
  const instagram = "instagramUrl" in profileContent && typeof profileContent.instagramUrl === "string" ? profileContent.instagramUrl : undefined;
  const messageUrl = instagram || `mailto:${profileContent.email}`;
  useEffect(() => { bestScore.current = Math.max(bestScore.current, percentage); }, [percentage]);
  useEffect(() => {
    let shown = false;
    const update = () => {
      const next = scrollY > 400;
      if (next !== shown) { shown = next; setVisible(shown); }
    };
    const initialLayout = new ResizeObserver(() => {
      initialLayout.disconnect();
      update();
    });
    initialLayout.observe(document.documentElement);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      initialLayout.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (root.current?.contains(event.target as Node)) return;
      setOpen(false);
      const interactive = event.target instanceof Element && event.target.closest("a[href],button,input,textarea,select,[tabindex],[contenteditable=true]");
      // Let the pointer's default focus action finish before returning focus.
      // An outside control keeps the focus the visitor deliberately gave it.
      if (!interactive) requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus({ preventScroll: true }); } };
    window.addEventListener("pointerdown", dismiss, { passive: true }); window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", dismiss); window.removeEventListener("keydown", escape); };
  }, [open]);
  const circumference = 2 * Math.PI * 21;
  return <div ref={root} className={`exploration-control ${visible || open ? "is-visible" : ""}`}>
    <button ref={trigger} type="button" className="exploration-trigger" title="View score" onClick={() => setOpen(value => !value)} aria-label={`Current score: ${percentage}%. Open score details`} aria-expanded={open} aria-controls="exploration-map">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="#11192020" strokeWidth="2" /><circle className="exploration-arc" cx="24" cy="24" r="21" fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percentage / 100)} /></svg>
      <strong>{percentage}<span>%</span></strong>
    </button>
    {open && <section id="exploration-map" className="exploration-map score-popup" aria-label="Score details" data-exploration-map>
      <div className="score-popup-head">
        <span className="score-popup-count" aria-label={`Count: ${count} of ${total}`}>{count} / {total}</span>
        <button type="button" className="map-close" aria-label="Close score details" onClick={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="score-popup-stats">
        <strong className="score-popup-current" aria-label={`Current score: ${percentage}%`}>{percentage}<span>%</span></strong>
        <div className="score-popup-best"><span>Best score</span><strong>{best}<span>%</span></strong></div>
      </div>
      <p>Think you know what this number means?</p>
      <a className="score-popup-message" href={messageUrl} target={instagram ? "_blank" : undefined} rel={instagram ? "noopener noreferrer" : undefined}>Message me{instagram && <span className="sr-only"> on Instagram</span>}<ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /></a>
    </section>}
  </div>;
}
