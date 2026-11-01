import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = process.env.PORTFOLIO_TEST_OUTPUT || 'output/playwright/behavior';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
async function fingerprint() {
  const files=[];
  async function walk(dir) { for(const f of await readdir(dir,{withFileTypes:true})) { const path=dir+'/'+f.name; if(f.isDirectory()) await walk(path); else files.push(path); } }
  await walk('src'); const hash=createHash('sha256');
  for(const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); }
  return hash.digest('hex');
}
const report = { head: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(), sourceBefore: await fingerprint(), checks: [], errors: [], requestFailures: [] };
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
  check('Eight autonomous virtual cursors work during hero construction', active, 8);
  check('Agent pointers use the original real cursor silhouette', await page.evaluate(() => {
    const original = [...document.querySelectorAll('.curzr-arrow-pointer path')].map(p => p.getAttribute('d'));
    return [...document.querySelectorAll('[data-agent]')].every(agent => JSON.stringify([...agent.querySelectorAll('path')].map(p => p.getAttribute('d'))) === JSON.stringify(original));
  }));
  check('Agents use all five colors from the supplied palette', await page.locator('[data-agent]').evaluateAll(els => [...new Set(els.map(el => getComputedStyle(el).getPropertyValue('--agent-color').trim()))].sort()), ['#2bbaa5','#93d3ae','#f96635','#f9a822','#faecb6'].sort());
  const firstClip = await page.locator('#hero h1').evaluate(el => el.style.getPropertyValue('--construction-clip'));
  await page.waitForTimeout(1600);
  check('Text builds autonomously without any mouse or scroll input', await page.locator('#hero h1').evaluate(el => el.style.getPropertyValue('--construction-clip')) !== firstClip);
  check('The slower intro remains in construction after two seconds', (await page.locator('#hero [data-building]').count()) > 0);
  await page.waitForFunction(() => !document.querySelector('#hero [data-building]'), null, { timeout: 12000 });
  await page.waitForTimeout(80);
  check('Document geometry stays identical throughout hero construction', await rects(), initial);
  await page.locator('#hero h1').evaluate(el => { el.style.transform = 'translateY(10px)'; });
  check('Negative control detects an actual injected 10px layout shift', JSON.stringify(await rects()) !== JSON.stringify(initial));
  await page.locator('#hero h1').evaluate(el => { el.style.removeProperty('transform'); });
  await page.locator('#hero h1').evaluate(el => { el.dataset.building = 'text'; el.style.setProperty('--construction-clip', 'inset(0 100% 0 0)'); });
  check('Negative control detects hidden content in the reading area', (await visiblePending()).length > 0);
  await page.locator('#hero h1').evaluate(el => { delete el.dataset.building; el.style.removeProperty('--construction-clip'); });
  check('Autonomous hero finishes without waiting for user input', await page.locator('#hero [data-building]').count(), 0);
  check('Completed work leaves no frozen decorative cursors', await page.locator('[data-agent]').evaluateAll(els => els.filter(el => getComputedStyle(el).opacity === '1').length), 0);
  await snap('hero-finished');
  check('Requested Microsoft headline is visible', await page.locator('#hero').getByText('SWE Intern at Microsoft', { exact: true }).isVisible());
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
  const partialAbout = await page.locator('#about [data-building]').count();
  await page.waitForTimeout(1600);
  check('Current-section work continues after scrolling stops', (await page.locator('#about [data-building]').count()) < partialAbout || (await page.locator('#about [data-constructed]').count()) > 0);
  await page.waitForTimeout(8000);
  check('Autonomous work leaves the reading area fully constructed', await visiblePending(), []);
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
  check('HarrTest is first and explicitly in progress', await page.locator('[data-project]').first().evaluate(el => el.dataset.project === 'harrtest' && el.textContent.includes('In progress')));
  check('Portrait is rendered in black and white', await page.locator('#about img').evaluate(el => getComputedStyle(el).filter), 'grayscale(1)');
  check('Microsoft is the first displayed professional employer', await page.locator('#experience h3').nth(1).innerText(), 'Microsoft');
  check('All eight verified roles appear in the actual timeline', await page.locator('#experience h4').count(), 8);
  check('The new C# certificate is displayed', await page.getByRole('heading', { name: 'Learning C#', exact: true }).count(), 1);
  check('Certificate photographs are rendered inline by default', await page.locator('#education .certificate-thumb').count(), 3);
  check('The Crossover role clearly states its freelance basis', await page.locator('#experience').innerText().then(text => text.includes('Part-time freelance') && text.includes('through Crossover')));
  for (const img of await page.locator('.project-media img').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(img => Promise.race([img.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Image decode timed out')), 10000))]));
  }
  check('Real project images load', await page.locator('.project-media img').evaluateAll(imgs => imgs.every(img => img.naturalWidth > 0)));
  await page.getByRole('button', { name: 'Zoom in Hivo Studio', exact: true }).click();
  check('Project preview opens accessible dialog', await page.getByRole('dialog').isVisible());
  await snap('project-preview');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  check('Preview closes with Escape', await page.getByRole('dialog').count(), 0);
  check('Preview restores keyboard focus', await page.getByRole('button', { name: 'Zoom in Hivo Studio', exact: true }).evaluate(el => el === document.activeElement));
  await page.locator('nav a[href="#education"]').click();
  for (const name of ['Learning C#', 'GCI World April 2026 - Data Science', 'Artificial Intelligence, Leading the Frontier - International Summer School']) {
    const button = page.getByRole('button', { name: `Zoom in ${name} certificate`, exact: true });
    await button.click();
    check(`${name} opens its genuine certificate image`, await page.getByRole('dialog').locator('img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' });
    check(`${name} certificate restores focus`, await button.evaluate(el => el === document.activeElement));
  }
  await page.locator('nav a[href="#projects"]').click();

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
  report.sourceAfter = await fingerprint();
  check('Application source remains stable during the browser journey', report.sourceBefore, report.sourceAfter);
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
