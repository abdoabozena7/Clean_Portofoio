import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before = process.argv.includes('--before');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const out = `output/playwright/paced-browsing-${before ? 'before' : 'after'}`;
await mkdir(out, { recursive: true });
const scope = ['src/lib/scrollIntent.ts', 'src/lib/constructionDirector.ts', 'src/hooks/useAdaptiveBrowsing.ts', 'src/hooks/useScrollConstruction.ts', 'src/styles/adaptive.css', 'src/components/ExperienceSection.tsx', 'src/components/CredentialList.tsx'];
async function fingerprint() { const h = createHash('sha256'); for (const file of scope) { h.update(file); h.update(await readFile(file)); } return h.digest('hex'); }
const report = { mode: before ? 'actual before implementation' : 'actual after implementation', url, sourceScope: scope, sourceBefore: await fingerprint(), verifier: createHash('sha256').update(await readFile('scripts/verify-paced-browsing.mjs')).digest('hex'), checks: [], journeys: [], errors: [], passed: false };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const phase = async (name, fn) => { try { await fn(); } catch (error) { check(`${name}: journey completes`, false, error.stack); } };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
async function open({ mobile = false, reduced = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference', recordVideo: { dir: out } });
  const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(() => { window.__pacedPrevented = []; const original = Event.prototype.preventDefault; Event.prototype.preventDefault = function (...args) { if (['wheel', 'touchmove', 'keydown'].includes(this.type)) window.__pacedPrevented.push({ type: this.type, at: performance.now() }); return original.apply(this, args); }; });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  return { context, page };
}
async function position(page, selector, top) { await page.locator(selector).first().evaluate((el, offset) => scrollTo({ top: scrollY + el.getBoundingClientRect().top - offset, behavior: 'instant' }), top); await page.waitForTimeout(450); }
async function wheel(page, delta, delay, count) { for (let i = 0; i < count; i++) { await page.mouse.wheel(0, delta); await page.waitForTimeout(delay); } }
async function observe(page, selector, start = true) {
  return page.evaluate(({ selector, start }) => {
    if (!start) { clearInterval(window.__pacedProbe.timer); const frames = window.__pacedProbe.frames; delete window.__pacedProbe; return frames; }
    const probe = { frames: [], timer: 0 }; window.__pacedProbe = probe;
    const painted = el => { for (let at = el; at instanceof Element; at = at.parentElement) { const s = getComputedStyle(at); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
    probe.timer = setInterval(() => {
      const el = document.querySelector(selector); if (!el) return;
      const r = el.getBoundingClientRect(), id = el.dataset.sceneId;
      const pointers = [...document.querySelectorAll('.virtual-agent')].map((p, agent) => ({ p, agent })).filter(({ p }) => p.classList.contains('scene-pointer') && p.dataset.sceneId === id && painted(p)).map(({ p, agent }) => { const b = p.getBoundingClientRect(); return { agent, op: p.dataset.sceneOperation, x: b.x - r.x, y: b.y - r.y, top: b.y, left: b.x }; });
      const surfaces = [...el.querySelectorAll('[data-building]')].map(p => ({ text: p.textContent?.trim().slice(0, 25), clip: getComputedStyle(p).clipPath, opacity: getComputedStyle(p).opacity }));
      probe.frames.push({ at: performance.now(), y: scrollY, scan: document.documentElement.dataset.browsing === 'scan', id, state: el.dataset.sceneState, rootTop: r.top, rootBottom: r.bottom, masks: surfaces, pointers });
    }, 25);
    return [];
  }, { selector, start });
}
function motionEvidence(frames) {
  const stationary = frames.filter((f, i) => i > 0 && Math.abs(f.y - frames[i - 1].y) <= 1);
  const points = stationary.flatMap(f => f.pointers), agents = [...new Set(points.map(p => p.agent))].map(agent => {
    const owned = points.filter(p => p.agent === agent), poses = new Set(owned.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
    return { agent, poses: poses.size, travel: Math.hypot(Math.max(...owned.map(p => p.x)) - Math.min(...owned.map(p => p.x)), Math.max(...owned.map(p => p.y)) - Math.min(...owned.map(p => p.y))) };
  });
  const paintStates = new Set(frames.map(f => JSON.stringify([f.state, f.masks])));
  return { stationaryFrames: stationary.length, poses: Math.max(0, ...agents.map(a => a.poses)), relativeTravel: Math.max(0, ...agents.map(a => a.travel)), agents, paintStates: paintStates.size, operations: [...new Set(points.map(p => p.op))], visibleFrames: frames.filter(f => f.rootTop < 850 && f.rootBottom > 100).length };
}
async function itemMetrics(page, group) {
  return page.locator(`${group} [data-scan-item]`).evaluateAll(es => es.map((el, index) => {
    const r = el.getBoundingClientRect(), title = el.querySelector('h3'), logo = el.querySelector('.company-logo'), image = el.querySelector('.certificate-thumb'), role = el.querySelector('.experience-role'), body = el.querySelector('.experience-detail p,.credential-copy > p');
    const painted = target => { if (!target) return false; for (let at = target; at instanceof Element; at = at.parentElement) { const s = getComputedStyle(at); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .5 || at.inert) return false; const box = at.getBoundingClientRect(); if (s.clipPath.includes('100%') || box.height < 1 || box.width < 1) return false; } return true; };
    return { index, top: r.top, bottom: r.bottom, width: r.width, height: r.height, title: title?.textContent, titleSize: parseFloat(getComputedStyle(title).fontSize), logoWidth: logo?.getBoundingClientRect().width || 0, roleVisible: painted(role), roleText: role?.textContent, bodyVisible: painted(body), imageWidth: image?.getBoundingClientRect().width || 0, imageVisible: painted(image), scan: el.closest('[data-scan-active]')?.dataset.scanActive === 'true' };
  }));
}
try {
  await phase('Natural moderate scrolling', async () => {
    const { context, page } = await open(); try {
      const selector = '#education [data-certificate]'; await position(page, selector, 1000); await observe(page, selector);
      await wheel(page, 80, 140, 8); await page.waitForTimeout(200); const frames = await observe(page, selector, false), evidence = motionEvidence(frames);
      check('Moderate80px/140ms wheel remains full-detail throughout, never scan', frames.length > 12 && frames.every(f => !f.scan), { scanFrames: frames.filter(f => f.scan).length, total: frames.length, viewportHeightsPerSecond: 80 / .14 / 900 });
      check('Moderate entry retains visible construction rather than cancelling it', evidence.poses >= 5 && evidence.paintStates >= 3, evidence);
      await page.screenshot({ path: `${out}/moderate-education.png` }); report.journeys.push({ name: 'Moderate Education entry', frames, evidence });
    } finally { await context.close(); }
  });
  await phase('Current Education recovery', async () => {
    const { context, page } = await open(); try {
      const harbin = '[data-attention-id="education-harbin"]'; await position(page, harbin, 1500);
      await wheel(page, 220, 60, 5);
      const fast = await page.evaluate(() => ({ scan: document.documentElement.dataset.browsing === 'scan', y: scrollY, active: [...document.querySelectorAll('.scene-pointer')].filter(el => +getComputedStyle(el).opacity > .1).length }));
      check('Sustained220px/60ms native wheel enters scan and hides construction pointers', fast.scan && fast.active === 0, fast);
      let selector = await page.evaluate(() => { const nodes = [...document.querySelectorAll('#education [data-certificate]')]; const el = nodes.find(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight - 50 && r.bottom > 140; }); return el?.dataset.sceneId; });
      check('Recovery starts from an Education item already in the CURRENT viewport', !!selector, await itemMetrics(page, '#education'));
      if (!selector) throw Error('The fast gesture moved the Education reading target out of the viewport');
      selector = `[data-scene-id="${selector}"][data-scan-item]`;
      for (let cycle = 1; cycle <= 2; cycle++) {
        if (cycle === 2) { await wheel(page, -220, 60, 3); await wheel(page, 220, 60, 3); }
        await observe(page, selector); await page.waitForTimeout(1450); const frames = await observe(page, selector, false), evidence = motionEvidence(frames);
        check(`Recovery${cycle}: agents physically work on the CURRENT visible Education item while scroll is idle`, evidence.visibleFrames >= 10 && evidence.stationaryFrames >= 10 && evidence.poses >= 6 && evidence.relativeTravel >= 18, evidence);
        check(`Recovery${cycle}: actual masks/text construction advance, not only a working label`, evidence.paintStates >= 3 && frames.some(f => f.masks.length > 0), evidence);
        await page.screenshot({ path: `${out}/education-recovery-${cycle}.png` }); report.journeys.push({ name: `Current Education recovery${cycle}`, frames, evidence });
      }
    } finally { await context.close(); }
  });
  await phase('Experience visual scan hierarchy', async () => {
    const { context, page } = await open(); try {
      await position(page, '#experience [data-experience-item]', 650); const natural = await itemMetrics(page, '#experience');
      await wheel(page, 220, 60, 5); const scan = await itemMetrics(page, '#experience'), visible = scan.filter(x => x.scan && x.top < 820 && x.bottom > 100);
      check('Fast Experience displays larger logos and company titles instead of shrinking them', visible.some(x => x.logoWidth >= natural[x.index].logoWidth * 1.15 && x.titleSize >= natural[x.index].titleSize), { natural, scan, visible });
      check('Fast Experience retains the role while hiding secondary description', visible.some(x => x.roleVisible && x.roleText?.trim() && !x.bodyVisible), visible);
      await page.screenshot({ path: `${out}/experience-visual-scan.png` }); report.journeys.push({ name: 'Experience scan', natural, scan });
    } finally { await context.close(); }
  });
  await phase('Credential visual scan hierarchy', async () => {
    const { context, page } = await open(); try {
      await position(page, '[data-attention-id="education-harbin"]', 1500); const natural = await itemMetrics(page, '#education'); await wheel(page, 220, 60, 5);
      const scan = await itemMetrics(page, '#education'), visible = scan.filter(x => x.scan && x.top < 850 && x.bottom > 100 && natural[x.index].imageWidth > 0);
      check('Fast credentials retain a prominent title and enlarge the actual visible certificate image', visible.some(x => x.imageVisible && x.imageWidth >= natural[x.index].imageWidth * 1.15 && x.titleSize >= natural[x.index].titleSize), { natural, scan, visible });
      await page.screenshot({ path: `${out}/credential-visual-scan.png` }); report.journeys.push({ name: 'Credential scan', natural, scan });
    } finally { await context.close(); }
  });
  await phase('Touch and reduced motion', async () => {
    const mobile = await open({ mobile: true }); try {
      await position(mobile.page, '#education', 100); const client = await mobile.context.newCDPSession(mobile.page), y = await mobile.page.evaluate(() => scrollY);
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
      for (const pos of [620, 520, 400, 270]) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: pos }] }); await mobile.page.waitForTimeout(40); }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await mobile.page.waitForTimeout(600);
      const state = await mobile.page.evaluate(() => ({ y: scrollY, prevented: window.__pacedPrevented, masks: document.querySelectorAll('section:not(#hero) [data-building]').length, agents: [...document.querySelectorAll('.virtual-agent,[data-scan-editor],.scene-actor')].filter(el => { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return false; for (let at = el; at instanceof Element; at = at.parentElement) { const s = getComputedStyle(at); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .1) return false; } return true; }).length, width: document.documentElement.scrollWidth, viewport: innerWidth }));
      check('Native touch remains free with no lower-page decorative construction or masks', state.y > y + 200 && state.prevented.length === 0 && state.agents === 0 && state.masks === 0 && state.width === state.viewport, { beforeY: y, ...state });
      await mobile.page.screenshot({ path: `${out}/mobile-education.png` });
    } finally { await mobile.context.close(); }
    const reduced = await open({ reduced: true }); try { await position(reduced.page, '#education', 100); check('Reduced motion immediately exposes finished Education without masks or scan state', await reduced.page.locator('#education').evaluate(el => !el.querySelector('[data-building],[data-scene-building]') && document.documentElement.dataset.browsing !== 'scan')); } finally { await reduced.context.close(); }
  });
  check('No uncaught runtime errors during native paced browsing', report.errors.length === 0, report.errors);
  report.sourceAfter = await fingerprint(); check('Relevant application source stays coherent throughout verification', report.sourceAfter === report.sourceBefore);
  report.passed = report.checks.every(c => c.passed);
} finally { await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failed: report.checks.filter(x => !x.passed).map(x => x.name), out })); if (!report.passed) process.exitCode = 1; }
