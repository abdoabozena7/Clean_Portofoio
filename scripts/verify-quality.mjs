import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const negative = process.argv.includes('--negative-control'), reminders = process.argv.includes('--reminder-budget'), companyOnly = process.argv.includes('--company-only');
const out = process.env.PORTFOLIO_EVIDENCE_DIR || `output/playwright/quality${negative ? '-negative' : ''}${reminders ? '-reminders' : ''}${companyOnly ? '-company' : ''}`;
await mkdir(out, { recursive: true });
async function source() { const files = []; async function walk(dir) { for (const item of await readdir(dir, { withFileTypes: true })) { const p = dir + '/' + item.name; if (item.isDirectory()) await walk(p); else files.push(p); } } await walk('src'); const h = createHash('sha256'); for (const file of files.sort()) { h.update(file); h.update(await readFile(file)); } return h.digest('hex'); }
const report = { url, sourceBefore: await source(), mode: 'native browser / real application / headless Edge', negative, faultApplied: false, checks: [], observations: [], errors: [], passed: false };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const gauge = page => page.getByRole('button', { name: /Current score: .*Open score details/ });
const score = page => page.locator('.exploration-trigger strong').textContent().then(value => parseFloat(value));
const storyCount = 25;
const compactCount = text => new RegExp(`^\\d+ / ${storyCount}$`).test(text);
const evidence = (page, selector) => page.locator(selector).evaluate(el => ({ quality: Number(el.dataset.quality), coverage: Number(el.dataset.qualityCoverage), encountered: el.dataset.qualityEncountered === 'true', confidence: el.dataset.qualityConfidence }));
const records = page => page.locator('[data-discovery-id]').evaluateAll(es => es.map(el => ({ id: el.dataset.discoveryId, quality: Number(el.dataset.quality), coverage: Number(el.dataset.qualityCoverage), encountered: el.dataset.qualityEncountered === 'true' })));
const move = async (page, selector, wait = 450) => { await page.locator(selector).evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 120, behavior: 'instant' })); if (wait) await page.waitForTimeout(wait); };
const fresh = async (mobile = true, { width = mobile ? 390 : 1440, reducedMotion = 'reduce', failedLogo = false } = {}) => {
 const context = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion });
 if (failedLogo) await context.route('**/images/microsoft-symbol.svg', route => route.abort());
 if (negative) await context.route('**/src/lib/discoveryScore.ts*', async route => { const response = await route.fetch(), original = await response.text(); const altered = original.replace(/return Math\.round\([^\n;]+\)\s*\/\s*10;/, 'return Math.round(1000 * earned / (encountered.length + 2)) / 10;'); report.faultApplied ||= altered !== original; await route.fulfill({ response, body: altered }); });
 const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message)); await page.goto(url + '#contact', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); await page.bringToFront();
 // Observe only the genuine rendered score, independently of the component's
 // visit-local maximum. This does not inject evidence or alter its calculation.
 await page.evaluate(() => { const value = document.querySelector('.exploration-trigger strong'); const sample = () => { window.__observedScoreMaximum = Math.max(window.__observedScoreMaximum || 0, parseFloat(value.textContent) || 0); }; sample(); new MutationObserver(sample).observe(value, { childList: true, characterData: true, subtree: true }); });
 return { context, page };
};

async function verifyCompanies() {
 const selector = '[data-attention-id="experience-microsoft"]';
 const captureLogo = async (page, width, phase) => {
  const logo = page.locator(selector + ' .company-logo');
  const png = await logo.screenshot({ path: `${out}/company-${width}-${phase}-logo.png` });
  return logo.evaluate(async (element, encoded) => {
   const accent = getComputedStyle(element.querySelector('.company-evidence-progress')).stroke.match(/\d+/g).map(Number);
   const image = new Image();
   image.src = 'data:image/png;base64,' + encoded;
   await image.decode();
   const canvas = document.createElement('canvas');
   canvas.width = image.width;
   canvas.height = image.height;
   const context = canvas.getContext('2d');
   context.drawImage(image, 0, 0);
   const { data } = context.getImageData(0, 0, image.width, image.height);
   const sides = [0, 0, 0, 0];
   for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
     const pixel = (y * image.width + x) * 4;
     if (!accent.slice(0, 3).every((channel, index) => Math.abs(data[pixel + index] - channel) < 42)) continue;
     if (y < 4) sides[0]++;
     if (x >= image.width - 4) sides[1]++;
     if (y >= image.height - 4) sides[2]++;
     if (x < 4) sides[3]++;
    }
   }
   return { sides, total: sides.reduce((sum, count) => sum + count, 0) };
  }, png.toString('base64'));
 };
 const inspect = page => page.locator(selector).evaluate(el => {
  const logo = el.querySelector('.company-logo'), image = logo.querySelector('img'), ring = logo.querySelector('.company-evidence'), progress = ring.querySelector('.company-evidence-progress'), mark = ring.querySelector('.company-evidence-finish');
  const r = logo.getBoundingClientRect(), q = ring.getBoundingClientRect(), a = image.getBoundingClientRect(), copy = el.querySelector('.experience-company');
  const style = getComputedStyle(image), filter = style.filter, copyStyle = getComputedStyle(copy);
  return {
   credit: Number(el.style.getPropertyValue('--exploration-evidence')), complete: el.dataset.explorationComplete,
   offset: Number(getComputedStyle(progress).strokeDashoffset.match(/[\d.]+/)?.[0]), mark: Number(getComputedStyle(mark).opacity),
   color: Number(filter.match(/grayscale\(([^)]+)\)/)?.[1] ?? 0),
   ink: Number(filter.match(/opacity\(([^)]+)\)/)?.[1] ?? style.opacity),
   transition: style.transitionProperty, naturalWidth: image.naturalWidth,
   rect: [r.x,r.y,r.width,r.height], ring: [q.x,q.y,q.width,q.height], image: [a.x,a.y,a.width,a.height],
   bodyColor: copyStyle.color, bodyOpacity: copyStyle.opacity, hidden: document.hidden, focused: document.hasFocus()
  };
 });
 for (const width of [360, 390, 1440]) {
  const mobile = width < 768, { context, page } = await fresh(mobile, { width, reducedMotion: width === 360 ? 'reduce' : 'no-preference' });
  const card = page.locator(selector);
  const pendingOffscreen = await inspect(page);
  await page.waitForTimeout(300);
  check(`${width}: an offscreen company receives no credit`, pendingOffscreen.credit === 0 && (await inspect(page)).credit === 0);
  await card.evaluate(el => el.inert = true);
  await move(page, selector, 0);
  const pending = await inspect(page);
  await page.waitForTimeout(450);
  const unavailable = await inspect(page);
  check(`${width}: unavailable content cannot advance the outline or show the mark`, unavailable.credit === pending.credit && unavailable.offset === 1 && unavailable.mark === 0, unavailable);
  check(`${width}: color treatment matches the viewport and text retains full contrast`, pending.ink === (mobile ? .5 : 1) && pending.color === Number(mobile) && pending.bodyOpacity === '1', pending);
  check(`${width}: the ring fits the current 68px square and the image is 58px`, pending.rect.every((n,i) => Math.abs(n-pending.ring[i]) < .1) && pending.rect.slice(2).every(n => n === 68) && pending.image.slice(2).every(n => n === 58), pending);
  const pendingPixels = mobile ? await captureLogo(page, width, 'pending') : null;
  if (mobile) await page.screenshot({ path: `${out}/company-${width}-pending.png` });
  await card.evaluate(el => el.inert = false);
  await page.waitForTimeout(750);
  const partial = await inspect(page);
  check(`${width}: the outline and mobile color progress before the completion mark`, partial.credit > 0 && partial.credit < .995 && partial.offset > 0 && partial.offset < 1 && partial.mark === 0 && (mobile ? partial.ink > pending.ink && partial.ink < 1 && partial.color < pending.color : partial.ink === 1 && partial.color === 0), partial);
  const partialPixels = mobile ? await captureLogo(page, width, 'partial') : null;
  if (mobile) await page.screenshot({ path: `${out}/company-${width}-partial.png` });
  if (width === 360) check('Reduced Motion removes interpolation and retains the same progressive values', partial.transition === 'none' && Math.abs(partial.offset - (1 - partial.credit)) < .002 && Math.abs(partial.ink - (.5 + .5 * partial.credit)) < .002, partial);
  if (width === 390) {
   const cdp = await context.newCDPSession(page);
   await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
   const other = await context.newPage();
   await (await context.newCDPSession(other)).send('Emulation.setFocusEmulationEnabled', { enabled: false });
   await other.bringToFront();
   const background = await inspect(page);
   await page.waitForTimeout(400);
   check('An inactive tab holds the company credit', (background.hidden || !background.focused) && (await inspect(page)).credit === background.credit, background);
   await other.close();
   await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
   await page.bringToFront();
   await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
   const left = await inspect(page);
   await page.waitForTimeout(500);
   check('Leaving the viewport preserves partial credit', (await inspect(page)).credit === left.credit && left.credit > 0 && left.credit < 1, left);
   await move(page, selector, 0);
   await page.evaluate(() => addEventListener('portfolio:scroll-command', event => {
    if (!event.detail.reverse) return;
    window.__companyReverseCredit = document.querySelector('[data-attention-id="experience-microsoft"]').style.getPropertyValue('--exploration-evidence');
   }, { once: true }));
   await page.mouse.move(195,600);
   await page.mouse.wheel(0, 330);
   await page.waitForTimeout(180);
   const reversing = await inspect(page), reverseStart = await page.evaluate(() => window.__companyReverseCredit);
   check('A visible company loader pauses during automatic reverse movement', reverseStart !== undefined && reversing.credit === Number(reverseStart) && reversing.rect[1] > 76 && reversing.rect[1] < 700, { reverseStart, reversing });
   await move(page, selector, 500);
   check('Returning to a visible company resumes credit from its previous value', (await inspect(page)).credit > reversing.credit);
  }
  await card.locator('.company-evidence').waitFor({ state: 'visible' });
  await page.waitForFunction(selector => document.querySelector(selector).style.getPropertyValue('--exploration-evidence') === '1', selector);
  await page.waitForTimeout(300);
  const complete = await inspect(page);
  check(`${width}: qualified exposure finishes the outline, color and mark without dimming the company name`, complete.complete === 'true' && complete.offset === 0 && complete.ink === 1 && complete.color === 0 && complete.mark === 1 && complete.bodyOpacity === pending.bodyOpacity && complete.bodyColor === pending.bodyColor, complete);
  if (mobile) {
   const completePixels = await captureLogo(page, width, 'complete');
   check(`${width}: the rendered outline starts empty, draws partway, then reaches all four sides`, pendingPixels.total < 8 && partialPixels.total > 25 && partialPixels.total < completePixels.total * .85 && completePixels.sides.every(count => count >= 40), { pendingPixels, partialPixels, completePixels });
  }
  await page.screenshot({ path: `${out}/company-${width}-complete.png` });
  check(`${width}: evidence SVGs remain decorative and keep their distinct motifs`, await page.locator('.company-evidence').evaluateAll(es => es.length > 0 && es.every(el => el.hasAttribute('data-construction-skip') && el.getAttribute('aria-hidden') === 'true' && el.getAttribute('focusable') === 'false' && getComputedStyle(el).pointerEvents === 'none' && !el.hasAttribute('data-scene-surface')) && new Set(es.map(el => el.querySelector('.company-evidence-finish').dataset.evidenceVariant)).size === 3));
  await context.close();
 }
 const failed = await fresh(true, { failedLogo: true });
 await move(failed.page, selector, 2700);
 const missing = await inspect(failed.page);
 check('A failed logo cannot earn media credit or a completion mark', missing.naturalWidth === 0 && missing.credit > 0 && missing.credit <= .455 && missing.complete === 'false' && missing.mark === 0, missing);
 await failed.context.close();
 const hidden = await fresh();
 await hidden.page.locator(selector + ' img').evaluate(el => el.style.visibility = 'hidden');
 await move(hidden.page, selector, 2700);
 const invisible = await inspect(hidden.page);
 check('A loaded but invisible logo cannot earn media credit', invisible.naturalWidth > 0 && invisible.credit > 0 && invisible.credit <= .455 && invisible.complete === 'false' && invisible.mark === 0, invisible);
 await hidden.context.close();
}

try {
 if (companyOnly) { await verifyCompanies(); } else {
 const { context, page } = await fresh();
 check('Fresh visit starts with no invented quality evidence', await score(page) === 0);
 check('Every actual story is registered, retaining the current 25-story population', await page.locator('[data-discovery-id]').count() === storyCount);
 check('The primary control remains a real circle', await gauge(page).evaluate(el => { const r = el.getBoundingClientRect(); return Math.abs(r.width - r.height) < .1 && parseFloat(getComputedStyle(el).borderRadius) >= r.width / 2; }));
 await move(page, '#project-hivo'); const start = await evidence(page, '#project-hivo'); await page.waitForTimeout(1300); const partial = await evidence(page, '#project-hivo');
 check('Expanded visible text and decoded media earn gradual evidence', partial.quality > start.quality && partial.quality < 100, { start, partial });
 const sample = await records(page), encountered = sample.filter(story => story.encountered), expected = encountered.reduce((sum, story) => sum + story.quality, 0) / encountered.length;
 check('Visible quality is the independent mean of encountered evidence, without gap debt', Math.abs(await score(page) - expected) < .6, { shown: await score(page), expected, encountered: encountered.length });
 check('A direct jump did not invent encounters with intermediate career and education stories', !sample.find(story => story.id === 'experience-microsoft').encountered && !sample.find(story => story.id === 'education-harbin').encountered);
 await page.waitForTimeout(3800); const earned = await score(page), preserved = await evidence(page, '#project-hivo');
 const beforeReverse = await records(page);
 await page.evaluate(() => addEventListener('portfolio:scroll-command', event => { window.__qualityReverse = event.detail; }, { once: true }));
 await page.mouse.wheel(0, 1400); await page.waitForTimeout(90); const skipped = await score(page), reversal = await page.evaluate(() => window.__qualityReverse);
 check('Automatic return moves upward without creating new evidence or encounter debt', reversal?.reverse && reversal.to < reversal.from && skipped === earned && JSON.stringify(await records(page)) === JSON.stringify(beforeReverse), { earned, skipped, reversal });
 check('Fast scrolling retains already earned evidence', (await evidence(page, '#project-hivo')).quality === preserved.quality);
 await move(page, '#project-community-simulator'); const beforeReturn = await evidence(page, '#project-community-simulator'); await page.waitForTimeout(2600); const afterReturn = await evidence(page, '#project-community-simulator');
 check('A visible expanded revisit strengthens its own story evidence', afterReturn.quality > beforeReturn.quality, { beforeReturn, afterReturn });
 await gauge(page).click();
 check('The optional panel retains its curved side corners', await page.locator('[data-exploration-map]').evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 20));
 check('The compact popup keeps the genuine count as plain numbers separate from the current percentage', await page.locator('.score-popup-count').innerText().then(compactCount) && Math.abs(parseFloat(await page.locator('.score-popup-current').innerText()) - await score(page)) < .1);
 check('The popup follows the requested mystery contract without explanatory labels or route/story menus', await page.locator('[data-exploration-map]').innerText().then(text => text.includes('Think you know what this number means?') && !/exposure|quality|reading|comprehension|coverage|encountered|stories|penalt|game|debt/i.test(text)) && await page.locator('[data-exploration-map] details,[data-exploration-map] ul,.exploration-routes,.exploration-next').count() === 0);
 const best = parseFloat(await page.locator('.score-popup-best strong').innerText()), observedMaximum = await page.evaluate(() => window.__observedScoreMaximum);
 check('Best score retains the independently observed genuine visit maximum', Math.abs(best - observedMaximum) < .1 && best >= await score(page), { best, observedMaximum, current: await score(page) });
 const covered = await records(page); await page.waitForTimeout(1600);
 check('The open panel cannot earn background story exposure', JSON.stringify(await records(page)) === JSON.stringify(covered));
 check('The invitation links to the exact owner-supplied Instagram without invented profile data', await page.locator('.score-popup-message').getAttribute('href') === 'https://www.instagram.com/abdoabozena1/' && await page.locator('.score-popup-message').getAttribute('rel') === 'noopener noreferrer');
 await page.screenshot({ path: out + '/mobile-quality-coverage.png' }); await page.keyboard.press('Escape');
 check('Escape closes the nonmodal map and restores keyboard focus', await page.locator('[data-exploration-map]').count() === 0 && await gauge(page).evaluate(el => document.activeElement === el));
 await move(page, '#project-ya-rab-ostorha', 0); await page.locator('#project-ya-rab-ostorha [data-scan-detail]').evaluateAll(es => es.forEach(el => { el.inert = true; el.style.opacity = '0'; })); const collapsed = await evidence(page, '#project-ya-rab-ostorha'); await page.waitForTimeout(2000);
 check('Collapsed details earn no story exposure while their title remains visible', (await evidence(page, '#project-ya-rab-ostorha')).quality === collapsed.quality);
 await page.locator('#project-ya-rab-ostorha [data-scan-detail]').evaluateAll(es => es.forEach(el => { el.inert = false; el.style.removeProperty('opacity'); })); await page.waitForTimeout(1500);
 const expanded = await evidence(page, '#project-ya-rab-ostorha');
 check('Restoring genuinely expanded content resumes exposure', expanded.quality > collapsed.quality, { collapsed, expanded });
 await page.locator('#project-ya-rab-ostorha').evaluate(el => el.dataset.sceneBuilding = 'true'); const building = await evidence(page, '#project-ya-rab-ostorha'); await page.waitForTimeout(1400);
 check('A scene still being constructed cannot earn exposure behind its paint masks', (await evidence(page, '#project-ya-rab-ostorha')).quality === building.quality); await page.locator('#project-ya-rab-ostorha').evaluate(el => delete el.dataset.sceneBuilding);
 const pageFocus = await context.newCDPSession(page); await pageFocus.send('Emulation.setFocusEmulationEnabled', {enabled:false}); const other = await context.newPage(); await (await context.newCDPSession(other)).send('Emulation.setFocusEmulationEnabled', {enabled:false}); await other.goto('about:blank'); await other.bringToFront(); const backgroundBefore = await evidence(page, '#project-ya-rab-ostorha'); const hiddenState = await page.evaluate(() => ({ hidden: document.hidden, focused: document.hasFocus() })); await page.waitForTimeout(1700);
 check('An inactive browser tab earns no exposure', (await evidence(page, '#project-ya-rab-ostorha')).quality === backgroundBefore.quality && (hiddenState.hidden || !hiddenState.focused), hiddenState); await other.close(); await pageFocus.send('Emulation.setFocusEmulationEnabled', {enabled:true}); await page.bringToFront();
 await page.getByRole('button', { name: /Zoom in on YA RAB/ }).click(); const dialogStart = await evidence(page, '#project-ya-rab-ostorha'), othersBefore = await records(page); await page.waitForTimeout(1400); const dialogEnd = await evidence(page, '#project-ya-rab-ostorha');
 check('Image inspection only adds its bounded optional action, never instant story completion', dialogEnd.quality - dialogStart.quality <= 5 && !(dialogStart.quality < 90 && dialogEnd.quality === 100), { dialogStart, dialogEnd });
 const ownId = await page.locator('#project-ya-rab-ostorha').getAttribute('data-discovery-id'), othersAfter = await records(page); check('A modal never credits the stories hidden behind it', othersAfter.filter(story => story.id !== ownId).every(story => story.quality === othersBefore.find(old => old.id === story.id)?.quality));
 await page.keyboard.press('Escape');
 const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })); check('The visit adds no localStorage or sessionStorage', storage.local === 0 && storage.session === 0, storage);
 await page.addInitScript(storyCount => {
  const first = new MutationObserver(() => {
   if (window.__qualityReloadInitial) return;
   const stories = [...document.querySelectorAll('[data-discovery-id][data-quality]')];
   if (stories.length === storyCount) { window.__qualityReloadInitial = stories.map(el => ({id:el.dataset.discoveryId,quality:Number(el.dataset.quality)})); first.disconnect(); }
  }); first.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-quality']});
 }, storyCount);
 await page.reload({ waitUntil: 'networkidle' }); await page.locator('#contact').evaluate(el => el.scrollIntoView({behavior:'instant'})); await page.waitForTimeout(350);
 const reloadInitial = await page.evaluate(() => window.__qualityReloadInitial);
 check('Refresh clears session evidence before any new exposure can accrue', reloadInitial?.length === storyCount && reloadInitial.every(story => story.quality === 0), reloadInitial);
 const y = await page.evaluate(() => scrollY); await page.waitForTimeout(1300); check('No mandatory popup, timer redirect or scroll lock is introduced', Math.abs(await page.evaluate(() => scrollY) - y) < 1 && await page.getByRole('dialog').count() === 0 && await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'));
 await page.mouse.wheel(0, -300); await page.waitForTimeout(180); check('Native wheel navigation remains available at an incomplete quality level', Math.abs(await page.evaluate(() => scrollY) - y) > 150);
 await page.screenshot({ path: out + '/mobile-circle.png' }); check('The mobile page retains its viewport width', await page.evaluate(() => document.documentElement.scrollWidth === innerWidth)); await context.close();
 const sourceCase = await fresh(), sp = sourceCase.page;
 await move(sp, '#project-hivo', 0); await sp.locator('#project-hivo .project-copy p').evaluate(el => el.style.opacity = '0');
 await sp.mouse.move(150, 320); await sp.waitForTimeout(500); const unexposed = await evidence(sp, '#project-hivo');
 check('Mouse movement over a title cannot credit unavailable details', unexposed.quality === 0);
 const [popup] = await Promise.all([sourceCase.context.waitForEvent('page'), sp.locator('#project-hivo .project-actions a').click()]);
 const sourceClick = await evidence(sp, '#project-hivo');
 check('A genuine source-link activation without visible exposure gives no instant credit', sourceClick.quality === 0, sourceClick);
 await popup.close(); await sourceCase.context.close();
 const desktop = await fresh(false); await gauge(desktop.page).click(); check('Desktop retains the compact numeric count and Instagram invitation without a story menu', await desktop.page.locator('.score-popup-count').innerText().then(compactCount) && await desktop.page.locator('.score-popup-message').getAttribute('href') === 'https://www.instagram.com/abdoabozena1/' && await desktop.page.locator('[data-exploration-map] details,[data-exploration-map] ul,.exploration-routes').count() === 0); await desktop.page.screenshot({ path: out + '/desktop-quality-panel.png' }); await desktop.context.close();
 await verifyCompanies();
 if (reminders) {
  const run = await fresh(), p = run.page, appearances = [];
  const pass = async selector => { await move(p, selector, 40); await p.mouse.wheel(0, 1600); await p.waitForTimeout(1450); };
  await pass('[data-attention-id="experience-microsoft"]');
  const first = p.locator('.quick-pass-cue'); check('A curated quick pass offers a small optional reminder after idle', await first.count() === 1); if (await first.count()) { appearances.push(await first.innerText()); check('The reminder retains its curved shape', await first.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 24)); await p.screenshot({ path: out + '/optional-curved-reminder.png' }); }
  await pass('[data-attention-id="education-harbin"]'); await p.waitForTimeout(8000); check('A second queued reminder waits for the20-second cooldown', await p.locator('.quick-pass-cue').count() === 0); await p.waitForTimeout(12000); if (await p.locator('.quick-pass-cue').count()) appearances.push(await p.locator('.quick-pass-cue').innerText());
  await pass('[data-attention-id="honors-impact"]'); await p.waitForTimeout(20500); if (await p.locator('.quick-pass-cue').count()) appearances.push(await p.locator('.quick-pass-cue').innerText());
  await pass('#project-hivo'); await p.waitForTimeout(20500); check('Automatic reminders are capped at three appearances for this visit', appearances.length === 3 && await p.locator('.quick-pass-cue').count() === 0, appearances);
  await run.context.close();
  const dismiss = await fresh(), dp = dismiss.page; await move(dp, '[data-attention-id="experience-microsoft"]', 40); await dp.mouse.wheel(0, 1600); await dp.waitForTimeout(1450);
  check('A reminder can be explicitly dismissed', await dp.getByRole('button', {name:'Dismiss highlight reminder'}).count() === 1); if (await dp.locator('.quick-pass-cue').count()) await dp.getByRole('button', {name:'Dismiss highlight reminder'}).click();
  await move(dp, '[data-attention-id="education-harbin"]', 40); await dp.mouse.wheel(0,1600); await dp.waitForTimeout(21500); check('Dismissal suppresses automatic reminders for the rest of the visit', await dp.locator('.quick-pass-cue').count() === 0);
  await dismiss.context.close();
 }
 }
 check('The real exploration journeys have no runtime errors', report.errors.length === 0, report.errors);
 report.sourceAfter = await source(); check('Source stayed coherent through the native verification', report.sourceBefore === report.sourceAfter);
 if (negative) check('The known broken mean was actually injected into the isolated browser response', report.faultApplied);
 report.passed = report.checks.every(item => item.passed);
} catch (error) { report.failure = error.stack; console.error(error); }
finally { await browser.close(); await writeFile(out + '/report.json', JSON.stringify(report, null, 2)); if (!report.passed) process.exitCode = 1; console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failure: report.failure, faultApplied: report.faultApplied })); }
