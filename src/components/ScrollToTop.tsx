import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUp, ArrowUpRight, Check, X } from "lucide-react";
import { getExploration, subscribeExploration } from "@/lib/exploration";

/** A reversible discovery score, with optional rules and free navigation. */
export default function ScrollToTop() {
  const exploration = useSyncExternalStore(subscribeExploration, getExploration, getExploration);
  const [visible, setVisible] = useState(false), [open, setOpen] = useState(false);
  const [route, setRoute] = useState("all");
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const core = exploration.items.filter(item => item.critical);
  const count = exploration.explored.length;
  const percentage = exploration.score;
  const remaining = exploration.items.filter(item => !exploration.explored.includes(item.id));
  const inRoute = (id: string) => route === "all" || (route === "ai" ? /project|skills/.test(id) : /experience|education|honors/.test(id));
  const next = remaining.find(item => inRoute(item.id) && item.id === exploration.suggestedId) || remaining.find(item => inRoute(item.id));
  useEffect(() => {
    const update = () => setVisible(scrollY > 400); update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus({ preventScroll: true }); } };
    window.addEventListener("pointerdown", dismiss, { passive: true }); window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", dismiss); window.removeEventListener("keydown", escape); };
  }, [open]);
  const visit = (id: string) => { setOpen(false); window.dispatchEvent(new CustomEvent("portfolio:explore-highlight", { detail: id })); };
  const circumference = 2 * Math.PI * 21;
  return <div ref={root} className={`exploration-control ${visible || open ? "is-visible" : ""}`}>
    <button ref={trigger} type="button" className="exploration-trigger" title="Discovery score · explore your route" onClick={() => setOpen(value => !value)} aria-label={`Discovery score: ${percentage}%. Open exploration map`} aria-expanded={open} aria-controls="exploration-map">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="#11192020" strokeWidth="2" /><circle className="exploration-arc" cx="24" cy="24" r="21" fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percentage / 100)} /></svg>
      <strong>{percentage}<span>%</span></strong><span className="sr-only">Discovery score</span>
    </button>
    {open && <section id="exploration-map" className="exploration-map" aria-label="Explore portfolio highlights" data-exploration-map>
      <div className="exploration-map-head"><div><span className="cue-kicker">Your discovery route</span><h2>{count} of {exploration.total} stories explored</h2></div><button type="button" className="map-close" aria-label="Close exploration map" onClick={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}><X className="w-4 h-4" /></button></div>
      <p className="exploration-explainer">Take a closer look. There’s more to the story.</p>
      <details className="discovery-rules"><summary>About this score</summary><p>Time with expanded, visible stories builds your score. Passing unfinished stories quickly leaves gaps; exploring them slowly fills those gaps. Earned attention stays earned. This estimates exposure, not reading. No scrolling is blocked. This visit only.</p></details>
      <div className="exploration-routes" aria-label="Choose what to explore">{[["all", "All"], ["ai", "AI & agents"], ["career", "Career & learning"]].map(([id, label]) => <button type="button" key={id} aria-pressed={route === id} onClick={() => setRoute(id)}>{label}</button>)}</div>
      {next ? <button type="button" className="exploration-next" onClick={() => visit(next.id)}><span><span className="cue-kicker">One more story?</span><strong>{next.message}</strong></span><ArrowUpRight className="w-4 h-4 shrink-0" /></button> : <p className="exploration-done">That route is explored. Feel free to keep browsing.</p>}
      <ul className="exploration-items">{core.map(item => <li key={item.id}><button type="button" onClick={() => visit(item.id)}><span className={`exploration-check ${exploration.explored.includes(item.id) ? "is-explored" : ""}`} aria-hidden="true">{exploration.explored.includes(item.id) && <Check className="w-3 h-3" />}</span><span>{item.title}</span><span className="sr-only">{exploration.explored.includes(item.id) ? "Explored" : "Not yet explored"}</span><ArrowUpRight className="w-3 h-3 ml-auto shrink-0" /></button></li>)}</ul>
      <details className="discovery-all"><summary>All {exploration.total} stories</summary><ul className="exploration-items">{exploration.items.map(item => <li key={item.id}><button type="button" onClick={() => visit(item.id)}><span className={`exploration-check ${exploration.explored.includes(item.id) ? "is-explored" : ""}`} aria-hidden="true">{exploration.explored.includes(item.id) && <Check className="w-3 h-3" />}</span><span>{item.title}</span><ArrowUpRight className="w-3 h-3 ml-auto shrink-0" /></button></li>)}</ul></details>
      <button type="button" className="map-back-top" aria-label="Scroll to top" onClick={() => { setOpen(false); window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><ArrowUp className="w-3 h-3" /> Back to top</button>
    </section>}
  </div>;
}
