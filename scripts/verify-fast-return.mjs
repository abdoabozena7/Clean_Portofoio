import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ts = require('typescript');
const before = process.argv.includes('--before'), argument = (key, fallback) => { const i = process.argv.indexOf(key); return i < 0 ? fallback : process.argv[i + 1]; };
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const configPath = argument('--config', process.env.PORTFOLIO_FAST_RETURN_CONFIG || '');
const out = `output/playwright/fast-reverse-${before ? 'before' : 'after'}`; await mkdir(out, { recursive: true });
async function source() { const files = []; async function walk(d) { for (const f of await readdir(d, { withFileTypes: true })) { const p = d + '/' + f.name; f.isDirectory() ? await walk(p) : files.push(p); } } await walk('src'); const h = createHash('sha256'); for (const p of files.sort()) { h.update(p); h.update(await readFile(p)); } return h.digest('hex'); }
async function configuration() {
  if (!configPath) return null;
  const text = await readFile(configPath, 'utf8'), ast = ts.createSourceFile(configPath, text, ts.ScriptTarget.Latest, true), values = {};
  const visit = node => { if (ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) { const value = node.initializer; if (ts.isStringLiteral(value)) values[node.name.text] = value.text; else if (ts.isNumericLiteral(value)) values[node.name.text] = Number(value.text); } ts.forEachChild(node, visit); }; visit(ast);
  return { path: configPath, sha256: createHash('sha256').update(text).digest('hex'), values, destination: values.destination || values.target || values.returnTarget, cooldownMs: values.cooldownMs };
}
const config = await configuration();
const report = { mode: before ? 'unmodified native baseline' : 'native experiment acceptance', verifierVersion: 3, targetOracle: 'Continuous reversal must reach the landing and show multiple upward steps after qualification; source origin is not a destination.', url, sourceBefore: await source(), verifier: createHash('sha256').update(await readFile('scripts/verify-fast-return.mjs')).digest('hex'), config, checks: [], journeys: [], errors: [], passed: false };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const phase = async (name, fn) => { try { await fn(); } catch (error) { check(`${name}: journey completes`, false, error.stack); } };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
async function open(mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, recordVideo: { dir: out } }), page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(() => { window.__fastReturnInputs = []; for (const type of ['wheel', 'keydown', 'touchstart', 'touchmove', 'touchend']) addEventListener(type, event => window.__fastReturnInputs.push({ type, trusted: event.isTrusted, at: performance.now(), dy: event.deltaY, key: event.key }), { passive: true }); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  return { context, page };
}
async function position(page, y) { await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(650); }
async function trace(page, start = true) { return page.evaluate(start => {
  if (!start) { clearInterval(window.__fastReturnTrace.timer); const data = window.__fastReturnTrace.frames; delete window.__fastReturnTrace; return data; }
  const data = { frames: [], timer: 0 }; window.__fastReturnTrace = data;
  const sample = () => data.frames.push({ at: performance.now(), y: scrollY, height: innerHeight, maxY: document.documentElement.scrollHeight - innerHeight, focused: document.activeElement?.tagName, dialog: !!document.querySelector('[role=dialog]') });
  sample(); data.timer = setInterval(sample, 16); return [];
}, start); }
async function wheel(page, delta, delay, count) { for (let i = 0; i < count; i++) { await page.mouse.wheel(0, delta); await page.waitForTimeout(delay); } }
function movement(frames) { let peak = frames[0]?.y || 0, drop = 0; for (const f of frames) { peak = Math.max(peak, f.y); drop = Math.max(drop, peak - f.y); } return { start: frames[0]?.y, end: frames.at(-1)?.y, maximumDrawdown: drop, min: Math.min(...frames.map(f => f.y)), max: Math.max(...frames.map(f => f.y)) }; }
function targetEvidence(frames, start) {
  if (!config?.destination) return { configured: false };
  const top = ['top', 'page-top', 'continuous-up'].includes(config.destination), burst = ['burst-start', 'burstStart', 'burst_start'].includes(config.destination);
  const target = top ? 0 : burst ? start : null;
  let peak = -Infinity;
  const returnIndex = frames.findIndex(frame => { peak = Math.max(peak, frame.y); return peak - frame.y >= 900; });
  const returnedFrames = returnIndex < 0 ? [] : frames.slice(returnIndex);
  return { configured: target !== null, destination: config.destination, expectedY: target, returnIndex, returnAt: frames[returnIndex]?.at, eligibleFrames: returnedFrames.length, closest: target === null || !returnedFrames.length ? Infinity : Math.min(...returnedFrames.map(f => Math.abs(f.y - target))) };
}
try {
  if (!before) check('The experiment destination is read from explicit root configuration', !!config && ['continuous-up'].includes(config.destination) && Number.isFinite(config.cooldownMs), config);
  await phase('Normal and moderate native browsing', async () => {
    const { context, page } = await open(); try {
      for (const [label, delta, delay, count] of [['Ordinary', 80, 140, 8], ['Moderately fast', 220, 60, 8], ['One accidental large notch', 3000, 50, 1]]) {
        await position(page, 1900); await trace(page); await wheel(page, delta, delay, count); await page.waitForTimeout(700); const frames = await trace(page, false), seen = movement(frames);
        check(`${label} wheel continues DOWN without automatic upward return`, seen.end > seen.start + Math.min(delta * count * .5, 1000) && seen.maximumDrawdown < 270, seen); report.journeys.push({ name: label, frames, seen });
      }
    } finally { await context.close(); }
  });
  await phase('Very-fast burst, recovery and rearm', async () => {
    const { context, page } = await open(); try {
      await position(page, 8000); await trace(page); const start = await page.evaluate(() => scrollY); await wheel(page, 500, 50, 32); await page.waitForTimeout(950); const first = await trace(page, false), firstMovement = movement(first), firstTarget = targetEvidence(first, start);
      check('A genuinely sustained very-fast500px/50ms burst physically sends the visitor UP', firstMovement.maximumDrawdown >= 900, { ...firstMovement, target: firstTarget });
      if (!before) check('Continued fast downward input reaches the landing, not Contact', firstTarget.configured && firstTarget.closest <= 3 && firstMovement.end <= 3, firstTarget);
      check('Reversal contains multiple upward movement steps, not an origin teleport', first.filter((f,i)=>i>0 && f.y < first[i-1].y-100).length >= 6, first.filter((f,i)=>i>0 && f.y < first[i-1].y-100)); await page.screenshot({ path: `${out}/first-return.png` }); report.journeys.push({ name: 'First very-fast burst', frames: first, seen: firstMovement, target: firstTarget });
      await page.waitForTimeout(config?.cooldownMs !== undefined ? config.cooldownMs + 100 : 1200);
      await trace(page); await wheel(page, 80, 140, 4); await page.waitForTimeout(350); const slow = await trace(page, false), slowMovement = movement(slow);
      check('After return, ordinary scrolling proceeds freely without a permanent lock', slowMovement.end > slowMovement.start + 160 && slowMovement.maximumDrawdown < 150, slowMovement);
      await trace(page); const secondStart = await page.evaluate(() => scrollY); await wheel(page, 500, 50, 32); await page.waitForTimeout(950); const second = await trace(page, false), secondMovement = movement(second), secondTarget = targetEvidence(second, secondStart);
      check('A second very-fast burst re-arms after the configured cooldown', secondMovement.maximumDrawdown >= 900, { ...secondMovement, target: secondTarget });
      if (!before) check('The rearmed return still uses the configured destination', secondTarget.configured && secondTarget.closest <= 90, secondTarget);
      report.journeys.push({ name: 'Ordinary browsing after return', frames: slow, seen: slowMovement }, { name: 'Rearmed burst', frames: second, seen: secondMovement, target: secondTarget });
      check('The exercised wheel inputs are trusted browser inputs', await page.evaluate(() => { const inputs = window.__fastReturnInputs.filter(e => e.type === 'wheel'); return inputs.length >= 24 && inputs.every(e => e.trusted); }));
    } finally { await context.close(); }
  });
  await phase('Keyboard and anchors', async () => {
    const { context, page } = await open(); try {
      await position(page, 1900); await trace(page); for (let i = 0; i < 5; i++) { await page.keyboard.press('PageDown'); await page.waitForTimeout(60); } await page.waitForTimeout(900); const keys = await trace(page, false), keysMovement = movement(keys);
      // Adaptive desktop layout can restore a few hundred pixels at idle. A
      // return in this experiment is the same one-viewport movement required
      // by its positive oracle, not that pre-existing material correction.
      check('Repeated native PageDown is exempt from automatic return', keysMovement.end > keysMovement.start + 1500 && keysMovement.maximumDrawdown < 900, keysMovement);
      await trace(page); await page.keyboard.press('End'); await page.waitForTimeout(1100); const end = await trace(page, false), endMovement = movement(end);
      check('Native End still reaches the footer without returning', end.at(-1).y >= end.at(-1).maxY - 90 && endMovement.maximumDrawdown < 270, endMovement);
      await page.locator('nav a[href="#projects"]').click(); await page.waitForTimeout(900); const anchor = await page.locator('#projects').evaluate(el => ({ hash: location.hash, top: el.getBoundingClientRect().top, y: scrollY }));
      check('A real navigation anchor reaches its requested section without return', anchor.hash === '#projects' && Math.abs(anchor.top) < 170, anchor); report.journeys.push({ name: 'Keyboard navigation', frames: keys, endFrames: end, anchor });
    } finally { await context.close(); }
  });
  await phase('Editable controls and image dialog', async () => {
    const { context, page } = await open(); try {
      const input = page.locator('#contact textarea'); await input.fill('Fast-scroll return verification'); await position(page, 1900); await page.mouse.move(1300, 500); await trace(page); await wheel(page, 500, 50, 10); await page.waitForTimeout(900); const editing = await trace(page, false), editMovement = movement(editing);
      check('A focused real editable field exempts a sustained fast wheel burst', editing.every(f => f.focused === 'TEXTAREA') && editMovement.end > editMovement.start + 3000 && editMovement.maximumDrawdown < 270 && await input.inputValue() === 'Fast-scroll return verification', editMovement);
      await page.locator('#project-hivo').evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' })); await page.getByRole('button', { name: 'Zoom in Hivo Studio', exact: true }).click(); const dialog = page.getByRole('dialog'); await dialog.waitFor(); await dialog.hover(); await trace(page); await wheel(page, 500, 50, 10); await page.waitForTimeout(700); const modal = await trace(page, false), modalMovement = movement(modal);
      check('Native wheel in an open image dialog never returns or navigates the page', modal.every(f => f.dialog) && Math.abs(modalMovement.end - modalMovement.start) < 3 && modalMovement.maximumDrawdown < 3, modalMovement); await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' }); check('Image dialog remains normally dismissible after the burst', await dialog.count() === 0);
      report.journeys.push({ name: 'Focused editable field', frames: editing, seen: editMovement }, { name: 'Dialog wheel', frames: modal, seen: modalMovement });
    } finally { await context.close(); }
  });
  await phase('Native touch', async () => {
    const { context, page } = await open(true); try {
      await position(page, 1900); const client = await context.newCDPSession(page); await trace(page);
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 650 }] });
      for (const y of [600, 540, 480]) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] }); await page.waitForTimeout(45); }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(900); const short = await trace(page, false), shortMovement = movement(short);
      check('A short moderate native touch flick stays free and does not bounce', shortMovement.end > shortMovement.start + 90 && shortMovement.maximumDrawdown < 200, shortMovement);
      check('The touch journey uses trusted native touch inputs and has no horizontal overflow', await page.evaluate(() => window.__fastReturnInputs.filter(e => e.type.startsWith('touch')).every(e => e.trusted) && document.documentElement.scrollWidth === innerWidth));
      report.journeys.push({ name: 'Native short touch flick', frames: short, seen: shortMovement, scope: 'This moderate flick does not claim to qualify as a sustained extremely-fast mobile fling.' }); await page.screenshot({ path: `${out}/mobile-short-flick.png` });
    } finally { await context.close(); }
  });
  check('No uncaught browser errors occurred', report.errors.length === 0, report.errors); report.sourceAfter = await source(); check('All native journeys belong to one coherent application source', report.sourceBefore === report.sourceAfter); report.passed = report.checks.every(c => c.passed);
} finally { await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failed: report.checks.filter(c => !c.passed).map(c => c.name), out })); if (!report.passed) process.exitCode = 1; }
