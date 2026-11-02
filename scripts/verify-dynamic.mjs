import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = 'output/playwright/dynamic'; await mkdir(out, { recursive: true });
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
async function fingerprint() { const files = []; async function walk(dir) { for (const f of await readdir(dir, { withFileTypes: true })) { const p = dir + '/' + f.name; if (f.isDirectory()) await walk(p); else files.push(p); } } await walk('src'); const hash = createHash('sha256'); for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); } return hash.digest('hex'); }
const report = { url, sourceBefore: await fingerprint(), checks: [], diagnostics: [], errors: [], passed: false };
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, passed: true }); console.log(name); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const wheel = async (p, n = 10, dy = 80, delay = 65) => { for (let i = 0; i < n; i++) { await p.mouse.wheel(0, dy); await p.waitForTimeout(delay); } };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } });
  await context.route('https://lnkd.in/**', route => route.fulfill({ contentType: 'text/html', body: 'External story destination intercepted for the click test.' }));
  const p = await context.newPage(); p.on('pageerror', e => report.errors.push(e.message));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(250);
  const before = await p.locator('#hero h1').evaluate(el => ({ text: el.textContent, rect: el.getBoundingClientRect().toJSON() }));
  const firstLetters = await p.locator('[data-name-assembly]').innerHTML();
  await p.waitForTimeout(400);
  check('Name is assembled as measured word blocks with real editing guides', await p.locator('[data-name-piece]').count() === 4 && await p.locator('[data-name-frame]').count() === 3 && await p.locator('[data-name-assembly]').innerHTML() !== firstLetters);
  check('The real accessible name is unchanged while its letters move', await p.locator('#hero h1').textContent() === before.text);
  const role = await p.locator('#hero .mt-6.h-8').textContent();
  await p.waitForFunction(() => +document.querySelector('[data-name-assembly]').dataset.nameProgress > .94 && document.querySelector('#hero h1').hasAttribute('data-building'), null, { timeout: 9000 });
  const alignment = await p.evaluate(() => {
    const ranges = [], walker = document.createTreeWalker(document.querySelector('#hero h1'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const n=walker.currentNode, text=n.textContent, from=text.search(/\S/); if(from<0)continue; const end=text.trimEnd().length, dot=text[end-1]==='.'; const r=document.createRange();r.setStart(n,from);r.setEnd(n,dot?end-1:end);ranges.push(r.getBoundingClientRect());if(dot){const d=document.createRange();d.setStart(n,end-1);d.setEnd(n,end);ranges.push(d.getBoundingClientRect());} }
    return ['first','surname','period'].map((kind,i) => { const el=document.querySelector(`[data-name-piece="${kind}"]`),r=document.createRange();r.selectNodeContents(el);const box=r.getBoundingClientRect();return{dx:box.left-ranges[i].left,dy:box.top-ranges[i].top}; });
  });
  report.diagnostics.push({ nameWordAlignment: alignment });
  check('Every word and period matches its native text Range before handoff', alignment.length===3 && alignment.every(g=>Math.abs(g.dx)<.2&&Math.abs(g.dy)<.2));
  await p.screenshot({ path: `${out}/name-landed.png` });
  await p.waitForFunction(() => !document.querySelector('#hero [data-building]'), null, { timeout: 9000 });
  check('Name handoff removes glyph props and displays the real heading once', await p.locator('[data-name-assembly]').evaluate(el => +el.style.opacity === 0) && await p.locator('#hero h1').evaluate(el => getComputedStyle(el).clipPath === 'none'));
  check('No competing role typewriter keeps modifying the hero', await p.locator('#hero .mt-6.h-8').textContent() === role);
  const after = await p.locator('#hero h1').evaluate(el => el.getBoundingClientRect().toJSON());
  check('Name assembly does not change its real layout rectangle', JSON.stringify(before.rect) === JSON.stringify(after));
  await p.screenshot({ path: `${out}/name-finished.png` });
  check('Requested section order is explicit in the actual document', await p.locator('[data-construction-section]').evaluateAll(es => es.map(el => el.id || 'finale').join('|')) === 'hero|about|experience|education|honors|projects|skills|contact|finale');
  check('Education contains only ECU and HIT', await p.locator('#education [data-certificate]').count() === 2 && (await p.locator('#education').innerText()).includes('Harbin Institute'));
  check('IMPACT is the first of six honors/certification entries', await p.locator('#honors [data-certificate]').count() === 6 && (await p.locator('#honors [data-certificate] h3').first().innerText()).includes('IMPACT'));

  // A fresh unbuilt employer logo tests the exact inner-image frame at full scale.
  const assetPage = await context.newPage(); assetPage.on('pageerror', e => report.errors.push(e.message));
  await assetPage.goto(url, { waitUntil: 'networkidle' }); await assetPage.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await assetPage.locator('#experience .company-logo').first().evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight - 30));
  await assetPage.waitForTimeout(250); await wheel(assetPage, 22, 12, 60);
  await assetPage.waitForFunction(() => [...document.querySelectorAll('[data-prop]')].some(el => el.dataset.target === 'Microsoft logo' && el.dataset.phase === 'align' && +el.style.opacity > .9), null, { timeout: 4000 });
  const asset = await assetPage.evaluate(() => {
    const prop = [...document.querySelectorAll('[data-prop]')].find(el => el.dataset.target === 'Microsoft logo' && +el.style.opacity > .9);
    const ghost = prop.querySelector('.prop-image').getBoundingClientRect(), real = document.querySelector('#experience .company-logo img').getBoundingClientRect();
    return { ghost: ghost.toJSON(), real: real.toJSON(), clip: getComputedStyle(document.querySelector('#experience .company-logo')).clipPath };
  });
  report.diagnostics.push({ assetHandoff: asset });
  check('Settled logo prop uses the exact padded inner image bounds', ['x', 'y', 'width', 'height'].every(k => Math.abs(asset.ghost[k] - asset.real[k]) < .2));
  check('Real image stays hidden until the fully aligned prop is committed', asset.clip.includes('100%'));
  await assetPage.waitForFunction(() => !document.querySelector('#experience .company-logo').hasAttribute('data-building'));
  check('Atomic logo handoff exposes the original full-size image', await assetPage.locator('#experience .company-logo').first().evaluate(el => getComputedStyle(el).clipPath === 'none'));
  await assetPage.locator('#experience').evaluate(el => el.scrollIntoView()); await wheel(assetPage);
  check('Regrouping the current section does not silently complete every future project', await assetPage.locator('#projects [data-building]').count() > 0);
  await assetPage.close();

  const activity = p.locator('[data-construction-scene="activity"]');
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await activity.evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight - 30)); await p.waitForTimeout(250);
  await p.waitForFunction(() => document.querySelector('[data-construction-scene="activity"]').dataset.activityReady === 'true');
  const dates = await activity.locator('rect[data-date]').evaluateAll(es => es.map(el => [el.dataset.date, el.dataset.level]));
  let batched = false, saved = false;
  for (let i = 0; i < 24; i++) { await p.mouse.wheel(0, 12); await p.waitForTimeout(50); batched ||= await activity.locator('g').evaluateAll(es => es.some(el => Number(el.style.opacity) > 0 && Number(el.style.opacity) < 1) && es.some(el => el.style.opacity === '0')); if (batched && !saved) { await p.screenshot({ path: `${out}/activity-building.png` }); saved = true; } }
  check('Agents construct genuine contribution weeks progressively', batched);
  await p.waitForFunction(() => !document.querySelector('[data-construction-scene="activity"]').hasAttribute('data-building'));
  check('Activity construction preserves every real date and intensity', JSON.stringify(await activity.locator('rect[data-date]').evaluateAll(es => es.map(el => [el.dataset.date, el.dataset.level]))) === JSON.stringify(dates));
  check('Contribution cells use the supplied five-color palette', await activity.locator('rect[data-date]').evaluateAll(es => es.length > 350 && es.every(el => ['#faecb6','#93d3ae','#2bbaa5','#f9a822','#f96635'].includes(el.getAttribute('fill').toLowerCase()))));
  await p.screenshot({ path: `${out}/activity-palette.png` });
  const footer = p.locator('[data-construction-section]').last(); await footer.evaluate(el => el.scrollIntoView()); await p.waitForTimeout(100);
  await footer.locator('a').first().hover(); await p.waitForTimeout(350);
  check('Final social links use palette hover colors with readable dark icons', await footer.locator('a').first().evaluate(el => getComputedStyle(el).backgroundColor === 'rgb(43, 186, 165)' && getComputedStyle(el.querySelector('svg')).color === 'rgb(17, 25, 32)'));
  for (const [i, expected] of ['rgb(43, 186, 165)','rgb(147, 211, 174)','rgb(250, 236, 182)','rgb(249, 168, 34)'].entries()) { const link = footer.locator('a').nth(i); await link.hover(); await p.waitForTimeout(350); check(`Footer social link ${i + 1} uses its own supplied accent`, await link.evaluate((el, expected) => getComputedStyle(el).backgroundColor === expected && getComputedStyle(el.querySelector('svg')).color === 'rgb(17, 25, 32)', expected)); }
  await p.screenshot({ path: `${out}/footer-palette-hover.png` });
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150);
  check('Desktop story bubble remains visible after the initial teaser period', await p.locator('#microsoft-story-tip a').isVisible());
  const desktopPopupPromise = p.waitForEvent('popup'); await p.locator('#microsoft-story-tip a').click(); const desktopPopup = await desktopPopupPromise; await desktopPopup.waitForLoadState();
  check('Clicking the desktop bubble itself opens the story after the intro', desktopPopup.url() === 'https://lnkd.in/p/e-7HV-sM'); await desktopPopup.close();
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await mobile.route('https://lnkd.in/**', route => route.fulfill({ contentType: 'text/html', body: 'Test intercepted external story destination; no LinkedIn data mocked.' }));
  const m = await mobile.newPage(); m.on('pageerror', e => report.errors.push(e.message)); await m.goto(url, { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(550);
  check('Touch keeps a visible team of at most three construction pointers', await m.locator('[data-agent]').evaluateAll(es => { const n = es.filter(el => +getComputedStyle(el).opacity > 0).length; return n > 0 && n <= 3; }));
  await m.locator('#microsoft-story-tip a').waitFor({ state: 'visible' });
  check('The story bubble is itself the actual hit-tested link', await m.locator('#microsoft-story-tip a').evaluate(el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('a') === el; }));
  const popupPromise = m.waitForEvent('popup'); await m.locator('#microsoft-story-tip a').tap(); const popup = await popupPromise; await popup.waitForLoadState();
  check('Tapping the visible story bubble opens the supplied post URL', popup.url() === 'https://lnkd.in/p/e-7HV-sM'); await popup.close();
  await mobile.close();
  check('Dynamic behavior has no runtime errors', report.errors.length === 0);
  report.sourceAfter = await fingerprint(); check('Final dynamic journey is bound to unchanged source', report.sourceAfter === report.sourceBefore); report.passed = true;
} catch (error) { report.failure = error.stack; throw error; }
finally { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failure: report.failure, source: report.sourceBefore })); }
