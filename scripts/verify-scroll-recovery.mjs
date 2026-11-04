import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
const out = 'output/playwright/scroll-recovery'; await mkdir(out, { recursive: true });
async function source() { const files=[]; async function walk(d){for(const f of await readdir(d,{withFileTypes:true})){const p=d+'/'+f.name;f.isDirectory()?await walk(p):files.push(p);}}await walk('src');const h=createHash('sha256');for(const p of files.sort()){h.update(p);h.update(await readFile(p));}return h.digest('hex'); }
const report={sourceBefore:await source(),checks:[],errors:[],samples:[],passed:false};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle'}); await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  await page.waitForFunction(()=>!document.querySelector('#hero [data-building]'),null,{timeout:24000});
  await page.locator('#about').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-100));
  const trace=async()=>page.evaluate(()=>({y:scrollY,actors:[...document.querySelectorAll('.scene-pointer')].filter(e=>+getComputedStyle(e).opacity>.1).map(e=>({id:e.dataset.sceneId,op:e.dataset.sceneOperation,transform:e.style.transform})),bypassed:[...document.querySelectorAll('[data-scene-bypassed]')].map(e=>({id:e.dataset.sceneId,top:e.getBoundingClientRect().top}))}));
  for(let i=0;i<10;i++){await page.mouse.wheel(0,180);await page.waitForTimeout(45);report.samples.push(await trace());}
  check('Fast scrolling advances native page position freely',report.samples.at(-1).y-report.samples[0].y>900);
  check('Fast browsing hides scene pointers instead of leaving workers behind',report.samples.slice(4).some(s=>s.actors.length===0));
  await page.waitForTimeout(850);
  const target=await page.evaluate(()=>[...document.querySelectorAll('[data-scene-state]')].find(e=>e.getBoundingClientRect().top>innerHeight+35&&e.getBoundingClientRect().height>100&&['unstarted','complete'].includes(e.dataset.sceneState))?.dataset.sceneId);
  if(!target)throw Error('No unexplored upcoming scene found for recovery');
  const selector=`[data-scene-id="${target}"][data-scene-state]`;
  await page.locator(selector).first().evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-innerHeight-35)); await page.waitForTimeout(100);
  await page.evaluate(()=>{window.__recovery=[];window.__recoveryTimer=setInterval(()=>window.__recovery.push({at:performance.now(),pointers:[...document.querySelectorAll('.scene-pointer')].filter(e=>+getComputedStyle(e).opacity>.1).map(e=>({id:e.dataset.sceneId,op:e.dataset.sceneOperation,transform:e.style.transform})),pending:document.querySelectorAll('[data-scene-building]').length}),30);});
  for(let i=0;i<16;i++){await page.mouse.wheel(0,18);await page.waitForTimeout(80);}
  await page.screenshot({path:out+'/slow-recovery.png'}); await page.waitForTimeout(3000);
  const resumed=await page.evaluate(()=>{clearInterval(window.__recoveryTimer);return window.__recovery;});report.resumed={scene:target,samples:resumed};
  const poses=new Set(resumed.flatMap(s=>s.pointers.filter(p=>p.id===target).map(p=>p.transform)));
  check('Slowing down restarts visible construction for an unexplored upcoming scene',poses.size>=5,{target,poses:poses.size});
  check('Recovered work completes as real unmasked content',await page.locator(selector).first().evaluate(e=>e.dataset.sceneState==='complete'&&!e.querySelector('[data-building]')));
  await page.screenshot({path:out+'/recovery-complete.png'});await context.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),m=await mobile.newPage(),requests=[];
  m.on('request',r=>{if(r.resourceType()==='image')requests.push(r.url());});m.on('pageerror',e=>report.errors.push(e.message));
  await m.goto(url,{waitUntil:'domcontentloaded'});await m.waitForTimeout(1800);
  check('Mobile keeps far project images deferred at the hero',await m.evaluate(()=>scrollY===0)&&!requests.some(src=>src.includes('/images/projects/')),{requests:[...requests]});
  await m.locator('#project-hivo .project-media').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  const media=await m.locator('#project-hivo .project-image-trigger img').evaluate(async image=>{await image.decode();return {src:image.currentSrc,priority:image.fetchPriority,naturalWidth:image.naturalWidth};});
  check('Reaching a project promotes and decodes its actual thumbnail',media.naturalWidth>0&&media.priority==='high'&&requests.includes(media.src),{media});
  check('Media preparation keeps the mobile agent policy',await m.locator('section:not(#hero) [data-building]').count()===0);
  await m.screenshot({path:out+'/mobile-prewarm.png'});await mobile.close();
  check('Recovery and prewarming introduce no uncaught errors',report.errors.length===0,report.errors);
  report.sourceAfter=await source();check('Recovery evidence is source coherent',report.sourceAfter===report.sourceBefore);report.passed=report.checks.every(c=>c.passed);
}catch(error){report.failure=error.stack;console.error(error);}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
