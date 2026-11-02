import { useRef } from "react";
import { X, ArrowUpLeft } from "lucide-react";
import { useAdaptiveBrowsing } from "@/hooks/useAdaptiveBrowsing";
import AgentPointer from "./AgentPointer";
import "@/styles/adaptive.css";

export default function AdaptiveBrowsing() {
  const editor = useRef<HTMLDivElement>(null);
  const cue = useAdaptiveBrowsing(editor);
  return <>
    <div ref={editor} data-scan-agent aria-hidden="true">{[0, 1, 2].map(i => <div key={i} data-scan-editor={i} className="scan-agent" style={{ "--agent-color": i === 1 ? "#2bbaa5" : i === 2 ? "#f96635" : "#f9a822" } as React.CSSProperties}><AgentPointer /><span /></div>)}</div>
    {cue && <aside className="quick-pass-cue" aria-label="Project passed quickly">
      <div><span className="font-mono text-[9px] uppercase tracking-wider">Passed quickly</span><strong className="text-xs block">{cue.title}</strong></div>
      <button type="button" aria-label={`Revisit ${cue.title}`} onClick={() => window.dispatchEvent(new CustomEvent("portfolio:revisit", { detail: cue.id }))}><ArrowUpLeft className="w-4 h-4" aria-hidden="true" /> Revisit</button>
      <button type="button" className="cue-dismiss" aria-label="Dismiss project reminder" onClick={() => window.dispatchEvent(new Event("portfolio:dismiss-cue"))}><X className="w-3.5 h-3.5" /></button>
    </aside>}
  </>;
}
