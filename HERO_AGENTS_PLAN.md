# Hero agents overlay — 2026-11-02

## Bound outcome
Implement the approved agent illustration as real animated SVG/DOM above the existing hero name. Preserve the current font, colors, text, background, layout and controls. Reference: user screenshot codex-clipboard-491d16e8-af60-419f-8c4e-727fc66446c8.png, matching approved overlay 01.

Visual thesis: small ink-outlined teal, amber and coral agents bring a delicate cable and two tool icons to life around the unchanged heavy name.
Content plan: existing hero, support sections, details and CTA remain unchanged; additions are decorative and carry no new copy.
Interaction thesis: wait for native name construction; one agent physically traces the cable while two carry/place tool icons; settle into the three perched mascots with restrained idle gestures. Pause offscreen/hidden and honor reduced motion; no tour, scroll hijacking or AI calls.

## Requirements / independent failure oracles
- R01 USER_CONFIRMED: approved pose, three colored SVG agents, a curved cable, junctions, code-file and terminal icons; no raster in the overlay. Fail if only an image, tour or redesigned name appears.
- R02 USER_STATED: an agent moves at the growing cable tip; other agents carry icons into their destinations. Fail if graphics simply fade in or the cable grows with a stationary worker.
- R03 USER_CONFIRMED: font, name geometry, surname gray, background, controls and document flow retained at desktop/mobile. Fail on unexpected DOM rectangle/font/color differences or blocked hit-testing.
- R04 DERIVED: integrates with existing name workshop; resize, quick navigation, return, reduced motion and hidden tabs remain sound. Fail on early overlap, restart on scroll, overflow or invisible content.

## Dependency-aware TODO
| ID | Outcome | Depends | Owner / write scope | Acceptance | State |
|---|---|---|---|---|---|
| T1 | Inspect readiness and capture native baseline | — | root; output/playwright/hero-agents | Real desktop/mobile rectangles + screenshots before edits | IN_PROGRESS |
| T2 | Implement SVG actors, directed timeline, responsive measured anchors | T1 | root; HeroSection.tsx, HeroAgentsOverlay.tsx, hero-agents.css, heroAgents.ts | Real drawing/carrying/settled frames; unchanged typography and layout | TODO |
| T3 | Review integration hazards | T1 | overlay_integration_review; read-only | Review current source and readiness, no shared mutations | IN_PROGRESS |
| T4 | Verify integrated live journeys, negative control, build/regression | T2,T3 | root; scripts/verify-hero-agents.mjs and evidence | Live current-source motion + layout, desktop/mobile/reduced/resize/scroll, disabled actor negative control detected | TODO |

Existing checkout has extensive unrelated uncommitted work; preserve it. No deployment or push requested. Own Vite instance is http://127.0.0.1:8081/Clean_Portofoio/ (8080 was occupied). HarrTest read-only version guard: LATEST_VERIFIED 2.6.1 at 04d968681226778b97511bfd6024272eac19fb9f; this verifies files, not host hook enforcement or behavioral impact.

## Final steering and verified completion
- Final pacing revision now VERIFIED: current child hero-crew-readable EVIDENCE_GATE_PASSED; root hero-readable-root ROOT_GOAL_VERIFIED after fresh rerun on merged scroll source. Actual current timing5600ms /1.15×. All70 live checks, negative control and production build pass. Latest run20261102T234128-6cfdd605f5; prior freshness failure retained below as history.
- Latest user pacing amendment: slow slightly for visibility. Current overlay5600ms (previous4700), global tempo1.15× (previous1.35×). Latest70/70 live checks, negative control and build passed. Later concurrent source edits invalidated receipt freshness before the final gate; root hero-readable-root currently ROOT_GOAL_UNVERIFIED. Prior timings below are historical.
- User selected existing creator pointers to progressively draw and carry the mascots, rather than self-moving mascots. Implemented with the existing cursor pool and viewport-space SVG jobs. Font and spacing stay unchanged, as explicitly reconfirmed.
- Hands align to the top visible ink runs of A / h / n, not character-box centres. Right amber rays point outward.
- Crew increased8→10 using only existing palette. Desktop pin/hold/align/inspect/node helpers add visible parallel work; mobile retains its3-worker limit. Existing name/page construction runs1.35×; the expanded overlay takes4700ms instead7000ms.
- T1,T2,T3,T4 VERIFIED within the final scope. Actual delegated reviewer `/root/overlay_integration_review` performed source/image review and exclusively authored the live verifier; root owns all implementation and live execution.
- Final live acceptance70/70, creator-freeze negative control detected the broken worker, production build passed, TypeScript and scoped ESLint passed,10 existing unit tests passed. Separate real native-wheel page journey observed type/trace/create-slot/drag/align/duplicate operations below the hero.
- Concurrent unrelated edits (including ScrollToTop and scroll pacing) were retained. Stale historical receipts were preserved and current integration rerun. The initial Windows cmd adapter failure was resolved in a documented revision using the same Vite build entry point directly.
- Current child `.runtime-proof/hero-crew-final`: EVIDENCE_GATE_PASSED / VERIFIED_WITHIN_SCOPE. Current root `.runtime-proof/root-goals/hero-crew-root`: ROOT_GOAL_VERIFIED. Reports: output/hero-crew-final-gate.json and output/hero-crew-root-gate.json.
- Latest inspected live artifacts: `.runtime-proof/hero-crew-final/runs/acceptance/20261102T231043-05872bf621/`. No deployment performed.
