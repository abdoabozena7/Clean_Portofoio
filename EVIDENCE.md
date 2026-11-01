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

## Final acceptance

- Source `c9a0a8e10008702d6b267673916482f88e224810db4f8cc9a9a411fc3e3bfcd7` stayed unchanged during the final original-vs-modified capture. Both capture and comparison exit0.
- Viewports1440×900,1366×768,768×1024,390×844:336 preserved element rectangle/font/margin/padding checks,32 section rectangles,16 grids and hero slots match original.28 unchanged-section screenshot crops have zero differing pixels outside explicit authorized/dynamic masks. Zero new overflow, browser errors, failed requests or unloaded images. Screenshots actually inspected by root and the independent capture agent.
- Additional isolated Git-baseline comparisons at320,600,900,1000: all section and project-grid rectangles match exactly. The transient sizing fixture is removed; seven cards contain their contents. A1/64px row remainder is carried into the final row to preserve the exact total.
- Construction independent review:14 probes pass, including actual first-frame opacity1 on fast jumps, resized partial masks, touch idle RAF0 persecond, fresh deep anchors, pointer semantics and card containment. Reports: `output/playwright/independent-review/report.json` and `responsive-footprint-report.json`.
- Production-build journey on8082:40 actual browser checks pass, covering construction, geometry, negative controls, original cursor, scroll/reverse/history/anchors, previews/focus/Escape, terminal, contact validation, genuine CV download, reduced motion, print and touch menu. No messages were sent. Report: `output/playwright/production-behavior/report.json`.
- Negative controls detect both an actual temporary10px browser transform and hidden reading-area content; comparison also rejects a separately injected10px saved-measurement shift. Failed attempts were not used as passing evidence.
- Final build/lint/Vitest/TypeScript all successful after final app changes. Existing7 lint warnings and original320px overflow are retained, not hidden. Production test server is stopped after verification; dev preview8080 remains available for the owner's local review.
