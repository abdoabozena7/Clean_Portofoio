import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const negative = process.argv.includes('--negative-control');
const out = `output/playwright/letter-choreography${negative ? '-negative' : ''}`; await mkdir(out, { recursive: true });
const fingerprint = async () => { const hash = createHash('sha256'); for (const path of ['src/lib/nameConstruction.ts', 'src/hooks/useScrollConstruction.ts', 'scripts/verify-letter-choreography.mjs']) { hash.update(path); hash.update(await readFile(path)); } return hash.digest('hex'); };
const report = { url, sourceBefore: await fingerprint(), checks: [], errors: [], diagnostics: [], passed: false };
const check = (label, value) => { assert.ok(value, label); report.checks.push({ label, passed: true }); console.log(label); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const mobile of [false, true]) {
    const label = mobile ? 'mobile' : 'desktop';
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: mobile, isMobile: mobile, recordVideo: { dir: out } });
    const page = await context.newPage(); page.on('pageerror', e => report.errors.push(e.message));
    await page.addInitScript(() => {
      const samples = []; window.letterSamples = samples;
      let before = null, began = false, stopped = false, alignment = null;
      const record = () => {
        const heading = document.querySelector('#hero h1'), root = document.querySelector('[data-name-assembly]');
        if (heading && root) {
          const rect = heading.getBoundingClientRect(); before ??= { text: heading.textContent, rect: rect.toJSON() };
          const glyphs = [...root.children].map((el, index) => {
            const m = new DOMMatrix(getComputedStyle(el).transform), r = el.getBoundingClientRect();
            return { index, owner: +el.dataset.letterOwner, operation: el.dataset.letterOperation, active: el.dataset.letterActive === 'true', opacity: +el.style.opacity, a: m.a, b: m.b, c: m.c, d: m.d, x: r.x, y: r.y, width: r.width, height: r.height };
          });
          const cursors = [...document.querySelectorAll('[data-agent]')].map((el, index) => { const m = new DOMMatrix(getComputedStyle(el).transform); return { index, letter: +(el.dataset.letter ?? -1), opacity: +el.style.opacity, x: m.e, y: m.f }; });
          if (!alignment && glyphs.length === 19 && glyphs.every(g => g.opacity === 1 && Math.abs(g.a - 1) < .00001 && Math.abs(g.d - 1) < .00001 && Math.abs(g.b) < .00001 && Math.abs(g.c) < .00001)) {
            const ranges = [], walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) { const n = walker.currentNode; for (let i = 0; i < n.textContent.length; i++) { if (!n.textContent[i].trim()) continue; const range = document.createRange(); range.setStart(n, i); range.setEnd(n, i + 1); ranges.push(range.getBoundingClientRect()); } }
            alignment = [...root.children].map((el, i) => { const range = document.createRange(); range.selectNodeContents(el); const r = range.getBoundingClientRect(); return { dx: r.left - ranges[i].left, dy: r.top - ranges[i].top }; });
          }
          if (heading.hasAttribute('data-building') && +root.style.opacity > 0) { began = true; samples.push({ t: performance.now(), glyphs, cursors }); }
          if (began && !heading.hasAttribute('data-building')) {
            window.letterResult = { before, after: { text: heading.textContent, rect: rect.toJSON() }, propOpacity: +root.style.opacity, alignment };
            stopped = true;
          }
        }
        if (!stopped) requestAnimationFrame(record);
      };
      requestAnimationFrame(record);
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await page.reload({ waitUntil: 'domcontentloaded' });
    if (negative) { await page.addStyleTag({ content: '[data-name-assembly] > span { transform:translate3d(100px,200px,0)!important; }' }); await page.evaluate(() => { window.letterSamples.length = 0; }); }
    await page.waitForTimeout(mobile ? 550 : 900); await page.screenshot({ path: `${out}/${label}-manipulation.png` });
    await page.waitForTimeout(mobile ? 400 : 650); await page.screenshot({ path: `${out}/${label}-second-jobs.png` });
    await page.waitForFunction(() => window.letterResult, null, { timeout: 12000 });
    const samples = await page.evaluate(() => window.letterSamples), result = await page.evaluate(() => window.letterResult);
    check(`${label}:19 measured glyphs with all8 distinct operations`, samples.some(s => s.glyphs.length === 19 && new Set(s.glyphs.map(g => g.operation)).size === 8));
    const active = samples.flatMap(s => s.glyphs.filter(g => g.active).map(g => ({ glyph: g, cursor: s.cursors[g.owner], frame: s })));
    check(`${label}:each active glyph has its own visible assigned pointer`, active.length > 100 && active.every(({ glyph, cursor }) => cursor.opacity > 0 && cursor.letter === glyph.index));
    check(`${label}:no pointer owns two active glyphs simultaneously`, samples.every(s => { const owners = s.glyphs.filter(g => g.active).map(g => g.owner); return new Set(owners).size === owners.length; }));
    const ownerIds = [...new Set(active.map(s => s.glyph.owner))];
    check(`${label}:the actual ${mobile ? 3 : 8} pointers visibly travel between glyph positions`, ownerIds.length === (mobile ? 3 : 8) && ownerIds.every(id => { const positions = active.filter(s => s.glyph.owner === id).map(s => s.cursor); return Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x)) > 25 || Math.max(...positions.map(p => p.y)) - Math.min(...positions.map(p => p.y)) > 25; }));
    check(`${label}:operations include substantial growth, shrinkage and rotation`, active.some(s => Math.hypot(s.glyph.a, s.glyph.b) < .4) && active.some(s => Math.hypot(s.glyph.a, s.glyph.b) > 1.4) && active.some(s => Math.abs(Math.atan2(s.glyph.b, s.glyph.a)) > .4));
    const allLanded = samples.filter(s => s.glyphs.every(g => g.opacity === 1 && Math.abs(g.a - 1) < .00001 && Math.abs(g.d - 1) < .00001 && Math.abs(g.b) < .00001 && Math.abs(g.c) < .00001));
    check(`${label}:all letters are fully aligned before one real-heading handoff`, allLanded.length > 2 && result.propOpacity === 0);
    check(`${label}:every final glyph matches its actual DOM character range`, result.alignment?.length === 19 && result.alignment.every(r => Math.abs(r.dx) < .2 && Math.abs(r.dy) < .2));
    report.diagnostics.push({ label, frameCount: samples.length, activeGlyphSamples: active.length, alignedFrames: allLanded.length, owners: ownerIds, result });
    check(`${label}:font-settled accessible heading text and layout are unchanged`, JSON.stringify(result.before) === JSON.stringify(result.after));
    await page.screenshot({ path: `${out}/${label}-finished.png` });
    await writeFile(`${out}/${label}-samples.json`, JSON.stringify(samples));
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  check('Reduced motion displays the original heading immediately without letter manipulation', await page.locator('#hero h1').evaluate(el => !el.hasAttribute('data-building')) && await page.locator('[data-name-assembly]').evaluate(el => +el.style.opacity === 0));
  await context.close();
  check('No native browser runtime errors during letter choreography', report.errors.length === 0);
  report.sourceAfter = await fingerprint(); check('Name implementation and verifier source remain unchanged throughout the probe', report.sourceAfter === report.sourceBefore);
  report.passed = true;
} catch (error) { report.failure = error.stack; throw error; }
finally { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
