import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const negative = process.argv.includes('--negative-control');
const out = `output/playwright/dynamic-layout${negative ? '-negative' : ''}`; await mkdir(out, { recursive: true });
const baseline = JSON.parse(await readFile('output/playwright/adaptive-before/report.json', 'utf8'));
const current = JSON.parse(await readFile('output/playwright/dynamic-after/report.json', 'utf8'));
if (negative) current.viewports.desktop.elements.find(el => el.section === 'projects' && el.tag === 'img').rect.width += 10;
const report = { baseline: baseline.sourceBefore, sourceBefore: current.sourceBefore, checks: [], pixels: [], authorizedChanges: ['Experience before Education/Honors, IMPACT first; split credentials and compact company hierarchy', 'Measured name assembly and static role', 'Palette heatmap and footer hovers', 'Honors nav link; tablet uses existing Menu to keep links reachable', 'Temporary anchored compact views in all five groups'], passed: false };
const check = (name, value) => { assert.ok(value, name); report.checks.push(name); };
const close = (a, b) => Math.abs(a - b) < .1;
async function fingerprint(){const files=[];async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())await walk(p);else files.push(p)}}await walk('src');const hash=createHash('sha256');for(const f of files.sort()){hash.update(f);hash.update(await readFile(f));}return hash.digest('hex');}
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  check('All capture receipts are coherent', baseline.sourceBefore === baseline.sourceAfter && current.sourceBefore === current.sourceAfter);
  check('Current source matches captured final natural layout', await fingerprint() === current.sourceAfter);
  for (const name of Object.keys(baseline.viewports)) {
    const a = baseline.viewports[name], b = current.viewports[name];
    check(`${name} no horizontal overflow`, b.scrollWidth === b.innerWidth);
    check(`${name} explicit requested section order`, b.sections.map(s => s.key).join('|') === 'hero|about|experience|education|honors|projects|skills|contact|finale');
    check(`${name} all real local images decoded`, b.loadedImages.every(i => i.complete && i.width > 0));
    check(`${name} no runtime errors or failed requests`, !b.pageErrors.length && !b.failedRequests.length);
    for (let i = 0; i < a.heroSlots.length; i++) for (const key of ['x','y','width','height']) check(`${name} protected hero slot ${i} ${key}`, close(a.heroSlots[i].rect[key], b.heroSlots[i].rect[key]));
    const projectRoots = [...new Set(b.elements.filter(e => e.section === 'projects').map(e => e.selector.match(/^#project-[a-z0-9-]+/)?.[0]).filter(Boolean))];
    const oldFinale = a.sections.find(s => s.key === 'finale'), newFinale = b.sections.find(s => s.key === 'finale');
    for (const key of ['hero','about','projects','skills','contact','finale']) {
      const before = a.sections.find(s => s.key === key), after = b.sections.find(s => s.key === key);
      check(`${name} ${key} original section width and height`, close(before.rect.width, after.rect.width) && close(before.rect.height, after.rect.height) && close(before.rect.x, after.rect.x));
    }
    for (const old of a.elements.filter(e => ['about','projects','skills','contact','finale'].includes(e.section) && e.tag !== 'nav' && e.rect.width > 1 && e.rect.height > 1)) {
      let selector = old.selector.replace(/^#projects > div:nth-of-type\(1\) > div:nth-of-type\((\d+)\)/, (_, index) => projectRoots[Number(index) - 1]);
      if (selector.startsWith(oldFinale.selector)) selector = newFinale.selector + selector.slice(oldFinale.selector.length);
      const now = b.elements.find(e => e.selector === selector);
      check(`${name} ${old.selector} still exists`, !!now);
      const beforeSection = a.sections.find(s => s.key === old.section), afterSection = b.sections.find(s => s.key === old.section);
      check(`${name} ${old.selector} original geometry`, ['x','width','height'].every(k => close(old.rect[k], now.rect[k])) && close(old.rect.y - beforeSection.rect.y, now.rect.y - afterSection.rect.y));
      const text = old.section === 'skills' ? now.text.replace(/\d+ skills ↗/g, '').trim() : now.text;
      check(`${name} ${old.selector} original content, typography and spacing`, old.text === text && JSON.stringify(old.font) === JSON.stringify(now.font) && old.padding === now.padding && old.margin === now.margin && old.display === now.display);
    }
    const context = await browser.newContext({ viewport: a.viewport, reducedMotion: 'reduce' }), page = await context.newPage();
    await page.goto('http://127.0.0.1:8080/Clean_Portofoio/', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}canvas,.curzr-arrow-pointer,[data-agent-layer]{visibility:hidden!important}' });
    for (let y = 0; y < b.scrollHeight; y += 650) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(85); }
    await page.evaluate(() => Promise.race([Promise.all([...document.images].filter(i => !i.closest('[data-agent-layer]')).map(i => i.decode())), new Promise((_, reject) => setTimeout(() => reject(Error('Real images failed to decode')), 10000))]));
    // Screenshot-only alignment AFTER actual natural geometry assertions: collapse
    // the three explicitly changed/reordered sections into one invisible spacer
    // of their OLD combined height. Protected sections then rasterize at original Y.
    const oldHeight = a.sections.filter(s => ['experience','education'].includes(s.key)).reduce((sum, s) => sum + s.rect.height, 0);
    await page.evaluate(height => {
      for (const id of ['education','honors']) document.getElementById(id).style.display = 'none';
      const section = document.getElementById('experience'); section.style.height = `${height}px`; section.style.visibility = 'hidden'; section.style.overflow = 'hidden';
      scrollTo(0, 0);
    }, oldHeight); await page.waitForTimeout(100);
    const excluded = await page.locator('.animate-marquee,.animate-marquee-reverse,[data-construction-scene="activity"]').evaluateAll(es => es.map(el => { const r = (el.classList.contains('animate-marquee') ? el.parentElement : el).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY }; }));
    const screenshot = `${out}/${name}-aligned.png`; await page.screenshot({ path: screenshot, fullPage: true }); await context.close();
    for (const key of ['name','about','projects','skills','contact','finale']) {
      const r = key === 'name' ? a.heroSlots[1].rect : a.sections.find(s => s.key === key).rect, region = { left: Math.floor(r.x), top: Math.floor(r.y), width: Math.floor(r.width), height: Math.floor(r.height) };
      const first = await sharp(`output/playwright/adaptive-before/${name}/full-page.png`).extract(region).ensureAlpha().raw().toBuffer(), second = await sharp(screenshot).extract(region).ensureAlpha().raw().toBuffer();
      const diff = Buffer.alloc(first.length); let changed = 0;
      for (let i = 0; i < first.length; i += 4) {
        const x = (i / 4) % region.width + region.left, y = Math.floor(i / 4 / region.width) + region.top;
        if (excluded.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)) { second.copy(diff, i, i, i + 4); continue; }
        const different = Math.max(...[0,1,2].map(k => Math.abs(first[i+k] - second[i+k]))) > 12; if (different) changed++;
        diff[i] = different ? 249 : second[i]; diff[i+1] = different ? 102 : second[i+1]; diff[i+2] = different ? 53 : second[i+2]; diff[i+3] = 255;
      }
      const ratio = changed / (region.width * region.height); report.pixels.push({ viewport: name, section: key, changedRatio: ratio });
      check(`${name} ${key} protected final-state pixels below 3%`, ratio < .03);
      await sharp(diff, { raw: { width: region.width, height: region.height, channels: 4 } }).png().toFile(`${out}/${name}-${key}-diff.png`);
    }
    console.log(`${name}: original protected geometry, content and final-state pixels pass`);
  }
  report.sourceAfter = await fingerprint(); check('App source is unchanged during comparison', report.sourceAfter === report.sourceBefore); report.passed = true;
} catch (error) { report.failure = error.stack; throw error; }
finally { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failure: report.failure, pixels: report.pixels })); }
