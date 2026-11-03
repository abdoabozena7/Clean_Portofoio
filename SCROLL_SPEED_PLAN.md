# Scroll speed measurement repair

USER_STATED: improve the logic measuring scroll speed. Preserve the accepted whole-skipped-section return and Slow Down cue; preserve finished layout. Baseline a8ec6b2. HarrTest instruction-only; installed2.6.1 latest-tree match verified, no host invocation or mechanical root-gate claim.

Root serial TODO:
- [x] V1: reproduce rate dependence and spike sensitivity with independent trajectories (ordinary, 120Hz trackpad, burst, noisy spikes, slowdown/direction/idle).
- [x] V2: bounded rolling, elapsed-time-weighted input estimator shared by wheel/touch; actual page-motion confirmation before arming return; exclude correction/jumps and preserve section destination.
- [x] V3: native section/pace regressions and input controls, inspect screenshots, build/typecheck/lint/unit tests, preserve Git and report verification scope.

Acceptance: same physical px/second trajectory must classify alike across sample rates; an isolated spike mixed with slow input cannot arm fast return. Rapid consistent travel must qualify and remain invertible without relying on forward page motion. Slowdown/upward/idle must release, and blocked controls cannot carry old velocity forward. No CSS/content changes, new dependency, telemetry or reading claim.


Verified app4cc3d672fb4f84b6d0d5d49c5ef4b8b96ae72217fdc9017cdb7a9e446ec48e27. New scrollVelocity.ts integrates actual delta/time over240ms; qualification keeps4.5viewport/s/180ms/1viewport and requires70%fast-time coverage. An80ms recent window releases reverse intent on slowdown. First unknown sample, idle, direction change, device change, pinch/multitouch, cancellation, blocked fields/dialogs and resize cannot carry old velocity into a new gesture. Line/page units are normalized using the page font and viewport. Native page crossing remains required; automatic movement/geometry corrections do not constitute a skipped section. Existing global construction/scan thresholds are unchanged.

Native Edge current-source acceptance39/39PASS at output/playwright/scroll-speed/report.json: actual skipped and exposed controls, ordinary/moderate browsing, isolated spike mixed with slow samples, small frequent deltas, and sustained frequent deltas. Actual recorded native rates: frequent fast input8.69viewport/s returned to Education; moderate2.75, small frequent0.21 and isolated-spike trajectory did not reverse. Eight contexts cover1440×900 and390×844 (mobile uses wheel emulation). A real12-second exposure still exempts Education. Screenshot/position traces inspected, including the trackpad-like return. This is not a claim of a physical trackpad/touch-device test.

Unit trajectory tests cover equal6000px/sec motion at2,4,8,16,40and60ms intervals, slower motion, noisy spikes, direction, idle, coalescing and delta modes. Original source formula confirmed from a8ec6b2: at2ms it estimates0.833viewport/s instead of6.667 for the same6000px/sec; at16ms it estimates6.667. Offline arithmetic control retained in original-formula-control.json, explicitly not a native device trial. Old dead qualification code and its three tests were replaced with the new estimator/four behavior tests; total17unit tests pass.

Existing pace/recovery15/15PASS; agents resume working in the current Education viewport twice, native touch/reduced-motion policy retained. Build, TypeScript and lint pass (0errors/7existing Fast Refresh warnings). Existing525.40kB bundle and Browserslist warnings remain. No CSS/content/geometry or dependency changes. No telemetry/persistence.

Failure retained: report-short-trackpad-burst.json. An initial140px/8ms-requested native stream ran at a slower irregular cadence than requested because real browser delivery is not the requested sleep interval; it started reversing but ended before reaching the destination. The final positive stream is explicitly200px/8ms-requested for96events with actual timestamps retained; the destination and no-overshoot assertions are unchanged. Rapid tiny-interval invariance is established separately by deterministic trajectories, not claimed from browser request timing.

Scope limits: physical touch hardware and positive continuous touch reversal remain unverified. Shared construction speed/scan presentation is regression-tested rather than redesigned. Latest repair is local; the previously approved64574cf deployment remains live until another publication request.
