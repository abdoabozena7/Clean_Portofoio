import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = 'output/playwright/adaptive-review';
await mkdir(output, { recursive: true });
const sourceFiles = ['src/lib/scrollIntent.ts', 'src/hooks/useAdaptiveBrowsing.ts', 'src/hooks/useScrollConstruction.ts', 'src/components/AdaptiveBrowsing.tsx', 'src/styles/adaptive.css', 'src/components/ProjectsSection.tsx', 'src/components/SkillsSection.tsx'];
const fingerprint = async () => { const files=[]; async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())await walk(p);else files.push(p);}} await walk('src'); const hash = createHash('sha256'); for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); } return hash.digest('hex'); };
const report = { sourceFiles, sourceBefore: await fingerprint(), checks: [], observations: [], errors: [] };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, ...(evidence === undefined ? {} : { evidence }) }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const url = 'http://127.0.0.1:8080/Clean_Portofoio/';
const intent = page => page.evaluate(async () => {
  const entry = performance.getEntriesByType('resource').find(item => item.name.includes('/src/lib/scrollIntent.ts'));
  return entry ? (await import(entry.name)).getScrollIntent() : null;
});
const setup = async (page, anchor) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  if (anchor) await page.evaluate(id => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), anchor);
  await page.waitForTimeout(550);
};
const burst = async (page, delta = 80, count = 9, wait = 75) => {
  const observations = [];
  for (let index = 0; index < count; index++) {
    await page.mouse.wheel(0, delta); await page.waitForTimeout(wait);
    observations.push({ ...(await intent(page)), mode: await page.evaluate(() => document.documentElement.dataset.browsing), y: await page.evaluate(() => scrollY) });
  }
  return observations;
};
const visibleHeading = page => page.evaluate(() => {
  const el = [...document.querySelectorAll('[data-project] h3,.skill-category h3')].find(el => { const rect = el.getBoundingClientRect(); return rect.top >= 80 && rect.top < innerHeight * .65; });
  return el ? { text: el.textContent, y: el.getBoundingClientRect().top } : null;
});
const actualVisibility = el => {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node); if (Number(style.opacity) < .99 || style.clipPath !== 'none') return false;
  }
  return true;
};
const phase = async (name, fn) => { try { await fn(); } catch (error) { check(name + ' completes', false, error.stack); } };
try {
  await phase('Desktop anticipation', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
    await setup(page);
    const before = await page.locator('#about img').evaluate(el => ({ top: el.getBoundingClientRect().top, built: el.dataset.constructed }));
    await page.mouse.wheel(0, 120); await page.waitForTimeout(80);
    const after = await page.locator('#about img').evaluate(el => ({ top: el.getBoundingClientRect().top, built: el.dataset.constructed, imageLoaded: el.complete && el.naturalWidth > 0, loading: el.loading }));
    check('Real fast input prepares an image before it enters the viewport', before.top > 900 && after.top > 900 && after.built === 'true', { before, after });
    check('Anticipated image is decoded and its masked ancestors are opaque', after.imageLoaded && await page.locator('#about img').evaluate(actualVisibility));
    const signal = await intent(page);
    check('Trusted wheel input supplies forward user intent', signal?.userDriven && signal.direction === 1, signal);
    await page.screenshot({ path: `${output}/desktop-anticipation.png` });
    await page.mouse.wheel(0, -90); await page.waitForTimeout(80);
    const reverse = await intent(page);
    check('Reverse input updates anticipation direction', reverse?.direction === -1, reverse);
    check('Reverse scrolling keeps prepared content constructed', await page.locator('#about img').getAttribute('data-constructed') === 'true');
    await context.close();
  });
  await phase('Single programmatic jump', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage(); await setup(page);
    await page.evaluate(() => { const el = document.querySelector('.certificate-image-trigger'); scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight - 230, behavior: 'instant' }); });
    await page.waitForTimeout(80);
    const state = await page.locator('.certificate-image-trigger').first().evaluate(el => ({ top: el.getBoundingClientRect().top, built: el.dataset.constructed, building: el.dataset.building }));
    const signal = await intent(page);
    check('A programmatic jump does not count as user acceleration', signal && !signal.userDriven, signal);
    check('Below-screen cinematic content remains available for detailed construction after a programmatic jump', state.top > 900 && state.built !== 'true' && state.building === 'asset', state);
    await context.close();
  });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await phase('Mobile compact and restore', async () => {
    const page = await mobile.newPage(); page.on('pageerror', error => report.errors.push(error.message));
    await page.addInitScript(() => { window.__reviewRaf = 0; const native = requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => native(time => { window.__reviewRaf++; cb(time); }); });
    await setup(page, 'projects');
    const heights = await page.locator('[data-project]').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
    const observations = await burst(page);
    report.observations.push({ phase: 'Mobile trusted wheel burst', observations });
    const compact = await page.evaluate(() => ({ mode: document.documentElement.dataset.browsing, heights: [...document.querySelectorAll('[data-project]')].map(el => el.getBoundingClientRect().height), details: [...document.querySelectorAll('[data-scan-active] [data-scan-detail]')].map(el => ({ inert: el.inert, hidden: el.getAttribute('aria-hidden') })), futureDetails: [...document.querySelectorAll('[data-scan-group]:not([data-scan-active]) [data-scan-detail]')].map(el => ({ inert: el.inert, hidden: el.getAttribute('aria-hidden') })) }));
    check('Sustained mobile browsing compacts cards to 112px title/image rows', compact.mode === 'scan' && compact.heights.every(value => Math.abs(value - 112) < .1), compact);
    check('Active compact details leave focus and accessibility trees', compact.details.length > 0 && compact.details.every(detail => detail.inert && detail.hidden === 'true'));
    check('Inactive future groups keep their own details available', compact.futureDetails.length > 0 && compact.futureDetails.every(detail => !detail.inert && detail.hidden !== 'true'));
    check('Scroll compensation does not create reverse input feedback', observations.filter(item => item.mode === 'scan').every(item => item.direction === 1 && item.speed >= 0));
    const anchor = await visibleHeading(page); await page.screenshot({ path: `${output}/mobile-compact.png` });
    await page.waitForTimeout(1000);
    const restored = await page.locator('[data-project]').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
    check('Stopping restores every natural project height', restored.every((value, index) => Math.abs(value - heights[index]) < .1), { heights, restored });
    const restoredAnchor = anchor ? await page.locator('[data-project] h3,.skill-category h3').evaluateAll((els, text) => els.find(el => el.textContent === text)?.getBoundingClientRect().top, anchor.text) : null;
    check('Expansion keeps the visible item title anchored within 2px', anchor && restoredAnchor !== null && Math.abs(restoredAnchor - anchor.y) <= 2, { anchor, restoredAnchor });
    check('Expanded details return to focus and accessibility trees', await page.locator('[data-scan-detail]').evaluateAll(els => els.every(el => !el.inert && !el.hasAttribute('aria-hidden'))));
    const stopped = await intent(page); check('Geometry correction does not keep scan mode active after stopping', stopped?.speed === 0 && !stopped.scan && !stopped.active, stopped);
    await page.screenshot({ path: `${output}/mobile-expanded.png` });
    const cue = page.locator('.quick-pass-cue');
    if (await cue.count()) {
      const title = await cue.locator('strong').textContent();
      check('Quick-pass reminder describes an observed pass without claiming reading knowledge', (await cue.textContent()).includes('Passed quickly') && !(await cue.textContent()).toLowerCase().includes('unread'), title);
      await page.getByRole('button', { name: 'Dismiss project reminder', exact: true }).click();
      check('Quick-pass reminder can be dismissed', await cue.count() === 0);
    } else report.observations.push({ phase: 'Quick-pass cue', observation: 'No reminder shown in this timing population; exposure policy may suppress it.' });
    const startFrames = await page.evaluate(() => window.__reviewRaf); await page.waitForTimeout(650);
    const idle = await page.evaluate(initial => window.__reviewRaf - initial, startFrames);
    check('Settled mobile browsing stops animation frames', idle <= 3, idle);
    await page.close();
  });
  await phase('Native touch scrolling', async () => {
    const page = await mobile.newPage(); await setup(page, 'projects');
    await page.evaluate(async () => {
      window.__touchReview = { trustedMoves: 0, minHeight: Infinity, modes: [], peakSpeed: 0 };
      const entry = performance.getEntriesByType('resource').find(item => item.name.includes('/src/lib/scrollIntent.ts'));
      const { getScrollIntent } = await import(entry.name);
      window.addEventListener('scroll', () => { window.__touchReview.peakSpeed = Math.max(window.__touchReview.peakSpeed, Math.abs(getScrollIntent().speed)); }, { passive: true });
      document.addEventListener('touchmove', event => { if (event.isTrusted) window.__touchReview.trustedMoves++; }, { passive: true });
      const card = document.querySelector('[data-project]');
      const observer = new MutationObserver(() => {
        window.__touchReview.minHeight = Math.min(window.__touchReview.minHeight, card.getBoundingClientRect().height);
        const mode = document.documentElement.dataset.browsing;
        if (mode && !window.__touchReview.modes.includes(mode)) window.__touchReview.modes.push(mode);
      });
      observer.observe(card, { attributes: true, attributeFilter: ['style'] });
    });
    const session = await mobile.newCDPSession(page);
    // dispatchTouchEvent emits actual trusted DOM touch events. The compositor-only
    // synthesizeScrollGesture command does not emit them in this Edge build.
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 40, y: 720 }] });
    for (let index = 1; index <= 12; index++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 40, y: 720 - index * 42 }] });
      await page.waitForTimeout(10);
    }
    // Stop the finger before lifting to bound inertial travel inside the section.
    await page.waitForTimeout(180);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(250);
    const gesture = await page.evaluate(() => window.__touchReview);
    check('Native mobile touch scrolling supplies genuine fast touch input', gesture.trustedMoves > 2 && gesture.peakSpeed > .75, gesture);
    check('Native touch scanning actually reaches compact mobile rows', gesture.modes.includes('scan') && gesture.minHeight <= 112.1, gesture);
    await page.waitForTimeout(900);
    check('Native touch scan returns to detail after stopping', await page.evaluate(() => !document.documentElement.dataset.browsing));
    await page.close();
  });
  await phase('Skills category tree and keyboard', async () => {
    const page = await mobile.newPage(); await setup(page, 'skills');
    // Establish scanning, then retain its hysteresis without scrolling past
    // the now much shorter category tree before its state can be observed.
    const observations = [...await burst(page, 80, 4, 65), ...await burst(page, 20, 4, 70)];
    const state = await page.locator('[data-scan-group="skills"]').evaluate(el => ({ active: el.dataset.scanActive, categories: [...el.querySelectorAll('.skill-category')].map(category => ({ height: category.getBoundingClientRect().height, expanded: category.querySelector('button').getAttribute('aria-expanded') })), details: [...el.querySelectorAll('[data-scan-detail]')].every(detail => detail.inert) }));
    check('Fast mobile skills browsing becomes an accessible compact category tree', state.active === 'true' && state.categories.every(category => Math.abs(category.height - 60) < .1 && category.expanded === 'false') && state.details, state);
    const firstVisible = await page.locator('[data-scan-toggle]').evaluateAll(els => els.findIndex(el => { const rect = el.getBoundingClientRect(); return rect.top > 80 && rect.bottom < innerHeight; }));
    if (firstVisible >= 0) {
      await page.locator('[data-scan-toggle]').nth(firstVisible).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(70);
      check('Keyboard disclosure restores full category details', await page.locator('[data-scan-toggle]').nth(firstVisible).getAttribute('aria-expanded') === 'true' && await page.locator('[data-scan-detail]').evaluateAll(els => els.every(el => !el.inert)));
    } else check('A compact category remains visible for keyboard activation', false, observations);
    await page.screenshot({ path: `${output}/skills-keyboard.png` });
    await page.close();
  });
  await phase('Focused controls and preview modal', async () => {
    const page = await mobile.newPage(); await setup(page, 'projects');
    const source = page.getByRole('link', { name: 'Hivo Studio source on GitHub', exact: true });
    await source.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    const focusVisible = await source.evaluate(el => el.matches(':focus-visible'));
    await burst(page, 80, 8, 70);
    check('Keyboard focus prevents a project control from being hidden by compaction', focusVisible && await source.evaluate(el => document.activeElement === el && !el.closest('[inert]')) && await page.evaluate(() => document.documentElement.dataset.browsing !== 'scan'));
    await page.evaluate(() => document.activeElement?.blur());
    await page.evaluate(() => document.querySelector('#projects').scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(500);
    await burst(page, 80, 8, 75);
    const imageIndex = await page.locator('.project-image-trigger').evaluateAll(els => els.findIndex(el => { const rect = el.getBoundingClientRect(); return rect.top > 80 && rect.bottom < innerHeight * .85; }));
    if (imageIndex >= 0) {
      const trigger = page.locator('.project-image-trigger').nth(imageIndex);
      const point = await trigger.evaluate(el => { const rect = el.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; });
      // A direct touch sequence cannot retry or silently scroll to the trigger.
      // This catches focus/geometry changes that retarget the generated click.
      const session = await mobile.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await page.waitForTimeout(40);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 3000 });
      check('Tapping a compact screenshot opens its correct preview despite expansion', await page.getByRole('dialog').isVisible());
      await burst(page, 90, 5, 60);
      check('Open preview prevents regrouping', await page.evaluate(() => document.documentElement.dataset.browsing !== 'scan'));
      await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' });
      const focus = await trigger.evaluate(el => ({ same: document.activeElement === el, expected: el.getAttribute('aria-label'), actual: document.activeElement?.getAttribute('aria-label'), tag: document.activeElement?.tagName }));
      check('Closing preview restores its original trigger focus', focus.same, focus);
    } else check('A compact preview trigger remains visible to open', false);
    await page.close();
  });
  await phase('Fresh fragment navigation and reduced motion', async () => {
    for (const anchor of ['projects', 'skills', 'contact']) {
      const page = await mobile.newPage(); await page.goto(url + '#' + anchor, { waitUntil: 'networkidle' }); await page.waitForTimeout(450);
      const rect = await page.locator('#' + anchor + ' h2').evaluate(el => el.getBoundingClientRect().toJSON());
      check(`Fresh #${anchor} actually navigates to its content`, rect.top >= -20 && rect.top < 200, rect);
      await page.close();
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    const page = await context.newPage(); await setup(page, 'projects'); await burst(page);
    check('Reduced motion keeps full readable details during fast browsing', await page.evaluate(() => !document.documentElement.dataset.browsing && document.querySelectorAll('[data-building]').length === 0 && [...document.querySelectorAll('[data-scan-detail]')].every(el => !el.inert)));
    await context.close();
  });
  await mobile.close();
  check('No runtime page errors occurred', report.errors.length === 0, report.errors);
  report.sourceAfter = await fingerprint(); check('Adaptive source stayed unchanged during review', report.sourceAfter === report.sourceBefore, { before: report.sourceBefore, after: report.sourceAfter });
  report.passed = report.checks.every(check => check.passed);
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, sourceBefore: report.sourceBefore, sourceAfter: report.sourceAfter, failures: report.checks.filter(check => !check.passed) }, null, 2));
  if (!report.passed) process.exitCode = 1;
}
