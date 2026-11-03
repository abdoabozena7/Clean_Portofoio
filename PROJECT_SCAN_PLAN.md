# Full-size project media during fast browsing

Request: during fast scrolling retain each project's title, existing tags and exact normal-size screenshot/flowchart; hide the description and source/zoom action row, removing their space. Restore the full card after slowing. Deploy the verified result. Other section summaries, hero, scroll detection and agent behavior stay unchanged.

Serial TODO (HarrTest instruction-only, no mechanical root-gate claim):
- [x] P1 capture pre-change detailed and fast project cards, including HarrTest and actual screenshots at desktop/laptop/tablet/mobile widths.
- [x] P2 retain full media geometry and visible tags during project scanning. Remove description and action space while preserving the existing mobile scroll anchor.
- [x] P3 verify native wheel and touch, detailed geometry, media size, gaps, overflow and zoom. Build, TypeScript, 24 unit tests, 38 global and 16 command checks passed. Lint reported seven existing warnings and no errors.
- [ ] P4 commit, synchronize source branches, deploy from main and verify published bytes plus live project behavior.

Negative controls: original 96px thumbnail behavior must fail the full-size oracle; hidden tags or remaining source buttons must fail; a card that never returns to its original detailed geometry must fail. Use DOM measurements and actual screenshots, not score/agent labels as proof.

Native browser evidence is under `output/playwright/project-scan/`. Baseline verification against the previous published release detected the old thumbnail sizing at all four widths. The final local run passed 43 checks. The mobile screenshot was inspected. The test waits for the actual project text fonts before measuring to avoid fallback-font wrapping differences.
