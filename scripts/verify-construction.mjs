import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = process.env.PORTFOLIO_TEST_OUTPUT || 'output/playwright/behavior';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { head: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(), checks: [], errors: [], requestFailures: [] };
const check = (name, actual, expected = true) => { assert.deepEqual(actual, expected, name); report.checks.push({ name, passed: true }); console.log(name); };
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
report.url = url;
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: output, size: { width: 1440, height: 900 } }, acceptDownloads: true });
const page = await context.newPage();
page.on('pageerror', e => report.errors.push(e.message));
page.on('requestfailed', r => report.requestFailures.push({ url: r.url(), error: r.failure()?.errorText }));
const snap = name => page.screenshot({ path: `${output}/${name}.png` });
const rects = () => page.evaluate(() => [...document.querySelectorAll('section:not([aria-live]),#hero h1,#hero .text-center > div,#about img')].map(el => {
  const r = el.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height].map(n => Math.round(n * 100) / 100);
}));
const visiblePending = () => page.evaluate(() => [...document.querySelectorAll('[data-building],section h1,section h2,section h3,section p,section a,section button,section img')].filter(el => {
  const r = el.getBoundingClientRect();
  if (!(r.width && r.height && r.top >= 80 && r.top < innerHeight * .55)) return false;
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (node.hasAttribute('data-building') || Number(style.opacity) < .98 || style.clipPath !== 'none') return true;
  }
  return false;
}).map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 50), rect: el.getBoundingClientRect().toJSON() })));
try {
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  // Warm existing fonts/calendar first; their original network-driven layout changes
  // must not be confused with paint-only construction. Reload uses the real cache.
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(480);
  const initial = await rects();
  await snap('hero-building');
  const initialMasks = await page.locator('[data-building]').count();
  check('Construction actually applies masks to real elements', initialMasks > 10);
  const active = await page.locator('[data-agent]').evaluateAll(els => els.filter(el => getComputedStyle(el).opacity !== '0').length);
  check('At least three independent virtual cursors work during hero construction', active >= 3);
  await page.waitForTimeout(2700);
  check('Document geometry stays identical throughout hero construction', await rects(), initial);
  await page.locator('#hero h1').evaluate(el => { el.style.transform = 'translateY(10px)'; });
  check('Negative control detects an actual injected 10px layout shift', JSON.stringify(await rects()) !== JSON.stringify(initial));
  await page.locator('#hero h1').evaluate(el => { el.style.removeProperty('transform'); });
  await page.locator('#hero h1').evaluate(el => { el.dataset.building = 'text'; el.style.setProperty('--construction-clip', 'inset(0 100% 0 0)'); });
  check('Negative control detects hidden content in the reading area', (await visiblePending()).length > 0);
  await page.locator('#hero h1').evaluate(el => { delete el.dataset.building; el.style.removeProperty('--construction-clip'); });
  check('Hero finishes within its short intro', await page.locator('#hero [data-building]').count(), 0);
  await snap('hero-finished');
  check('Requested Microsoft headline is visible', await page.getByText('SWE Intern at Microsoft', { exact: true }).isVisible());
  await page.mouse.move(230, 240); await page.waitForTimeout(120);
  const cursor = await page.locator('.curzr-arrow-pointer').evaluate(el => ({ transform: el.style.transform, opacity: el.style.opacity, z: Number(el.style.zIndex) }));
  check('Original user cursor responds independently', cursor.transform.includes('230') && cursor.opacity === '1' && cursor.z > 100);
  check('Every agent-layer element ignores hit testing', await page.locator('[data-agent-layer]').evaluate(el => [el, ...el.querySelectorAll('*')].every(node => getComputedStyle(node).pointerEvents === 'none')));

  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  // Slow actual wheel input: progress comes from visibility rather than elapsed time.
  let sawPartial = false, sawAgents = false;
  const beforeScroll = await rects();
  for (let i = 0; i < 19; i++) {
    await page.mouse.wheel(0, 42); await page.waitForTimeout(90);
    if (await page.locator('#about [data-building]').count()) sawPartial = true;
    if (await page.locator('[data-agent]').evaluateAll(els => els.filter(el => getComputedStyle(el).opacity === '1').length >= 3)) sawAgents = true;
    if (i === 9) await snap('about-wireframe-typing');
  }
  check('Slow scrolling exposes intermediate construction', sawPartial);
  check('Multiple agents collaborate while scrolling', sawAgents);
  check('Scrolling construction never moves layout boxes', await rects(), beforeScroll);
  check('Reading-area content is already fully constructed', await visiblePending(), []);
  // Large wheel input must synchronize without waiting for any previous task.
  await page.mouse.wheel(0, 3000); await page.waitForTimeout(100);
  check('Fast scroll immediately synchronizes the reading area', await visiblePending(), []);
  await snap('fast-scroll');
  const completed = await page.locator('[data-constructed]').count();
  await page.mouse.wheel(0, -3000); await page.waitForTimeout(100);
  check('Reverse scrolling never hides completed elements', (await page.locator('[data-constructed]').count()) >= completed);

  await page.locator('nav a[href="#projects"]').click(); await page.waitForTimeout(160);
  check('Anchor navigation reaches Projects', new URL(page.url()).hash, '#projects');
  check('Anchor targets immediately expose readable content', await visiblePending(), []);
  await snap('projects-anchor');
  check('All requested projects and the skill are present', await page.locator('[data-project]').count(), 7);
  for (const img of await page.locator('.project-media img').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(img => Promise.race([img.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Image decode timed out')), 10000))]));
  }
  check('Real project images load', await page.locator('.project-media img').evaluateAll(imgs => imgs.every(img => img.naturalWidth > 0)));
  await page.getByRole('button', { name: 'Preview Hivo Studio', exact: true }).click();
  check('Project preview opens accessible dialog', await page.getByRole('dialog').isVisible());
  await snap('project-preview');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  check('Preview closes with Escape', await page.getByRole('dialog').count(), 0);
  check('Preview restores keyboard focus', await page.getByRole('button', { name: 'Preview Hivo Studio', exact: true }).evaluate(el => el === document.activeElement));

  await page.keyboard.press('Control+k');
  const terminal = page.locator('input[autocomplete="off"]');
  await terminal.fill('projects'); await terminal.press('Enter');
  check('Terminal still answers project command', await page.locator('text=guest@portfolio:~$ projects').isVisible());
  await snap('terminal');
  await page.keyboard.press('Escape');
  check('Terminal closes without overlay interference', await page.getByRole('button', { name: 'Open Terminal', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Open Terminal', exact: true }).click();
  await terminal.fill('clear'); await terminal.press('Enter');
  check('Terminal clear command works', await page.locator('text=guest@portfolio:~$ projects').count(), 0);
  await page.keyboard.press('Escape');

  await page.locator('nav a[href="#contact"]').click(); await page.waitForTimeout(140);
  const inputs = page.locator('#contact input');
  await inputs.nth(0).fill('Local review'); await inputs.nth(1).fill('review@example.com');
  await page.locator('#contact textarea').fill('Testing locally, no message will be sent.');
  check('Contact fields retain entered values', await inputs.nth(0).inputValue(), 'Local review');
  await inputs.nth(1).fill('bad-email');
  check('Contact form preserves native invalid-email validation', await inputs.nth(1).evaluate(el => el.validity.typeMismatch));
  check('Focused contact controls are never masked', await inputs.nth(1).evaluate(el => !el.closest('[data-building]')));
  await page.goBack(); await page.waitForTimeout(100);
  check('Browser history restores the previous anchor', new URL(page.url()).hash, '#projects');
  await page.goForward(); await page.waitForTimeout(100);
  check('Browser forward restores Contact', new URL(page.url()).hash, '#contact');
  await page.keyboard.press('Home'); await page.keyboard.press('PageUp'); await page.waitForTimeout(100);
  check('Keyboard scroll keeps reading content available', await visiblePending(), []);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  const downloadWait = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download CV' }).click();
  const download = await downloadWait;
  check('CV download retains its original filename', download.suggestedFilename(), 'Abdelrahman_Abozena_CV.pdf');
  const response = await page.request.get(url + 'resume.pdf');
  check('CV link serves a genuine PDF payload', (await response.body()).subarray(0, 4).toString(), '%PDF');
  check('No runtime page errors', report.errors, []);
  await context.tracing.stop({ path: `${output}/trace.zip` });
  await context.close();

  const reduced = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  const rp = await reduced.newPage(); await rp.goto(url + '#experience', { waitUntil: 'networkidle' });
  check('Reduced motion immediately constructs all content', await rp.locator('[data-building]').count(), 0);
  check('Reduced motion removes virtual agents', await rp.locator('[data-agent-layer]').evaluate(el => getComputedStyle(el).display), 'none');
  await rp.screenshot({ path: `${output}/reduced-motion.png` });
  await rp.emulateMedia({ media: 'print' });
  check('Print keeps content accessible without masks', await rp.locator('[data-building]').count(), 0);
  await reduced.close();

  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mp = await touch.newPage(); await mp.goto(url, { waitUntil: 'networkidle' });
  check('Touch uses simplified construction without mouse pointers', await mp.locator('[data-agent-layer]').evaluate(el => getComputedStyle(el).display), 'none');
  await mp.getByRole('button', { name: 'Menu', exact: true }).tap();
  await mp.locator('nav a[href="#projects"]:visible').tap(); await mp.waitForTimeout(1000);
  check('Mobile menu navigates to Projects', new URL(mp.url()).hash, '#projects');
  check('Mobile has no horizontal overflow', await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mp.screenshot({ path: `${output}/mobile-projects.png` });
  await touch.close();
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.stack;
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
