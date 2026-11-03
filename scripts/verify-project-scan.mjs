import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseline = process.argv.includes('--baseline');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const out = process.env.PORTFOLIO_EVIDENCE_DIR || `output/playwright/project-scan/${baseline ? 'baseline' : 'local'}`;
await mkdir(out, { recursive: true });
const report = { url, baseline, checks: [], errors: [], viewports: {} };
async function fingerprint() { const hash = createHash('sha256'); for (const file of ['src/hooks/useAdaptiveBrowsing.ts', 'src/components/ProjectsSection.tsx', 'src/styles/projects.css', 'scripts/verify-project-scan.mjs']) hash.update(file).update(await readFile(file)); return hash.digest('hex'); }
report.sourceBefore = await fingerprint();
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const near = (a, b) => Math.abs(a - b) <= .6;
async function snapshot(page) {
  return page.evaluate(() => {
    const opacity = element => { let value = 1; for (let el = element; el instanceof HTMLElement; el = el.parentElement) { const style = getComputedStyle(el); if (style.visibility === 'hidden' || style.display === 'none') return 0; value *= Number(style.opacity); } return value; };
    const rect = (el, root) => { const a = el.getBoundingClientRect(), b = root.getBoundingClientRect(); return { x: a.x-b.x, y: a.y-b.y, w: a.width, h: a.height }; };
    return { mode: document.documentElement.dataset.browsing, scan: Number(document.querySelector('[data-scan-group="projects"]').style.getPropertyValue('--scan')),
      cards: [...document.querySelectorAll('[data-project]')].map(card => { const title = card.querySelector('h3'), tags = card.querySelector('.project-copy > div'), media = card.querySelector('.project-media'), actions = card.querySelector('.project-actions'), brief = card.querySelector('.project-copy p'); return { id: card.dataset.project, card: rect(card, card), title: rect(title, card), titleFont: getComputedStyle(title).font, tags: rect(tags, card), tagsText: tags.textContent, tagsOpacity: opacity(tags), media: rect(media, card), mediaOpacity: opacity(media), briefOpacity: opacity(brief), actionsOpacity: opacity(actions), actionsInert: actions.inert, top: card.getBoundingClientRect().top }; }) };
  });
}
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const old = baseline ? null : JSON.parse(await readFile('output/playwright/project-scan/baseline/report.json', 'utf8'));
  for (const [width, height] of [[1440,900],[1366,768],[768,1024],[390,844]]) {
    const context = await browser.newContext({ viewport: { width,height }, hasTouch: width===390, isMobile: width===390, reducedMotion: 'reduce', recordVideo: { dir: out } });
    try {
      const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(async () => {
        const projectText = [...document.querySelectorAll('[data-project] h3, [data-project] p')];
        await Promise.all(projectText.map(el => document.fonts.load(getComputedStyle(el).font, el.textContent)));
        await document.fonts.ready;
      });
      await page.locator('#project-harrtest').evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 430, behavior: 'instant' }));
      await page.waitForTimeout(500);
      const normal = await snapshot(page);
      await page.screenshot({ path: `${out}/${width}-detail.png` });
      if (!baseline) check(`${width}: detailed cards match pre-change geometry and wrapping`, normal.cards.every((card,i) => { const previous=old.viewports[width].normal.cards[i]; return card.id===previous.id && card.titleFont===previous.titleFont && card.tagsText===previous.tagsText && ['card','title','tags','media'].every(key => ['x','y','w','h'].every(axis => near(card[key][axis],previous[key][axis]))); }), normal);
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(200);
      for (let i=0;i<8;i++) { await page.mouse.wheel(0,180); await page.waitForTimeout(60); }
      const fast = await snapshot(page); report.viewports[width] = { normal, fast };
      await page.screenshot({ path: `${out}/${width}-fast.png` });
      if (baseline) check(`${width}: old thumbnail behavior rejected by full-size oracle`, fast.mode==='scan' && fast.cards.some((card,i) => card.media.w < normal.cards[i].media.w - 20));
      else {
        check(`${width}: native fast browsing actually activates`, fast.mode==='scan' && fast.scan>.9, fast);
        check(`${width}: every screenshot and flowchart keeps exact full dimensions`, fast.cards.every((card,i) => near(card.media.w,normal.cards[i].media.w) && near(card.media.h,normal.cards[i].media.h)), fast);
        check(`${width}: project title and all tags remain readable`, fast.cards.every((card,i) => card.titleFont===normal.cards[i].titleFont && card.tagsText===normal.cards[i].tagsText && card.tagsOpacity>.99), fast);
        check(`${width}: descriptions and action rows hidden and unavailable`, fast.cards.every(card => card.briefOpacity<.01 && card.actionsOpacity<.01 && card.actionsInert), fast);
        check(`${width}: stacked media stays below tags with small gap`, fast.cards.every(card => card.media.x > card.title.x+80 || card.media.y >= card.tags.y+card.tags.h+12 && card.media.y <= card.tags.y+card.tags.h+22), fast);
        check(`${width}: upcoming cards remove description/action empty space`, fast.cards.filter(card => card.top>150).every(card => near(card.card.h,Math.max(card.media.y+card.media.h,card.tags.y+card.tags.h)+22)), fast);
      }
      await page.waitForTimeout(1300); const restored = await snapshot(page);
      if (!baseline) {
        check(`${width}: slowing restores original card, image, tags and actions`, !restored.mode && restored.cards.every((card,i) => near(card.card.h,normal.cards[i].card.h) && ['x','y','w','h'].every(key => near(card.media[key],normal.cards[i].media[key])) && card.tagsOpacity>.99 && card.briefOpacity>.99 && card.actionsOpacity>.99 && !card.actionsInert), restored);
        if (width===390) {
          const cdp=await context.newCDPSession(page);
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:740}]});
          for(const y of [620,500,380,260,140,20]) { await page.waitForTimeout(40); await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y}]}); }
          const touch=await snapshot(page); report.viewports[width].touch=touch;
          check('Mobile native swipe retains full media and tags',touch.mode==='scan' && touch.cards.every((card,i)=>near(card.media.w,normal.cards[i].media.w)&&near(card.media.h,normal.cards[i].media.h)&&card.tagsOpacity>.99&&card.actionsOpacity<.01),touch);
          await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          await page.waitForTimeout(1400);
        }
        await page.locator('#project-ya-rab-ostorha .project-image-trigger').click();
        check(`${width}: screenshot still opens real zoom dialog`,await page.getByRole('dialog').isVisible());
        await page.keyboard.press('Escape');
        check(`${width}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
      }
    } finally { await context.close(); }
  }
  check('No runtime errors',!report.errors.length,report.errors);
} catch(error) { check('Journey completes',false,error.stack); }
finally { await browser.close(); report.sourceAfter=await fingerprint(); check('Current source remained coherent',report.sourceAfter===report.sourceBefore); report.passed=report.checks.every(check=>check.passed); await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)); console.log(`Evidence: ${out}/report.json`); if(!report.passed)process.exitCode=1; }
