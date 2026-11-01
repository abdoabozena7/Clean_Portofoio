# Local portfolio review

Preview: http://127.0.0.1:8080/Clean_Portofoio/

The original is preserved at tag `baseline/pre-agent-construction` (`c0f0146`). All changes are on `codex/scroll-agent-construction`; nothing was pushed or deployed.

## Changes

- `AgentConstruction.tsx`, `useScrollConstruction.ts`, `construction.ts`, `construction.css`: four decorative DOM-targeted pointers, temporary guides, line-aware text clipping, scroll-driven progress, fast-jump synchronization and persistent completed states. No animation canvas or runtime AI request was added. Original `ArrowPointerCursor.tsx` is unchanged.
- `SectionBlock.tsx`, `Index.tsx`, `Finale.tsx`: isolated animation integration. Removed the previous section translation entrance so construction never moves layout boxes.
- `MicrosoftHeadline.tsx`, `HeroSection.tsx`, local Microsoft SVG: exact Microsoft headline in the existing 34px badge, with original name/role/tags/social/CV geometry. Existing role animation retained, timer cleanup corrected, reduced motion honored, existing matrix work paused offscreen.
- `profileContent.ts`: central headline, links, animated roles, original display slots, verified LinkedIn PDF records, certifications, projects, editable update placeholders and source provenance. Full professional records are stored without adding timeline rows. Original timeline/education display copy is intentionally retained; edit those display arrays to promote future verified updates.
- `ProjectsSection.tsx`, `HarrTestFlow.tsx`, `projects.css`: six requested projects plus HarrTest, concise English hooks, genuine inline screenshots and accessible image dialogs. Hivo and YA RAB OSTORHA have understated active-work indicators. Original columns, breakpoints and overall measured project-grid footprint retained. `useProjectFootprint.ts` briefly measures an invisible, inert sizing fixture from `projectLayoutBaseline.ts` and removes it before paint; this preserves the original natural footprint between test widths as well as at the four required sizes, without a flow-affecting wrapper or hard-coded viewport coordinates.
- `AnimatedAvatar.tsx`: supplied speaking portrait with transparent background, inside the original image box. Source asset: `public/images/portrait-cutout.png`, generated using the built-in image-generation edit tool. Prompt: “Remove ONLY the background completely, producing true transparent alpha. Preserve the exact person, facial identity, glasses, black shirt, hair, microphone and cord, both hands, skin, watch, original natural lighting, pose and proportions. Clean accurate hair and finger edges. Do not beautify, redraw, recolor, crop any visible part of the person, add objects or text. Professional faithful photographic cutout for existing portfolio portrait.” Alpha verified RGBA, range 0–255.
- Terminal project replies use the same content source. ESLint now ignores generated `.vite` files; existing UI-library warnings remain visible.

The later instruction “use all mentioned” superseded the original five-project limit. The seven card interiors and portrait/badge/count content are authorized visual changes; their surrounding section geometry stays under regression checks.

## Verification

Evidence and images: `output/playwright/`. The durable checklist is `TASK_PLAN.md`; raw findings and initial failures are recorded in `EVIDENCE.md`.

Final results: build, lint, TypeScript and4 unit tests pass;40 production-browser checks and14 independent construction checks pass. Required four-viewport comparison verifies336 preserved elements,32 sections and16 grids. All28 unchanged-section screenshot crops are pixel-exact outside authorized/dynamic masks. Extra320/600/900/1000px baseline comparisons also preserve exact section geometry. All eight checklist tasks are verified.

```powershell
npm run build
npm run lint
npm test
npx tsc --noEmit -p tsconfig.app.json
npm run test:construction
npm run test:construction:review
npm run test:layout:capture
npm run test:layout
```

Browser scripts use the installed bundled Playwright/Sharp runtime. Other machines can set `PLAYWRIGHT_MODULE` and `SHARP_MODULE` to their installed package directories. Capture requires a local preview on port 8080; `PORTFOLIO_URL` can point the behavior journey at a production-build local preview. The preserved original baseline captures must exist before running the comparison; generate them from the baseline tag in a separate original checkout, never from modified source.

## Content access and limits

LinkedIn's public page returned HTTP 999. The supplied PDF and public GitHub/local repository evidence supplied the facts; there is no authenticated scraping or automatic runtime LinkedIn fetch. Public repositories: 63 verified on 1 November 2026. Total 92 is owner-reported; 29 private is derived, with provenance in the data.

The CV download deliberately serves the original PDF. Contact submission retains its existing mailto behavior; testing filled/validated the form without sending a message. Wazzefni's real screenshot shows its signed-out frontend, with no fabricated job results. Local browser verification does not establish field Core Web Vitals or cross-browser behavior outside the exercised Chromium engine.

Existing limitations retained from the original:7 UI-library Fast Refresh lint warnings; an old Browserslist data notice; at320px the original and modified documents both measure342px wide. The required390px mobile viewport and all wider verified widths have no horizontal overflow. No new unresolved issue remains in the tested acceptance scope.
