import "@/styles/exploration-evidence.css";

/** Paint-only feedback for local exposure evidence; this is not proof of reading. */
export default function CompanyEvidence({ variant = 0 }: { variant?: number }) {
  return <svg className="company-evidence" viewBox="0 0 40 40" aria-hidden="true" focusable="false" data-construction-skip>
    <rect className="company-evidence-track" x=".75" y=".75" width="38.5" height="38.5" pathLength="1" />
    <rect className="company-evidence-progress" x=".75" y=".75" width="38.5" height="38.5" pathLength="1" />
    <g className="company-evidence-finish" data-evidence-variant={variant % 3}>
      {variant % 3 === 1 ? <>
        <path className="company-evidence-stamp" d="M34 28l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" />
        <path className="company-evidence-spark" d="M34 31v6M31 34h6" />
      </> : variant % 3 === 2 ? <>
        <path className="company-evidence-stamp" d="M29 29h10v10H29Z" />
        <path className="company-evidence-check" d="m31 34 2 2 4-4" />
      </> : <>
        <circle className="company-evidence-stamp" cx="34" cy="34" r="5" />
        <path className="company-evidence-check" d="m31 34 2 2 4-4" />
      </>}
    </g>
  </svg>;
}
