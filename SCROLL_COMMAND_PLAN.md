# Immediate gesture command translation

USER_STATED: ordinary downward commands move down; strong downward commands move up immediately, proportional to the input. No section/exposure/progress or sustained-timer prerequisite. This supersedes19dd290's section-gated local version; published64574cf remains unchanged. HarrTest instruction-only; no mechanical root-gate claim.

- [x] C1: scrollCommand.ts translates current intent independently of content state.
- [x] C2: wheel inversion before native default; first vertical touchmove ownership; proportional movement, decaying release inertia and interruption; controls/taps/keyboard exclusions.
- [x] C3: native wheel/touch held/release/recovery checks, actual screenshot/trace review, build/lint/TypeScript/20unit tests and Git checkpoint.

Source262cf302247cf2f9793be206b650e411be233f05e25ef2b2efa60b035f56caad. Native Edge16/16PASS in output/playwright/scroll-command/report.json. First500px wheel moves UP without crossing a section. Strong held touch moves2199 to1599, then continues upward after release; normal touch moves2200 to2275. Slowing the SAME held gesture restores downward movement; a new finger press stops old inertia. Real taps open the real project dialog; dialog touches and focused form fields do not move the page; PageDown stays native. Trusted CDP touch is browser emulation, not physical-phone verification. Screenshot touch-held-up.png and actual scroll traces inspected.

Existing paced browsing15/15PASS;20unit tests, build, TypeScript and lint pass (0errors/7existing Fast Refresh warnings; existing bundle/Browserslist warnings remain). No layout CSS/content change beyond the gesture cue caption. No dependencies, telemetry, storage or reading inference.

To translate touch BEFORE native downward momentum begins, the hook cancels its FIRST eligible vertical touchmove and owns that gesture's scrolling/inertia. Taps, horizontal gestures, nested scroll areas, forms/dialogs, multitouch and keyboard remain excluded. No touch-action CSS or document scroll lock. Movement is1:1; release inertia is bounded700ms, honors reduced motion and stops on new input. Current slow input overrides old fast history.

The old pace check prohibited ANY preventDefault; that conflicts with the newly authorized touch-command translation. Its replacement preserves actual ordinary downward motion, no lower agents/masks and no overflow; the dedicated new suite verifies both directions and real interactions. Original failure retained in output/playwright/paced-browsing-after/report-old-native-touch-policy.json.

Retained diagnostics in scroll-command/: report-swipe-diagnostic.json (160px touch commands straddled the high-speed boundary at actual CDP intervals), report-release-diagnostic.json and report-subpixel-inertia-failure.json. The final strong300px gestures retain timestamps and still require EVERY held command to move up. Release failures exposed fractional pixel rounding prematurely ending inertia; the controller now accumulates subpixel movement. A continuous pause decay replaces the abrupt90ms cutoff. A second unchanged-source native run checks this previously intermittent path.

Limit: physical-phone momentum/pinch feel is not established by browser emulation. Horizontal/multitouch guards exist but are not claimed as physical-device proof. No deployment in this turn. test:fast-return and test:scroll-command now run current command acceptance; earlier section verifiers are historical.
