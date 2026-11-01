import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require(process.env.SHARP_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const negative=process.argv.includes('--negative-control');
const out='output/playwright/'+(negative?'visual-revision-negative':'visual-revision');await mkdir(out,{recursive:true});
async function fingerprint(){const files=[];async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())await walk(p);else files.push(p)}}await walk('src');const hash=createHash('sha256');for(const f of files.sort()){hash.update(f);hash.update(await readFile(f));}return hash.digest('hex');}
const baseline=JSON.parse(await readFile('output/playwright/revision-before/report.json','utf8'));
const report={sourceBefore:await fingerprint(),checks:[],viewports:[],authorizedChanges:['Verified About, Education, Experience, Skills, contact and footer content/height changes','Certificate images visible by default','Natural project cards with larger screenshots, two desktop columns, HarrTest wide first card, no reserved legacy rows','Supplied palette on agents, tags and hovers','Grayscale portrait, company logos, Crossover part-time freelance clarification'],passed:false};
const check=(name,value)=>{assert.ok(value,name);report.checks.push({name,passed:true});};
const close=(a,b)=>Math.abs(a-b)<.1;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const[name,w,h]of[['desktop',1440,900],['laptop',1366,768],['tablet',768,1024],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width:w,height:h},reducedMotion:'reduce',isMobile:name==='mobile',hasTouch:name==='mobile'});const p=await context.newPage();const errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failed.push(r.url()));
  await p.goto('http://127.0.0.1:8080/Clean_Portofoio/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.addStyleTag({content:'html{scroll-behavior:auto!important} canvas,.curzr-arrow-pointer{visibility:hidden!important}'});
  const length=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<length;y+=650)await p.evaluate(y=>scrollTo(0,y),y);
  for(const img of await p.locator('img:not([data-agent-layer] img)').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(img=>Promise.race([img.decode().catch(e=>{throw Error(img.src+': '+e.message)}),new Promise((_,reject)=>setTimeout(()=>reject(Error('decode timeout '+img.src)),10000))]));}
  await p.evaluate(()=>scrollTo(0,0));
  const m=await p.evaluate(()=>{
   const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height}};
   const hero=document.querySelector('#hero'),center=hero.querySelector('.text-center');
   return{width:innerWidth,scrollWidth:document.documentElement.scrollWidth,pending:document.querySelectorAll('[data-building]').length,heroSlots:[...center.children].map(el=>({rect:rect(el)})),nav:rect(document.querySelector('nav')),avatar:rect(document.querySelector('#about img')),
    sections:[...document.querySelectorAll('section:not([aria-live])')].map((el,i)=>({id:el.id||(i===0?'hero':'finale'),...rect(el),padding:getComputedStyle(el).padding})),
    certs:[...document.querySelectorAll('#education .certificate-thumb')].map(i=>({width:i.clientWidth,height:i.clientHeight,natural:i.naturalWidth,display:getComputedStyle(i).display})),
    logos:[...document.querySelectorAll('.company-logo img')].map(i=>({alt:i.alt,natural:i.naturalWidth})),
    gridColumns:getComputedStyle(document.querySelector('.project-grid')).gridTemplateColumns,gridInlineRows:document.querySelector('.project-grid').style.gridTemplateRows,
    cards:[...document.querySelectorAll('[data-project]')].map(el=>({id:el.dataset.project,width:el.clientWidth,height:el.clientHeight,overflow:el.scrollHeight-el.clientHeight,media:rect(el.querySelector('.project-media'))})),
    paletteTags:[...document.querySelectorAll('#skills .palette-tag')].slice(0,10).map(el=>getComputedStyle(el).backgroundColor),filter:getComputedStyle(document.querySelector('#about img')).filter};
  });
  if(negative&&name==='desktop')m.heroSlots[1].rect.y+=10;
  const before=baseline.viewports[name];
  for(let i=0;i<before.heroSlots.length;i++)for(const dim of['x','y','width','height'])check(`${name} original hero slot ${i} ${dim}`,close(m.heroSlots[i].rect[dim],before.heroSlots[i].rect[dim] + (i===0 && dim==='y' && name==='laptop' ? 23 : 0)));
  const oldNav=before.elements.find(e=>e.tag==='nav');for(const dim of['x','width','height'])check(`${name} navigation ${dim}`,close(m.nav[dim],oldNav.rect[dim]));
  // The old generic rect collector added the end-of-page scroll offset to fixed nav.y.
  // Compare its viewport anchor directly, and verify the actual top screenshot below.
  check(`${name} navigation remains fixed at the viewport top`,close(m.nav.y,0));
  check(`${name} section order preserved`,m.sections.map(s=>s.id).join('|')===before.sections.map(s=>s.key).join('|'));
  for(const section of m.sections){const old=before.sections.find(s=>s.key===section.id);check(`${name} ${section.id} column alignment`,close(section.x,old.rect.x)&&close(section.width,old.rect.width));}
  const oldAvatar=before.elements.find(e=>e.section==='about'&&e.tag==='img');check(`${name} portrait box size preserved`,close(m.avatar.width,oldAvatar.rect.width)&&close(m.avatar.height,oldAvatar.rect.height));
  check(`${name} no horizontal overflow`,m.scrollWidth<=w);check(`${name} reduced motion fully constructs content`,m.pending===0);check(`${name} grayscale portrait`,m.filter==='grayscale(1)');
  check(`${name} six certificates/achievement photos rendered inline and decoded`,m.certs.length===6&&m.certs.every(c=>c.width>0&&c.height>0&&c.natural>0&&c.display!=='none'));
  check(`${name} certificate thumbnails remain compact`,m.certs.every(c=>c.width<=160&&c.height<=112));
  check(`${name} all eight genuine company logos decode`,m.logos.length===8&&m.logos.every(i=>i.natural>0));check(`${name} natural project sizing has no legacy fixed rows`,m.gridInlineRows==='');
  check(`${name} seven project cards contain contents`,m.cards.length===7&&m.cards.every(c=>c.overflow===0));check(`${name} first card features HarrTest`,m.cards[0].id==='harrtest');
  check(`${name} readable screenshot sizing`,m.cards.filter(c=>c.id!=='harrtest').every(c=>c.media.width>=(w<768?275:300)&&c.media.height>150));
  check(`${name} skills use varied palette tints`,new Set(m.paletteTags).size===5);check(`${name} no page errors`,errors.length===0);check(`${name} no failed requests`,failed.length===0);
  await p.screenshot({path:`${out}/${name}.png`,fullPage:true});
  for(const sec of m.sections.filter(s=>['hero','education','experience','projects','skills'].includes(s.id)))await sharp(`${out}/${name}.png`).extract({left:Math.floor(sec.x),top:Math.floor(sec.y),width:Math.floor(sec.width),height:Math.floor(sec.height)}).png().toFile(`${out}/${name}-${sec.id}.png`);
  // Only the unchanged name and navigation are pixel-golden; new accents/content are intentional.
  await p.screenshot({path:`${out}/${name}-hero-viewport.png`});const h1=before.heroSlots[1].rect;
  for(const[label,region]of[['name',{left:Math.floor(h1.x),top:Math.floor(h1.y),width:Math.floor(h1.width),height:Math.floor(h1.height)}],['navigation',{left:0,top:0,width:w,height:72}]]){
   const a=await sharp(`output/playwright/revision-before/${name}/hero-viewport.png`).extract(region).ensureAlpha().raw().toBuffer();const b=await sharp(`${out}/${name}-hero-viewport.png`).extract(region).ensureAlpha().raw().toBuffer();let differences=0;for(let i=0;i<a.length;i+=4){
    // The newly clickable laptop badge is lifted clear of the nav. Exclude only
    // the original badge/nav intersection, where its old logo showed through blur.
    const px=(i/4)%region.width,py=Math.floor(i/4/region.width);
    if(name==='laptop'&&label==='navigation'&&px>=before.heroSlots[0].rect.x&&px<=before.heroSlots[0].rect.x+before.heroSlots[0].rect.width&&py>=before.heroSlots[0].rect.y)continue;
    if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>12)differences++;}check(`${name} unchanged ${label} screenshot`,differences/(region.width*region.height)<.0015);
  }
  report.viewports.push({name,...m,errors,failed});console.log(name+' visual and responsive checks passed');await context.close();
 }
 report.sourceAfter=await fingerprint();check('Application source stayed unchanged during verification',report.sourceBefore===report.sourceAfter);report.passed=true;
}catch(e){report.failure=e.stack;throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,source:report.sourceBefore,failure:report.failure}));}
