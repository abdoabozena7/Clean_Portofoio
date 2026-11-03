# Very-fast downward return experiment — 2026-11-03

USER_STATED: on genuinely very-fast sustained downward scrolling, move the visitor UP instead of allowing a rapid unread pass. Ordinary/slow scrolling stays native downward; use a high threshold and forgiving grace. This explicitly supersedes the old no-automatic-return requirement for this experiment only. Preserve bfa52b1 and the existing page geometry, score, agents and controls. No deployment.

Optional destination question remains unanswered: burst start vs page top. The stated reversible assumption is the beginning of the fast burst, with page top configurable. Elapsed time is not treated as approval. Config makes target and thresholds easy to change/disable. No credentials, telemetry, reading/comprehension claim, scroll-lock CSS or fixed-duration reading requirement.

| ID | Dependencies | Owner/scope | Observable acceptance | State |
|---|---|---|---|---|
| F1 | — | root + /root/compact_score_popup; plan/native baseline | Original code fails actual very-fast upward return; normal/moderate/control navigation works | VERIFIED |
| F2 | F1 | root; isolated config/model/hook + small scroll-signal integration | >=4.5viewport/s for>=300ms,>=1.5viewport travel and>=5samples; return once then reverse only continuing very-fast wheel intent; slow input immediately stays native | VERIFIED |
| F3 | F2 | root/unit model + independent verifier | Actual upward position and target; false-positive controls, repeat/cooldown, touch/keyboard/editable/dialog exclusions; source coherent | VERIFIED |
| F4 | F3 | root/report/Git | Build/lint/tests, interactions and reviewed runtime evidence; preserve all existing work, local review | VERIFIED |

Native BEFORE17checks:15PASS,2expected missing-return failures. Frozen verifier SHA9da8ebbbfa0d686d3937c8d81afaee0989fb6c0135231c67a2ce2902a851f0b3, source99ce0687…. Original harness diagnostics retained separately. Destination is read from actual config; events alone cannot prove movement. Independent popup reviewer owns only scripts/verify-fast-return.mjs and output. Root owns app integration. HarrTest2.6.1 full62-file read-only latest-main check passed against04d96868…; instruction-only ledger, no mechanical root-gate or measured skill-impact claim.

## Current-source acceptance

- App fingerprint `5a58a390db528ffeb5dcbcd62dffc9686edc3c5e34e310652eded0037fdee7ca`; V2 native Edge acceptance20/20PASS in `output/playwright/fast-return-after/report.json`. Actual500px/50ms sustained wheel input returns upward and reaches measured burst origins1900px and320px, then ordinary browsing continues downward. Continuing very-fast input can carry the viewport farther upward.
- Negative controls: ordinary80px/140ms, moderate220px/60ms, single3000px notch, repeated keyboard PageDown/End, anchors, focused textarea and image dialog. No return false positives; values and dialog interaction remain intact. Second burst re-arms after1200ms cooldown. No runtime errors.
- V2 destination evidence excludes all frames before the actual900px upward drawdown. Original weaker target-oracle report and source-drift failures remain retained. An offline adversarial check rejects a wrong destination even when the initial frame matches the expected origin; this is an oracle check, not another live product run.
- Existing paced-browsing regression15/15PASS after the final app changes: Education construction resumes in the current reading area over two cycles, normal input stays detailed, genuine scan enlarges hierarchy, mobile/reduced-motion policies remain. Its declared narrower source fingerprint is `feb22e016c3017f40cfbf875e1f007093ee9523af038475cf4ebb93382a63430`.
- Build, app TypeScript and lint pass (0errors,7existing Fast Refresh warnings);16unit tests pass. Existing Browserslist age and>500kB bundle warnings remain. No CSS, content, geometry or dependency change is part of this experiment. Historical full layout checks are preserved, not relabeled as a fresh four-size capture.
- Screenshots, real scroll-position traces and recordings were reviewed; `first-return.png` captures the final top position after continued reversing input. Static imagery alone is not evidence of motion. Automatic return uses the shared hard-jump path, restores natural adaptive layout and suppresses exposure credit during its navigation window.

## Touch scope and rollback

Native touch emulation verifies short/moderate flicks stay native. A deliberately quick600px swipe peaked at15.87viewport/s but remained above the threshold only96ms and934px, below300ms and1266px required at390×844; it correctly did not trigger. A positive qualifying mobile return is **not established** by that test. Typical short phone flicks are intentionally forgiven; physical-device validation remains open. Touch does not prevent default or fight a held finger. This is pace detection, not a claim that the visitor has or has not read content.

Set `FAST_SCROLL_RETURN_CONFIG.enabled=false` to disable the experiment, or revert this isolated Git change. Baseline `bfa52b1` and unrelated concurrent hero files are preserved. No publication, telemetry or storage was introduced.
