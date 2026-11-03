import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseline = process.argv.includes('--baseline');
const out = `output/playwright/global-scroll/${baseline ? 'baseline' : `final-${Date.now()}`}`;
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
await mkdir(out, { recursive: true });
const report = { url, baseline, checks: [], errors: [], journeys: [], geometry: {} };
async function fingerprint() {
  const files = ['package.json', 'package-lock.json', 'vite.config.ts', 'scripts/verify-global-scroll.mjs'];
  async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { const path = `${dir}/${entry.name}`; if (entry.isDirectory()) await walk(path); else files.push(path); } }
  await walk('src'); const hash = createHash('sha256');
  for (const file of files.sort()) hash.update(file).update(await readFile(file));
  return hash.digest('hex');
}
report.sourceBefore = await fingerprint();
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
async function open(mobile = false, reduced = false, width = mobile ? 390 : 1440) {
  const context = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference', recordVideo: { dir: out } });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await Promise.all([400, 600, 700, 800, 900].map(weight => document.fonts.load(`${weight} 16px Inter`)));
    await document.fonts.ready;
  });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  return { context, page };
}
async function position(page, selector, top = 300) {
  await page.locator(selector).first().evaluate((el, offset) => scrollTo({ top: scrollY + el.getBoundingClientRect().top - offset, behavior: 'instant' }), top);
  await page.waitForTimeout(700);
}
async function state(page) {
  return page.evaluate(() => ({ y: scrollY, mode: document.documentElement.dataset.browsing,
    groups: [...document.querySelectorAll('[data-scan-group]')].map(g => ({ name: g.dataset.scanGroup, active: g.dataset.scanActive, progress: Number(g.style.getPropertyValue('--scan')), top: g.getBoundingClientRect().top })),
    rows: [...document.querySelectorAll('[data-scan-item],[data-project]')].map(el => ({ title: el.querySelector('h3')?.textContent, font: getComputedStyle(el.querySelector('h3')).fontSize, logo: el.querySelector('.company-logo')?.getBoundingClientRect().width, media: el.querySelector('.certificate-image-trigger')?.getBoundingClientRect().width, style: [...el.style].filter(p => !p.startsWith('--exploration-') && !p.startsWith('--construction-')).map(p => [p,el.style.getPropertyValue(p)]).sort().map(p => p.join(':')).join(';'), inert: [...el.querySelectorAll('[data-scan-detail]')].some(d => d.inert) })) }));
}
function allActive(s) { return s.groups.length >= 4 && s.groups.every(g => g.active === 'true' && g.progress > .9); }
async function wheel(page, delta, count = 8) { for (let i = 0; i < count; i++) { await page.mouse.wheel(0, delta); await page.waitForTimeout(60); } }
async function geometry(page, selector) {
  return page.locator(selector).evaluate(root => {
    const origin = root.getBoundingClientRect(), round = n => Math.round(n * 100) / 100;
    return { height: round(origin.height), elements: [root, ...root.querySelectorAll('*')].map(el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return { tag: el.tagName, x: round(r.x - origin.x), y: round(r.y - origin.y), w: round(r.width), h: round(r.height), font: s.font, color: s.color, bg: s.backgroundColor, padding: s.padding, margin: s.margin, gap: s.gap, border: s.border, display: s.display };
    }) };
  });
}
function sameDesktopGeometry(a, b) {
  // Browser-native textarea rows and text glyphs may round differently as web
  // fonts load. All computed styles and outer section sizes must match exactly.
  return a.height === b.height && a.elements.length === b.elements.length && a.elements.every((el, i) => Object.entries(el).every(([key, value]) => typeof value === 'number' ? Math.abs(value - b.elements[i][key]) <= 3 : value === b.elements[i][key]));
}
try {
  // Stable before/after visual contract, independent of source class names.
  const old = baseline ? null : JSON.parse(await readFile('output/playwright/global-scroll/baseline/report.json', 'utf8'));
  for (const width of [1440, 768, 390, 320]) {
    const mobile = width < 768, { context, page } = await open(mobile, true, width);
    try {
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
      report.geometry[width] = {};
      for (const [key, selector] of [['contact', '#contact'], ['finale', '[data-construction-section]:last-of-type']]) {
        await position(page, selector, 80);
        const g = await geometry(page, selector); report.geometry[width][key] = g;
        await page.screenshot({ path: `${out}/${width}-${key}.png` });
        if (!baseline) check(`${width}: ${key} ${mobile ? 'substantially shorter' : 'desktop geometry/styles unchanged'}`, mobile ? g.height < old.geometry[width][key].height * .82 : sameDesktopGeometry(g, old.geometry[width][key]), { beforeHeight: old.geometry[width][key].height, height: g.height });
      }
      check(`${width}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
      if (!baseline) check(`${width}: skills and stale navigation removed`, await page.locator('#skills,a[href="#skills"]').count() === 0);
      if (mobile) {
        await page.locator('#contact input[type=text]').fill('Mobile visitor');
        await page.locator('#contact input[type=email]').fill('visitor@example.com');
        await page.locator('#contact textarea').fill('Testing compact contact layout');
        check(`${width}: compact fields retain values and usable sizes`, await page.locator('#contact form').evaluate(form => [...form.querySelectorAll('input,textarea,button')].every(el => el.getBoundingClientRect().height >= 44) && form.checkValidity()));
      }
      if (!baseline) { await position(page, '#experience'); await wheel(page, 180); check(`${width}: reduced-motion remains detailed`, !(await state(page)).groups.some(g => g.active)); }
    } finally { await context.close(); }
  }
  for (const mobile of [false, true]) {
    const { context, page } = await open(mobile);
    try {
      await position(page, '#experience', 550); const initial = await state(page);
      await wheel(page, 60, 4); check(`${mobile ? 'touch viewport' : 'desktop'}: slow wheel stays detailed`, !(await state(page)).groups.some(g => g.active));
      await page.waitForTimeout(650);
      const natural = await state(page);
      if (mobile) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 740 }] });
        const touchFrames = [];
        for (const y of [620,500,380,260,140,20]) { await page.waitForTimeout(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] }); touchFrames.push(await page.evaluate(() => ({ mode: document.documentElement.dataset.browsing, y: scrollY, at: performance.now() }))); }
        const fast = await state(page); report.journeys.push({ mobile, natural, fast, touchFrames });
        check('Native touch: all offscreen groups share scan', allActive(fast), fast);
        if (!baseline) check('Native touch: certificates and Experience retain their full presentation', fast.rows.every((r,i) => (!r.logo || r.logo === 68 && r.logo === natural.rows[i].logo) && (!r.media || r.media === natural.rows[i].media && !r.inert)), { natural, fast });
        await page.screenshot({ path: `${out}/touch-fast.png` });
        if (!baseline) {
          await page.waitForTimeout(950); const heldIdle = await state(page);
          check('Native touch: stationary held finger restores all sizes', heldIdle.groups.every(g => !g.active) && heldIdle.rows.every((r,i) => !r.inert && r.font === natural.rows[i]?.font && r.logo === natural.rows[i]?.logo && r.media === natural.rows[i]?.media), heldIdle);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        if (!baseline) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 740 }] });
          for (const y of [620,500,380,260,140,20]) { await page.waitForTimeout(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] }); }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          const acrossTouch = [];
          await page.evaluate(() => { window.__globalTouchEvents=[]; for(const type of ['focusin','click','portfolio:attention-focus','portfolio:fast-return-start','pointerdown']) addEventListener(type,e=>window.__globalTouchEvents.push({type,at:performance.now(),y:scrollY,target:e.target?.tagName,txt:e.target?.textContent?.slice(0,30),mode:document.documentElement.dataset.browsing}),true); });
          for (let swipe = 0; swipe < 7; swipe++) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 740 }] });
            for (const y of [620,500,380,260,140,20]) { await page.waitForTimeout(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] }); acrossTouch.push(await state(page)); }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            if (await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top < innerHeight * .8)) break;
          }
          check('Native touch: continuous global state across sections to contact', acrossTouch.length >= 6 && acrossTouch.every(allActive) && acrossTouch.at(-1).y > fast.y + 1500, {frames:acrossTouch,events:await page.evaluate(()=>window.__globalTouchEvents)});
          await page.screenshot({ path: `${out}/touch-across-sections.png` });
        }
        // A new stationary press stops the existing touch controller's momentum.
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 740 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.evaluate(() => { window.__globalFrames = []; window.__globalTimer = setInterval(() => window.__globalFrames.push({ y: scrollY, mode: document.documentElement.dataset.browsing, active: [...document.querySelectorAll('[data-scan-group]')].filter(g => g.dataset.scanActive === 'true').length }), 25); });
        await wheel(page, 180, 8); const fast = await state(page);
        check('Desktop: all offscreen groups share scan', allActive(fast), fast);
        if (!baseline) check('Desktop: offscreen certificates use scan previews', fast.rows.every((r,i) => !r.media || r.media > natural.rows[i].media + 10 && r.media <= 224), { natural, fast });
        await page.screenshot({ path: `${out}/desktop-fast.png` });
        await wheel(page, 180, 26);
        if (!baseline) {
          for (let i = 0; i < 30 && !await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top < innerHeight * .8); i++) await wheel(page, 180, 1);
          check('Desktop: global flag remains active into contact', allActive(await state(page)) && await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top < innerHeight * .8));
        }
        const across = await state(page);
        await wheel(page, -180, 12);
        const frames = await page.evaluate(() => { clearInterval(window.__globalTimer); return window.__globalFrames; });
        const entered = frames.findIndex(f => f.mode === 'scan' && f.active === fast.groups.length);
        check('Desktop: continuous global state across section boundaries and reverse direction', entered >= 0 && frames.slice(entered).every(f => f.mode === 'scan' && f.active === fast.groups.length) && across.y > fast.y + 1000, { fast, across, frames });
        report.journeys.push({ mobile, natural, fast, across, frames });
      }
      await page.waitForTimeout(1100); const idle = await state(page);
      check(`${mobile ? 'Touch' : 'Desktop'}: idle restores EVERY group and row`, idle.groups.every(g => !g.active) && idle.rows.every((r,i) => !r.inert && r.font === natural.rows[i]?.font && r.logo === natural.rows[i]?.logo && r.media === natural.rows[i]?.media && r.style === natural.rows[i]?.style), { natural, idle });
      if (!baseline && !mobile) {
        await position(page, '#projects', 500); await wheel(page, -180, 8); const repeat = await state(page);
        check('Repeat upward burst retains the large Experience logos', allActive(repeat) && repeat.rows.filter(r => r.logo).every(r => r.logo === 68), repeat);
        await page.waitForTimeout(900);
        await page.locator('#contact input[type=text]').fill('Keyboard visitor');
        check('Focus restores detail without losing form content', !(await state(page)).groups.some(g => g.active) && await page.locator('#contact input[type=text]').inputValue() === 'Keyboard visitor');
      }
    } finally { await context.close(); }
  }
  check('No browser runtime errors', !report.errors.length, report.errors);
} catch (error) { check('Journey completes', false, error.stack); }
finally {
  await browser.close();
  report.sourceAfter = await fingerprint();
  check('Current full application source stayed unchanged during browser run', report.sourceBefore === report.sourceAfter);
  report.passed = report.checks.every(c => c.passed);
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(`Evidence: ${out}/report.json`);
  if (!report.passed && !baseline) process.exitCode = 1;
}
