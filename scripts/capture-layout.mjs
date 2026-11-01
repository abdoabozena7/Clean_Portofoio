import { createRequire } from 'node:module';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const value = (flag, fallback) => { const i = process.argv.indexOf(flag); return i < 0 ? fallback : process.argv[i + 1]; };
const label = value('--label', 'baseline');
const url = value('--url', 'http://127.0.0.1:8080/Clean_Portofoio/');
const output = path.resolve('output/playwright', label);
await mkdir(output, { recursive: true });
async function fingerprint(dir = 'src') {
  const files = [];
  async function walk(current) { for (const f of await readdir(current, { withFileTypes: true })) { const p = path.join(current, f.name); if (f.isDirectory()) await walk(p); else files.push(p); } }
  await walk(dir);
  const hash = createHash('sha256');
  for (const file of files.sort()) { hash.update(file.replaceAll('\\', '/')); hash.update(await readFile(file)); }
  return hash.digest('hex');
}
const sourceBefore = await fingerprint();
const report = { label, url, capturedAt: new Date().toISOString(), head: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(), sourceBefore, testNormalizations: ['Hide stochastic hero canvas without changing geometry', 'Freeze CSS animations at completed state after scrolling through actual page', 'Hide user cursor and decorative construction overlays for final-state comparison'], viewports: {} };
const browser = await chromium.launch({ channel: 'msedge', headless: !process.argv.includes('--headed') });
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['laptop', 1366, 768], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    const stage = message => console.log(`[${name}] ${message}`);
    stage('launch context');
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'no-preference', isMobile: name === 'mobile', hasTouch: name === 'mobile' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = []; const failedRequests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => failedRequests.push({ url: r.url(), error: r.failure()?.errorText }));
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    stage('page loaded; waiting for fonts and eager images');
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Font loading exceeded 10 seconds')), 10000))]));
    // Calling decode on lazy images before scrolling deadlocks their deferred loading.
    await page.evaluate(() => Promise.race([
      Promise.all([...document.images].filter(image => image.complete || image.loading !== 'lazy').map(image => image.decode().catch(() => {}))),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Eager image decoding exceeded 10 seconds')), 10000)),
    ]));
    await page.addStyleTag({ content: 'html {scroll-behavior:auto!important}' });
    // Exercise the original one-shot IntersectionObservers using real scrolling.
    const length = await page.evaluate(() => document.documentElement.scrollHeight);
    stage(`scroll traversal (${length}px)`);
    for (let y = 0; y < length; y += height * 0.55) {
      await page.evaluate(y => window.scrollTo(0, y), y);
      await page.waitForTimeout(85);
    }
    stage('traversal complete; decoding reached lazy images');
    await page.evaluate(() => Promise.race([
      Promise.all([...document.images].map(image => image.decode().catch(() => {}))),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Image decoding after traversal exceeded 10 seconds')), 10000)),
    ]));
    await page.waitForTimeout(1100);
    await page.addStyleTag({ content: `
      *, *::before, *::after {animation-duration:0.001ms!important;animation-delay:0ms!important;transition-duration:0ms!important;caret-color:transparent!important}
      canvas, .curzr-arrow-pointer, [data-agent-layer], .agent-cursor-layer, .construction-overlay {visibility:hidden!important}
    ` });
    await page.waitForTimeout(100);
    const metrics = await page.evaluate(() => {
      const round = n => Math.round(n * 1000) / 1000;
      const rect = el => { const r = el.getBoundingClientRect(); return { x: round(r.x + scrollX), y: round(r.y + scrollY), width: round(r.width), height: round(r.height) }; };
      const cssPath = el => { const parts = []; while (el && el.nodeType === 1 && el.tagName !== 'BODY') { if (el.id) { parts.unshift('#' + CSS.escape(el.id)); break; } const tag = el.tagName.toLowerCase(); const siblings = el.parentElement ? [...el.parentElement.children].filter(s => s.tagName === el.tagName) : [el]; parts.unshift(tag + ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')'); el = el.parentElement; } return parts.join(' > '); };
      const sections = [...document.querySelectorAll('section:not([aria-live])')].map((el, i) => ({ key: el.id || (i === 0 ? 'hero' : 'finale'), selector: cssPath(el), rect: rect(el), opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }));
      const elements = [...document.querySelectorAll('section,section h1,section h2,section h3,section h4,section p,section a,section button,section input,section textarea,section img,section .grid,nav')].map(el => {
        const style = getComputedStyle(el);
        return { selector: cssPath(el), tag: el.tagName.toLowerCase(), section: el.closest('section')?.id || (el.closest('section') === document.querySelector('section:not([aria-live])') ? 'hero' : 'finale'), text: (el.textContent || '').trim().replace(/\s+/g, ' '), rect: rect(el), font: { family: style.fontFamily, size: style.fontSize, lineHeight: style.lineHeight, weight: style.fontWeight, spacing: style.letterSpacing }, display: style.display, margin: style.margin, padding: style.padding };
      });
      const grids = [...document.querySelectorAll('section .grid')].map(el => ({ selector: cssPath(el), rect: rect(el), template: getComputedStyle(el).gridTemplateColumns, gap: getComputedStyle(el).gap, children: [...el.children].map(child => ({ rect: rect(child), text: (child.textContent || '').slice(0, 80) })) }));
      const hero = document.querySelector('section:not([aria-live])');
      const center = hero?.querySelector('.text-center');
      const heroSlots = center ? [...center.children].map((el, i) => ({ index: i, tag: el.tagName, rect: rect(el), text: el.textContent?.trim().slice(0, 100) })) : [];
      return { sections, elements, grids, heroSlots, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, innerWidth, innerHeight, fonts: document.fonts.status, loadedImages: [...document.images].map(el => ({src: el.src, complete: el.complete, width: el.naturalWidth, height: el.naturalHeight})) };
    });
    const folder = path.join(output, name); await mkdir(folder, { recursive: true });
    stage('metrics captured; screenshots');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(folder, 'hero-viewport.png') });
    for (let i = 0; i < metrics.sections.length; i++) {
      const section = metrics.sections[i];
      stage(`capture ${section.key}`);
      const locator = page.locator('section:not([aria-live])').nth(i);
      await page.evaluate(y => window.scrollTo(0, Math.max(0, y - 80)), section.rect.y);
      await page.waitForTimeout(70);
      await page.screenshot({ path: path.join(folder, `${section.key}-viewport.png`) });
      await locator.screenshot({ path: path.join(folder, `${section.key}-section.png`), timeout: 15000 });
    }
    stage('capture full page');
    await page.screenshot({ path: path.join(folder, 'full-page.png'), fullPage: true });
    report.viewports[name] = { viewport: { width, height }, ...metrics, pageErrors: errors, failedRequests };
    await writeFile(path.join(folder, 'metrics.json'), JSON.stringify(report.viewports[name], null, 2));
    console.log(JSON.stringify({ name, viewport: `${width}x${height}`, scrollWidth: metrics.scrollWidth, sections: metrics.sections.map(s => [s.key, s.rect.y, s.rect.height]), pageErrors: errors.length, failedRequests: failedRequests.length }));
    await context.close();
  }
} finally { await browser.close(); }
report.sourceAfter = await fingerprint();
report.sourceChangedDuringCapture = report.sourceBefore !== report.sourceAfter;
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
if (report.sourceChangedDuringCapture) throw new Error('Source changed during capture; baseline is not coherent');
console.log(`Layout capture saved: ${output}`);
