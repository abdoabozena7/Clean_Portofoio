import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = 'output/playwright/cinematic'; await mkdir(output, { recursive: true });
async function fingerprint() {
  const files = []; async function walk(dir) { for (const f of await readdir(dir, { withFileTypes: true })) { const p = dir + '/' + f.name; if (f.isDirectory()) await walk(p); else files.push(p); } }
  await walk('src'); const hash = createHash('sha256'); for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); } return hash.digest('hex');
}
const report = { sourceBefore: await fingerprint(), checks: [], errors: [], samples: [], passed: false };
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, passed: true }); console.log(name); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: output, size: { width: 1440, height: 900 } } });
  const page = await context.newPage(); page.on('pageerror', e => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8080/Clean_Portofoio/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  // The prior universal carry queue is superseded by the stronger semantic
  // empty-slot -> source -> duplicate -> customize -> commit browser journey.
  execFileSync(process.execPath, ['scripts/verify-scenes.mjs'], { stdio: 'inherit' });
  const sceneEvidence = JSON.parse(await readFile('output/playwright/scenes/report.json', 'utf8'));
  check('Cinematic construction passes actual semantic scene and handoff acceptance', sceneEvidence.passed && sceneEvidence.sourceAfter === report.sourceBefore);
  report.semanticEvidence = { path: 'output/playwright/scenes/report.json', source: sceneEvidence.sourceAfter, checks: sceneEvidence.checks.length };
  await page.evaluate(() => document.querySelector('#skills').scrollIntoView()); await page.waitForTimeout(90);
  check('Fast navigation removes all obsolete moving props immediately', await page.locator('[data-prop]').evaluateAll(es => es.every(el => Number(el.style.opacity) === 0)));
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(100);
  const badge = page.locator('[data-microsoft-headline]'); await badge.focus();
  check('Microsoft badge links to the exact supplied story', await badge.getAttribute('href') === 'https://lnkd.in/p/e-7HV-sM');
  check('Keyboard focus exposes the small story callout', await page.locator('#microsoft-story-tip').isVisible());
  await page.screenshot({ path: `${output}/microsoft-story.png` });
  await page.keyboard.press('Escape'); check('Escape dismisses the callout', await page.locator('#microsoft-story-tip').count() === 0);
  for (const [title, suffix] of [['Microsoft Machine Learning Engineer', 'certificate'], ['Artificial Intelligence Level 1', 'certificate'], ['IMPACT Hackathon — 1st Place', 'photo']]) {
    const button = page.getByRole('button', { name: `Zoom in ${title} ${suffix}`, exact: true }); await button.click();
    check(`${title} opens the supplied full image`, await page.getByRole('dialog').locator('img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
    await page.keyboard.press('Escape'); check(`${title} restores keyboard focus`, await button.evaluate(el => el === document.activeElement));
  }
  check('IMPACT is identified as first place and links to its verified post', (await page.locator('[data-achievement] .achievement-ribbon').innerText()).trim().toLowerCase() === '1st place' && await page.locator('.credential-story').getAttribute('href') === 'https://lnkd.in/p/eDP9zBzM');
  const portraitPage = await context.newPage(); portraitPage.on('pageerror', e => report.errors.push(e.message));
  await portraitPage.goto('http://127.0.0.1:8080/Clean_Portofoio/', { waitUntil: 'networkidle' });
  await portraitPage.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await portraitPage.locator('#about > div').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight - 35));
  await portraitPage.evaluate(()=>{window.__portraitFrames=[];window.__portraitTimer=setInterval(()=>{for(const prop of document.querySelectorAll('[data-scene-prop]')){if(Number(getComputedStyle(prop.parentElement).opacity)<=.05)continue;for(const img of prop.querySelectorAll('img'))if(img.src.includes('portrait-cutout'))window.__portraitFrames.push({src:img.src,filter:getComputedStyle(img).filter,rect:img.getBoundingClientRect().toJSON()});}},20);});
  await portraitPage.waitForTimeout(200);
  let portraitCaptured=false;
  for (let i = 0; i < 24; i++) { await portraitPage.mouse.wheel(0, 18); await portraitPage.waitForTimeout(55);if(!portraitCaptured&&await portraitPage.evaluate(()=>window.__portraitFrames.length>0)){await portraitPage.screenshot({path:`${output}/portrait-grayscale-carry.png`});portraitCaptured=true;} }
  await portraitPage.waitForTimeout(700);
  report.portraitFrames=await portraitPage.evaluate(()=>{clearInterval(window.__portraitTimer);return window.__portraitFrames;});
  check('The carried portrait remains grayscale throughout construction',report.portraitFrames.length>0&&report.portraitFrames.every(frame=>frame.filter==='grayscale(1)'));
 await portraitPage.close();
  check('No runtime errors during cinematic manipulation and credential dialogs', report.errors.length === 0);
  report.sourceAfter = await fingerprint(); check('Source is coherent throughout this recorded journey', report.sourceAfter === report.sourceBefore);
  await context.close(); report.passed = true;
} catch (e) { report.failure = e.stack; throw e; }
finally { await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, source: report.sourceBefore, failure: report.failure })); }
