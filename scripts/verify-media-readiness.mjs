import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

// The response gates are installed before navigation because the application
// may prewarm media. Success paths deliver unmodified real origin payloads.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const out = process.env.MEDIA_READINESS_OUT || 'output/playwright/media-readiness';
await mkdir(out, { recursive: true });
const digest = value => createHash('sha256').update(value).digest('hex');
async function fingerprint() {
  const files = [];
  async function walk(dir) {
    for (const file of await readdir(dir, { withFileTypes: true })) {
      const path = `${dir}/${file.name}`;
      if (file.isDirectory()) await walk(path); else files.push(path);
    }
  }
  await walk('src');
  const hash = createHash('sha256');
  for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); }
  return hash.digest('hex');
}
function gate() {
  let release;
  const promise = new Promise(resolve => { release = resolve; });
  return { promise, release };
}
const report = {
  url, capturedAt: new Date().toISOString(), sourceBefore: await fingerprint(),
  verifier: digest(await readFile(new URL(import.meta.url))), checks: [], journeys: [], transports: [], errors: [], passed: false,
  evidenceClass: 'Real Edge and actual app. Delayed success responses use unmodified real origin payloads. A separate scenario deliberately supplies an HTTP500 calendar error.',
  normalization: 'html scroll-behavior:auto for repeatable scroll entry; no implementation substitutions or real-content mutations',
};
const check = (name, passed, evidence) => {
  report.checks.push({ name, passed: !!passed, evidence });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
};
const phase = async (name, run) => {
  try { await run(); } catch (error) { check(`${name}: journey completes`, false, error.stack); }
};
const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function open() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  return { context, page };
}
async function navigate(page) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
}
async function enter(page, locator, steps = 22) {
  await locator.evaluate(element => scrollTo({ top: scrollY + element.getBoundingClientRect().top - innerHeight - 35, behavior: 'instant' }));
  // Finish only the positioning jump. The target remains below the viewport.
  await page.waitForTimeout(450);
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, 18); await page.waitForTimeout(75); }
}
async function realResponseGate(context, pattern, responseGate, kind) {
  await context.route(pattern, async route => {
    try {
      const response = await route.fetch({ timeout: 20000 });
      const body = await response.body();
      const entry = { kind, evidence: 'Unmodified real origin response, delivery delayed by the verifier', url: route.request().url(), status: response.status(), bytes: body.length, sha256: digest(body) };
      if (kind === 'calendar') {
        try { const data = JSON.parse(body.toString()); entry.contributions = data.contributions?.length || 0; } catch { entry.invalidJson = true; }
      }
      await responseGate.promise;
      report.transports.push(entry);
      await route.fulfill({ response, body });
    } catch (error) {
      report.transports.push({ kind, evidence: 'Origin transport failed; no success fixture substituted', error: String(error) });
      await route.abort('failed').catch(() => {});
    }
  });
}
async function sample(locator) {
  return locator.evaluate(element => {
    const painted = target => {
      if (!target) return false;
      for (let node = target; node && node !== document.documentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || +style.opacity < .025) return false;
        if (style.clipPath.startsWith('inset(')) {
          const rect = node.getBoundingClientRect(), parts = style.clipPath.slice(6).split(')')[0].split(' round ')[0].trim().split(/\s+/);
          const values = parts.length === 1 ? [parts[0], parts[0], parts[0], parts[0]] : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]] : parts.length === 3 ? [parts[0], parts[1], parts[2], parts[1]] : parts;
          const px = (value, size) => parseFloat(value) * (value.includes('%') ? size / 100 : 1);
          if (px(values[1], rect.width) + px(values[3], rect.width) >= rect.width - .2 || px(values[0], rect.height) + px(values[2], rect.height) >= rect.height - .2) return false;
        }
      }
      return true;
    };
    const image = element.querySelector('img'), rect = element.getBoundingClientRect();
    const activity = element.matches('[data-construction-scene="activity"]') ? element : element.querySelector('[data-construction-scene="activity"]');
    const weeks = [...new Set([...element.querySelectorAll('rect[data-date]')].map(cell => cell.parentElement))];
    const actors = [...document.querySelectorAll('.scene-prop')].filter(prop => +getComputedStyle(prop.parentElement).opacity > .05 && prop.dataset.sceneId === element.dataset.sceneId).map(prop => ({
      operation: prop.dataset.sceneOperation, target: prop.dataset.sceneTarget, rect: prop.getBoundingClientRect().toJSON(),
      decodedImage: [...prop.querySelectorAll('img')].some(img => img.complete && img.naturalWidth > 0 && painted(img)),
    }));
    return {
      at: performance.now(), state: element.dataset.sceneState, building: element.hasAttribute('data-scene-building'), scene: element.dataset.sceneId,
      box: { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height }, viewportTop: rect.top,
      masks: element.querySelectorAll('[data-building]').length,
      image: image ? { complete: image.complete, naturalWidth: image.naturalWidth, painted: painted(image), src: image.currentSrc || image.src } : null,
      ready: !!activity?.hasAttribute('data-activity-ready'), hostPainted: painted(activity),
      cellCount: element.querySelectorAll('rect[data-date]').length, weekCount: weeks.length, registeredWeeks: weeks.filter(week => week.hasAttribute('data-scene-target-id')).length,
      weekOpacities: weeks.map(week => +getComputedStyle(week).opacity), actors,
      errorText: activity?.textContent?.includes('Error – Fetching GitHub contribution data') || false,
    };
  });
}
async function waitComplete(locator, timeout = 10000) {
  await locator.evaluate((element, timeoutMs) => new Promise((resolve, reject) => {
    const started = performance.now();
    const timer = setInterval(() => {
      if (element.dataset.sceneState === 'complete' && !element.querySelector('[data-building],[data-scene-building]')) { clearInterval(timer); resolve(); }
      else if (performance.now() - started > timeoutMs) { clearInterval(timer); reject(new Error('Real content did not finish construction within the observation window')); }
    }, 40);
  }), timeout);
}
const dataSignature = async locator => digest(await locator.evaluate(element => JSON.stringify([...element.querySelectorAll('rect[data-date]')].map(cell => [cell.getAttribute('data-date'), cell.getAttribute('data-level'), cell.getAttribute('fill')]))));

try {
  await phase('Delayed image and real calendar', async () => {
    const { context, page } = await open();
    const imageGate = gate(), calendarGate = gate();
    try {
      await realResponseGate(context, '**/images/projects/ya-rab-ostorha.png*', imageGate, 'screenshot');
      await realResponseGate(context, 'https://github-contributions-api.jogruber.de/**', calendarGate, 'calendar');
      await navigate(page);
      const project = page.locator('[data-project="ya-rab-ostorha"]');
      await enter(page, project); await page.waitForTimeout(3600);
      const pendingImage = await sample(project);
      await page.screenshot({ path: `${out}/image-pending.png` });
      check('An undecoded screenshot stays behind its measured slot without completing the scene', pendingImage.state !== 'complete' && pendingImage.building && pendingImage.image && !pendingImage.image.complete && pendingImage.image.naturalWidth === 0 && !pendingImage.image.painted, pendingImage);
      imageGate.release();
      await project.locator('img').evaluate(image => image.decode());
      const imageFrames = [];
      for (let i = 0; i < 35; i++) {
        const frame = await sample(project); imageFrames.push(frame);
        if (frame.actors.some(actor => ['drag', 'replace'].includes(actor.operation) && actor.decodedImage) && !frame.image.painted) await page.screenshot({ path: `${out}/image-decoded-placement.png` });
        await page.waitForTimeout(40);
      }
      await waitComplete(project);
      const finalImage = await sample(project);
      check('Decoded screenshot pixels visibly move in an agent prop before native image handoff', imageFrames.some(frame => frame.actors.some(actor => ['drag', 'replace'].includes(actor.operation) && actor.decodedImage) && !frame.image.painted), { observedFrames: imageFrames.length, decodedPlacementFrames: imageFrames.filter(frame => frame.actors.some(actor => actor.decodedImage)).length });
      check('The real screenshot completes decoded and readable without residual masks', finalImage.state === 'complete' && finalImage.masks === 0 && finalImage.image.complete && finalImage.image.naturalWidth > 0 && finalImage.image.painted, finalImage);
      check('Delayed screenshot construction preserves its real document geometry', ['x', 'y', 'width', 'height'].every(key => Math.abs(pendingImage.box[key] - finalImage.box[key]) <= 1), { pending: pendingImage.box, final: finalImage.box });
      await page.screenshot({ path: `${out}/image-complete.png` });
      report.journeys.push({ name: 'Delayed screenshot', pending: pendingImage, frames: imageFrames, final: finalImage });

      const activity = page.locator('[data-construction-scene="activity"]').locator('..');
      await enter(page, activity); await page.waitForTimeout(2700);
      const pendingCalendar = await sample(activity);
      await page.screenshot({ path: `${out}/calendar-pending.png` });
      check('Calendar placeholder pixels stay masked while genuine data is pending', pendingCalendar.state !== 'complete' && pendingCalendar.building && !pendingCalendar.ready && !pendingCalendar.hostPainted && pendingCalendar.registeredWeeks === 0, pendingCalendar);
      calendarGate.release();
      await page.waitForFunction(() => document.querySelector('[data-construction-scene="activity"]')?.hasAttribute('data-activity-ready'), {}, { timeout: 20000 });
      const initialData = await dataSignature(activity), calendarFrames = [];
      let savedPartial = false;
      for (let i = 0; i < 45; i++) {
        const frame = await sample(activity); calendarFrames.push(frame);
        if (!savedPartial && frame.weekOpacities.some(opacity => opacity > .025 && opacity < .99) && frame.weekOpacities.some(opacity => opacity < .025)) {
          await page.screenshot({ path: `${out}/calendar-partial.png` }); savedPartial = true;
        }
        await page.waitForTimeout(40);
      }
      await waitComplete(activity);
      const finalCalendar = await sample(activity), finalData = await dataSignature(activity);
      check('Real calendar weeks register before visibly progressing through partial and hidden groups', calendarFrames.some(frame => frame.ready && frame.registeredWeeks > 40 && frame.weekOpacities.some(opacity => opacity > .025 && opacity < .99) && frame.weekOpacities.some(opacity => opacity < .025)), { partialFrameSaved: savedPartial, registeredWeeks: finalCalendar.registeredWeeks });
      check('All genuine calendar cells finish painted with their original dates and intensities', finalCalendar.state === 'complete' && finalCalendar.masks === 0 && finalCalendar.cellCount > 350 && finalCalendar.registeredWeeks > 40 && finalCalendar.weekOpacities.every(opacity => opacity >= .99) && initialData === finalData, { final: finalCalendar, initialData, finalData });
      await page.screenshot({ path: `${out}/calendar-complete.png` });
      report.journeys.push({ name: 'Delayed genuine calendar', pending: pendingCalendar, frames: calendarFrames, final: finalCalendar, initialData, finalData });
      check('Success evidence used decoded local screenshot and genuine calendar origin payloads', report.transports.some(response => response.kind === 'screenshot' && response.status === 200 && response.bytes > 0) && report.transports.some(response => response.kind === 'calendar' && response.status === 200 && response.contributions > 350), report.transports);
    } finally { imageGate.release(); calendarGate.release(); await context.close(); }
  });

  await phase('Calendar HTTP500 recovery', async () => {
    const { context, page } = await open(), failureGate = gate();
    try {
      await context.route('https://github-contributions-api.jogruber.de/**', async route => {
        await failureGate.promise;
        const body = JSON.stringify({ error: 'Controlled HTTP500 readiness regression' });
        report.transports.push({ kind: 'calendar-error', evidence: 'Deliberately supplied HTTP500 failure response; this is not live transport evidence', status: 500, sha256: digest(body), bytes: Buffer.byteLength(body) });
        await route.fulfill({ status: 500, contentType: 'application/json', body });
      });
      await navigate(page);
      const activity = page.locator('[data-construction-scene="activity"]').locator('..');
      await enter(page, activity); await page.waitForTimeout(900);
      const pending = await sample(activity);
      failureGate.release();
      await page.waitForFunction(() => document.querySelector('[data-construction-scene="activity"]')?.textContent?.includes('Error – Fetching GitHub contribution data'), {}, { timeout: 10000 });
      await waitComplete(activity);
      const final = await sample(activity);
      check('A calendar HTTP500 exposes the real readable error fallback without permanent masks', !pending.ready && final.errorText && final.hostPainted && final.state === 'complete' && final.masks === 0 && !final.building, { pending, final });
      await page.screenshot({ path: `${out}/calendar-http500-fallback.png` });
      report.journeys.push({ name: 'Controlled calendar HTTP500', pending, final });
    } finally { failureGate.release(); await context.close(); }
  });

  await phase('Completed template resize', async () => {
    const { context, page } = await open();
    try {
      await navigate(page);
      const rows = page.locator('#experience [data-experience-item]'), source = rows.nth(0), destination = rows.nth(1);
      // Complete only the first visible record; the second remains below the fold.
      await source.evaluate(element => scrollTo({ top: scrollY + element.getBoundingClientRect().top - 835, behavior: 'instant' }));
      await waitComplete(source); await page.waitForTimeout(450);
      const before = { source: await sample(source), destination: await sample(destination) };
      check('Resize precondition retains a completed template and an unstarted later record', before.source.state === 'complete' && before.destination.state === 'unstarted', before);
      const targetId = await destination.getAttribute('data-scene-target-id');
      // Native viewport resize can itself expose the next row. Observe before
      // resizing so that this real entry cannot outrun a Node-side polling loop.
      await page.evaluate(target => {
        const probe = { frames: [], timer: 0 }; window.__mediaReadinessResizeProbe = probe;
        probe.timer = setInterval(() => {
          const rows = document.querySelectorAll('#experience [data-experience-item]'), source = rows[0], destination = rows[1];
          const sourceBox = source.getBoundingClientRect(), destinationBox = destination.getBoundingClientRect();
          const copies = [...document.querySelectorAll('.scene-prop[data-scene-operation="duplicate"]')].filter(prop => prop.dataset.sceneTarget === target && +getComputedStyle(prop.parentElement).opacity > .05 && prop.querySelector('.scene-snapshot')).map(prop => {
            const rect = prop.getBoundingClientRect(), style = getComputedStyle(prop);
            return { rect: rect.toJSON(), boxSizing: style.boxSizing, empty: !prop.querySelector('img') && !prop.textContent.trim() };
          });
          probe.frames.push({ at: performance.now(), viewportWidth: innerWidth, source: sourceBox.toJSON(), destination: destinationBox.toJSON(), state: destination.dataset.sceneState, copies });
        }, 16);
      }, targetId);
      await page.setViewportSize({ width: 768, height: 900 }); await page.waitForTimeout(80);
      const resized = { source: await sample(source), destination: await sample(destination) };
      let savedCopy = false;
      for (let i = 0; i < 70; i++) {
        if (i < 16 && i % 5 === 0) await page.mouse.wheel(0, 24);
        const frame = await page.evaluate(() => window.__mediaReadinessResizeProbe.frames.at(-1));
        if (!savedCopy && frame.copies.length) { await page.screenshot({ path: `${out}/completed-template-resize-copy.png` }); savedCopy = true; }
        await page.waitForTimeout(16);
      }
      const frames = await page.evaluate(() => { const probe = window.__mediaReadinessResizeProbe; clearInterval(probe.timer); delete window.__mediaReadinessResizeProbe; return probe.frames; });
      const copies = frames.filter(frame => frame.viewportWidth === 768).flatMap(frame => frame.copies.map(copy => ({ ...copy, source: frame.source, destination: frame.destination })));
      const moved = Math.abs(before.source.box.x - resized.source.box.x) > 100 && Math.abs(before.source.box.width - resized.source.box.width) > 100;
      check('Resizing a completed template remeasures the next empty copy from its current bounds', moved && before.destination.state === 'unstarted' && copies.length >= 2 && copies.every(copy => copy.empty && Math.abs(copy.rect.left - copy.source.left) <= 2 && Math.abs(copy.rect.width - copy.source.width) <= 2), { before, resized, observedCopies: copies.length, examples: copies.slice(0, 6) });
      await page.screenshot({ path: `${out}/completed-template-resize.png` });
      report.journeys.push({ name: 'Completed template resize1440to768', before, resized, frames });
    } finally { await context.close(); }
  });
  check('No uncaught browser errors occurred', report.errors.length === 0, report.errors);
} catch (error) { report.failure = error.stack; }
finally {
  await browser.close();
  report.sourceAfter = await fingerprint();
  check('Every readiness journey belongs to one coherent implementation source', report.sourceBefore === report.sourceAfter, { before: report.sourceBefore, after: report.sourceAfter });
  report.passed = !report.failure && report.checks.every(result => result.passed);
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failed: report.checks.filter(result => !result.passed).map(result => result.name), out }));
  if (!report.passed) process.exitCode = 1;
}
