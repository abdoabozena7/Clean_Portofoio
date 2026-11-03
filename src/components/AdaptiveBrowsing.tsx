import { useRef } from "react";
import { X, ArrowUpLeft } from "lucide-react";
import { useAdaptiveBrowsing } from "@/hooks/useAdaptiveBrowsing";
import { useAttentionJourney } from "@/hooks/useAttentionJourney";
import { useFastScrollReturn } from "@/hooks/useFastScrollReturn";
import AgentPointer from "./AgentPointer";
import "@/styles/adaptive.css";
import "@/styles/section-return.css";

export default function AdaptiveBrowsing() {
  const editor = useRef<HTMLDivElement>(null);
  const returnCue = useRef<HTMLDivElement>(null);
  useAdaptiveBrowsing(editor);
  useFastScrollReturn(returnCue);
  const journey = useAttentionJourney();
  return <>
    <div ref={returnCue} className="section-return-cue" data-visible="false">
      <div role="status" aria-live="polite"><strong>Slow Down</strong><span>Take another look · <span data-return-section /></span></div>
    </div>
    <div ref={editor} data-scan-agent aria-hidden="true">
      <svg className="scan-trails">{[0, 1, 2].map(i => <path key={i} data-scan-trail={i} fill="none" stroke={i === 1 ? "#2bbaa5" : i === 2 ? "#f96635" : "#f9a822"} />)}</svg>
      {[0, 1, 2].map(i => <div key={i} data-scan-editor={i} className="scan-agent" style={{ "--agent-color": i === 1 ? "#2bbaa5" : i === 2 ? "#f96635" : "#f9a822" } as React.CSSProperties}><AgentPointer /><i className="scan-grip" /><span /></div>)}
    </div>
    {journey.cue && <aside className="quick-pass-cue" aria-label="Highlight passed quickly" aria-live="polite">
      <button className="cue-revisit" type="button" aria-label={`Revisit ${journey.cue.title}`} onClick={() => journey.revisit(journey.cue!.id)}>
        <span className="cue-circle" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeDasharray="66 88" /></svg><ArrowUpLeft className="w-3.5 h-3.5" /></span>
        <span><span className="cue-kicker">Passed quickly · revisit</span><strong>{journey.cue.message}</strong></span>
      </button>
      <button type="button" className="cue-dismiss" aria-label="Dismiss highlight reminder" onClick={journey.dismiss}><X className="w-3.5 h-3.5" /></button>
    </aside>}
  </>;
}
