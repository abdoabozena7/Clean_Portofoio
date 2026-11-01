import { useRef, type CSSProperties } from "react";
import { useScrollConstruction } from "@/hooks/useScrollConstruction";
import { constructionAgents as agents } from "@/lib/agentConfig";
import "@/styles/construction.css";

/** A single decorative DOM/SVG layer, below controls and the real custom cursor. */
export default function AgentConstruction() {
  const layer = useRef<HTMLDivElement>(null);
  useScrollConstruction(layer);
  return (
    <div ref={layer} data-agent-layer aria-hidden="true" className="agent-construction">
      <svg className="construction-guides" width="100%" height="100%">
        {agents.map(agent => (
          <g key={agent.name} data-guide={agent.task} opacity="0" style={{ color: agent.color }}>
            <rect className="construction-selection" rx="0" pathLength="1" />
            <path className="construction-handles" />
          </g>
        ))}
      </svg>
      {agents.map(agent => (
        <div key={agent.name} data-agent={agent.task} data-role={agent.role} className="virtual-agent" style={{ "--agent-color": agent.color } as CSSProperties}>
          <span className="agent-click" />
          <svg className="agent-pointer-shape" width="20" height="20" viewBox="0 0 32 32">
            <path d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z" fill="var(--agent-color)" />
            <path d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z" fill="#111920" />
          </svg>
          <span className="agent-label"><i />{agent.name}<span className="agent-action" /></span>
        </div>
      ))}
      {agents.map(agent => <div key={agent.task} data-caret={agent.task} className="construction-caret" style={{ background: agent.color }} />)}
    </div>
  );
}
