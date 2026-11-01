import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = 'output/playwright/autonomous-review';
await mkdir(output, { recursive: true });
const files = ['src/hooks/useScrollConstruction.ts', 'src/components/AgentConstruction.tsx', 'src/lib/agentConfig.ts', 'src/lib/palette.ts', 'src/styles/construction.css', 'src/lib/construction.ts', 'src/lib/constructionScene.ts', 'src/components/ArrowPointerCursor.tsx'];
const fingerprint = async () => {
  const hash = createHash('sha256');
  for (const file of files) { hash.update(file); hash.update(await readFile(file)); }
  return hash.digest('hex');
};
const report = { revision: 'Autonomous visible construction / eight colored agents', sourceFiles: files, sourceBefore: await fingerprint(), checks: [], diagnostics: [], errors: [] };
const check = (name, actual, expected = true) => { assert.deepEqual(actual, expected, name); report.checks.push({ name, passed: true }); console.log(name); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const url = 'http://127.0.0.1:8080/Clean_Portofoio/';
const visiblePending = () => [...document.querySelectorAll('[data-building]')].filter(el => {
  const r = el.getBoundingClientRect(); return r.width && r.height && r.top >= 80 && r.top < innerHeight * .55;
}).map(el => el.textContent?.trim().slice(0, 50));
const rendered = el => {
  let current = el;
  while (current && current !== document.body) {
    const style = getComputedStyle(current);
    if (Number(style.opacity) < .99 || style.clipPath !== 'none') return false;
    current = current.parentElement;
  }
  return true;
};
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(() => {
    window.__reviewRafCount = 0;
    const original = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => original(time => { window.__reviewRafCount++; callback(time); });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(180);
  const start = await page.evaluate(() => ({
    masks: document.querySelectorAll('[data-building]').length,
    heroMasks: document.querySelectorAll('#hero [data-building]').length,
    nameClip: document.querySelector('#hero h1').style.getPropertyValue('--construction-clip'),
    active: [...document.querySelectorAll('[data-agent]')].filter(el => getComputedStyle(el).opacity === '1').length,
  }));
  report.diagnostics.push({ name: 'Initial autonomous construction', ...start });
  check('Eight decorative virtual agents exist', await page.locator('[data-agent]').count(), 8);
  check('Blank-before-build masks apply to real content', start.masks > 30 && start.heroMasks > 5 && !!start.nameClip);
  const shapes = await page.evaluate(() => {
    const original = [...document.querySelectorAll('.curzr-arrow-pointer svg path')].map(el => el.getAttribute('d'));
    return [...document.querySelectorAll('[data-agent] svg')].map(el => [...el.querySelectorAll('path')].map(path => path.getAttribute('d')).join('|') === original.join('|'));
  });
  check('All eight agents reuse both exact original custom-cursor SVG paths', shapes.every(Boolean));
  const colors = await page.locator('[data-agent]').evaluateAll(els => els.map(el => getComputedStyle(el).getPropertyValue('--agent-color').trim()));
  check('Eight agents share the supplied five-color palette', [...new Set(colors)].sort(), ['#2bbaa5','#93d3ae','#f96635','#f9a822','#faecb6'].sort());
  check('Decorative layer never intercepts interaction', await page.locator('[data-agent-layer]').evaluate(el => [el, ...el.querySelectorAll('*')].every(node => getComputedStyle(node).pointerEvents === 'none')));
  await page.screenshot({ path: `${output}/hero-autonomous-start.png` });
  const movement = await page.evaluate(async () => {
    const elements = [...document.querySelectorAll('[data-agent]')];
    const previous = new Map(); let maxSpeed = 0, maxActive = 0, moves = 0;
    const started = performance.now();
    while (performance.now() - started < 1800) {
      // Compare compositor-frame timestamps, avoiding performance.now() jitter
      // from synchronous style/layout work between two callback samples.
      const now = await new Promise(requestAnimationFrame); let active = 0;
      elements.forEach((el, index) => {
        if (getComputedStyle(el).opacity !== '1') { previous.delete(index); return; }
        active++;
        const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        const old = previous.get(index);
        if (old) {
          const distance = Math.hypot(matrix.m41 - old.x, matrix.m42 - old.y);
          if (distance > .01) moves++;
          maxSpeed = Math.max(maxSpeed, distance / Math.max(.001, (now - old.time) / 1000));
        }
        previous.set(index, { x: matrix.m41, y: matrix.m42, time: now });
      });
      maxActive = Math.max(maxActive, active);
    }
    return { maxSpeed, maxActive, moves, nameClip: document.querySelector('#hero h1').style.getPropertyValue('--construction-clip') };
  });
  report.diagnostics.push({ name: 'Movement with no user input', ...movement });
  check('All eight agents visibly collaborate without input', Math.max(start.active, movement.maxActive), 8);
  check('Autonomous agents move without pointer or scroll input', movement.moves > 20);
  check('Normal agent movement stays near the declared 420px/s limit', movement.maxSpeed <= 480);
  check('Heading construction advances while the visitor is idle', movement.nameClip !== start.nameClip);
  const mouseIsolation = await page.evaluate(() => {
    const cursors = [...document.querySelectorAll('[data-agent]')];
    const before = cursors.map(el => el.style.transform);
    for (let i = 0; i < 100; i++) document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 100 + i, clientY: 200 + i }));
    return { isolated: JSON.stringify(before) === JSON.stringify(cursors.map(el => el.style.transform)), real: document.querySelector('.curzr-arrow-pointer').style.transform };
  });
  check('Mouse movement drives only the original real cursor', mouseIsolation.isolated && mouseIsolation.real.includes('199'));
  await page.evaluate(() => document.fonts.ready);
  const offscreenBefore = await page.locator('#about h2').evaluate(el => el.style.getPropertyValue('--construction-clip'));
  await page.waitForTimeout(8500);
  check('Autonomous hero eventually finishes every visible target', await page.locator('#hero [data-building]').count(), 0);
  check('Agents hide after all visible work finishes', await page.locator('[data-agent]').evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '0')));
  check('Offscreen text does not consume an autonomous animation queue', await page.locator('#about h2').evaluate(el => el.style.getPropertyValue('--construction-clip')), offscreenBefore);
  const idleCount = await page.evaluate(() => window.__reviewRafCount);
  await page.waitForTimeout(650);
  const idleFrames = await page.evaluate(initial => window.__reviewRafCount - initial, idleCount);
  report.diagnostics.push({ name: 'Desktop completed idle animation callbacks', idleFrames });
  check('Completed desktop construction stops animation frames', idleFrames <= 2);
  await page.screenshot({ path: `${output}/hero-autonomous-finished.png` });

  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 18); await page.waitForTimeout(50); }
  const partial = await page.locator('#about h2').evaluate(el => ({ clip: el.style.getPropertyValue('--construction-clip'), kind: el.dataset.building, rect: el.getBoundingClientRect().toJSON() }));
  check('Slow entry starts an unfinished About text construction', partial.kind, 'text');
  await page.setViewportSize({ width: 1000, height: 900 }); await page.waitForTimeout(160);
  const resized = await page.locator('#about h2').evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    const top = Math.min(...[...range.getClientRects()].map(rect => rect.top)) - el.getBoundingClientRect().top;
    return { clip: el.style.getPropertyValue('--construction-clip'), lineTop: top };
  });
  check('Partial construction mask uses freshly measured responsive line geometry', resized.clip.includes(`0px ${Math.min(0, resized.lineTop)}px`));
  const geometry = await page.evaluate(() => [...document.querySelectorAll('#about,#about h2,#about p,#about img')].map(el => {
    const r = el.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height];
  }));
  await page.screenshot({ path: `${output}/about-autonomous-partial.png` });
  await page.waitForTimeout(4000);
  check('About text continues to completion without more scrolling', await page.locator('#about h2').getAttribute('data-constructed'), 'true');
  check('Autonomous reveal never changes actual About layout boxes', await page.evaluate(() => [...document.querySelectorAll('#about,#about h2,#about p,#about img')].map(el => {
    const r = el.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height];
  })), geometry);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    const section = document.querySelector('#projects'); scrollTo(0, section.getBoundingClientRect().top + scrollY);
  });
  await page.waitForTimeout(80);
  check('A large jump immediately exposes reading-area content', await page.evaluate(visiblePending), []);
  check('The visible first card is actually opaque through its ancestors after a fast jump', await page.locator('[data-project="harrtest"]').evaluate(rendered));
  const completed = await page.locator('[data-constructed]').count();
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(70);
  check('Reverse scrolling preserves completed targets', await page.locator('[data-constructed]').count() >= completed);

  const focusPage = await context.newPage();
  await focusPage.goto(url, { waitUntil: 'domcontentloaded' });
  await focusPage.locator('#contact input').first().evaluate(el => el.focus({ preventScroll: true }));
  check('Keyboard focus exposes a masked input and all masked ancestors', await focusPage.locator('#contact input').first().evaluate(rendered));
  await focusPage.close();
  for (const anchor of ['projects', 'contact']) {
    const deep = await context.newPage();
    await deep.goto(url + '#' + anchor, { waitUntil: 'networkidle' });
    check(`Fresh #${anchor} navigation immediately exposes reading content`, await deep.evaluate(visiblePending), []);
    await deep.close();
  }
  check('Grayscale portrait is applied', await page.locator('#about img').evaluate(el => getComputedStyle(el).filter.includes('grayscale(1)')));
  await context.close();

  const reduced = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  const rp = await reduced.newPage(); await rp.goto(url, { waitUntil: 'networkidle' });
  check('Reduced motion begins with every target fully constructed', await rp.locator('[data-building]').count(), 0);
  check('Reduced motion hides autonomous pointers', await rp.locator('[data-agent-layer]').evaluate(el => getComputedStyle(el).display), 'none');
  await reduced.close();

  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tp = await touch.newPage();
  await tp.addInitScript(() => {
    window.__reviewRafCount = 0; const original = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => original(time => { window.__reviewRafCount++; callback(time); });
  });
  await tp.goto(url, { waitUntil: 'networkidle' }); await tp.waitForTimeout(1600);
  check('Touch simplified hero finishes autonomously', await tp.locator('#hero [data-building]').count(), 0);
  check('Touch never displays decorative mouse cursors', await tp.locator('[data-agent-layer]').evaluate(el => getComputedStyle(el).display), 'none');
  await tp.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await tp.evaluate(() => scrollTo(0, 350)); await tp.waitForTimeout(1500);
  const touchCount = await tp.evaluate(() => window.__reviewRafCount); await tp.waitForTimeout(650);
  const touchIdle = await tp.evaluate(initial => window.__reviewRafCount - initial, touchCount);
  report.diagnostics.push({ name: 'Touch completed idle animation callbacks', touchIdle });
  check('Touch construction stops animation frames after its simplified build', touchIdle <= 2);
  await touch.close();
  check('No runtime page errors occurred', report.errors, []);
  report.sourceAfter = await fingerprint();
  check('Reviewed construction source stayed unchanged during the run', report.sourceAfter, report.sourceBefore);
  report.passed = true;
} catch (error) { report.passed = false; report.failure = error.stack; throw error; }
finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
