import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [before, after, out = 'output/mobile-performance/quality'] = process.argv.slice(2);
assert(before && after, 'Provide baseline and candidate production URLs.');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { before, after, browser: browser.version(), geometry: [], journeys: [], negative: null };

async function open(url, width, height, mobile, video = false) {
  const context = await browser.newContext({
    viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1,
    ...(video ? { recordVideo: { dir: out, size: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 } } } : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

async function geometry(page) {
  return page.evaluate(() => {
    const selector = 'nav,main,section[id],h1,h2,[data-project] h3,.project-media,.certificate-image-trigger,.experience-brand,.credential-copy';
    const elements = [...document.querySelectorAll(selector)].map((node, index) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { index, text: node.matches('h1,h2,h3') ? node.textContent : '', bounds: [x + scrollX, y + scrollY, width, height] };
    });
    return { elements, horizontalOverflow: document.documentElement.scrollWidth - innerWidth };
  });
}

function maxDelta(a, b) {
  assert.equal(a.elements.length, b.elements.length, 'Measured element count');
  return Math.max(...a.elements.flatMap((element, index) => {
    assert.equal(element.text, b.elements[index].text, 'Measured heading text');
    return element.bounds.map((number, i) => Math.abs(number - b.elements[index].bounds[i]));
  }));
}

async function visitMedia(page) {
  for (const section of await page.locator('section[id]').all()) {
    await section.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
}

async function motionAndControls(label, url, mobile) {
  const { context, page, errors } = await open(url, mobile ? 390 : 1440, mobile ? 844 : 900, mobile, true);
  const shotNames = new Set();
  const screenshots = [];
  let video;
  try {
    const hero = page.locator('#hero');
    const workshop = page.locator('[data-name-assembly]');
    for (const phase of ['carry', 'resize', 'duplicate', 'punctuate', 'align']) {
      await page.waitForFunction(expected => document.querySelector('[data-name-assembly]')?.dataset.nameShot === expected, phase, { polling: 'raf', timeout: 10000 });
      shotNames.add(phase);
    }
    await page.waitForFunction(() => document.querySelector('h1')?.dataset.constructed === 'true');
    assert.equal(await hero.locator('[data-hero-agent]').count(), 3, 'Three hero characters are retained');
    assert.equal(await workshop.locator('[data-name-piece]').count(), 4);
    await page.waitForTimeout(1800);
    const screenshot = async name => {
      const file = path.join(out, label + '-' + (mobile ? 'mobile' : 'desktop') + '-' + name + '.png');
      await page.screenshot({ path: file });
      screenshots.push(file);
    };
    await screenshot('hero');
    if (mobile) {
      await page.getByRole('button', { name: 'Menu', exact: true }).tap();
      await page.getByRole('link', { name: 'Projects', exact: true }).tap();
      await page.waitForURL('**/#projects');
    }
    await page.locator('#project-hivo').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const zoom = page.getByRole('button', { name: 'Zoom in Hivo Studio', exact: true });
    await zoom.waitFor();
    await page.locator('#project-hivo .project-image-trigger img').evaluate(image => image.decode());
    await screenshot('projects');
    const zoomImage = page.getByRole('dialog').locator('img');
    const client = mobile ? await context.newCDPSession(page) : null;
    if (client) await client.send('Performance.enable');
    const memory = async () => {
      await client.send('HeapProfiler.collectGarbage');
      const { metrics } = await client.send('Performance.getMetrics');
      return Object.fromEntries(metrics.filter(m => ['JSHeapUsedSize', 'Nodes'].includes(m.name)).map(m => [m.name, m.value]));
    };
    const reopenMemory = [];
    let zoomSize;
    for (let i = 0; i < (label === 'after' && mobile ? 10 : 1); i++) {
      await zoom.click();
      zoomSize = await zoomImage.evaluate(async image => {
        await image.decode();
        return [image.naturalWidth, image.naturalHeight, image.currentSrc.split('/').at(-1)];
      });
      assert.deepEqual(zoomSize, [1920, 1020, 'hivo.png']);
      if (i === 0) await screenshot('zoom');
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      if (client && (i === 1 || i === 9)) {
        await page.waitForTimeout(300);
        reopenMemory.push(await memory());
      }
    }
    if (reopenMemory.length === 2) {
      assert(reopenMemory[1].Nodes <= reopenMemory[0].Nodes + 30, 'Zoom should release dialog nodes');
      assert(reopenMemory[1].JSHeapUsedSize <= reopenMemory[0].JSHeapUsedSize * 1.15, 'Zoom should release retained JavaScript objects');
    }
    const certificate = page.locator('#education .certificate-image-trigger').first();
    await certificate.click();
    const certificateSize = await zoomImage.evaluate(async image => {
      await image.decode();
      return [image.naturalWidth, image.naturalHeight, image.currentSrc.split('/').at(-1)];
    });
    assert.deepEqual(certificateSize, [489, 695, 'hit-summer-school-2025.jpg']);
    await screenshot('certificate');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const score = page.getByRole('button', { name: /Open score details/ });
    await score.click();
    await page.getByRole('region', { name: 'Score details' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('region', { name: 'Score details' }).waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Open Terminal', exact: true }).click();
    const focused = page.locator('input:focus');
    await focused.fill('help');
    await focused.press('Enter');
    await page.getByText('Learn about me', { exact: true }).waitFor();
    await screenshot('terminal');
    await focused.fill('clear');
    await focused.press('Enter');
    await page.getByText('Learn about me', { exact: true }).waitFor({ state: 'hidden' });
    await page.keyboard.press('Escape');
    const contact = page.locator('#contact form');
    assert.equal(await contact.evaluate(form => form.checkValidity()), false);
    await contact.locator('input[type="text"]').fill('Local verification');
    await contact.locator('input[type="email"]').fill('verification@example.test');
    await contact.locator('textarea').fill('Local verification');
    assert.equal(await contact.evaluate(form => form.checkValidity()), true);
    if (mobile) {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    }
    assert.deepEqual(errors, [], 'No runtime errors');
    video = page.video();
    return { label, mobile, phases: [...shotNames], zoomSize, certificateSize, reopenMemory, screenshots, errors, video };
  } finally { await context.close(); }
}

async function mediaRecoveryAndExposure() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 2, reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/images/projects/hivo-*.webp', async route => {
      await gate;
      await route.abort('failed');
    });
    const request = page.waitForRequest(r => /hivo-\d+\.webp$/.test(r.url()));
    await page.goto(after + '#project-hivo', { waitUntil: 'domcontentloaded' });
    const media = page.locator('#project-hivo .project-media');
    await media.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await request;
    const beforeBox = await media.boundingBox();
    await page.waitForTimeout(500);
    release();
    await page.waitForFunction(() => {
      const image = document.querySelector('#project-hivo .project-image-trigger img');
      return image?.complete && image.naturalWidth === 1920 && image.currentSrc.endsWith('/hivo.png');
    });
    const afterBox = await media.boundingBox();
    for (const key of ['width', 'height']) assert(Math.abs(beforeBox[key] - afterBox[key]) <= 1);
    const story = page.locator('[data-attention-id="experience-microsoft"]');
    await story.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const initial = Number(await story.getAttribute('data-quality'));
    await page.waitForFunction(initial => {
      const story = document.querySelector('[data-attention-id="experience-microsoft"]');
      return Number(story?.dataset.quality) > initial;
    }, initial, { timeout: 10000 });
    assert.deepEqual(errors, []);
    return { beforeBox, afterBox, recoveredOriginal: true, exposure: [initial, Number(await story.getAttribute('data-quality'))] };
  } finally { await context.close(); }
}

try {
  for (const [width, height, mobile] of [[360, 800, true], [390, 844, true], [430, 932, true], [768, 1024, true], [1366, 768, false], [1440, 900, false]]) {
    const results = [];
    for (const url of [before, after]) {
      const { context, page, errors } = await open(url, width, height, mobile);
      try {
        await visitMedia(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(180);
        results.push(await geometry(page));
        if (width === 390 && url === after) {
          await page.locator('.project-media').first().evaluate(node => { node.style.width = '80%'; });
          report.negative = maxDelta(results[0], await geometry(page)) > 1;
        }
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
    const delta = maxDelta(...results);
    report.geometry.push({ width, elements: results[0].elements.length, delta, overflow: results.map(result => result.horizontalOverflow) });
    assert(delta <= 1, 'Unexpected geometry delta at width ' + width + ': ' + delta);
    assert.deepEqual(results.map(result => result.horizontalOverflow), [0, 0]);
  }
  assert.equal(report.negative, true, 'Geometry verifier detects a shrunken picture');
  for (const [label, url] of [['before', before], ['after', after]]) {
    for (const mobile of [true, false]) {
      const { video, ...journey } = await motionAndControls(label, url, mobile);
      report.journeys.push({ ...journey, video: await video.path() });
    }
  }
  report.recovery = await mediaRecoveryAndExposure();
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
