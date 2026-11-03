import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const negative = process.argv.includes('--negative-control'), reminders = process.argv.includes('--reminder-budget'), companyOnly = process.argv.includes('--company-only');
const out = `output/playwright/quality${negative ? '-negative' : ''}${reminders ? '-reminders' : ''}${companyOnly ? '-company' : ''}`;
await mkdir(out, { recursive: true });
async function source() { const files = []; async function walk(dir) { for (const item of await readdir(dir, { withFileTypes: true })) { const p = dir + '/' + item.name; if (item.isDirectory()) await walk(p); else files.push(p); } } await walk('src'); const h = createHash('sha256'); for (const file of files.sort()) { h.update(file); h.update(await readFile(file)); } return h.digest('hex'); }
const report = { url, sourceBefore: await source(), mode: 'native browser / real application / headless Edge', negative, faultApplied: false, checks: [], observations: [], errors: [], passed: false };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const gauge = page => page.getByRole('button', { name: /Current score: .*Open score details/ });
const score = page => page.locator('.exploration-trigger strong').textContent().then(value => parseFloat(value));
const evidence = (page, selector) => page.locator(selector).evaluate(el => ({ quality: Number(el.dataset.quality), coverage: Number(el.dataset.qualityCoverage), encountered: el.dataset.qualityEncountered === 'true', confidence: el.dataset.qualityConfidence }));
const records = page => page.locator('[data-discovery-id]').evaluateAll(es => es.map(el => ({ id: el.dataset.discoveryId, quality: Number(el.dataset.quality), coverage: Number(el.dataset.qualityCoverage), encountered: el.dataset.qualityEncountered === 'true' })));
const move = async (page, selector, wait = 450) => { await page.locator(selector).evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 120, behavior: 'instant' })); if (wait) await page.waitForTimeout(wait); };
const fresh = async (mobile = true) => {
 const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
 if (negative) await context.route('**/src/lib/discoveryScore.ts*', async route => { const response = await route.fetch(), original = await response.text(); const altered = original.replace(/return Math\.round\([^\n;]+\)\s*\/\s*10;/, 'return Math.round(1000 * earned / (encountered.length + 2)) / 10;'); report.faultApplied ||= altered !== original; await route.fulfill({ response, body: altered }); });
 const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message)); await page.goto(url + '#contact', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); await page.bringToFront();
 // Observe only the genuine rendered score, independently of the component's
 // visit-local maximum. This does not inject evidence or alter its calculation.
 await page.evaluate(() => { const value = document.querySelector('.exploration-trigger strong'); const sample = () => { window.__observedScoreMaximum = Math.max(window.__observedScoreMaximum || 0, parseFloat(value.textContent) || 0); }; sample(); new MutationObserver(sample).observe(value, { childList: true, characterData: true, subtree: true }); });
 return { context, page };
};

async function verifyCompanies() {
 const run = await fresh(false), p = run.page, selector = '[data-attention-id="experience-microsoft"]';
 await move(p, selector, 0);
 await p.locator(selector + ' [data-scan-detail]').evaluateAll(es => es.forEach(el => el.inert = true));
 const inspect = () => p.locator(selector).evaluate(el => {
  const logo = el.querySelector('.company-logo'), image = logo.querySelector('img'), ring = logo.querySelector('.company-evidence'), progress = ring.querySelector('.company-evidence-progress'), mark = ring.querySelector('.company-evidence-finish');
  const r = logo.getBoundingClientRect(), q = ring.getBoundingClientRect(), a = image.getBoundingClientRect(), copy = el.querySelector('.experience-company');
  return { quality:Number(el.dataset.quality), credit:Number(el.style.getPropertyValue('--exploration-evidence')), complete:el.dataset.explorationComplete, offset:Number(getComputedStyle(progress).strokeDashoffset.match(/-?[0-9.]+/)?.[0]), opacity:Number(getComputedStyle(image).opacity), filter:getComputedStyle(image).filter, mark:Number(getComputedStyle(mark).opacity), rect:[r.x,r.y,r.width,r.height], ring:[q.x,q.y,q.width,q.height], image:{x:a.x+scrollX,y:a.y+scrollY,width:a.width,height:a.height}, bodyColor:getComputedStyle(copy).color, bodyOpacity:getComputedStyle(copy).opacity };
 });
 const pending = await inspect(); await p.waitForTimeout(900); const unavailable = await inspect();
 check('The square company loader cannot advance while details are unavailable', unavailable.credit === pending.credit && unavailable.mark === 0, {pending,unavailable});
 check('Pending logos stay muted while company text retains full contrast', unavailable.opacity < 1 && /grayscale\([^)]+\)/.test(unavailable.filter) && unavailable.bodyOpacity === '1');
 check('The decorative company loader exactly occupies the original40px square', unavailable.rect.every((n,i)=>Math.abs(n-unavailable.ring[i])<.1) && unavailable.rect[2]===40 && unavailable.rect[3]===40, unavailable);
 await p.screenshot({path:out+'/company-pending.png'});
 await p.locator(selector + ' [data-scan-detail]').evaluateAll(es => es.forEach(el => el.inert = false)); await p.waitForTimeout(1100); const partial = await inspect();
 check('Qualified exposure progressively traces the square and restores logo color', partial.credit > unavailable.credit && partial.offset < unavailable.offset && partial.opacity > unavailable.opacity, {unavailable,partial});
 check('Partial evidence does not display a completion reward', partial.credit >= .995 || partial.mark === 0, partial);
 await p.screenshot({path:out+'/company-partial.png'}); await p.waitForTimeout(2500); const complete = await inspect();
 check('Full qualified exposure finishes the loader and its small completion mark', complete.credit === 1 && complete.offset === 0 && complete.opacity === 1 && complete.filter === 'grayscale(0)' && complete.mark === 1, complete);
 check('Evidence feedback never dims or changes the company-name text', complete.bodyColor === pending.bodyColor && complete.bodyOpacity === pending.bodyOpacity);
 await p.screenshot({path:out+'/company-complete.png'});
 await p.mouse.wheel(0,1400); await p.waitForTimeout(100); const afterFast = await inspect(); await p.mouse.wheel(0,-1400); await p.waitForTimeout(450); const afterReverse = await inspect();
 check('Fast and reverse scrolling retain the earned square and completed color', afterFast.credit === 1 && afterReverse.credit === 1 && afterReverse.offset === 0 && afterReverse.mark === 1, {afterFast,afterReverse});
 check('All company feedback is decorative and excluded from construction inventory', await p.locator('.company-evidence').evaluateAll(es=>es.length===8&&es.every(el=>el.hasAttribute('data-construction-skip')&&el.getAttribute('aria-hidden')==='true'&&el.getAttribute('focusable')==='false'&&getComputedStyle(el).pointerEvents==='none'&&!el.hasAttribute('data-scene-surface'))));
 check('Small completion motifs vary across the company list', await p.locator('.company-evidence-finish').evaluateAll(es=>new Set(es.map(el=>el.dataset.evidenceVariant)).size===3));
 const baseline = JSON.parse(await readFile('output/playwright/scenes-before/report.json','utf8'));
 for(const [name,width,height] of [['desktop',1440,900],['laptop',1366,768],['tablet',768,1024],['mobile',390,844]]) {
  await p.setViewportSize({width,height}); await move(p,selector,200);
  const now = await inspect(), original = baseline.viewports[name].elements.find(el=>el.section==='experience'&&el.tag==='img');
  const aboutHeight = await p.locator('#about').evaluate(el=>el.getBoundingClientRect().height);
  const aboutDelta = aboutHeight - baseline.viewports[name].sections.find(s=>s.key==='about').rect.height;
  const expected = {...original.rect,y:original.rect.y+aboutDelta};
  check(`${name}: company logo image retains its accepted document geometry`, ['x','y','width','height'].every(key=>Math.abs(now.image[key]-expected[key])<=1), {original:original.rect,authorizedAboutHeightDelta:aboutDelta,expected,current:now.image});
 }
 await run.context.close();
}

try {
 if (companyOnly) { await verifyCompanies(); } else {
 const { context, page } = await fresh();
 check('Fresh visit starts with no invented quality evidence', await score(page) === 0);
 check('Every actual story is registered, retaining the accepted33-story population', await page.locator('[data-discovery-id]').count() === 33);
 check('The primary control remains a real circle', await gauge(page).evaluate(el => { const r = el.getBoundingClientRect(); return Math.abs(r.width - r.height) < .1 && parseFloat(getComputedStyle(el).borderRadius) >= r.width / 2; }));
 await move(page, '#project-hivo'); const start = await evidence(page, '#project-hivo'); await page.waitForTimeout(1300); const partial = await evidence(page, '#project-hivo');
 check('Expanded visible text and decoded media earn gradual evidence', partial.quality > start.quality && partial.quality < 100, { start, partial });
 const sample = await records(page), encountered = sample.filter(story => story.encountered), expected = encountered.reduce((sum, story) => sum + story.quality, 0) / encountered.length;
 check('Visible quality is the independent mean of encountered evidence, without gap debt', Math.abs(await score(page) - expected) < .6, { shown: await score(page), expected, encountered: encountered.length });
 check('A direct jump did not invent encounters with intermediate career and education stories', !sample.find(story => story.id === 'experience-microsoft').encountered && !sample.find(story => story.id === 'education-harbin').encountered);
 await page.waitForTimeout(3800); const earned = await score(page), preserved = await evidence(page, '#project-hivo'); await page.mouse.wheel(0, 1400); await page.waitForTimeout(90); const skipped = await score(page);
 check('Encountering new quickly passed stories lowers the quality average', skipped < earned, { earned, skipped });
 check('Fast scrolling retains already earned evidence', (await evidence(page, '#project-hivo')).quality === preserved.quality);
 await move(page, '#project-harrtest'); const beforeReturn = await evidence(page, '#project-harrtest'); await page.waitForTimeout(3500); const afterReturn = await evidence(page, '#project-harrtest');
 check('A visible expanded revisit strengthens its own story evidence', afterReturn.quality > beforeReturn.quality, { beforeReturn, afterReturn });
 await gauge(page).click();
 check('The optional panel retains its curved side corners', await page.locator('[data-exploration-map]').evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 20));
 check('The compact popup keeps the genuine count as plain numbers separate from the current percentage', await page.locator('.score-popup-count').innerText().then(text => /^\d+ \/ 33$/.test(text)) && Math.abs(parseFloat(await page.locator('.score-popup-current').innerText()) - await score(page)) < .1);
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
 check('Restoring genuinely expanded content resumes exposure', (await evidence(page, '#project-ya-rab-ostorha')).quality > collapsed.quality);
 await page.locator('#project-ya-rab-ostorha').evaluate(el => el.dataset.sceneBuilding = 'true'); const building = await evidence(page, '#project-ya-rab-ostorha'); await page.waitForTimeout(1400);
 check('A scene still being constructed cannot earn exposure behind its paint masks', (await evidence(page, '#project-ya-rab-ostorha')).quality === building.quality); await page.locator('#project-ya-rab-ostorha').evaluate(el => delete el.dataset.sceneBuilding);
 const pageFocus = await context.newCDPSession(page); await pageFocus.send('Emulation.setFocusEmulationEnabled', {enabled:false}); const other = await context.newPage(); await (await context.newCDPSession(other)).send('Emulation.setFocusEmulationEnabled', {enabled:false}); await other.goto('about:blank'); await other.bringToFront(); const backgroundBefore = await evidence(page, '#project-ya-rab-ostorha'); const hiddenState = await page.evaluate(() => ({ hidden: document.hidden, focused: document.hasFocus() })); await page.waitForTimeout(1700);
 check('An inactive browser tab earns no exposure', (await evidence(page, '#project-ya-rab-ostorha')).quality === backgroundBefore.quality && (hiddenState.hidden || !hiddenState.focused), hiddenState); await other.close(); await pageFocus.send('Emulation.setFocusEmulationEnabled', {enabled:true}); await page.bringToFront();
 await page.getByRole('button', { name: /Zoom in on YA RAB/ }).click(); const dialogStart = await evidence(page, '#project-ya-rab-ostorha'), othersBefore = await records(page); await page.waitForTimeout(1400); const dialogEnd = await evidence(page, '#project-ya-rab-ostorha');
 check('Image inspection only adds its bounded optional action, never instant story completion', dialogEnd.quality - dialogStart.quality <= 5 && !(dialogStart.quality < 90 && dialogEnd.quality === 100), { dialogStart, dialogEnd });
 const ownId = await page.locator('#project-ya-rab-ostorha').getAttribute('data-discovery-id'), othersAfter = await records(page); check('A modal never credits the stories hidden behind it', othersAfter.filter(story => story.id !== ownId).every(story => story.quality === othersBefore.find(old => old.id === story.id)?.quality));
 await page.keyboard.press('Escape');
 const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })); check('The visit adds no localStorage or sessionStorage', storage.local === 0 && storage.session === 0, storage);
 await page.addInitScript(() => {
  const first = new MutationObserver(() => {
   if (window.__qualityReloadInitial) return;
   const stories = [...document.querySelectorAll('[data-discovery-id][data-quality]')];
   if (stories.length === 33) { window.__qualityReloadInitial = stories.map(el => ({id:el.dataset.discoveryId,quality:Number(el.dataset.quality)})); first.disconnect(); }
  }); first.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-quality']});
 });
 await page.reload({ waitUntil: 'networkidle' }); await page.locator('#contact').evaluate(el => el.scrollIntoView({behavior:'instant'})); await page.waitForTimeout(350);
 const reloadInitial = await page.evaluate(() => window.__qualityReloadInitial);
 check('Refresh clears session evidence before any new exposure can accrue', reloadInitial?.length === 33 && reloadInitial.every(story => story.quality === 0), reloadInitial);
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
 const desktop = await fresh(false); await gauge(desktop.page).click(); check('Desktop retains the compact numeric count and Instagram invitation without a story menu', await desktop.page.locator('.score-popup-count').innerText().then(text => /^\d+ \/ 33$/.test(text)) && await desktop.page.locator('.score-popup-message').getAttribute('href') === 'https://www.instagram.com/abdoabozena1/' && await desktop.page.locator('[data-exploration-map] details,[data-exploration-map] ul,.exploration-routes').count() === 0); await desktop.page.screenshot({ path: out + '/desktop-quality-panel.png' }); await desktop.context.close();
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
