import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const output = 'output/playwright/fast-scroll-popup';
const titles = ["What's the rush?", 'Nice try.', 'Easy, speedrunner.', 'Plot twist.', 'Hold your horses.', 'That was quick.', 'Already in a hurry?'];
const subtitles = ["We haven't even met properly.", "You're not skipping the good part.", "This isn't a race to the footer.", "We're going back to the beginning.", "I haven't shown you the cool stuff yet.", "At least pretend you're interested.", 'Come on, enjoy the ride.'];
const variants = ['ticket', 'terminal', 'note', 'editorial', 'layers', 'glitch'];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const errors = [];

async function open(options) {
  const page = await browser.newPage(options);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('#honors').waitFor({ state: 'attached' });
  await position(page);
  return page;
}
async function position(page) {
  await page.evaluate(() => scrollTo({ top: 3900, behavior: 'instant' }));
  await page.waitForTimeout(350);
}
const scrollY = page => page.evaluate(() => window.scrollY);
const cue = page => page.locator('.section-return-cue');

try {
  const desktop = await open({ viewport: { width: 1440, height: 900 } });
  for (let index = 0; index < titles.length; index++) {
    const before = await scrollY(desktop);
    await desktop.mouse.wheel(0, 500);
    await desktop.waitForTimeout(290);
    assert.ok(await scrollY(desktop) < before - 450, 'A first strong command still goes up');
    assert.equal(await cue(desktop).getAttribute('data-variant'), variants[index % variants.length]);
    assert.equal(await cue(desktop).locator('strong').textContent(), titles[index]);
    assert.equal(await cue(desktop).locator('.return-popup span').textContent(), subtitles[index]);
    assert.equal(await cue(desktop).locator('.return-popup').count(), 1);
    assert.ok(await cue(desktop).evaluate(el => {
      const popup = el.querySelector('.return-popup');
      const accent = getComputedStyle(el).getPropertyValue('--interaction-accent');
      return getComputedStyle(popup).getPropertyValue('--interaction-accent') === accent && getComputedStyle(el).boxShadow.includes(accent);
    }), 'Popup and glow share their computed accent');
    if (index < variants.length) await desktop.screenshot({ path: `${output}/${variants[index]}.png` });
    await desktop.keyboard.press('Shift'); // Discrete run with a fresh attempt counter, while the copy rotates for the visit.
    await position(desktop);
  }
  console.log('PASS seven exact titles, six variations, synchronized colors and no duplicate popup');

  const attempts = [];
  for (let index = 0; index < 3; index++) {
    const before = await scrollY(desktop);
    await desktop.mouse.wheel(0, 500);
    await desktop.waitForTimeout(index === 2 ? 100 : 330);
    attempts.push(await scrollY(desktop) - before);
  }
  assert.ok(attempts[0] < 0 && attempts[1] < 0 && attempts[2] > 0, JSON.stringify(attempts));
  assert.equal(await desktop.locator('html').getAttribute('data-browsing'), 'scan');
  assert.equal(await cue(desktop).locator('.return-popup').count(), 0);
  await desktop.mouse.wheel(0, 40);
  await desktop.waitForFunction(() => !document.documentElement.dataset.browsing);
  console.log('PASS repeated fast wheel advances in scan mode, ordinary wheel restores detail');

  const mobile = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await mobile.context().newCDPSession(mobile);
  const point = (type, y) => touch.send('Input.dispatchTouchEvent', { type, touchPoints: y === undefined ? [] : [{ x: 195, y }] });
  const swipe = async () => {
    await point('touchStart', 700);
    await mobile.waitForTimeout(25);
    await point('touchMove', 370);
  };
  const start = await scrollY(mobile);
  await swipe();
  assert.ok(await scrollY(mobile) < start - 300);
  await point('touchEnd');
  await mobile.waitForTimeout(280);
  assert.ok(await cue(mobile).evaluate(el => {
    const rect = el.getBoundingClientRect(), nav = document.querySelector('nav');
    return el.parentElement === document.body && rect.top === 0 && rect.left === 0 && rect.bottom === innerHeight && rect.right === innerWidth && Number(getComputedStyle(el).zIndex) > Number(getComputedStyle(nav).zIndex) && getComputedStyle(el).pointerEvents === 'none';
  }), 'Glow covers all four viewport edges above the mobile navbar');
  await mobile.screenshot({ path: `${output}/mobile-glow.png` });
  await mobile.getByRole('button', { name: 'Menu', exact: true }).tap();
  assert.equal(await mobile.getByRole('button', { name: 'Close', exact: true }).getAttribute('aria-expanded'), 'true');
  assert.ok(await mobile.locator('nav a[href="#education"]:visible').isVisible());
  await mobile.getByRole('button', { name: 'Close', exact: true }).tap();
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  console.log('PASS mobile glow reaches above MENU and menu remains usable');

  await mobile.keyboard.press('Shift');
  await position(mobile);
  const mobileAttempts = [];
  for (let index = 0; index < 3; index++) {
    const before = await scrollY(mobile);
    await swipe();
    mobileAttempts.push(await scrollY(mobile) - before);
    if (index < 2) { await point('touchEnd'); await mobile.waitForTimeout(300); }
  }
  assert.ok(mobileAttempts[0] < 0 && mobileAttempts[1] < 0 && mobileAttempts[2] > 0, JSON.stringify(mobileAttempts));
  assert.equal(await mobile.locator('html').getAttribute('data-browsing'), 'scan');
  await mobile.waitForTimeout(90);
  await point('touchMove', 345);
  await point('touchEnd');
  await mobile.waitForFunction(() => !document.documentElement.dataset.browsing);
  console.log('PASS repeated fast touch advances in scan mode and slower touch restores detail');

  const reduced = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await reduced.mouse.wheel(0, 500);
  await reduced.waitForTimeout(100);
  assert.equal(await cue(reduced).getAttribute('data-visible'), 'true');
  assert.equal(await cue(reduced).locator('.return-popup').evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.ok(await cue(reduced).evaluate(el => getComputedStyle(el).transitionDuration.split(',').every(duration => parseFloat(duration) < .001)));
  await reduced.goto(`${url}#education`);
  const harbin = reduced.locator('[data-attention-id="education-harbin"]');
  await harbin.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 240, behavior: 'instant' }));
  await reduced.waitForTimeout(350);
  for (let i = 0; i < 6; i++) {
    await reduced.mouse.wheel(0, 160);
    await reduced.waitForTimeout(75);
  }
  assert.ok(await harbin.evaluate(el => el.getBoundingClientRect().bottom < 76), 'The visitor passed the Harbin highlight');
  await reduced.waitForTimeout(1500);
  assert.equal(await reduced.locator('.quick-pass-cue').count(), 0);
  await reduced.getByRole('button', { name: /Open score details/ }).click();
  assert.ok(await reduced.locator('[data-exploration-map]').isVisible());
  await reduced.keyboard.press('Escape');
  console.log('PASS passing Harbin produces no revisit reminder and manual score details still open');
  await harbin.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 200, behavior: 'instant' }));
  await reduced.waitForFunction(() => Number(document.querySelector('[data-attention-id="education-harbin"]').style.getPropertyValue('--exploration-evidence')) > .15);
  assert.ok(await harbin.evaluate(el => {
    const rail = getComputedStyle(el);
    const shadow = getComputedStyle(el.querySelector('.certificate-image-trigger'), '::after');
    const fill = rail.getPropertyValue('--credential-fill');
    return parseFloat(fill) > 15 && rail.borderImageSource.includes(fill.trim()) &&
      shadow.getPropertyValue('--credential-fill') === fill && shadow.backgroundImage.includes('linear-gradient') &&
      shadow.pointerEvents === 'none';
  }));
  await reduced.screenshot({ path: `${output}/credential-progress.png` });
  assert.equal(await reduced.locator('#about p').count(), 3);
  assert.ok(await reduced.locator('#about').getByText('Abdelrahman', { exact: true }).count());
  assert.match(await reduced.locator('#about p').first().textContent(), /^I didn’t start coding with a five-year plan\./);
  assert.deepEqual(errors, []);
  console.log('PASS reduced motion, visible credential evidence, About copy and no runtime errors');
} finally {
  await browser.close();
}
