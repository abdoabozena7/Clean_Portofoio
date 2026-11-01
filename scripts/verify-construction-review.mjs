// Independent review probes: resize repaint, immediate opacity, touch idle work,
// fresh deep anchors and narrower/wider card containment. No application mutations.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = 'output/playwright/independent-review';
await mkdir(output, { recursive: true });
const sourceFiles = ['src/hooks/useScrollConstruction.ts', 'src/hooks/useProjectFootprint.ts', 'src/data/projectLayoutBaseline.ts', 'src/lib/construction.ts', 'src/styles/construction.css', 'src/components/HeroSection.tsx', 'src/components/ProjectsSection.tsx', 'src/styles/projects.css'];
const hash = createHash('sha256');
for (const file of sourceFiles) { hash.update(file); hash.update(await readFile(file)); }
const report = { sourceFiles, sourceSha256: hash.digest('hex'), checks: [], diagnostics: [] };
const record = (name, actual, expected = true) => { assert.deepEqual(actual, expected, name); report.checks.push({ name, passed: true }); console.log(name); };
const url = 'http://127.0.0.1:8080/Clean_Portofoio/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2700);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(() => scrollTo(0, 350));
  await page.waitForTimeout(250);
  const before = await page.locator('#about h2').evaluate(el => ({ clip: el.style.getPropertyValue('--construction-clip'), height: el.getBoundingClientRect().height, building: el.dataset.building }));
  record('Resize probe starts with a genuinely partial heading', before.building, 'text');
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.waitForTimeout(200);
  const after = await page.locator('#about h2').evaluate(el => ({ clip: el.style.getPropertyValue('--construction-clip'), height: el.getBoundingClientRect().height }));
  record('Resize remeasures the responsive heading', after.height !== before.height);
  record('Unchanged monotone progress repaints its mask after resize', after.clip !== before.clip);
  report.diagnostics.push({ name: 'Resize mask observations', before, after });
  await page.screenshot({ path: `${output}/resize-partial.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  const samples = await page.evaluate(async () => {
    const card = document.querySelector('[data-project="hivo"]');
    scrollTo(0, card.getBoundingClientRect().top + scrollY - 250);
    const samples = [];
    for (let i = 0; i < 6; i++) {
      await new Promise(requestAnimationFrame);
      samples.push({ frame: i, opacity: Number(getComputedStyle(card).opacity), constructed: card.dataset.constructed });
    }
    return samples;
  });
  report.diagnostics.push({ name: 'Fast jump opacity RAF samples', samples });
  record('Fast jump finishes the actual card by the next paint', samples[2].constructed, 'true');
  record('Finished structure has immediate computed opacity, without CSS transition lag', samples[2].opacity, 1);
  await page.close();

  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const tp = await touch.newPage();
  await tp.addInitScript(() => {
    window.__reviewRafCount = 0;
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => original(time => { window.__reviewRafCount++; callback(time); });
  });
  await tp.goto(url, { waitUntil: 'networkidle' });
  await tp.waitForTimeout(2800);
  await tp.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await tp.evaluate(() => scrollTo(0, 350));
  await tp.waitForTimeout(250);
  const initialCount = await tp.evaluate(() => window.__reviewRafCount);
  await tp.waitForTimeout(1000);
  const framesWhileIdle = await tp.evaluate(initial => window.__reviewRafCount - initial, initialCount);
  report.diagnostics.push({ name: 'Touch idle requestAnimationFrame callbacks over one second', framesWhileIdle });
  record('Touch does not render decorative mouse pointers', await tp.locator('[data-agent-layer]').evaluate(el => getComputedStyle(el).display), 'none');
  record('Touch construction stops continuous animation work while input is idle', framesWhileIdle <= 3);
  await touch.close();

  for (const hash of ['contact', 'skills']) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(url + '#' + hash, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const pending = await p.evaluate(() => [...document.querySelectorAll('[data-building]')].filter(el => {
      const r = el.getBoundingClientRect(); return r.width && r.height && r.top >= 80 && r.top < innerHeight * .55;
    }).map(el => el.textContent?.slice(0, 40)));
    record(`Fresh #${hash} deep link has no pending reading-area masks`, pending, []);
    await p.close();
  }
  for (const width of [320, 600, 900]) {
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    await p.goto(url + '#projects', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const metrics = await p.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      cards: [...document.querySelectorAll('[data-project]')].map(el => ({ id: el.dataset.project, overflow: el.scrollHeight - el.clientHeight, actionBottom: el.querySelector('.project-actions').getBoundingClientRect().bottom - el.getBoundingClientRect().bottom })) }));
    report.diagnostics.push(metrics);
    record(`${width}px cards and actions stay inside their reserved boxes`, metrics.cards.every(card => card.overflow === 0 && card.actionBottom < 0));
    if (width !== 320) record(`${width}px page has no horizontal overflow`, metrics.scrollWidth <= width);
    // The 320px document overflow is a diagnostic outside the mandated 390px
    // mobile baseline; preserve it for investigation rather than silently hiding it.
    await p.close();
  }
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.stack; throw error;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
