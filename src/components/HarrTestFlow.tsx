/** Native SVG flowchart; the decorative agent layer builds its measured nodes. */
const HarrTestFlow = () => (
  <svg className="harrtest-flow" viewBox="0 0 300 150" role="img" aria-labelledby="harrtest-flow-title harrtest-flow-description">
    <title id="harrtest-flow-title">HarrTest evidence loop</title>
    <desc id="harrtest-flow-description">Plan, Build, Run, Observe, Verify. If verification fails, repair and run again.</desc>
    <defs>
      <marker id="harrtest-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" />
      </marker>
    </defs>
    <text x="18" y="18" fontSize="9" letterSpacing="1.2" opacity=".5">THE EVIDENCE LOOP</text>
    <g fill="none" stroke="currentColor" strokeWidth="1" markerEnd="url(#harrtest-arrow)">
      <path d="M 88 47 H 112" />
      <path d="M 183 47 H 207" />
      <path d="M 243 62 V 96 H 220" />
      <path d="M 149 110 H 126" />
      <path d="M 56 110 H 25 V 76 H 148 V 62" strokeDasharray="3 3" opacity=".45" />
    </g>
    {[
      { name: "Plan", x: 18, y: 33 },
      { name: "Build", x: 113, y: 33 },
      { name: "Run", x: 208, y: 33 },
      { name: "Observe", x: 150, y: 96 },
      { name: "Verify", x: 55, y: 96 },
    ].map(({ name, x, y }, index) => (
      <g key={name} data-construction="structure">
        <rect x={x} y={y} width="70" height="28" fill="white" stroke="black" />
        <text x={x + 7} y={y + 11} fontSize="7" opacity=".4" aria-hidden="true">0{index + 1}</text>
        <text x={x + 35} y={y + 19} fontSize="11" fontWeight="700" textAnchor="middle">{name}</text>
      </g>
    ))}
    <text x="282" y="141" fontSize="8" textAnchor="end" opacity=".55">if it fails: repair, then run again</text>
  </svg>
);

export default HarrTestFlow;
