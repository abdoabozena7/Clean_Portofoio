import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const out = 'output/playwright/credential-layout';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const errors = [];

try {
  for (const [width, height] of [[1440, 900], [1366, 768], [768, 1024], [767, 1024], [390, 844], [320, 780]]) {
    const desktop = width >= 768;
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 768, isMobile: width < 768 });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'load' });
    const credentials = page.locator('[data-certificate]');
    const expected = { images: 6, textOnly: 2 };
    const measured = { images: 0, textOnly: 0 };
    for (const row of await credentials.all()) {
      const frame = row.locator('.certificate-image-trigger');
      if (await frame.count()) {
        await frame.scrollIntoViewIfNeeded();
        await frame.locator('img').evaluate(img => img.decode());
        measured.images++;
      } else measured.textOnly++;
      const layout = await row.evaluate(el => {
        const rect = node => node.getBoundingClientRect().toJSON();
        const frame = el.querySelector('.certificate-image-trigger');
        const image = frame?.querySelector('img');
        const style = getComputedStyle(el);
        return {
          row: rect(el), section: rect(el.closest('section')), header: rect(el.querySelector('.credential-copy')),
          description: rect(el.querySelector('.credential-description')), frame: frame ? rect(frame) : null,
          image: image ? { ...rect(image), ratio: image.naturalWidth / image.naturalHeight } : null,
          inset: parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft), rail: style.borderImageSource,
          railWidth: style.borderLeftWidth, background: style.backgroundColor,
        };
      });
      assert.ok(layout.row.left > layout.section.left && layout.row.right < layout.section.right);
      assert.equal(layout.railWidth, '2px');
      assert.match(layout.rail, /linear-gradient/);
      assert.equal(layout.background, 'rgba(0, 0, 0, 0)');
      assert.ok(Math.abs(layout.header.top - layout.row.top - (desktop ? 8 : 0)) < 1);
      if (layout.frame) {
        const { row, frame, header, image, inset, description } = layout;
        assert.ok(Math.abs(image.width / image.height - image.ratio) < .005);
        if (desktop) {
          assert.equal(frame.width, 200);
          assert.equal(frame.height, 140);
          assert.ok(Math.abs(frame.top - header.top) < 1 && Math.abs(frame.right - row.right) < 1);
          assert.ok(frame.left - Math.max(header.right, description.right) >= 23);
          assert.ok(description.top - header.bottom >= 11 && description.top - header.bottom <= 13);
          assert.ok(Math.abs(Math.max(frame.bottom, description.bottom) + 8 - row.bottom) < 1);
        } else {
          assert.ok(Math.abs(frame.width - Math.min(740, row.width - inset)) < 1);
          assert.ok(Math.abs((frame.left + frame.right) / 2 - (row.left + inset + row.right) / 2) < 1);
          assert.ok(frame.top - header.bottom >= 20 && description.top - frame.bottom >= 16);
          assert.ok(Math.abs(description.bottom - row.bottom) < 1);
        }
      } else assert.ok(layout.description.top - layout.header.bottom < 20);
    }
    assert.deepEqual(measured, expected);
    const impact = page.locator('[data-attention-id="honors-impact"]');
    const impactZoom = impact.getByRole('button', { name: /Zoom in/ });
    await impactZoom.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/${width}-impact.png` });
    if (desktop) await impactZoom.click(); else await impactZoom.tap();
    const dialog = page.getByRole('dialog');
    await dialog.locator('img').evaluate(img => img.decode());
    assert.match(await dialog.getByRole('heading').textContent(), /IMPACT Hackathon/);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await impact.getByRole('link', { name: 'The winning idea' }).getAttribute('href'), 'https://lnkd.in/p/eDP9zBzM');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    if (width === 1440) {
      await impact.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 160, behavior: 'instant' }));
      await page.waitForFunction(() => {
        const award = document.querySelector('[data-attention-id="honors-impact"]');
        const rail = getComputedStyle(award);
        const shadow = getComputedStyle(award.querySelector('.certificate-image-trigger'), '::after');
        return rail.getPropertyValue('--credential-fill').trim() === '100%' &&
          shadow.getPropertyValue('--credential-fill').trim() === '100%' &&
          rail.borderImageSource.includes('100%') && shadow.backgroundImage.match(/100%/g)?.length === 4;
      }, null, { timeout: 10000 });
      await page.screenshot({ path: `${out}/1440-progress-complete.png` });
      console.log('PASS desktop dwell fills the full rail and offset shadow');
    }
    console.log(`PASS ${width}px: ${desktop ? 'side-by-side' : 'stacked'} credentials, proportional images, rails, zoom, award link and no overflow`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
