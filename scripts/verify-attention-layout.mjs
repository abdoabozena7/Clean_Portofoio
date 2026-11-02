import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const negative = process.argv.includes('--negative-control');
const out = `output/playwright/attention-layout${negative ? '-negative' : ''}`; await mkdir(out, { recursive: true });
const baseline = JSON.parse(await readFile('output/playwright/dynamic-after/report.json', 'utf8'));
const current = JSON.parse(await readFile('output/playwright/attention-after/report.json', 'utf8'));
if (negative) current.viewports.desktop.elements.find(e => e.section === 'projects' && e.tag === 'img').rect.width += 10;
const report = { baseline: baseline.sourceBefore, sourceBefore: current.sourceBefore, checks: [], pixels: [], passed: false,
  authorizedChanges: ['Shorter About and removed Showcase CTA', 'Hivo first in existing featured copy/media pattern, HarrTest second; resulting card/asset positions, original copy/media widths preserved', 'Stronger Skills heading and token weights', 'Decorative choreography and explicit critical highlight stops'] };
const check = (name, value) => { assert.ok(value, name); report.checks.push(name); };
const near = (a,b) => Math.abs(a-b) < .1;
const card = (capture, selector) => { const roots=[...new Set(capture.elements.filter(e=>e.section==='projects').map(e=>e.selector.match(/^#project-[a-z0-9-]+/)?.[0]).filter(Boolean))]; return capture.grids.find(g=>g.selector.startsWith('#projects'))?.children[roots.indexOf(selector)]; };
async function fingerprint() { const files=[]; async function walk(d) { for (const f of await readdir(d,{withFileTypes:true})) { const p=d+'/'+f.name; if(f.isDirectory())await walk(p);else files.push(p); }} await walk('src');const h=createHash('sha256');for(const p of files.sort()){h.update(p);h.update(await readFile(p));}return h.digest('hex'); }
try {
  check('Coherent before/after captures', baseline.sourceBefore === baseline.sourceAfter && current.sourceBefore === current.sourceAfter);
  check('Final natural capture matches current source', await fingerprint() === current.sourceAfter);
  for (const name of Object.keys(baseline.viewports)) {
    const a=baseline.viewports[name], b=current.viewports[name];
    check(`${name} no overflow`,b.scrollWidth === b.innerWidth);
    check(`${name} all images decoded and no browser/network failures`, b.loadedImages.every(i=>i.complete&&i.width>0)&&!b.pageErrors.length&&!b.failedRequests.length);
    check(`${name} existing nine sections and order`, a.sections.map(s=>s.key).join('|') === b.sections.map(s=>s.key).join('|'));
    for(let i=0;i<a.heroSlots.length;i++) for(const k of ['x','y','width','height']) check(`${name} protected hero ${i} ${k}`,near(a.heroSlots[i].rect[k],b.heroSlots[i].rect[k]));
    for(const section of a.sections) {
      const now=b.sections.find(s=>s.key===section.key);
      check(`${name} ${section.key} original outer alignment`, near(section.rect.x,now.rect.x)&&near(section.rect.width,now.rect.width));
      if(!['about','projects','skills'].includes(section.key))check(`${name} ${section.key} original detailed height`,near(section.rect.height,now.rect.height));
    }
    for(const old of a.elements.filter(e=>['experience','education','honors','contact','finale','projects'].includes(e.section)&&e.tag!=='section'&&e.tag!=='nav'&&!(e.section==='projects'&&e.selector==='#projects > div:nth-of-type(1)')&&e.rect.width>1&&e.rect.height>1)) {
      const now=b.elements.find(e=>e.selector===old.selector);check(`${name} ${old.selector} retained`,!!now);
      const root=old.section==='projects'?old.selector.match(/^#project-[a-z0-9-]+/)?.[0]:null;
      const beforeRoot=root?card(a,root):a.sections.find(s=>s.key===old.section);
      const afterRoot=root?card(b,root):b.sections.find(s=>s.key===old.section);
      const dimensions=['width','height'].every(k=>near(old.rect[k],now.rect[k]));
      // Projects moved deliberately; compare each actual card's internal coordinates.
      const movedFeaturedAsset=root==='#project-hivo' && (old.selector.includes('> div:nth-of-type(2)') || old.selector.includes('> div:nth-of-type(3)'));
      const position=beforeRoot&&afterRoot&&!movedFeaturedAsset?near(old.rect.x-beforeRoot.rect.x,now.rect.x-afterRoot.rect.x)&&near(old.rect.y-beforeRoot.rect.y,now.rect.y-afterRoot.rect.y):true;
      check(`${name} ${old.selector} exact detailed geometry`,dimensions&&position);
      check(`${name} ${old.selector} original copy/font/spacing`,old.text===now.text&&JSON.stringify(old.font)===JSON.stringify(now.font)&&old.padding===now.padding&&old.margin===now.margin);
    }
    const about=b.elements.filter(e=>e.section==='about'&&e.tag==='p');
    check(`${name} About concise and Showcase removed`,about.length===2&&about.map(e=>e.text).join(' ').split(/\s+/).length<=40&&!b.elements.some(e=>e.section==='about'&&e.text==='View Showcase Profile'));
    const ordered=[...new Set(b.elements.filter(e=>e.section==='projects').map(e=>e.selector.match(/^#project-[a-z0-9-]+/)?.[0]).filter(Boolean))];
    check(`${name} Hivo followed by HarrTest`,ordered[0]==='#project-hivo'&&ordered[1]==='#project-harrtest');
    const nameRect=a.heroSlots[1].rect, crop={left:Math.floor(nameRect.x),top:Math.floor(nameRect.y),width:Math.floor(nameRect.width),height:Math.floor(nameRect.height)};
    const first=await sharp(`output/playwright/dynamic-after/${name}/full-page.png`).extract(crop).ensureAlpha().raw().toBuffer();
    const second=await sharp(`output/playwright/attention-after/${name}/full-page.png`).extract(crop).ensureAlpha().raw().toBuffer();
    let changed=0;for(let i=0;i<first.length;i+=4)if(Math.max(...[0,1,2].map(k=>Math.abs(first[i+k]-second[i+k])))>12)changed++;
    const ratio=changed/(crop.width*crop.height); report.pixels.push({viewport:name,section:'name',changedRatio:ratio});
    check(`${name} finished name exact pixel match`,ratio===0);
    await sharp(`output/playwright/attention-after/${name}/full-page.png`).extract(crop).toFile(`${out}/${name}-finished-name.png`);
    console.log(`${name}: detailed geometry/content, requested copy/order and name pixels PASS`);
  }
  report.sourceAfter=await fingerprint();check('No source drift during comparison',report.sourceAfter===report.sourceBefore);report.passed=true;
} catch(error){report.failure=error.stack;throw error;}
finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,failure:report.failure}));}
