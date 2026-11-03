import { createRequire } from 'node:module';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='output/playwright/section-return'; await mkdir(out,{recursive:true});
async function fingerprint(){const files=[];async function walk(d){for(const f of await readdir(d,{withFileTypes:true})){const p=d+'/'+f.name;f.isDirectory()?await walk(p):files.push(p)}}await walk('src');const h=createHash('sha256');for(const p of files.sort())h.update(p).update(await readFile(p));return h.digest('hex')}
const report={sourceBefore:await fingerprint(),checks:[],journeys:[],errors:[]};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(passed?'PASS':'FAIL',name)};
const browser=await chromium.launch({channel:'msedge',headless:true});
async function open(mobile=false){const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,recordVideo:{dir:out}});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:8080/Clean_Portofoio/');await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});await page.locator('#education').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-350,behavior:'instant'}));await page.waitForTimeout(800);return {context,page}}
async function wheeling(page,delta,delay,count){for(let i=0;i<count;i++){await page.mouse.wheel(0,delta);await page.waitForTimeout(delay)}}
try {
 for(const mode of ['skipped','exposed','normal','mobile-skipped']){
  const {context,page}=await open(mode==='mobile-skipped');
  try{
   if(mode==='exposed'){
    await page.locator('#education [data-discovery-id]').first().evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-140,behavior:'instant'}));
    await page.waitForTimeout(12000);
    const evidence=await page.locator('#education [data-discovery-id]').first().evaluate(el=>({quality:Number(el.dataset.quality),coverage:Number(el.dataset.qualityCoverage)}));
    check('Real expanded visible Education earns meaningful exposure',evidence.quality>=60&&evidence.coverage>=75,evidence);
    await page.locator('#education').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-350,behavior:'instant'}));await page.waitForTimeout(300);
   }
   await page.evaluate(()=>{window.__sectionFrames=[];window.__returnEvents=[];window.__trusted=[];addEventListener('portfolio:fast-scroll-return',e=>window.__returnEvents.push(e.detail));addEventListener('wheel',e=>window.__trusted.push(e.isTrusted),{passive:true});window.__trace=setInterval(()=>{const el=document.querySelector('#education'),cue=document.querySelector('.section-return-cue');window.__sectionFrames.push({y:scrollY,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,cue:cue.dataset.visible,color:cue.style.getPropertyValue('--return-color'),section:cue.dataset.section})},16)});
   if(mode==='normal')await wheeling(page,80,140,24);else await wheeling(page,500,50,16);
   const during=await page.evaluate(()=>({frames:window.__sectionFrames.slice(),events:window.__returnEvents.slice(),trusted:window.__trusted.every(Boolean)}));
   report.journeys.push({mode,...during});
   check(mode+': trusted browser inputs',during.trusted);
   if(mode.endsWith('skipped')){
    check('Whole skipped Education triggers section-targeted upward movement',during.events.some(e=>e.section==='education'&&e.from>e.to),during.events);
    check('Return reaches Education heading and never overshoots toward landing',during.events.some(e=>e.section==='education'&&e.arrived)&&during.events.filter(e=>e.section==='education').every(e=>e.to>500),during.events);
    check(mode+': no return cue before the whole section is passed',during.frames.slice(0,during.frames.findIndex(f=>f.bottom<=96)).every(f=>f.cue!=='true'));
    check('Palette edge cue is shown during return',during.frames.some(f=>f.cue==='true'&&f.section==='education'&&/^#/.test(f.color)));
    await page.screenshot({path:out+'/'+mode+'-education-return.png'});
    await page.waitForTimeout(400);const start=await page.evaluate(()=>scrollY);await wheeling(page,80,140,4);await page.waitForTimeout(1300);
    const end=await page.evaluate(()=>({y:scrollY,cue:document.querySelector('.section-return-cue').dataset.visible}));
    check('Slow browsing resumes and temporary cue clears',end.y>start+160&&end.cue==='false',{start,...end});
   }else if(mode==='exposed') check('Meaningfully exposed Education is not a return target',!during.events.some(e=>e.section==='education'),during.events);
   else check('Ordinary pace has no reversal or edge warning',during.events.length===0&&during.frames.every(f=>f.cue!=='true'),during.events);
   check(mode+': cue never blocks interaction or creates overflow',await page.evaluate(()=>getComputedStyle(document.querySelector('.section-return-cue')).pointerEvents==='none'&&document.documentElement.scrollWidth===innerWidth));
   await page.evaluate(()=>clearInterval(window.__trace));
  }finally{await context.close()}
 }
 check('No runtime exceptions',report.errors.length===0,report.errors);report.sourceAfter=await fingerprint();check('Current source is coherent',report.sourceBefore===report.sourceAfter);report.passed=report.checks.every(c=>c.passed);
}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1}
