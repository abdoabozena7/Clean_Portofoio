# Continuous upward scrolling correction

Latest USER_STATED clarification supersedes burst-origin navigation: sustained fast downward input must move UP continuously toward the landing page, never finish at Contact. Slow input stays native. Earlier burst-return implementation is preserved at c6481f0. Local only.

TODO (root serial; hook/model and native browser verification share one interface):
- [x] R1: qualify from actual input cadence, independent of downward document motion or adaptive collapse; retain high threshold and accidental-notch protection.
- [x] R2: invert each subsequent downward wheel delta until slow input, upward input or idle; reach and remain at landing during a long fast burst. No origin teleport.
- [x] R3: native browser positive/negative controls, build/lint/unit checks, inspect motion evidence and record limits.

Oracle: from y8000, sustained500px/50ms native wheel reaches y0, with repeated negative increments after qualification; it must not merely jump once or reach Contact. Slow/moderate input and single large notch still move down. This is instruction-only HarrTest, not a sealed mechanical root verification.

Current-source native Edge verification21/21PASS: `output/playwright/fast-reverse-after/report.json`, app526dc09ff9d8edfcbb1d53ac95b3c0054b739af66bd0f972c48c76a22617da12. Starting8000px, qualification occurred after a2000px grace; subsequent steps9500,9000,...,500,0 show repeated real upward motion, with final frames staying0. Screenshot inspected at landing; actual position trace provides the motion evidence. Normal80px/140ms, moderate220px/60ms, single3000px notch, keyboard, anchors, editable field and dialog exclusions pass. Build, TypeScript,16unit tests pass; lint0errors/7existing warnings, existing bundle/Browserslist warnings remain. No geometry, content or dependency changes. Prior V2 verifier is preserved under ignored output; V3 changes the destination oracle to the user's corrected continuous-up behavior.

Existing current-source pace/recovery regression also15/15PASS (`output/playwright/paced-browsing-after/report.json`): actual agent movement and masks resume in the current Education viewport on both recovery cycles, with preserved scan hierarchy, native touch and reduced-motion behavior.

Qualification now observes wheel events before native movement rather than waiting for shared scroll/RAF state. Activation remains high (4.5viewport/s);180ms/1viewport/3samples provides grace. The active reverse mode uses a0.75 exit ratio to avoid chatter near entry speed and350ms idle release. Only qualified fast input is prevented; ordinary events use native defaults. The wheel listener must be non-passive to invert movement. Automatic movements still do not earn exposure credit. Touch retains a native short/moderate negative control; positive physical-phone reversal is not verified and is not claimed. No deployment or telemetry.
