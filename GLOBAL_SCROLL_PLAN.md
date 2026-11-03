# Global scrolling and compact mobile ending

Original user request: `output/playwright/global-scroll/request.txt` (complete Arabic request).

Requirements (USER_STATED):
- R1: One shared fast-scroll visual state across all adaptive sections, including offscreen and previously passed rows; no section-boundary reset. Slow/idle restores all groups.
- R2: Remove the Technical Skills section and its navigation anchors.
- R3: Compact contact and final ending below 768px; retain content, usable controls, and the exact desktop appearance.
- R4: Integrated desktop/mobile native-input journeys, idle recovery, repeat/reverse direction, form interaction, reduced motion, and production build.

Execution: coordinator owns implementation/browser; read-only reviewer `/root/review_scroll_state` inspected state/anchoring and acceptance independently. Existing unrelated working-tree changes are preserved.

TODO (dependency order):
- T1 VERIFIED: Reproduced global-state failure and captured desktop/mobile geometry before editing. Output: output/playwright/global-scroll/baseline. Both desktop and touch failed the all-groups oracle before implementation.
- T2 VERIFIED (T1): Capture/paint all groups once, preserve mobile upstream footprints while applying global visual changes, remove local reset. Remove skills/navigation. Scope: useAdaptiveBrowsing, Index, Navbar, Footer. Also distinguish link drags from taps and restore on stationary held-touch idle.
- T3 VERIFIED (T1): Scoped mobile-only contact/finale compression. Scope: ContactSection, Finale, contact CSS.
- T4 VERIFIED (T2,T3): Native desktop/touch journeys and desktop baseline comparison passed; screenshots inspected; build, unit suite, targeted lint and adjacent command/dialog regressions passed.

Acceptance: fast mode visibly changes offscreen experience logos/credential media and marks all groups together; no intermediate detail frames at boundaries; idle restores original styles and inert state. Above-viewport mobile card heights may stay reserved during a burst to protect touch momentum, while their summary visuals share the same state. Desktop contact/finale per-element relative geometry and computed styles match the captured baseline. Mobile contact/finale substantially shorter, without horizontal overflow or unusable fields.

Negative control: pre-edit real application must fail the global-all-groups oracle. Slow scrolling must not activate scan. Reduced-motion browsing must not regroup.

Harness integrity: installed HarrTest 2.6.1 matched current public tree. Existing checkout active task hero-crew-readable has a historical passing gate but is now source-stale. New proof init was refused as another unfinished task is active; no task was overwritten, blocked, or replaced. This task uses this durable ledger plus actual browser artifacts; no mechanical child/root verification is claimed (ROOT_GOAL_UNVERIFIED). New root request preservation lives under .runtime-proof/root-goals/global-scroll-mobile-contact. Verification evidence and user-facing results remain independently inspectable.

## Final evidence and scope

Implementation status: VERIFIED_WITHIN_SCOPE using real headless Edge, local Vite instance started by this task on 127.0.0.1:8081. Mechanical CHILD_TASK_STATUS: NOT_RUN; ROOT_GOAL_STATUS: ROOT_GOAL_UNVERIFIED because an existing active task owns checkout harness state. This is a harness ownership limitation, not a failed browser acceptance.

- Final integrated report: `output/playwright/global-scroll/final-1793722131593/report.json`: 38/38 checks; no browser errors; complete src/config/lock/verifier fingerprint unchanged during run.
- Viewports: 1440, 768, 390, 320px. Desktop section heights and computed styles match pre-edit; internal text/native textarea geometry permits up to 3px browser font rounding (earliest final attempt matched exact geometry; later native font metrics varied by 1–2.17px).
- Mobile 390: contact 1076.75 → 842.78px (21.7% shorter), finale 1058 → 610px (42.3% shorter). 320: 1170 → 906.78px and 1077 → 629px. No content removed from contact/finale; controls remain at least 44px tall.
- Native wheel/touch enter one global state before offscreen sections enter view, remain active across boundaries through contact, restore every group on idle, and repeat upward. Stationary held finger restores sizes without requiring touchend. Ordinary scrolling and reduced motion remain detailed.
- Inspected current-source `touch-across-sections.png`, `320-contact.png`, `390-finale.png` in final evidence directory. Earlier attempts preserved under `final/` and `final-1793722039451/`: exposed web-font rounding in overly exact native-input geometry checks and an interactive-link drag activation timer; corrected and re-exercised the actual journeys. Initial baseline global failure remains preserved.
- Adjacent behavior report: `output/playwright/global-scroll/command-regression/report.json`, 16/16 checks: strong-gesture command reversal retained, ordinary touch momentum, same-gesture slowdown, form focus, actual thumbnail tap/dialog open and modal scrolling isolation.
- `npm run build`: passed (existing chunk-size/old Browserslist advisories remain).
- `npm test`: 7 files, 21 tests passed. Targeted ESLint on all changed TSX/TS files passed; `git diff --check` passed.
- No deployment, external messages, or commits. Existing unrelated source work was preserved. No claim of measured behavioral uplift from the skill itself (BEHAVIORAL_IMPACT_UNPROVEN); no mechanical enforcement is claimed.
