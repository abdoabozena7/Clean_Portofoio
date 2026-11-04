import { useRef } from "react";
import { createPortal } from "react-dom";
import { useAdaptiveBrowsing } from "@/hooks/useAdaptiveBrowsing";
import { useAttentionJourney } from "@/hooks/useAttentionJourney";
import { useFastScrollReturn } from "@/hooks/useFastScrollReturn";
import AgentPointer from "./AgentPointer";
import "@/styles/adaptive.css";
import "@/styles/section-return.css";

const returnMessages = [
  ["What's the rush?", "We haven't even met properly."],
  ["Nice try.", "You're not skipping the good part."],
  ["Easy, speedrunner.", "This isn't a race to the footer."],
  ["Plot twist.", "We're going back to the beginning."],
  ["Hold your horses.", "I haven't shown you the cool stuff yet."],
  ["That was quick.", "At least pretend you're interested."],
  ["Already in a hurry?", "Come on, enjoy the ride."],
];
const returnVariants = ["ticket", "terminal", "note", "editorial", "layers", "glitch"];

export default function AdaptiveBrowsing() {
  const editor = useRef<HTMLDivElement>(null);
  useAdaptiveBrowsing(editor);
  const cue = useFastScrollReturn();
  const variant = returnVariants[Math.max(0, cue.activation - 1) % returnVariants.length];
  const [title, subtitle] = returnMessages[Math.max(0, cue.activation - 1) % returnMessages.length];
  useAttentionJourney();
  return <>
    {createPortal(
      <div className="section-return-cue" data-visible={cue.visible} data-variant={variant}>
        {cue.activation > 0 && <div className="return-popup" key={cue.activation} aria-hidden="true">
          <strong>Slow Down</strong><span>{title} {subtitle}</span>
        </div>}
        <div role="status" aria-atomic="true" className="sr-only">{cue.visible ? `Slow Down. ${title} ${subtitle}` : ""}</div>
      </div>, document.body,
    )}
    <div ref={editor} data-scan-agent aria-hidden="true">
      <svg className="scan-trails">{[0, 1, 2].map(i => <path key={i} data-scan-trail={i} fill="none" stroke={i === 1 ? "#2bbaa5" : i === 2 ? "#f96635" : "#f9a822"} />)}</svg>
      {[0, 1, 2].map(i => <div key={i} data-scan-editor={i} className="scan-agent" style={{ "--agent-color": i === 1 ? "#2bbaa5" : i === 2 ? "#f96635" : "#f9a822" } as React.CSSProperties}><AgentPointer /><i className="scan-grip" /><span /></div>)}
    </div>
  </>;
}
