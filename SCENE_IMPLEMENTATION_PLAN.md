# Semantic construction scenes — current implementation ledger

## Root goal and authority

User request: **PLEASE IMPLEMENT THIS PLAN: إعادة بناء منطق الأنيميشن من الفيديو — وخطة التنفيذ كـPrompt** (2026-11-02, current conversation). The complete user-supplied plan in that message is authoritative; the previous planning-only deliverable boundary is superseded by the explicit implementation request. This task implements locally; publication is not needed for this request.

Accepted finished-state source: `52cfa85`. Existing branch: `codex/scroll-agent-construction`. Original pre-agent baseline remains in Git (`baseline/pre-agent-construction`). Reference: supplied WhatsApp video, SHA256 `4d1e18fd21074096a658bccdf64acaf5c2986f1dd64db6d22e0260680b2b495c`; 1694 frames reviewed, evidence under ignored `output/reference-analysis/`.

Visual thesis: the existing monochrome portfolio and approved five-color accents, temporarily treated as a measured design canvas where visible actions explain each newly constructed component.
Content plan: retain Hero → About → Experience → Education → Honors → Projects → Skills/activity → Contact → Finale and all verified content.
Interaction thesis: establish empty structure; build and duplicate a reusable instance; customize and align it. Scroll urgency advances ahead of the visitor, while the accepted hero and mobile collapse behavior remain intact.

## Source requirement ledger / independent failure oracles

All R01–R09 are USER_STATED in the supplied implementation plan. Actual full-width Hivo/HarrTest layout is REPOSITORY_EVIDENCE and must be preserved rather than forcing those two cards into a new row.

| ID | Required user outcome | Incorrect result to detect | Verification |
|---|---|---|---|
| R01 | Preserve approved hero, all finished content, four-size geometry, palette and interactions | Changed wrapping, section height/position, hero choreography, broken link/dialog/terminal | Four-size source-bound baseline comparison; hero/name/fluid/dynamic browser journeys |
| R02 | Empty region → structure → content → duplication → customization → align/commit | Independent populated elements performing identical generic carry; content visible before slot; parent batch-pop | Real intermediate frames, source/destination movement, masks and pointer/handle measurement; old source negative control |
| R03 | Semantic recipes for About, Experience, Education, Honors, Projects/flow, Skills, activity, Contact/Finale | One generic operation for all sections; wrong professional names/logos copied; missing flow/calendar construction | Measured scene inventory plus actual visible scene journeys/frames |
| R04 | Scroll-ahead, autonomous watched work, monotonic completion, jumps/reverse correct, atomic handoff | Cursor queue behind viewport; 90%-scale snap; offscreen props; repeated destruction | Slow/fast/reverse/anchor/focus and handoff recordings |
| R05 | Single owner during adaptive regroup; preserve native mobile momentum; hero-only mobile agents | Competing transforms; active mobile scroll correction; lower mobile agent work | Existing native scan/fluid checks and new semantic checks |
| R06 | Accessibility, fail-open, real cursor, performance and cleanup | Invisible focused controls; overlay interception; reduced-motion masks; permanent rAF/swarm | Keyboard/pointer actions, reduced/touch, error/resize checks, idle observation |
| R07 | Encountered-only exploration quality plus separate coverage, retained evidence, content-aware eligible exposure | Gap debt;100 falsely means whole page; dwell behind collapsed/covered/unfinished content | Unit tests and actual quality browser journeys/negative controls |
| R08 | In-memory visit-only bounded signals and optional curated reminders | Storage/network telemetry; source-click proof of reading; auto navigation/scroll lock; reminder spam | Network/storage observation and foreground/hidden/collapsed/rapid-pass/action tests |
| R09 | Actual integrated result, meaningful negative controls, inspected current-source artifacts, build/lint/tests | Green assertions without visible pipeline; stale evidence; silently ignored failures | Final integrated current-source acceptance and reviewed evidence report |

## Dependency-aware TODO

| ID | Concrete outcome / write scope | Dependencies | Owner | State |
|---|---|---|---|---|
| T01 | Baseline all9sections/4sizes; freeze DOM/story/actor contracts; ledger | — | root | VERIFIED |
| T02 | Explicit scene/job graph, DOM-only operation actors, preserve hero controller | T01 | root | VERIFIED |
| T03 | Actual projects empty-frame/duplicate/customization/handoff visibly verified | T02 | root | VERIFIED |
| T04 | All semantic section recipes, flow/calendar and adaptive ownership/urgency | T03 | root | VERIFIED |
| T05 | Local evidence-based exploration score/store/UI + meaningful tests | T01 | /root/exploration_quality, integrated by root | VERIFIED |
| T06 | Independent new scene/layout verifiers, baseline-negative evidence | T01 | /root/scene_acceptance, completed by root | VERIFIED |
| T07 | Integrated browser/geometry/pixels/performance/accessibility; all relevant existing tests | T04,T05,T06 | root | VERIFIED |
| T08 | Inspect final evidence, fix failures, preserve Git and concise change report | T07 | root | VERIFIED |

Strategy: hybrid. Main owns construction and coordination. Quality source is independent after the shared paint-state contract. A separate verifier owns only new scripts. Root alone updates this ledger and integrates; workers do not commit or publish.

## Shared contracts

- Scene roots: `data-scene-id`, `data-scene-state=unstarted|building|complete`; `data-scene-building` while unavailable. Fine-grained paint surfaces: `data-building`.
- Overlay: `.scene-agent-layer` under the existing `data-agent-layer`; scene actors/pointers/props expose `data-scene-id`, `data-scene-operation`, `data-scene-target`. Props expose `data-scene-prop`, guides `data-scene-guide`.
- All coordinates come from actual DOM rectangles. One main animation loop calls the scene director. Completion/focus and failure expose real DOM immediately.
- Quality keeps compatible snapshot fields and adds encountered IDs, coverage count, confidence and bounded evidence summaries. No persistent/network state. Score is encountered-only mean; coverage is separate.
- Baseline-negative source has no semantic scene pipeline and must fail the corresponding behavioral check, rather than pass because the old final UI already looks correct.

## Baseline and workflow evidence

`node scripts/capture-layout.mjs --label scenes-before` completed on unchanged52cfa85: desktop1440×900, laptop1366×768, tablet768×1024, mobile390×844, all9sections. All scroll widths equal viewport widths; no browser errors or failed requests. `output/playwright/scenes-before/report.json` has coherent sourceBefore/sourceAfter.

HarrTest2.6.1 read and applied through available filesystem skill workflow; read-only version guard attested all62public-tree files (CRLF-normalized) against04d968681226778b97511bfd6024272eac19fb9f. Guard explicitly does not attest native host invocation. This repository continues instruction-only durable tracking; no sealed mechanical root gate or measured skill uplift is claimed. Product evidence must be real runtime evidence regardless of harness mode.

Adversarial plan review: attributes alone cannot prove motion or empty-before-content. Capture actual paint state and pointer/handle coordinates; verify finished pixels separately. Distinguish native adaptive layout changes from forbidden construction shifts. Distinguish GitHub fallback fixtures from live calendar transport. Do not claim quality is reading/comprehension.

## Checkpoint

Implementation began after completed baseline. Source-bound evidence is in `output/playwright/`; reusable verifiers live in `scripts/`. Final results below supersede intermediate checkpoints.

## Incorporated later user steering

- R10 USER_STATED: use the existing company logo outline as a local evidence loader; pending logos are muted, qualified exposure restores color and adds small varied completion marks. All body text remains readable, and all40px logo/image rectangles stay fixed. This is an explicit pixel exception inside company logo bounds only.
- R11 USER_STATED: fast scrolling hides decorative agents and prepares real content provisionally. Slowing down re-arms construction for still-unexplored scenes; previously observed content stays available. Returning slowly also works. No scroll interception or forced return.
- R12 USER_STATED: preload below-fold project/certificate/company images during the introduction, also on mobile/slow connections; use low fetch priority until a visible scene needs the image.

Implementation source includes new semantic graph/director and painting-only actors; original hero job implementation remains. Graph unit tests enforce source-content-before-copy and nodes-before-connections/labels, and pointer geometry. Quality worker owns company SVG/evidence, retained33-story model and actual negative controls. Separate reviewer reproduced delayed-image and delayed-calendar pops before fixes, then verified decoded placement,53realweek batches/366cells, readable HTTP500 fallback and updated template geometry after1440→768 resize (13native checks on4496f055…; source/config-specific full integration still in progress).

Final-source regression freeze started after all app edits, including prewarm and provisional fast-pass recovery. Baseline33-check project scene positives and broken-mask negative are retained as diagnostic milestones, not silently promoted after subsequent edits. Current all-section recipes/quality/four-size captures and existing regressions are running; unresolved checks must stay visible until fixed.

## User-confirmed concurrent work and final evidence — 2026-11-03

- R13 USER_CONFIRMED: retain the concurrent three-paragraph About narrative, inline Microsoft symbol and AI Engineer avatar label. About height increases by230.75px desktop/laptop,234px tablet and388px mobile; subsequent section Y positions move by exactly those amounts. Other section dimensions, content, typography and internal spacing remain unchanged.
- R14 USER_CONFIRMED: retain the concurrent HeroAgentsOverlay SVG illustration and its supporting heroAgents/CSS files. This is an explicit decorative hero exception. Existing real heading, role animation, controls and their geometry remain covered by acceptance. The separate HERO_AGENTS_PLAN and its unfinished verifier belong to that concurrent workflow; this ledger does not certify that workflow's additional contract.

Final application src fingerprint: `585532194183529eae3ecdfb6fcd36408def6cc2ffd8a1eb9645776a056e2732`. Build, TypeScript, ESLint (zero errors/seven pre-existing warnings), and all10unit tests pass. See CHANGE_REPORT.md for the complete evidence index and limitations.

After verification, the parallel hero workflow continued editing its component, timeline and a new work bridge. Those later edits stay in the working tree and are not included in this checkpoint. The index preserves the actually tested version, including the original drawing pen used by its timeline; no current user file was overwritten. Stable tested production preview is port8083. This ledger certifies that checkpoint, not the parallel workflow's unfinished follow-up.

The four-size geometry oracle remains the unmodified52cfa85 capture (`scenes-baseline-settled`). A separate pixel reference (`scenes-approved-reference`) uses a detached52cfa85 worktree with ONLY the two explicitly approved About/profile files copied in. This avoids treating fractional downstream raster-origin changes as redesigned text. The original baseline remains intact in Git and its original capture is untouched. Final capture is `scenes-final-reviewed`; all2277bounds/content/pixel checks pass. The new decorative company loaders are excluded only within their existing40px squares, live calendar data is excluded from static pixel comparisons, and decorative hero overlays are hidden for the original heading pixel comparison. Actual animated normal-motion journeys are verified separately.

Native Edge acceptance passes:33semantic scene checks,37all-recipe checks,15cinematic checks,29dynamic integration checks,60production interaction checks,65fluid browsing checks,16scan continuity checks,23name workshop checks,51quality/reminder checks,6full33-story completion checks,13media-readiness checks and8recovery/prewarm checks. Hero completion trace verification also runs against the unchanged workshop controller. Each artifact records its own source scope; the full-src suites use the fingerprint above.

Meaningful negative controls remain failing as expected: removed scene masks fail empty-before-content; a10px Hivo image change fails the geometry oracle; the deliberately broken encountered mean fails the independent quality calculation. No production source was altered for these controls.

Observed failures and corrections: auto-sized lazy certificate images were initially missing from semantic registration; registration now precedes load and measurement refreshes on readiness. A2px decorative image inset caused a size discontinuity; outline-only chrome and exact destination holding fixed it. A99.9% exposure timer could stop early; it now continues to full evidence. Initial portrait/resize tests accidentally jumped their intended animation into view; their setup now starts above the whole scene and leaves the resize destination below the viewport. Concurrent About/Hero changes correctly invalidated stale evidence, so affected journeys were repeated on the stable source. Early pixel comparisons were affected by fractional raster origins from the approved longer About; original geometry plus an explicitly amended pixel reference resolves that without raising thresholds. Temporary network-idle timeouts under parallel browser load were recorded; complete final runs pass. No failed claim is silently accepted.

Inspected artifacts include final desktop/mobile projects and certificates, partial/completed company feedback, and extracted frames of `scenes/project-construction.webm` showing the empty frame, first content, source-preserving moving duplicate, destination customization and guide release. New APIs/dependencies, telemetry, scroll locks, forced navigation and deployment were not introduced.

Verification scope is native headless Edge with desktop/tablet/touch emulation, local Vite and production preview. This is not a physical-device or real-user comprehension/CWV study. Exploration quality estimates qualified exposure; it cannot establish reading or comprehension. HarrTest is instruction-only: product VERIFIED_WITHIN_SCOPE; sealed mechanical ROOT_GOAL_UNVERIFIED (not executed); BEHAVIORAL_IMPACT_UNPROVEN.
