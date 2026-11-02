import { useRef, type CSSProperties } from "react";
import AgentPointer from "./AgentPointer";
import { useScrollConstruction } from "@/hooks/useScrollConstruction";
import { usePortfolioMediaPreload } from "@/hooks/usePortfolioMediaPreload";
import { constructionAgents as agents } from "@/lib/agentConfig";
import "@/styles/construction.css";

/** A single decorative DOM/SVG layer, below controls and the real custom cursor. */
export default function AgentConstruction() {
  const layer = useRef<HTMLDivElement>(null);
  usePortfolioMediaPreload();
  useScrollConstruction(layer);
  return (
    <div ref={layer} data-agent-layer aria-hidden="true" className="agent-construction">
      <div className="scene-agent-layer" data-scene-layer />
      <svg className="construction-guides" width="100%" height="100%">
        {agents.map(agent => (
          <g key={agent.name} data-guide={agent.task} opacity="0" style={{ color: agent.color }}>
            <rect className="construction-selection" rx="0" pathLength="1" />
            <path className="construction-handles" />
          </g>
        ))}
      </svg>
      {agents.map(agent => (
        <div key={agent.task} data-prop={agent.task} className="construction-prop" style={{ "--agent-color": agent.color } as CSSProperties}>
          <div className="construction-prop-surface">
            <img className="prop-template" alt="" /><img className="prop-image" alt="" />
            <div className="prop-icon" />
            <span className="prop-template-label" /><span className="prop-label" />
          </div>
          <span className="prop-copy" /><span className="prop-handle" />
          <span className="prop-operation" />
        </div>
      ))}
      {agents.map(agent => (
        <div key={agent.name} data-agent={agent.task} data-role={agent.role} className="virtual-agent" style={{ "--agent-color": agent.color } as CSSProperties}>
          <span className="agent-click" />
          <AgentPointer />
          <span className="agent-label"><i />{agent.name}<span className="agent-action" /></span>
        </div>
      ))}
      {agents.map(agent => <div key={agent.task} data-caret={agent.task} className="construction-caret" style={{ background: agent.color }} />)}
    </div>
  );
}
