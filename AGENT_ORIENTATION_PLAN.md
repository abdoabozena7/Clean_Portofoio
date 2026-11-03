# Directional agents and central rendezvous

Latest USER_STATED: pointers face their actual work/movement instead of always up, depart from a central cluster and return to varied central positions between tasks while browsing. Preserve existing pointer silhouette, palette, real-user cursor, DOM geometry and useful construction. Existing lower-mobile/reduced-motion policy stays. Local only.

Current baseline4d61b13. Concurrent modifications to ContactSection/Finale/Footer/Navbar/Index/useAdaptiveBrowsing/contact.css belong to another task and must remain untouched; they are not animation regressions to revert.

Root serial TODO:
- [x] O1: add shortest-turn heading and deterministic varied center positions; isolate tests from concurrent content/layout edits.
- [x] O2: rotate SVG only around its tip, keep labels upright and contact fixed; return idle workers to center via bounded paths using the existing frame loop, then park without perpetual work.
- [x] O3: native observations of multiple headings, actual travel out/back, exact grip anchors, idle parking, pointer hit testing, mobile/reduced-motion and build/type/lint/unit checks. Preserve Git and disclose concurrent-source limitations.

HarrTest instruction-only. No redesign, new runtime AI, dependencies or document-flow changes. New user-requested central PARKED crew supersedes the old no-visible-agents-at-idle assertion; no busy/moving swarm after work is still required.


## Result and evidence

Owned runtime changes: constructionDirector.ts now derives heading from actual document-space work travel and viewport-space return travel, smooths shortest-angle turns, dispatches available workers from a center rendezvous, returns idle workers along bounded520ms paths and parks them without an endless animation loop. agentOrientation.ts defines pure heading/rendezvous math. construction.css rotates ONLY the decorative SVG around its tip and offsets that tip onto the existing measured anchor; labels remain upright and hidden while parked. Existing pointer silhouette/palette and actual user cursor are preserved. Stable seeded variation changes rendezvous positions per return, not random per-frame jitter. No new DOM flow, dependencies, global scroll handler or runtime AI.

Native14/14PASS: output/playwright/agent-orientation/report.json. Runtime scope fingerprint e8784467353e1fb1b5b3177cd85811274fa7d46f6e4a438e2718eb48bc1292f9. Scope includes director, pose math/recipes, shared construction hook/CSS and pointer SVG. It explicitly excludes concurrent contact/navigation/global-collapse changes. Actual SVG matrices show multiple headings;207work-contact samples keep the SVG tip at the measured parent anchor within floating-point precision (max1.14e-13px). Workers physically return, ALL currently registered10agents park centrally in varied stable positions, and settle with no continuous movement. Native fast-browse and slow recovery tests hide/restore the crew, reduced motion hides it, mobile lower sections have no hub and no overflow, and overlays remain pointer-events:none. Education's actual width/height remain unchanged. Screenshot central-crew.png and extracted working-directions.jpg plus recording inspected.

Negative control: forcing --agent-heading:0deg with CSS makes exactly the heading assertion fail while the other13checks still pass. This proves actual rendered direction is measured, not an activity label. Evidence in agent-orientation-negative/report.json. Initial report-fixed-count-diagnostic.json retained: its fixed8count was wrong because the existing runtime pool contains10; final acceptance discovers the registered count and requires every registered agent, rather than changing the application pool.

Build, app TypeScript, lint and23unit tests pass. Existing7Fast Refresh warnings, old Browserslist and>500kB chunk warning remain. Native scroll-command16/16PASS verifies existing wheel/touch translation, taps/dialog, keyboard and form controls. Full old all-section/Skills baselines are not relabeled as fresh: another task is removing Skills and changing global adaptive layout/mobile ending concurrently. This task neither overwrites those files nor claims those unrelated outcomes complete. No full-site zero-diff claim is made against a changing concurrent layout; this scope tests the actual pointer anchors, unchanged Education geometry, hit testing and responsive/reduced-motion policy.

Local only; no deploy/push. Physical-device/CWV/engagement gains are not established by browser emulation. New parked central crew is intentional per the latest user request; temporary working props/guides still release after completion.
