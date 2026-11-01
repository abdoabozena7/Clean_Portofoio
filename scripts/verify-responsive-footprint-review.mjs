import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = 'output/playwright/independent-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { baseline: 'baseline/pre-agent-construction', viewports: [], passed: false };
try {
  for (const width of [320, 600, 900, 1000]) {
    const observations = {};
    for (const [name, port] of [['original', 8081], ['modified', 8080]]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`http://127.0.0.1:${port}/Clean_Portofoio/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      const length = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < length; y += 450) {
        await page.evaluate(y => scrollTo(0, y), y);
        await page.waitForTimeout(35);
      }
      await page.waitForTimeout(900);
      observations[name] = await page.evaluate(() => {
        const round = n => Math.round(n * 1000) / 1000;
        const rect = el => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y + scrollY), width: round(r.width), height: round(r.height) }; };
        const sections = [...document.querySelectorAll('section:not([aria-live])')].map((el, index) => ({ id: el.id || (index === 0 ? 'hero' : 'finale'), rect: rect(el) }));
        const grid = document.querySelector('#projects > .grid');
        return { sections, projectGrid: rect(grid), gridRows: getComputedStyle(grid).gridTemplateRows, scrollWidth: document.documentElement.scrollWidth, innerWidth,
          cards: [...document.querySelectorAll('[data-project]')].map(el => ({ id: el.dataset.project, overflow: el.scrollHeight - el.clientHeight, actionBottom: el.querySelector('.project-actions').getBoundingClientRect().bottom - el.getBoundingClientRect().bottom })),
          sizingFixturesRemaining: [...document.body.children].filter(el => el.hasAttribute('inert') && el.getAttribute('aria-hidden') === 'true' && getComputedStyle(el).visibility === 'hidden').length };
      });
      if (name === 'modified') {
        await page.locator('#projects').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/responsive-${width}.png` });
      }
      await page.close();
    }
    assert.deepEqual(observations.modified.sections, observations.original.sections, `${width}px all section rectangles must match original`);
    assert.deepEqual(observations.modified.projectGrid, observations.original.projectGrid, `${width}px original grid footprint`);
    assert.equal(observations.modified.scrollWidth, observations.original.scrollWidth, `${width}px no introduced horizontal overflow`);
    assert.equal(observations.modified.sizingFixturesRemaining, 0, `${width}px temporary sizing fixture removed`);
    assert(observations.modified.cards.every(card => card.overflow === 0 && card.actionBottom < 0), `${width}px card content contained`);
    report.viewports.push({ width, ...observations, passed: true });
    console.log(`${width}px: all sections and original grid footprint match; temporary fixture removed; cards contained`);
  }
  report.passed = true;
} catch (error) { report.failure = error.stack; throw error; }
finally {
  await writeFile(`${output}/responsive-footprint-report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, viewports: report.viewports.map(item => item.width), failure: report.failure }));
}
