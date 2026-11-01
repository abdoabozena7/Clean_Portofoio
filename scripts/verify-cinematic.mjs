import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = 'output/playwright/cinematic'; await mkdir(output, { recursive: true });
async function fingerprint() {
  const files = []; async function walk(dir) { for (const f of await readdir(dir, { withFileTypes: true })) { const p = dir + '/' + f.name; if (f.isDirectory()) await walk(p); else files.push(p); } }
  await walk('src'); const hash = createHash('sha256'); for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); } return hash.digest('hex');
}
const report = { sourceBefore: await fingerprint(), checks: [], errors: [], samples: [], passed: false };
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, passed: true }); console.log(name); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: output, size: { width: 1440, height: 900 } } });
  const page = await context.newPage(); page.on('pageerror', e => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8080/Clean_Portofoio/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  // Place a still-unbuilt media row just below the viewport, then enter it slowly.
  const media = page.locator('[data-project="ya-rab-ostorha"] .project-media');
  const before = await media.evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top + scrollY, width: r.width, height: r.height }; });
  await media.evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight - 35));
  await page.waitForTimeout(220);
  await page.evaluate(() => {
    window.__cinematic = []; window.__sceneStart = performance.now();
    window.__sceneTimer = setInterval(() => {
      const props = [...document.querySelectorAll('[data-prop]')].filter(el => Number(el.style.opacity) > 0).map(el => ({
        phase: el.dataset.phase, target: el.dataset.target, copy: el.dataset.copy, media: el.dataset.media,
        rect: el.getBoundingClientRect().toJSON(), opacity: Number(el.style.opacity),
        template: el.querySelector('.prop-template').getAttribute('src'), image: el.querySelector('.prop-image').getAttribute('src'),
        replacement: Number(el.querySelector('.prop-image').style.opacity),
      }));
      const real = document.querySelector('[data-project="ya-rab-ostorha"] .project-media');
      window.__cinematic.push({ time: performance.now() - window.__sceneStart, props, realClip: getComputedStyle(real).clipPath });
    }, 40);
  });
  for (let i = 0; i < 28; i++) { await page.mouse.wheel(0, 18); await page.waitForTimeout(55); if (i === 12 || i === 25) await page.screenshot({ path: `${output}/projects-drag-${i}.png` }); }
  await page.waitForTimeout(400); await page.screenshot({ path: `${output}/projects-resize.png` });
  await page.waitForTimeout(6000);
  report.samples = await page.evaluate(() => { clearInterval(window.__sceneTimer); return window.__cinematic; });
  const shots = report.samples.flatMap(s => s.props.filter(p => p.media === 'image' && p.image?.includes('ya-rab-ostorha')));
  const phases = new Set(shots.map(s => s.phase));
  check('Real project image passes through pickup, carry, resize and alignment', ['pick', 'carry', 'resize', 'align'].every(p => phases.has(p)));
  check('A sibling screenshot is duplicated before the destination image replaces it', shots.some(s => s.copy === 'true' && s.template !== s.image && s.replacement === 0) && shots.some(s => s.replacement > .99));
  check('Image prop physically travels more than 30px', Math.max(...shots.map(s => s.rect.y)) - Math.min(...shots.map(s => s.rect.y)) > 30);
  check('Image prop visibly resizes to its real measured destination', Math.min(...shots.map(s => s.rect.width)) < before.width * .65 && Math.max(...shots.map(s => s.rect.width)) > before.width * .99);
  check('The actual media stays masked while the movable prop is being carried', report.samples.some(s => s.props.some(p => p.image?.includes('ya-rab-ostorha') && p.phase === 'carry') && s.realClip.includes('100%')));
  const after = await media.evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top + scrollY, width: r.width, height: r.height }; });
  check('Carrying and resizing never change the actual project flow box', JSON.stringify(before) === JSON.stringify(after));
  check('The committed project image is fully visible and interactive', await media.evaluate(el => !el.hasAttribute('data-building') && getComputedStyle(el).clipPath === 'none'));
  await page.screenshot({ path: `${output}/projects-committed.png` });
  await page.evaluate(() => document.querySelector('#skills').scrollIntoView()); await page.waitForTimeout(90);
  check('Fast navigation removes all obsolete moving props immediately', await page.locator('[data-prop]').evaluateAll(es => es.every(el => Number(el.style.opacity) === 0)));
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(100);
  const badge = page.locator('[data-microsoft-headline]'); await badge.focus();
  check('Microsoft badge links to the exact supplied story', await badge.getAttribute('href') === 'https://lnkd.in/p/e-7HV-sM');
  check('Keyboard focus exposes the small story callout', await page.getByRole('tooltip').isVisible());
  await page.screenshot({ path: `${output}/microsoft-story.png` });
  await page.keyboard.press('Escape'); check('Escape dismisses the callout', await page.getByRole('tooltip').count() === 0);
  for (const [title, suffix] of [['Microsoft Machine Learning Engineer', 'certificate'], ['Artificial Intelligence Level 1', 'certificate'], ['IMPACT Hackathon — 1st Place', 'photo']]) {
    const button = page.getByRole('button', { name: `Zoom in ${title} ${suffix}`, exact: true }); await button.click();
    check(`${title} opens the supplied full image`, await page.getByRole('dialog').locator('img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
    await page.keyboard.press('Escape'); check(`${title} restores keyboard focus`, await button.evaluate(el => el === document.activeElement));
  }
  check('IMPACT is identified as first place and links to its verified post', (await page.locator('[data-achievement] .achievement-ribbon').innerText()).trim().toLowerCase() === '1st place' && await page.locator('.credential-story').getAttribute('href') === 'https://lnkd.in/p/eDP9zBzM');
  const portraitPage = await context.newPage(); portraitPage.on('pageerror', e => report.errors.push(e.message));
  await portraitPage.goto('http://127.0.0.1:8080/Clean_Portofoio/', { waitUntil: 'networkidle' });
  await portraitPage.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await portraitPage.locator('#about img').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight - 35));
  await portraitPage.waitForTimeout(200);
  for (let i = 0; i < 12; i++) { await portraitPage.mouse.wheel(0, 18); await portraitPage.waitForTimeout(55); }
  await portraitPage.waitForFunction(() => [...document.querySelectorAll('[data-prop]')].some(p => +p.style.opacity > 0 && p.querySelector('.prop-image').src.includes('portrait-cutout') && getComputedStyle(p.querySelector('.prop-image')).filter === 'grayscale(1)'));
  check('The carried portrait remains grayscale throughout construction', true);
  await portraitPage.screenshot({ path: `${output}/portrait-grayscale-carry.png` }); await portraitPage.close();
  check('No runtime errors during cinematic manipulation and credential dialogs', report.errors.length === 0);
  report.sourceAfter = await fingerprint(); check('Source is coherent throughout this recorded journey', report.sourceAfter === report.sourceBefore);
  await context.close(); report.passed = true;
} catch (e) { report.failure = e.stack; throw e; }
finally { await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, source: report.sourceBefore, failure: report.failure })); }
