import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const negative = process.argv.includes('--negative-control');
const out = `output/playwright/cinematic-comparison${negative ? '-negative' : ''}`; await mkdir(out, { recursive: true });
const before = JSON.parse(await readFile('output/playwright/cinematic-before/report.json', 'utf8'));
const after = JSON.parse(await readFile('output/playwright/cinematic-after/report.json', 'utf8'));
if (negative) after.viewports.desktop.elements.find(e => e.section === 'projects' && e.tag === 'img').rect.width += 10;
const report = { baseline: before.sourceBefore, current: after.sourceBefore, checks: [], pixels: [], passed: false, authorizedChanges: ['Education/credential content and compact layout', 'Interactive Microsoft badge: same reserved 34px height; laptop paint offset +23px clears fixed nav'] };
const check = (name, value) => { assert.ok(value, name); report.checks.push(name); };
const close = (a, b) => Math.abs(a - b) < .1;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  check('Before and after captures each use one coherent source', before.sourceBefore === before.sourceAfter && after.sourceBefore === after.sourceAfter);
  for (const name of Object.keys(before.viewports)) {
    const a = before.viewports[name], b = after.viewports[name];
    const delta = b.sections.find(s => s.key === 'education').rect.height - a.sections.find(s => s.key === 'education').rect.height;
    check(`${name} no new horizontal overflow`, b.scrollWidth === b.innerWidth);
    // scrollHeight is integer-rounded while DOMRect preserves fractional pixels.
    check(`${name} document height changes only by authorized credential delta`, Math.abs(b.scrollHeight - a.scrollHeight - delta) < 1);
    check(`${name} section order`, a.sections.map(s => s.key).join() === b.sections.map(s => s.key).join());
    for (const old of a.sections) {
      const current = b.sections.find(s => s.key === old.key);
      if (old.key !== 'education') check(`${name} ${old.key} section dimensions`, close(old.rect.width, current.rect.width) && close(old.rect.height, current.rect.height));
      check(`${name} ${old.key} position changes only by authorized credential delta`, close(old.rect.x, current.rect.x) && close(old.rect.y + (a.sections.indexOf(old) > 2 ? delta : 0), current.rect.y));
    }
    for (const old of a.elements.filter(e => e.tag !== 'nav' && !['hero', 'education'].includes(e.section) && e.rect.width > 1 && e.rect.height > 1)) {
      const current = b.elements.find(e => e.selector === old.selector);
      check(`${name} ${old.selector} still exists`, !!current);
      const sectionA = a.sections.find(s => s.key === old.section), sectionB = b.sections.find(s => s.key === old.section);
      check(`${name} ${old.selector} geometry`, ['x', 'width', 'height'].every(k => close(old.rect[k], current.rect[k])) && close(old.rect.y - sectionA.rect.y, current.rect.y - sectionB.rect.y));
      check(`${name} ${old.selector} text, typography and spacing`, old.text === current.text && JSON.stringify(old.font) === JSON.stringify(current.font) && old.margin === current.margin && old.padding === current.padding && old.display === current.display);
    }
    // AFTER checking the actual natural geometry above, restore only the changed
    // credential section's old height for screenshot comparison. This places all
    // unchanged sections at the exact original document/raster coordinates.
    // Fractional transforms instead create composited image/text interpolation.
    const context = await browser.newContext({ viewport: a.viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8080/Clean_Portofoio/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} canvas,.curzr-arrow-pointer,[data-agent-layer]{visibility:hidden!important}' });
    for (let y = 0; y < b.scrollHeight; y += 650) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(85); }
    await page.evaluate(() => Promise.race([Promise.all([...document.images].filter(i => !i.closest('[data-agent-layer]')).map(i => i.decode())), new Promise((_, reject) => setTimeout(() => reject(Error('Real images did not decode within 10 seconds')), 10000))]));
    await page.evaluate(height => {
      const credentials = document.querySelector('#education');
      credentials.style.height = `${height}px`; credentials.style.overflow = 'hidden';
      scrollTo(0, 0);
    }, a.sections.find(s => s.key === 'education').rect.height);
    await page.waitForTimeout(80);
    // Existing infinite marquees intentionally keep moving; only their moving
    // text strips are excluded from the pixel golden, never static content.
    const movingRegions = await page.locator('.animate-marquee,.animate-marquee-reverse').evaluateAll(es => es.map(el => { const r = el.parentElement.getBoundingClientRect(); return { left: r.left, top: r.top + scrollY, right: r.right, bottom: r.bottom + scrollY }; }));
    const normalized = `${out}/${name}-pixel-normalized.png`; await page.screenshot({ path: normalized, fullPage: true }); await context.close();
    for (const key of ['about', 'experience', 'projects', 'skills', 'contact', 'finale']) {
      const old = a.sections.find(s => s.key === key).rect, current = b.sections.find(s => s.key === key).rect;
      const region = r => ({ left: Math.floor(r.x), top: Math.floor(r.y), width: Math.floor(r.width), height: Math.floor(r.height) });
      const w = Math.floor(old.width), h = Math.floor(old.height);
      const imgA = await sharp(`output/playwright/cinematic-before/${name}/full-page.png`).extract(region(old)).ensureAlpha().raw().toBuffer();
      const imgB = await sharp(normalized).extract(region(old)).ensureAlpha().raw().toBuffer();
      const diff = Buffer.alloc(imgA.length); let changed = 0;
      for (let i = 0; i < imgA.length; i += 4) {
        const x = (i / 4) % w + Math.floor(old.x), y = Math.floor(i / 4 / w) + Math.floor(old.y);
        if (movingRegions.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)) { imgB.copy(diff, i, i, i + 4); continue; }
        const differs = Math.max(...[0, 1, 2].map(k => Math.abs(imgA[i + k] - imgB[i + k]))) > 12;
        if (differs) changed++;
        diff[i] = differs ? 249 : imgB[i]; diff[i + 1] = differs ? 102 : imgB[i + 1]; diff[i + 2] = differs ? 53 : imgB[i + 2]; diff[i + 3] = 255;
      }
      const ratio = changed / (w * h);
      report.pixels.push({ viewport: name, section: key, changedRatio: ratio, screenshotOnlyNormalization: 'Credential section height restored to original AFTER actual geometry checks; original infinite marquee strips excluded' });
      await sharp(diff, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`${out}/${name}-${key}-diff.png`);
      check(`${name} ${key} final-state pixel diff below 3%`, ratio < .03);
    }
    console.log(`${name}: unchanged sections, all recorded elements, project media and screenshot diffs passed`);
  }
  report.passed = true;
} catch (error) { report.failure = error.stack; throw error; }
finally { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failure: report.failure, pixels: report.pixels })); }
