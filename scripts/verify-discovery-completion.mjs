import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = 'output/playwright/discovery-completion'; await mkdir(out, { recursive: true });
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
async function source() { const files = []; async function walk(dir) { for (const item of await readdir(dir, { withFileTypes: true })) { const p = dir + '/' + item.name; if (item.isDirectory()) await walk(p); else files.push(p); } } await walk('src'); const hash = createHash('sha256'); for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); } return hash.digest('hex'); }
const report = { url, sourceBefore: await source(), mode: 'native mobile browser, reduced motion, actual expanded content', steps: [], checks: [], errors: [], passed: false };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
 const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); page.on('pageerror', error => report.errors.push(error.message));
 await page.goto(url + '#contact', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
 const ids = await page.locator('[data-discovery-id]').evaluateAll(es => es.map(el => el.dataset.discoveryId));
 for (const id of ids) {
  const element = page.locator(`[data-discovery-id="${id}"]`);
  const itinerary = await element.evaluate(el => {
   const heading = el.querySelector('h3,h1') || el.parentElement.querySelector('h3') || el.closest('section').querySelector('h2');
   const a = el.getBoundingClientRect(), b = heading.getBoundingClientRect(), top = scrollY + Math.min(a.top, b.top), bottom = scrollY + Math.max(a.bottom, b.bottom), usable = innerHeight - 200;
   const text = [...el.querySelectorAll('p,h1,h3,.palette-tag')].map(node => (node.textContent || '').trim().split(/\s+/).filter(Boolean).length);
   const dwell = Math.max(2000, ...text.map(words => Math.max(1.2, Math.min(8, words / 4)) * 1000)) + 600;
   const distance = Math.max(0, bottom - top - usable), ys = [];
   for (let offset = 0; offset < distance; offset += usable * .65) ys.push(Math.max(0, top - 110 + offset));
   ys.push(Math.max(0, top - 110 + distance)); return { ys, dwell };
  });
  for (const y of itinerary.ys) { await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(itinerary.dwell); }
  await page.waitForFunction(id => Number(document.querySelector(`[data-discovery-id="${id}"]`).dataset.quality) === 100, id, { timeout: 8000 });
  const evidence = await element.evaluate(el => ({ id: el.dataset.discoveryId, quality: Number(el.dataset.quality), coverage: Number(el.dataset.qualityCoverage), encountered: el.dataset.qualityEncountered === 'true', confidence: el.dataset.qualityConfidence }));
  report.steps.push({ ...evidence, itinerary }); console.log(`${id}: quality=${evidence.quality} coverage=${evidence.coverage}`);
 }
 const shown = parseFloat(await page.locator('.exploration-trigger strong').textContent());
 check('All33 actual stories retain genuine full exposure evidence', ids.length === 33 && report.steps.every(step => step.quality === 100 && step.coverage === 100 && step.encountered), report.steps.filter(step => step.quality !== 100 || step.coverage !== 100));
 check('The quality indicator reaches100 from actual expanded exposure', shown === 100, shown);
 await page.getByRole('button', { name: /Current score: .*Open score details/ }).click();
 check('The completed popup separately reports the genuine plain33 / 33 count', (await page.locator('.score-popup-count').innerText()) === '33 / 33');
 check('Actual full exposure reaches100 current and100 Best score without requiring story-list clicks', parseFloat(await page.locator('.score-popup-current').innerText()) === 100 && parseFloat(await page.locator('.score-popup-best strong').innerText()) === 100 && await page.locator('[data-exploration-map] details,[data-exploration-map] ul,.exploration-routes').count() === 0);
 await page.screenshot({ path: out + '/all-stories-complete.png' }); check('Completion generated no browser errors', report.errors.length === 0, report.errors);
 report.sourceAfter = await source(); check('The complete journey stayed coherent with its source', report.sourceBefore === report.sourceAfter); report.passed = report.checks.every(item => item.passed);
} catch (error) { report.failure = error.stack; console.error(error); }
finally { await browser.close(); await writeFile(out + '/report.json', JSON.stringify(report, null, 2)); if (!report.passed) process.exitCode = 1; console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failure: report.failure })); }
