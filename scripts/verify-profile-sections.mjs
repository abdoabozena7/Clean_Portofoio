import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output='output/research/profile-sections';await mkdir(output,{recursive:true});
const sources=['src/data/profileContent.ts','src/components/CredentialList.tsx','src/components/EducationSection.tsx','src/components/HonorsSection.tsx','src/components/ExperienceSection.tsx','src/components/SkillsSection.tsx','src/pages/Index.tsx','src/hooks/useAdaptiveBrowsing.ts','src/hooks/useScrollConstruction.ts','src/styles/palette.css','src/styles/adaptive.css','src/styles/construction.css','src/lib/scrollIntent.ts','src/components/Navbar.tsx','src/components/SectionBlock.tsx','src/components/ui/dialog.tsx','src/components/AgentConstruction.tsx','src/index.css','public/images/certificates/impact-first-place-2026.png','public/images/certificates/hit-summer-school-2025.jpg','public/images/certificates/gci-world-2026.jpg','public/images/certificates/learning-csharp-2026.png','public/images/certificates/depi-2026.png','public/images/certificates/orange-ai-2024.png','scripts/verify-profile-sections.mjs'];
const fingerprint=async()=>{const h=createHash('sha256');for(const p of sources){h.update(p);h.update(await readFile(p));}return h.digest('hex');};
const report={sourceBefore:await fingerprint(),sources,checks:[],observations:[],errors:[]};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const state=async(page,group)=>page.locator(`[data-scan-group="${group}"]`).evaluate(el=>{
 const opacity=n=>{let p=1;for(let v=n;v;v=v.parentElement)p*=Number(getComputedStyle(v).opacity);return p;};
 return{active:el.dataset.scanActive,progress:Number(el.style.getPropertyValue('--scan')),height:el.getBoundingClientRect().height,items:[...el.querySelectorAll('[data-scan-item],.skill-category')].map(n=>{const h=n.querySelector('h3'),r=n.getBoundingClientRect(),t=h.getBoundingClientRect();return{title:h.textContent,height:r.height,titleRect:{top:t.top-r.top,bottom:t.bottom-r.top,left:t.left-r.left,right:t.right-r.left,width:t.width},clipped:t.top<r.top-.6||t.bottom>r.bottom+.6||t.left<r.left-.6||t.right>r.right+.6,opacity:opacity(h),details:[...n.querySelectorAll('[data-scan-detail]')].map(d=>({opacity:opacity(d),inert:d.inert,hidden:d.getAttribute('aria-hidden')}))};})};
});
try{
 for(const width of[390,1440])for(const group of['experience','education','honors']){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:'no-preference'});page.on('pageerror',e=>report.errors.push({width,group,message:e.message}));
  await page.goto('http://127.0.0.1:8080/Clean_Portofoio/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  const order=await page.locator('section[id]').evaluateAll(els=>els.map(e=>e.id));
  check(`${width}/${group}: section order Experience, Education, Honors`,order.indexOf('experience')<order.indexOf('education')&&order.indexOf('education')<order.indexOf('honors'),order);
  const list=page.locator(`[data-scan-group="${group}"]`);
  const imgs=list.locator('img');for(const img of await imgs.all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());}
  const images=await imgs.evaluateAll(els=>els.map(e=>({src:e.getAttribute('src'),alt:e.alt,width:e.naturalWidth,height:e.naturalHeight})));
  check(`${width}/${group}: genuine local photos/logos load`,images.every(i=>i.width>0&&i.height>0&&i.src.startsWith('/Clean_Portofoio/images/')),images);
  await list.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-450,behavior:'instant'}));await page.waitForTimeout(700);
  const before=await state(page,group);check(`${width}/${group}: natural titles fit`,before.items.every(i=>!i.clipped),before);
  if(group==='education')check(`${width}: education contains only ECU and HIT`,before.items.length===2&&(await list.innerText()).includes('Egyptian Chinese University')&&(await list.innerText()).includes('Harbin Institute of Technology'),before.items.map(i=>i.title));
  if(group==='honors'){
   check(`${width}: IMPACT leads six honors`,before.items.length===6&&before.items[0].title.includes('IMPACT'),before.items.map(i=>i.title));
   check(`${width}: IMPACT photo uses supplied winning photo`,images[0]?.src.endsWith('/impact-first-place-2026.png')&&images[0]?.width===1280&&images[0]?.height===853,images[0]);
  }
  await page.locator('#'+group).screenshot({path:`${output}/${group}-${width}-detail.png`});
  await list.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-450,behavior:'instant'}));await page.waitForTimeout(550);
  const samples=[];
  for(let i=0;i<12;i++){
   const delta=i<5?80:(i%2?-60:60);await page.mouse.wheel(0,delta);await page.waitForTimeout(65);samples.push(await state(page,group));
  }
  const compact=await state(page,group);report.observations.push({width,group,before,compact,samples,images});
  check(`${width}/${group}: real wheel input compacts target list`,compact.active==='true'&&compact.progress>.95,compact);
  check(`${width}/${group}: compact titles are not clipped`,compact.active==='true'&&compact.items.every(i=>!i.clipped),compact.items);
  await page.screenshot({path:`${output}/${group}-${width}-compact.png`});
  await page.waitForTimeout(1100);const restored=await state(page,group);
  check(`${width}/${group}: stopping restores natural heights`,!restored.active&&restored.items.every((n,i)=>Math.abs(n.height-before.items[i].height)<.6),{before:before.items.map(i=>i.height),restored});
  check(`${width}/${group}: restored details remain opaque and accessible`,restored.items.every(i=>i.opacity>.99&&i.details.every(d=>d.opacity>.99&&!d.inert&&d.hidden===null)),restored);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);check(`${width}/${group}: no horizontal overflow`,!overflow);
  if(group==='honors'){
   const first=list.locator('[data-scan-item]').first();await first.getByRole('button').click();const dialog=page.getByRole('dialog');await dialog.waitFor();const photo=dialog.locator('img');await photo.evaluate(e=>e.decode());
   check(`${width}: IMPACT zoom shows genuine winning photo`,await photo.evaluate(e=>e.naturalWidth===1280&&e.naturalHeight===853));await page.waitForTimeout(260);check(`${width}: settled zoom is fully opaque`,await dialog.evaluate(e=>Number(getComputedStyle(e).opacity)>.99));await page.screenshot({path:`${output}/impact-${width}-zoom.png`});
   await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});check(`${width}: IMPACT zoom closes with Escape`,await dialog.count()===0);
  }
  await page.close();
 }
 for(const width of[390,1440]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:'no-preference'});page.on('pageerror',e=>report.errors.push({width,group:'skills',message:e.message}));
  await page.goto('http://127.0.0.1:8080/Clean_Portofoio/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  const list=page.locator('[data-scan-group="skills"]');await list.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-450,behavior:'instant'}));await page.waitForTimeout(700);
  for(let i=0;i<12;i++){await page.mouse.wheel(0,i<5?80:(i%2?-60:60));await page.waitForTimeout(65);}
  const compact=await state(page,'skills');check(`${width}/skills: real input reaches compact categories`,compact.active==='true'&&compact.progress>.95&&compact.items.length===7,compact);
  await page.waitForTimeout(1100);const restored=await state(page,'skills');
  check(`${width}/skills: restored categories and details stay opaque`,!restored.active&&restored.items.length===7&&restored.items.every(i=>i.opacity>.99&&i.details.every(d=>d.opacity>.99&&!d.inert&&d.hidden===null)),restored);
  await page.screenshot({path:`${output}/skills-${width}-restored.png`});await page.close();
 }
}catch(error){report.errors.push({message:error.stack});console.error(error);}
finally{await browser.close();report.sourceAfter=await fingerprint();check('Source unchanged during review',report.sourceBefore===report.sourceAfter);check('No runtime or verification errors',report.errors.length===0,report.errors);await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));if(report.checks.some(c=>!c.passed)||report.errors.length)process.exitCode=1;}
