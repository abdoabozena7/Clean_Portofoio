import { useLayoutEffect, useRef, type RefObject } from "react";
import { animateHeroAgents } from "@/lib/heroAgents";
import "@/styles/hero-agents.css";

type Props = { headingRef: RefObject<HTMLHeadingElement> };

/** A real illustration layered over the untouched, accessible HTML name. */
export default function HeroAgentsOverlay({ headingRef }: Props) {
  const root = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    if (!root.current || !headingRef.current) return;
    return animateHeroAgents(root.current, headingRef.current);
  }, [headingRef]);

  return (
    <svg ref={root} className="hero-agents-overlay" data-hero-agents data-construction-skip
      aria-hidden="true" focusable="false" fill="none" stroke="#111920" strokeWidth="1.65"
      strokeLinecap="round" strokeLinejoin="round">
      <path data-agent-cable className="hero-agent-cable" />
      <g data-cable-junctions>
        {["#2bbaa5", "#f9a822", "#f96635"].map((color, index) => (
          <circle key={color} data-cable-junction={index} r="4.3" fill={color} />
        ))}
      </g>
      <g data-hero-tool="code">
        <path d="M-13-17H7L15-9V17H-13Z" fill="#fff" />
        <path d="M7-17V-9H15M-5-3L-9 1L-5 5M5-3L9 1L5 5M2-5L-2 7" />
      </g>
      <g data-hero-tool="terminal">
        <rect x="-19" y="-15" width="38" height="30" rx="3" fill="#fff" />
        <path d="M-16-15H16Q19-15 19-12V-6H-19V-12Q-19-15-16-15Z" fill="#93d3ae" />
        <path d="M-19-6H19M-11-1L-6 3L-11 7M-1 8H7" />
        <g fill="#111920" stroke="none"><circle cx="-13" cy="-10.5" r="1" /><circle cx="-9" cy="-10.5" r="1" /></g>
      </g>
      {(["teal", "amber", "coral"] as const).map((kind, index) => (
        <g key={kind} data-hero-agent={kind}>
          <g className={`hero-mascot-body hero-mascot-${kind}`}>
            {kind === "amber"
              ? <path d="M-10-35L10-34L20-19L12-5L-8-5L-20-19Z" fill="#f9a822" />
              : <rect x="-16" y="-34" width="32" height="29" rx={kind === "teal" ? 6 : 3} fill={kind === "teal" ? "#2bbaa5" : "#f96635"} />}
            <g className="hero-mascot-eyes" fill="#111920" stroke="none">
              <ellipse cx="-5.5" cy="-20" rx="1.9" ry="2.2" /><ellipse cx="5.5" cy="-20" rx="1.9" ry="2.2" />
            </g>
            <g className="hero-mascot-sparks" stroke={["#2bbaa5", "#f9a822", "#f96635"][index]} strokeWidth="2.3">
              <path d="M13-43L17-49M21-38L28-42M5-46L6-52" />
            </g>
          </g>
          <g className="hero-mascot-hands" fill="#fff">
            <path d="M-16 0C-19-4-16-9-12-8C-8-10-4-6-6-1M-15-2L-14-5M-11-1L-10-5" />
            <path d="M6-1C4-6 8-10 12-8C16-9 19-4 16 0M10-1L10-5M14-2L14-5" />
          </g>
        </g>
      ))}
      <g data-hero-celebration strokeWidth="2.3">
        <path data-celebration-left stroke="#2bbaa5" />
        <path data-celebration-right stroke="#f9a822" />
      </g>
    </svg>
  );
}
