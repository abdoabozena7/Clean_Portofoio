# Evidence ledger

- Baseline source SHA: c0f0146ea55fca394fd48053b7af67c99361d600. Clean initial checkout; preserved tag and isolated local branch.
- Reference video decoded using installed OpenCV: 56.4667s at 30fps. Examined 29 frames at 2s intervals and enlarged 32s frame. Features: coordinated small pointers, thin target outlines, progressive media/text, natural scrolling, no reason to copy reference colors or layout.
- LinkedIn public page returned HTTP 999; supplied two-page PDF extracted and rendered at `output/reference`. Microsoft title and start month are explicitly present. Do not infer role responsibilities.
- GitHub project research, verified exact names, source links and private-count provenance: `output/research/project-findings.md`.
- Original build: PASS. Original Vitest: PASS (1 test). Original lint: FAIL, 3 errors from generated `.vite/deps`, plus existing Fast Refresh warnings.
- Preview owned by this task: Vite on http://127.0.0.1:8080/Clean_Portofoio/.

## Integration findings and fixes

- Initial animation geometry experiment started before the original network font/calendar finished loading; warmed real resources and awaited fonts before comparing paint-only animation. No app layout workaround was introduced.
- Initial after-capture hung because it awaited decoding lazy images before scrolling them into view. Capture now decodes eager images first, traverses the real page, then checks lazy images with finite timeouts.
- Initial mobile behavior selector matched hidden desktop + visible mobile links; corrected the test to choose the visible menu link.
- Independent reviewer reproduced and verified fixes for: stale partial-text masks after resize; delayed project opacity due to existing transition-all (including a failed first fix caused by equal CSS specificity); unnecessary idle RAF callbacks on touch. Failed opacity receipt retained in `output/playwright/independent-review/failure-opacity-transition.json`.
- Element-only mobile screenshots could paint a fixed nav midway through long section clips. Comparator now crops both original and after full-page images using separately recorded document rectangles; it does not change the app. Failed screenshot report retained.
- An intermediate final capture correctly rejected its source changing during execution. That attempt remains in `output/playwright/after-source-changed-attempt`.
- Four required viewport checks first passed with fixed original project heights. An extra 320px original-vs-modified experiment exposed a 378px section shift outside those anchor widths. Replaced the fixed heights with temporary invisible original-layout measurement, retaining genuine responsive sizing and removing the fixture before paint. Additional width comparison is part of final review.
- The 320px horizontal overflow is pre-existing: original and modified both have document width342 at viewport320. Required390px and wider checks have no overflow.
- Latest production build browser journey:40 checks passed, zero page errors or failed requests, at local port8082. Report in `output/playwright/production-behavior/report.json`.
- Latest build, lint, Vitest and TypeScript commands exit0. Vitest:4 tests. Lint:7 existing Fast Refresh warnings in UI library files. Browserslist data-age notice remains from baseline.

## First delivery acceptance (historical)

- Source `c9a0a8e10008702d6b267673916482f88e224810db4f8cc9a9a411fc3e3bfcd7` stayed unchanged during the final original-vs-modified capture. Both capture and comparison exit0.
- Viewports1440×900,1366×768,768×1024,390×844:336 preserved element rectangle/font/margin/padding checks,32 section rectangles,16 grids and hero slots match original.28 unchanged-section screenshot crops have zero differing pixels outside explicit authorized/dynamic masks. Zero new overflow, browser errors, failed requests or unloaded images. Screenshots actually inspected by root and the independent capture agent.
- Additional isolated Git-baseline comparisons at320,600,900,1000: all section and project-grid rectangles match exactly. The transient sizing fixture is removed; seven cards contain their contents. A1/64px row remainder is carried into the final row to preserve the exact total.
- Construction independent review:14 probes pass, including actual first-frame opacity1 on fast jumps, resized partial masks, touch idle RAF0 persecond, fresh deep anchors, pointer semantics and card containment. Reports: `output/playwright/independent-review/report.json` and `responsive-footprint-report.json`.
- Production-build journey on8082:40 actual browser checks pass, covering construction, geometry, negative controls, original cursor, scroll/reverse/history/anchors, previews/focus/Escape, terminal, contact validation, genuine CV download, reduced motion, print and touch menu. No messages were sent. Report: `output/playwright/production-behavior/report.json`.
- Negative controls detect both an actual temporary10px browser transform and hidden reading-area content; comparison also rejects a separately injected10px saved-measurement shift. Failed attempts were not used as passing evidence.
- Final build/lint/Vitest/TypeScript all successful after final app changes. Existing7 lint warnings and original320px overflow are retained, not hidden. Production test server is stopped after verification; dev preview8080 remains available for the owner's local review.


## Current revision acceptance — 2 November 2026

- Current app source89ec657b212ce2c75fd54fac12beb6c0d7a804f475b791958ffa4a7217ed04a8 stays unchanged throughout the final60-check production journey and209-check visual run. Autonomy probe source is separately bound to its declared files and passes32checks.
- Actual rendered content now uses the verified data, instead of the earlier unused archive. About/Experience/Education/Skills/contact/footer/terminal agree; Microsoft is first, eight roles are present, and Crossover is part-time freelance per the owner.
- Three supplied certificate images render inline; all zoom dialogs load actual images and close with Escape/focus restoration. The cleaner supplied Prompt image replaces the old asset. Portrait filter is grayscale(1).
- Five exact palette tokens are used across eight agents, tags, rules and real hovered controls. Pointer path strings match both original cursor paths; synchronous mouse events affect only the real cursor. Autonomous progress continues without input and normal measured speed is420px/s. Finished desktop/touch RAF counts are0.
- User-authorized project UX change removes the old sizing fixture. Two desktop columns, a compact wide HarrTest feature and natural card heights replace forced legacy rows. Education/Experience/project heights intentionally change; hero slots/navigation/outer columns stay protected.
- Eight local company-logo assets decode. Public LinkedIn company guest pages supplied six company marks; Microsoft uses the existing local symbol, DEPI its official initiative image. Source URLs are in profileContent.ts and a hashed final asset manifest in output/research/logos. No credentials, private pages or runtime LinkedIn fetches.
- A200response from one Orange asset endpoint contained HTML. Image decoding caught it; replaced it with the valid public LinkedIn Orange JPEG. Invalid research download retained outside public assets.
- Corrected a real CSS specificity issue that initially let Tailwind flex override the featured horizontal grid. Inspected the corrected compact first card on desktop and mobile.
- Verification adaptations preserve correct oracles: fixed nav baseline coordinates are viewport-relative; tablet media width is304px, so the design minimum is300px rather than the initial off-by-one305assumption; fast-jump opacity checks target the visible first card rather than an offscreen later card. Failed reports were retained.
- A safe10px injected hero shift fails the visual comparator exactly at hero slot1y. Four required sizes have no overflow/errors/failed requests/unloaded images. Extra320/600/900/1000checks show all cards contained; the original320→342overflow is unchanged.
- Build/lint/TypeScript and four unit tests pass. Seven existing UI-library Fast Refresh warnings and the Browserslist age notice remain. No messages, push or deployment. Production test server is stopped after verification; the8080dev preview stays available for review.
- Current raw evidence: output/playwright/final-production/report.json (60checks), autonomous-review/report.json (32), visual-revision/report.json (209), additional-widths-and-hovers.json, and visual-revision-negative/report.json. Older first-delivery reports are historical and do not certify this revision.


## Cinematic follow-up — 2 November 2026

- Preserved coherent before capture at 15c0d84 / app SHA89ec657b212ce2c75fd54fac12beb6c0d7a804f475b791958ffa4a7217ed04a8. CINEMATIC_PLAN.md shot list was written before implementing the cinematic props.
- Both supplied lnkd.in post links resolve through anonymous public HTML. IMPACT confirms first place with Hivo Studio; Microsoft story describes the job-search agent and acceptance journey. Local research snapshots are in output/research/cinematic. Supplied DEPI and Orange certificate images support all added course facts. No authenticated scraping.
- A tooltip integration attempt accidentally nested an effect; lint and real browser caught it. Fixed the hook placement; re-ran lint, types, actual page journeys and current-source tests.
- Visual script initially tried to scroll/decode the new decorative empty image slots. Scoped the image check to real portfolio images, preserving all actual-image requirements. A comparator traversal that skipped lazy intersections was stopped as the owned test process; added frame-spaced scrolling and a finite image decode deadline.
- Laptop badge was partially behind fixed nav at y53 in the prior version. Its painting now sits at y76; reserved height, hero name and other slots stay fixed. Pixel golden excludes only its original badge/nav intersection from the nav crop; all other nav pixels stay checked.
- Full-page diffs at different fractional document Y offsets showed glyph/image resampling. Real DOM rectangles/fonts/spacing are checked first. Test-only restoration of the changed credential section's original height aligns unchanged sections to their exact original raster coordinates. Moving pre-existing marquee strips are explicitly excluded. No app layout shim was added. About/Experience/Projects then show zero changed pixels in all four viewports. Contact/finale differences show old fixed-nav/widget capture artifacts; mobile Skills differences show live GitHub month labels. Inspected the actual diff images.
- Copied portrait prop originally did not inherit the actual grayscale filter. Corrected filter inheritance and added a real-browser carried-portrait check.
- Final app SHA: ff2d3c59966c78a730d50e418281548712b39777036ca68597bbf0fe12cd7eec. PASS: cinematic21, built-production60, autonomy32, responsive213, geometry/pixel1669, unit4; build/lint/types. Autonomy scoped source SHA:c8344ef94d0bb4a5eedd55ee1fdf37c3ecf52f191647880bd027044040581ed6. All current receipts are coherent within their declared source scope.
- Both geometry negative controls failed for the expected specific injected faults: +10px hero Y and +10px project image width. Positive comparison runs passed separately.
- Actual current scenes inspected: copied Hivo screenshot carried toward YA RAB OSTORHA, resized Hivo prop and sibling replacement, completed project cards, Microsoft story callout, grayscale portrait pickup, compact desktop/mobile credentials and responsive hero. WebM/trace/PNG artifacts remain under output/playwright.
- Existing 7 Fast Refresh warnings and old Browserslist data remain. No runtime errors or failed requests in the production journey. No field CWV, physical touch device or sealed HarrTest root-gate claim. No push/deploy.
