import { useRef } from "react";
import { X, ArrowUpLeft, Check } from "lucide-react";
import { useAdaptiveBrowsing } from "@/hooks/useAdaptiveBrowsing";
import { useAttentionJourney } from "@/hooks/useAttentionJourney";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import AgentPointer from "./AgentPointer";
import "@/styles/adaptive.css";

export default function AdaptiveBrowsing() {
  const editor = useRef<HTMLDivElement>(null);
  useAdaptiveBrowsing(editor);
  const journey = useAttentionJourney();
  return <>
    <div ref={editor} data-scan-agent aria-hidden="true">
      <svg className="scan-trails">{[0, 1, 2].map(i => <path key={i} data-scan-trail={i} fill="none" stroke={i === 1 ? "#2bbaa5" : i === 2 ? "#f96635" : "#f9a822"} />)}</svg>
      {[0, 1, 2].map(i => <div key={i} data-scan-editor={i} className="scan-agent" style={{ "--agent-color": i === 1 ? "#2bbaa5" : i === 2 ? "#f96635" : "#f9a822" } as React.CSSProperties}><AgentPointer /><i className="scan-grip" /><span /></div>)}
    </div>
    {journey.cue && <aside className="quick-pass-cue" aria-label="Highlight passed quickly" aria-live="polite">
      <div><span className="font-mono text-[9px] uppercase tracking-wider">Passed quickly</span><strong className="text-xs block">{journey.cue.message}</strong></div>
      <button type="button" aria-label={`Revisit ${journey.cue.title}`} onClick={() => journey.revisit(journey.cue!.id)}><ArrowUpLeft className="w-4 h-4" aria-hidden="true" /> Revisit</button>
      <button type="button" className="cue-dismiss" aria-label="Dismiss highlight reminder" onClick={journey.dismiss}><X className="w-3.5 h-3.5" /></button>
    </aside>}
    <Dialog open={journey.phase === "warning"} onOpenChange={open => { if (!open) journey.escape(); }}>
      <DialogContent data-attention-dialog className="attention-dialog" onCloseAutoFocus={event => event.preventDefault()} onInteractOutside={event => { if ((event.target as HTMLElement).closest("[data-attention-ring]")) event.preventDefault(); }}>
        <DialogHeader>
          <span className="attention-kicker">One highlight before you go</span>
          <DialogTitle>{journey.item?.title}</DialogTitle>
          <DialogDescription>{journey.item?.message}</DialogDescription>
        </DialogHeader>
        <button className="attention-return" onClick={() => journey.revisit()}><ArrowUpLeft className="w-4 h-4" /> Take me back <span>{journey.seconds}s</span></button>
        <p className="font-mono text-[10px] text-black/60">Returning automatically · a 3-second spotlight</p>
      </DialogContent>
    </Dialog>
    {["reviewing", "complete"].includes(journey.phase) && <aside className={`attention-review ${journey.phase}`} role="status">
      {journey.phase === "complete" ? <Check className="w-5 h-5" /> : <span className="attention-count">{journey.seconds}</span>}
      <div><strong>{journey.phase === "complete" ? "Highlight complete" : journey.item?.title}</strong><span>{journey.phase === "complete" ? "You're free to explore." : "A quick spotlight. Scrolling resumes in a moment."}</span></div>
    </aside>}
  </>;
}
