import { useRef } from "react";
import { useScrollConstruction } from "@/hooks/useScrollConstruction";
import "@/styles/construction.css";

const agents = [
  { name: "layout.ai", task: "layout", shade: "ink" },
  { name: "type.ai", task: "text", shade: "paper" },
  { name: "style.ai", task: "style", shade: "graphite" },
  { name: "asset.ai", task: "asset", shade: "silver" },
];

/** A single decorative DOM/SVG layer, below controls and the real custom cursor. */
export default function AgentConstruction() {
  const layer = useRef<HTMLDivElement>(null);
  useScrollConstruction(layer);
  return (
    <div ref={layer} data-agent-layer aria-hidden="true" className="agent-construction">
      <svg className="construction-guides" width="100%" height="100%">
        {agents.map(agent => (
          <g key={agent.name} data-guide={agent.task} opacity="0">
            <rect className="construction-selection" rx="0" pathLength="1" />
            <path className="construction-handles" />
          </g>
        ))}
      </svg>
      {agents.map(agent => (
        <div key={agent.name} data-agent={agent.task} className={`virtual-agent virtual-agent--${agent.shade}`}>
          <span className="agent-click" />
          <svg width="17" height="21" viewBox="0 0 17 21" fill="none">
            <path d="M1 1L15 12.5L8.6 13.2L5.5 19L1 1Z" fill="currentColor" stroke="var(--agent-outline)" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="agent-label"><i />{agent.name}<span className="agent-action" /></span>
        </div>
      ))}
      <div className="construction-caret" />
    </div>
  );
}
