import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const negative = process.argv.includes('--negative-control');
const recipesOnly = process.argv.includes('--recipes-only');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const out = `output/playwright/scenes${negative ? '-negative' : recipesOnly ? '-recipes' : ''}`;
await mkdir(out, { recursive: true });
async function fingerprint() {
  const files = []; async function walk(dir) { for (const f of await readdir(dir, { withFileTypes: true })) { const p = `${dir}/${f.name}`; f.isDirectory() ? await walk(p) : files.push(p); } }
  await walk('src'); const hash = createHash('sha256'); for (const file of files.sort()) { hash.update(file); hash.update(await readFile(file)); } return hash.digest('hex');
}
const report = { url, sourceBefore: await fingerprint(), verifier: createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'), checks: [], journeys: [], errors: [], passed: false,
  evidenceClass: 'Real Edge browser and real portfolio DOM; observation-only sampling. Negative mode deliberately removes real-content paint masks.' };
const check = (name, passed, evidence) => { report.checks.push({ name, passed: !!passed, evidence }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const phase = async (name, fn) => { try { await fn(); } catch (error) { check(`${name}: journey completes`, false, error.stack); } };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
async function open({ mobile = false, reduced = false, hash = '', video = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: mobile, isMobile: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference', ...(video ? { recordVideo: { dir: out, size: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } } } : {}) });
  const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(url + hash, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  if (negative) await page.addStyleTag({ content: 'html [data-scene-building],html [data-scene-building] *{clip-path:none!important;opacity:1!important;visibility:visible!important}' });
  return { context, page };
}
// Observe rendered paint, not only animation labels. Inset masks and opacity on
// ancestors count, because a completed child can still be hidden by its parent.
async function observe(page, enabled = true, scope = null) {
  if (!enabled) return page.evaluate(() => { clearInterval(window.__sceneProbeTimer); return window.__sceneProbe; });
  await page.evaluate(scope => {
    const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
    const painted = element => {
      if (!element) return false;
      for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
        const css = getComputedStyle(node); if (css.display === 'none' || css.visibility === 'hidden' || Number(css.opacity) < .025) return false;
        if (css.clipPath.startsWith('inset(')) {
          const r = node.getBoundingClientRect(), parts = css.clipPath.slice(6).split(')')[0].split(' round ')[0].trim().split(/\s+/);
          const values = parts.length === 1 ? [parts[0], parts[0], parts[0], parts[0]] : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]] : parts.length === 3 ? [parts[0], parts[1], parts[2], parts[1]] : parts;
          const px = (v, size) => parseFloat(v) * (v.includes('%') ? size / 100 : 1);
          if (px(values[1], r.width) + px(values[3], r.width) >= r.width - .2 || px(values[0], r.height) + px(values[2], r.height) >= r.height - .2) return false;
        }
      }
      return true;
    };
    const visible = element => { const r = element.getBoundingClientRect(); return painted(element) && r.width > 1 && r.height > 1 && r.bottom > 76 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
    const resolve = id => document.getElementById(id) || [...document.querySelectorAll('[data-scene-target-id]')].find(e => e.dataset.sceneTargetId === id) || [...document.querySelectorAll('[data-scene-node]')].find(e => e.dataset.sceneNode === id);
    window.__sceneProbe = []; window.__sceneProbeStart = performance.now();
    window.__sceneProbeTimer = setInterval(() => {
      const props = [...document.querySelectorAll('[data-scene-prop],.scene-prop')].filter(visible).map(e => ({ scene: e.dataset.sceneId || e.closest('[data-scene-id]')?.dataset.sceneId, operation: e.dataset.sceneOperation || e.closest('[data-scene-operation]')?.dataset.sceneOperation,
        target: e.dataset.sceneTarget || e.closest('[data-scene-target]')?.dataset.sceneTarget, rect: rect(e), opacity: getComputedStyle(e).opacity,
        images: [...e.querySelectorAll('img')].map(img => ({ src: img.currentSrc || img.src, painted: painted(img), visible: visible(img), opacity: getComputedStyle(img).opacity, rect: rect(img) })),
        text: e.textContent?.trim().slice(0, 120) }));
      const pointers = [...document.querySelectorAll('.scene-pointer')].filter(visible).map(e => ({ scene: e.dataset.sceneId || e.closest('[data-scene-id]')?.dataset.sceneId, operation: e.dataset.sceneOperation || e.closest('[data-scene-operation]')?.dataset.sceneOperation,
        target: e.dataset.sceneTarget || e.closest('[data-scene-target]')?.dataset.sceneTarget, rect: rect(e) }));
      const actors = [...document.querySelectorAll('.scene-actor')].filter(visible).map(e => ({ operation: e.dataset.sceneOperation, target: e.dataset.sceneTarget, scene: e.dataset.sceneId, rect: rect(e) }));
      const actual = [...document.querySelectorAll('[data-project]')].map(e => { const media = e.querySelector('.project-media'), img = media?.querySelector('img'), r = rect(e); return { project: e.dataset.project, scene: e.dataset.sceneId || e.closest('[data-scene-id]')?.dataset.sceneId, state: e.dataset.sceneState || e.closest('[data-scene-state]')?.dataset.sceneState,
        rect: { ...r, y: r.y + scrollY, top: r.top + scrollY, bottom: r.bottom + scrollY }, viewportTop: r.top, mediaRect: media ? rect(media) : null,
        mediaPainted: img ? painted(img) : media ? painted(media) : false, mediaVisible: img ? visible(img) : media ? visible(media) : false, image: img?.currentSrc || img?.src,
        headingPainted: painted(e.querySelector('h3')), anyBuilding: !!e.closest('[data-scene-building]') || !!e.querySelector('[data-building],[data-scene-building]') }; });
      const targets = props.map(p => { const el = resolve(p.target); return { id: p.target, rect: el ? rect(el) : null, painted: el ? painted(el) : null }; });
      const root = scope ? document.querySelector(scope) : null;
      const surfaces = root ? [...new Set([...(root.hasAttribute('data-scene-target-id') ? [root] : []), ...root.querySelectorAll('[data-scene-target-id]')])].map(e => ({ id: e.dataset.sceneTargetId, tag: e.tagName.toLowerCase(), text: e.textContent?.trim().slice(0, 100), painted: painted(e), visible: visible(e), clip: getComputedStyle(e).clipPath, opacity: getComputedStyle(e).opacity, strokeOffset: getComputedStyle(e).strokeDashoffset, rect: rect(e), nodeLabel: e.matches('.harrtest-flow > g[data-construction] text'), nodeRect: e.matches('.harrtest-flow > g[data-construction] rect'), connection: e.matches('.harrtest-flow > g[marker-end] > path') })) : [];
      window.__sceneProbe.push({ time: performance.now() - window.__sceneProbeStart, scrollY, props, pointers, actors, actual, targets, surfaces, rootScene: root?.dataset.sceneId || root?.closest('[data-scene-id]')?.dataset.sceneId, rootState: root?.dataset.sceneState || root?.closest('[data-scene-state]')?.dataset.sceneState });
    }, 30);
  }, scope);
}
const imageProps = samples => samples.flatMap(sample => sample.props.filter(prop => prop.images.some(img => img.visible)).map(prop => ({ ...prop, time: sample.time })));
const edgeDistance = (pointer, box) => {
  const x = pointer.x + Math.min(10, pointer.width / 2), y = pointer.y + Math.min(2, pointer.height / 10);
  const dx = Math.max(box.left - x, 0, x - box.right), dy = Math.max(box.top - y, 0, y - box.bottom);
  return dx || dy ? Math.hypot(dx, dy) : Math.min(x - box.left, box.right - x, y - box.top, box.bottom - y);
};
try {
 if (recipesOnly) {
  await phase('All lower semantic recipes', async () => {
    const { context, page } = await open({ video: true });
    await page.waitForFunction(() => !document.querySelector('#hero [data-building]'), null, { timeout: 24000 });
    const cases = [
      { id: 'about', selector: '#about > div', image: 'portrait-cutout' },
      { id: 'experience', selector: '[data-attention-id="experience-microsoft"]', image: 'microsoft-symbol' },
      { id: 'education', selector: '[data-attention-id="education-harbin"]', image: 'hit-summer-school' },
      { id: 'honors', selector: '[data-attention-id="honors-impact"]', image: 'impact-first-place' },
      { id: 'flowchart', selector: '#project-harrtest' },
      { id: 'skills', selector: '#skills .skill-category' },
      { id: 'activity', selector: '[data-construction-scene="activity"]' },
      { id: 'contact', selector: '#contact form' },
      { id: 'finale', selector: 'section[data-construction-section]:last-of-type .max-w-6xl > .grid' },
    ];
    for (const item of cases) {
      const target = page.locator(item.selector).first();
      if (item.id === 'activity') await page.waitForSelector('[data-activity-ready] rect[data-date]', { state: 'attached', timeout: 15000 });
      const daysBefore = item.id === 'activity' ? await target.locator('rect[data-date]').evaluateAll(es => es.map(e => [e.getAttribute('data-date'), e.getAttribute('fill'), e.getAttribute('data-level')])) : null;
      await target.evaluate(e => { const root = e.closest('[data-scene-id]') || e; scrollTo({ top: scrollY + root.getBoundingClientRect().top - innerHeight - 35, behavior: 'instant' }); });
      await page.waitForTimeout(100); await observe(page, true, item.selector);
      for (let i = 0; i < 18; i++) { await page.mouse.wheel(0, 18); await page.waitForTimeout(70); if ([8, 14].includes(i)) await page.screenshot({ path: `${out}/${item.id}-entry-${i}.png` }); }
      await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${item.id}-intermediate.png` });
      await page.waitForTimeout(2800); const samples = await observe(page, false);
      const sceneId = samples.find(s => s.rootScene)?.rootScene;
      const related = samples.map(s => ({ ...s, props: s.props.filter(p => p.scene === sceneId), pointers: s.pointers.filter(p => p.scene === sceneId), actors: s.actors.filter(p => p.scene === sceneId) }));
      const poses = new Set(related.flatMap(s => s.pointers.map(p => `${p.target}:${p.operation}:${p.rect.x.toFixed(1)},${p.rect.y.toFixed(1)}`)));
      const emptyAt = related.find(s => s.props.some(p => ['trace', 'create-slot', 'resize'].includes(p.operation) && !p.images.some(i => i.visible)) && s.surfaces.some(surface => !surface.painted))?.time;
      const populatedAt = related.find(s => s.time > (emptyAt ?? Infinity) && s.surfaces.some(surface => surface.visible && surface.painted))?.time;
      report.journeys.push({ name: `${item.id} semantic recipe`, sceneId, samples, firstEmpty: emptyAt, firstContent: populatedAt, pointerPoses: poses.size });
      check(`${item.id}: actual visible empty construction precedes populated real content`, emptyAt !== undefined && populatedAt !== undefined && populatedAt > emptyAt, { emptyAt, populatedAt });
      check(`${item.id}: agents visibly perform changing operations`, poses.size >= 5, { pointerPoses: poses.size, operations: [...new Set(related.flatMap(s => s.pointers.map(p => p.operation)))] });
      if (item.image) {
        const carriedImages = related.flatMap(s => s.props.flatMap(p => p.images.filter(i => i.visible).map(i => i.src)));
        check(`${item.id}: agents place the correct actual image without copying unrelated credentials`, carriedImages.some(src => src.includes(item.image)) && carriedImages.every(src => src.includes(item.image)), { images: [...new Set(carriedImages)] });
      }
      if (item.id === 'flowchart') {
        const firstNode = related.find(s => s.surfaces.some(n => n.nodeRect && n.visible))?.time;
        const firstLabel = related.find(s => s.surfaces.some(n => n.nodeLabel && n.visible))?.time;
        check('Flowchart nodes become visible before their actual labels', firstNode !== undefined && firstLabel !== undefined && firstNode < firstLabel, { firstNode, firstLabel });
        check('Flowchart connections visibly trace through intermediate stroke offsets', related.some(s => s.surfaces.some(n => n.connection && n.visible && parseFloat(n.strokeOffset) > 0)), { offsets: [...new Set(related.flatMap(s => s.surfaces.filter(n => n.connection).map(n => n.strokeOffset)))].slice(0, 12) });
      }
      if (item.id === 'activity') {
        const daysAfter = await target.locator('rect[data-date]').evaluateAll(es => es.map(e => [e.getAttribute('data-date'), e.getAttribute('fill'), e.getAttribute('data-level')]));
        check('Live GitHub calendar preserves every actual date/value/color while constructing weeks', daysBefore.length >= 300 && JSON.stringify(daysBefore) === JSON.stringify(daysAfter), { beforeCount: daysBefore.length, afterCount: daysAfter.length });
        check('Live GitHub weeks populate incrementally with agents at the active batch', related.some(s => s.pointers.some(p => p.operation === 'populate')) && related.some(s => { const weeks = s.surfaces.filter(n => n.tag === 'g'); return weeks.some(n => n.painted) && weeks.some(n => !n.painted); }));
      }
      check(`${item.id}: finished component releases its paint masks`, await target.evaluate(e => { const root = e.closest('[data-scene-id]') || e; return !root.hasAttribute('data-scene-building') && !root.querySelector('[data-building],[data-scene-building],[data-scene-svg-paint],[data-scene-shell]'); }));
      await page.screenshot({ path: `${out}/${item.id}-complete.png` });
    }
    await context.close(); await page.video()?.saveAs(`${out}/all-semantic-recipes.webm`);
  });
 } else {
  await phase('Watched project construction', async () => {
    const { context, page } = await open({ video: true });
    check('Semantic scenes are registered below the approved hero', await page.locator('[data-scene-state][data-scene-id]').count() >= 8);
    const inventory = await page.locator('[data-scene-state][data-scene-id]').evaluateAll(es => es.map(e => ({ id: e.dataset.sceneId, section: e.closest('section')?.id || 'finale' })));
    check('Every lower major section has a semantic scene recipe', ['about', 'experience', 'education', 'honors', 'projects', 'skills', 'contact', 'finale'].every(id => inventory.some(scene => scene.section === id)), inventory);
    const card = page.locator('[data-project="ya-rab-ostorha"]');
    const before = await card.evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height }; });
    await card.evaluate(e => scrollTo({ top: scrollY + e.getBoundingClientRect().top - innerHeight - 35, behavior: 'instant' }));
    await page.waitForTimeout(100); await observe(page);
    for (let i = 0; i < 18; i++) { await page.mouse.wheel(0, 18); await page.waitForTimeout(70); if ([3, 8, 14].includes(i)) await page.screenshot({ path: `${out}/project-entry-${i}.png` }); }
    await page.waitForTimeout(250); await page.screenshot({ path: `${out}/project-mid-build.png` });
    await page.waitForTimeout(3500); const samples = await observe(page, false);
    report.journeys.push({ name: 'Watched project pair', before, samples });
    const projectScenes = new Set(samples.flatMap(s => s.actual.filter(a => ['ya-rab-ostorha', 'wazzefni'].includes(a.project)).map(a => a.scene)).filter(Boolean));
    const related = samples.map(s => ({ ...s, props: s.props.filter(p => projectScenes.has(p.scene)), pointers: s.pointers.filter(p => projectScenes.has(p.scene)), actors: s.actors.filter(a => projectScenes.has(a.scene)) }));
    const empty = related.filter(s => s.props.some(p => ['trace', 'create-slot', 'resize'].includes(p.operation) && p.rect.width > 25 && p.rect.height > 15 && p.images.every(img => !img.visible)) && s.actual.some(a => ['ya-rab-ostorha', 'wazzefni'].includes(a.project) && !a.mediaPainted));
    const populated = imageProps(related);
    check('A viewport-visible empty frame exists before media content', empty.length > 0 && populated.some(p => p.time > empty[0].time), { emptyFrames: empty.length, firstEmpty: empty[0]?.time, firstPopulated: populated[0]?.time, operations: [...new Set(related.flatMap(s => s.props.map(p => p.operation)))] });
    check('Two or more working pointers collaborate in the observed project scene', Math.max(0, ...related.map(s => s.pointers.length)) >= 2);
    // Skill-tag duplication is a valid earlier operation, but does not prove the
    // requested whole-card template copy. The source may already be real DOM.
    const duplicate = related.flatMap(s => s.props.filter(p => p.operation === 'duplicate' && p.rect.width > 200 && p.rect.height > 100).map(p => ({ ...p, time: s.time })));
    const firstSource = related.find(s => s.actual.some(a => a.project === 'ya-rab-ostorha' && a.mediaVisible))?.time;
    const firstPopulated = Math.min(firstSource ?? Infinity, ...populated.filter(p => p.operation !== 'duplicate').map(p => p.time));
    check('A selected component visibly duplicates after a first populated instance', duplicate.length >= 3 && firstPopulated < duplicate[0].time, { duplicateFrames: duplicate.length, firstDuplicate: duplicate[0]?.time, firstPopulated });
    const copyGroups = new Map(); for (const p of duplicate) { const id = p.target || p.scene; if (!copyGroups.has(id)) copyGroups.set(id, []); copyGroups.get(id).push(p); }
    const copyTravel = Math.max(0, ...[...copyGroups.values()].map(group => Math.hypot(Math.max(...group.map(p => p.rect.x)) - Math.min(...group.map(p => p.rect.x)), Math.max(...group.map(p => p.rect.y)) - Math.min(...group.map(p => p.rect.y)))));
    check('Duplication physically separates the copy from its source', copyTravel > 20, { maximumCopyTravel: copyTravel });
    check('Replacement/customization occurs in an established destination', related.some(s => s.props.some(p => ['replace', 'populate'].includes(p.operation) && p.images.some(i => i.visible))), { operations: [...new Set(related.flatMap(s => s.props.map(p => p.operation)))] });
    const connections = [];
    for (const sample of related) for (const prop of sample.props.filter(p => ['duplicate', 'drag', 'resize', 'align'].includes(p.operation))) {
      const pointer = sample.pointers.find(p => p.target === prop.target && p.operation === prop.operation);
      if (pointer) connections.push({ time: sample.time, operation: prop.operation, distance: edgeDistance(pointer.rect, prop.rect), prop: prop.rect, pointer: pointer.rect });
    }
    check('Manipulating pointers remain physically attached to moving component edges', connections.length >= 3 && connections.filter(c => c.distance <= 24).length >= connections.length * .8, { sampleCount: connections.length, attached: connections.filter(c => c.distance <= 24).length, examples: connections.slice(0, 5) });
    const rects = samples.flatMap(s => s.actual.filter(a => a.project === 'ya-rab-ostorha').map(a => a.rect));
    check('Construction never changes the real project flow geometry', rects.every(r => Math.abs(r.x - before.x) <= 1 && Math.abs(r.y - before.y) <= 1 && Math.abs(r.width - before.width) <= 1 && Math.abs(r.height - before.height) <= 1));
    check('The source and destination finish with their own correct images', await page.locator('[data-project="ya-rab-ostorha"] .project-media img').getAttribute('src').then(src => src.includes('ya-rab')) && await page.locator('[data-project="wazzefni"] .project-media img').getAttribute('src').then(src => src.includes('wazzefni')));
    check('Committed real cards have readable text and no residual construction masks', await page.locator('[data-project="ya-rab-ostorha"],[data-project="wazzefni"]').evaluateAll(es => es.every(e => !e.closest('[data-scene-building]') && !e.querySelector('[data-building],[data-scene-building]') && getComputedStyle(e).opacity === '1')));
    await page.screenshot({ path: `${out}/project-committed.png` });
    const settled = await page.evaluate(() => [...document.querySelectorAll('.scene-actor')].filter(e => +getComputedStyle(e).opacity > .05).length);
    check('Agents release completed project work rather than running a permanent swarm', settled === 0, { visibleSceneActors: settled });
    await context.close(); await page.video()?.saveAs(`${out}/project-construction.webm`);
  });
  if (!negative) {
    await phase('Fast reverse and direct navigation', async () => {
      const { context, page } = await open({ video: true });
      await page.locator('#projects').evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(100);
      await page.keyboard.press('PageDown'); await page.waitForTimeout(100);
      check('Fast navigation exposes real reading-area content', await page.locator('[data-building],[data-scene-building]').evaluateAll(es => es.every(e => { const r = e.getBoundingClientRect(); return r.bottom <= 76 || r.top < 76 || r.top >= innerHeight * .6; })));
      await page.locator('#skills').evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(100);
      check('No obsolete project prop continues after leaving its work area', await page.locator('[data-scene-prop],.scene-prop').evaluateAll(es => es.filter(e => +getComputedStyle(e).opacity > .05).every(e => { const scene = e.dataset.sceneId || e.closest('[data-scene-id]')?.dataset.sceneId; return !scene?.includes('project'); })));
      await page.locator('#projects').evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(180);
      check('Reverse return preserves completed construction', await page.locator('#project-hivo').evaluate(e => !e.closest('[data-scene-building]') && !e.querySelector('[data-building],[data-scene-building]')));
      for (const id of ['experience', 'education', 'honors', 'projects', 'skills', 'contact']) {
        await page.evaluate(id => { location.hash = id; }, id); await page.waitForTimeout(150);
        check(`Anchor ${id} exposes its destination immediately`, await page.locator(`#${id}`).evaluate(e => [...e.querySelectorAll('[data-building],[data-scene-building]')].every(n => { const r = n.getBoundingClientRect(); return r.bottom <= 76 || r.top >= innerHeight * .7; })));
      }
      await page.screenshot({ path: `${out}/anchor-contact.png` });
      await context.close(); await page.video()?.saveAs(`${out}/fast-navigation.webm`);
    });
    await phase('Mobile and reduced motion', async () => {
      const { context, page } = await open({ mobile: true, video: true });
      await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(650);
      check('Mobile retains approved hero agent construction', await page.locator('#hero [data-building]').count() > 0 && await page.locator('[data-agent]').evaluateAll(es => es.some(e => +getComputedStyle(e).opacity > .1)));
      await page.locator('#projects').evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(200);
      check('Mobile below-hero scenes contain no masked content or active scene pointers', await page.locator('section:not(#hero) [data-building],section:not(#hero) [data-scene-building]').count() === 0 && await page.locator('.scene-actor,.scene-pointer').evaluateAll(es => es.every(e => +getComputedStyle(e).opacity < .05 || getComputedStyle(e).display === 'none')));
      for (let i = 0; i < 9; i++) { await page.mouse.wheel(0, 65); await page.waitForTimeout(60); }
      check('Mobile preserves native adaptive collapse without lower decorative agents', await page.locator('[data-scan-group="projects"]').getAttribute('data-scan-active') === 'true' && await page.locator('.scene-pointer').evaluateAll(es => es.every(e => +getComputedStyle(e).opacity < .05 || getComputedStyle(e).display === 'none')));
      await page.waitForTimeout(1000); await page.screenshot({ path: `${out}/mobile-projects.png` });
      check('Mobile has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
      await context.close(); await page.video()?.saveAs(`${out}/mobile-policy.webm`);
      const reduced = await open({ reduced: true, hash: '#projects' });
      check('Reduced motion exposes real content immediately without agents', await reduced.page.locator('[data-building],[data-scene-building]').count() === 0 && await reduced.page.locator('[data-agent-layer]').evaluateAll(es => es.every(e => getComputedStyle(e).display === 'none' || +getComputedStyle(e).opacity === 0)));
      await reduced.page.screenshot({ path: `${out}/reduced-projects.png` }); await reduced.context.close();
    });
    await phase('Interactive real content', async () => {
      const { context, page } = await open({ hash: '#projects' });
      const trigger = page.getByRole('button', { name: 'Zoom in YA RAB OSTORHA', exact: true });
      await trigger.focus();
      check('Keyboard focus immediately exposes the real interactive component', await trigger.evaluate(e => !e.closest('[data-building],[data-scene-building]')));
      await trigger.click(); await page.getByRole('dialog').waitFor();
      check('Project zoom opens the actual decoded screenshot', await page.getByRole('dialog').locator('img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
      await page.keyboard.press('Escape');
      check('Closing project zoom restores actual keyboard focus', await trigger.evaluate(e => document.activeElement === e));
      check('Every construction decoration ignores pointer hit testing', await page.locator('[data-agent-layer],.scene-actor,.scene-prop,.scene-pointer').evaluateAll(es => es.every(e => getComputedStyle(e).pointerEvents === 'none')));
      await page.mouse.move(400, 300); await page.waitForTimeout(80); const first = await page.locator('.curzr-arrow-pointer').boundingBox();
      await page.mouse.move(600, 420); await page.waitForTimeout(80); const second = await page.locator('.curzr-arrow-pointer').boundingBox();
      check('The real custom cursor stays responsive and separate from agents', first && second && Math.hypot(first.x - second.x, first.y - second.y) > 100);
      await context.close();
    });
  }
 }
  check('No uncaught browser errors during real journeys', report.errors.length === 0, report.errors);
  report.sourceAfter = await fingerprint(); check('All runtime evidence belongs to one coherent source', report.sourceBefore === report.sourceAfter);
  report.passed = report.checks.every(c => c.passed);
} catch (error) { report.failure = error.stack; console.error(error); }
finally {
  await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failed: report.checks.filter(c => !c.passed).map(c => c.name), out }));
  if (!report.passed) process.exitCode = 1;
}
