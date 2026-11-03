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
          briefDisplay: getComputedStyle(el.querySelector('.credential-description p')).display,
          story: el.querySelector('.credential-story') ? rect(el.querySelector('.credential-story')) : null,
          image: image ? { ...rect(image), ratio: image.naturalWidth / image.naturalHeight } : null,
          inset: parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft), rail: style.borderImageSource,
          railWidth: style.borderLeftWidth, background: style.backgroundColor,
        };
      });
      assert.ok(layout.row.left > layout.section.left && layout.row.right < layout.section.right);
      assert.equal(layout.railWidth, '2px');
      assert.match(layout.rail, /linear-gradient/);
      assert.equal(layout.background, 'rgba(0, 0, 0, 0)');
      assert.equal(layout.briefDisplay === 'none', !desktop);
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
          assert.ok(frame.top - header.bottom >= 20);
          if (layout.story) {
            assert.ok(layout.story.top - frame.bottom >= 16);
            assert.ok(Math.abs(description.bottom - row.bottom) < 1);
          } else assert.ok(Math.abs(frame.bottom - row.bottom) < 1, 'No empty description gap follows the certificate image');
        }
      } else if (desktop) assert.ok(layout.description.top - layout.header.bottom < 20);
      else assert.ok(Math.abs(layout.header.bottom - layout.row.bottom) < 1, 'Text-only credentials end after metadata');
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
    await page.locator('[data-attention-id="education-harbin"]').evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 160, behavior: 'instant' }));
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(350);
    const credentialGeometry = () => page.locator('[data-certificate]').evaluateAll(rows => rows.map(row => {
      const origin = row.getBoundingClientRect();
      return [row, ...row.querySelectorAll('.credential-copy,.credential-description,h3,p,[data-scan-detail],.certificate-thumb')].map(el => {
        const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
        const visibleBox = rect.width > 0 || rect.height > 0;
        return { x: visibleBox ? rect.left - origin.left : 0, y: visibleBox ? rect.top - origin.top : 0, width: rect.width, height: rect.height, opacity: style.opacity, font: style.font, display: style.display, inert: el.inert, hidden: el.getAttribute('aria-hidden') };
      });
    }));
    const detailed = await credentialGeometry();
    const experienceGeometry = () => page.locator('[data-experience-item]').evaluateAll(rows => rows.map(row => {
      const origin = row.getBoundingClientRect();
      return [row, ...row.querySelectorAll('.company-logo,.company-logo img,.experience-company,.experience-role')].map(el => {
        const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
        return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height, font: style.font, opacity: style.opacity, filter: style.filter, inert: el.inert };
      });
    }));
    const experience = await experienceGeometry();
    assert.equal(experience.length, 8);
    assert.equal(await page.locator('#experience p,.experience-date,.experience-detail').count(), 0);
    assert.ok(await page.locator('.company-logo img').evaluateAll(images => images.every(img => getComputedStyle(img).opacity === '1' && getComputedStyle(img).filter === 'none')));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    if (width < 768) {
      const client = await page.context().newCDPSession(page);
      for (let swipe = 0; swipe < 3; swipe++) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width / 2, y: height - 24 }] });
        for (let step = 1; step <= 8; step++) {
          await page.waitForTimeout(30);
          await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: width / 2, y: height - 24 - step * (height - 48) / 8 }] });
        }
        if (await page.locator('html').getAttribute('data-browsing') === 'scan') break;
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      assert.equal(await page.locator('html').getAttribute('data-browsing'), 'scan');
      assert.deepEqual(await credentialGeometry(), detailed, 'Fast touch keeps every credential image, title, brief, link and award at its detailed size');
      assert.deepEqual(await experienceGeometry(), experience, 'Experience retains its permanent logo, company and role presentation');
      assert.ok(await page.locator('.project-actions').evaluateAll(elements => elements.every(el => el.inert)), 'Project actions still collapse');
      await page.screenshot({ path: `${out}/${width}-fast-large-certificates.png` });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => !document.documentElement.dataset.browsing);
      assert.deepEqual(await credentialGeometry(), detailed);
      console.log(`PASS ${width}px: native fast touch keeps credentials and Experience stable while Projects adapt`);
    } else {
      for (let step = 0; step < 12; step++) { await page.mouse.wheel(0, Math.round(height * .2)); await page.waitForTimeout(50); }
      assert.equal(await page.locator('html').getAttribute('data-browsing'), 'scan');
      await page.waitForFunction(() => [...document.querySelectorAll('.credential-description [data-scan-detail]')].every(el => el.inert));
      assert.deepEqual(await experienceGeometry(), experience);
      await page.waitForFunction(() => !document.documentElement.dataset.browsing);
      assert.deepEqual(await credentialGeometry(), detailed);
    }
    assert.deepEqual(await experienceGeometry(), experience);
    await page.locator('#experience').evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 70, behavior: 'instant' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${width}-experience.png` });
    console.log(`PASS ${width}px: ${desktop ? 'side-by-side' : 'stacked'} credentials, proportional images, rails, zoom, award link and no overflow`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
