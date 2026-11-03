# Unified source integration and deployment

USER_STATED: explain the three branches, combine all intended features including removal of Skills, merge source into one version and deploy again. Authorization includes previously uncommitted global-scroll/mobile-ending changes. Do not discard accepted hero/agents/content or history.

Inventory after fresh fetch:
- main/origin/main:c0f0146, original portfolio/CV source; ancestor of feature branch.
- codex/scroll-agent-construction:cfb2d8f, cumulative profile/Microsoft/hero/reveals, command scrolling, full crew, orientation and deployment checks; origin feature branch is older52cfa85.
- gh-pages:built publication assets, origin0fdb273. No separate source features: regenerate from integrated main rather than mixing dist/index.html into Vite source.
- Local approved changes: global adaptive state across all groups; remove Skills section and nav links; compact mobile Contact/Finale; local verification/hero evidence docs not yet committed.

Root serial TODO:
- [x] U1: inventory/preserve pre-integration branch refs and checkpoint all approved local changes on feature branch.
- [x] U2: integrate feature source into main (fast-forward if ancestor), resolve code/test contradictions according to latest user instructions; establish main as source of truth.
- [x] U3: full integrated native global scroll, crew/orientation/command, hero and responsive checks; build/typecheck/lint/unit tests; inspect actual results and fix failures.
- [ ] U4: push consolidated source, publish generated gh-pages from main, verify exact public asset bytes plus no Skills, global state/crew interactions, and record source/publication commits.

HarrTest instruction-only; latest installed2.6.1 public-tree check passed. Source-ledger and actual runtime verification, no mechanical root-gate/engagement claim. Preserve original Git history and all prior release commits. No fabricated branch merge for generated assets.

## Integration verification

Source checkpoint e09d5cb includes the approved local work, then main was fast-forwarded without conflicts. The former main, feature and remote Pages revisions remain under backup/pre-unified-*-20261103 tags. Main is the publication source; the feature branch will fast-forward to the same revision. gh-pages will be regenerated, not merged into source.

- Build, application TypeScript and 24 unit tests pass. Lint: zero errors, seven existing Fast Refresh warnings. Existing Browserslist age and bundle-size warnings remain.
- Native Edge against unified source: full crew 9/9, orientation 14/14, immediate wheel/touch command 16/16. Hero 70/70; first attempt used a stopped 8081 endpoint and failed before checks, corrected to the running 8080 server.
- Exact production preview on 8086: global scroll/responsiveness 38/38 and hero 70/70. Reports: output/playwright/global-scroll/final-1793728178841/report.json and output/playwright/unified/hero-production/result.json. Desktop geometry/computed styles, compact 390/320 mobile layouts, no Skills/stale links, native wheel/touch, focus, reduced motion and idle restoration checked. Desktop/tablet Contact/Finale preserved against pre-edit evidence; intentional Skills removal changes downstream positions.
- Actual 390 Finale and 320 Contact screenshots inspected. Browser emulation does not establish physical-device performance.
- Global verifier now observes the public DOM instead of importing a dev-only TypeScript module, enabling identical production/public checks. No acceptance assertions removed. Repeatable npm aliases added for global and hero checks.
- This release supersedes the previous isolated bdeeee0 deployment described in AGENTS_DEPLOYMENT.md: its exclusions are now explicitly included by the owner.
