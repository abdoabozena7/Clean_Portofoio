import {createRequire} from 'node:module';import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=process.argv.includes('--before'),negative=process.argv.includes('--negative-control'),out='output/playwright/reference-v2-motion-'+(before?'before':negative?'negative':'after');await mkdir(out,{recursive:true});
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/';
async function fingerprint(){const files=[];async function walk(d){for(const f of await readdir(d,{withFileTypes:true})){const p=d+'/'+f.name;f.isDirectory()?await walk(p):files.push(p)}}await walk('src');const h=createHash('sha256');for(const p of files.sort())h.update(p).update(await readFile(p));return h.digest('hex')}
const report={sourceBefore:await fingerprint(),checks:[],journeys:[],errors:[]},check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(passed?'PASS':'FAIL',name)};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const section of ['experience','education','projects','contact']){
  const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(6000);await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
   if(negative)await page.addStyleTag({content:'[data-agent][data-scene-phase="approach"]{transform:translate3d(0,0,0)!important}'});
   await page.evaluate(()=>{window.__motion=[];window.__motionClock=setInterval(()=>{const pose=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};window.__motion.push({at:performance.now(),scrollY,pointers:[...document.querySelectorAll('[data-agent]')].map((e,i)=>({i,phase:e.dataset.scenePhase,op:e.dataset.sceneOperation,target:e.dataset.sceneTarget,...pose(e),opacity:+getComputedStyle(e).opacity})).filter(e=>e.op&&e.opacity>.1),guides:[...document.querySelectorAll('[data-scene-guide]')].filter(e=>+e.getAttribute('opacity')>.1).map(e=>({target:e.dataset.sceneTarget,...pose(e.querySelector('rect'))}))})},20)});
   await page.locator('#'+section).evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-innerHeight*.78,behavior:'instant'}));
   for(let i=0;i<10;i++){await page.mouse.wheel(0,80);await page.waitForTimeout(180)}await page.waitForTimeout(3600);
   const frames=await page.evaluate(()=>{clearInterval(window.__motionClock);return window.__motion});report.journeys.push({section,frames});
   const approaches=frames.flatMap(f=>f.pointers.filter(p=>p.phase==='approach').map(p=>({...p,worldY:p.y+f.scrollY})));
   const work=frames.flatMap(f=>f.pointers.filter(p=>p.phase==='work'));
   let moving=0,idleMoving=0;for(let i=1;i<frames.length;i++)for(const p of frames[i].pointers.filter(p=>p.phase==='approach')){const q=frames[i-1].pointers.find(q=>q.i===p.i&&q.target===p.target&&q.op===p.op&&q.phase==='approach');if(q&&Math.hypot(p.x-q.x,(p.y+frames[i].scrollY)-(q.y+frames[i-1].scrollY))>1){moving++;if(Math.abs(frames[i].scrollY-frames[i-1].scrollY)<.1)idleMoving++}}
   check(section+': actual approach travel before working, including while scroll is IDLE',approaches.length>=3&&moving>=2&&idleMoving>=1,{poses:approaches.length,moving,idleMoving});
   check(section+': agents perform work after approach',work.length>10,{poses:work.length});
   const contacts=[];for(const f of frames)for(const p of f.pointers.filter(p=>p.phase==='work'&&['resize','create-slot'].includes(p.op))){const g=f.guides.find(g=>g.target===p.target);if(g)contacts.push(Math.min(Math.hypot(p.x-g.x-g.w,p.y-g.y-g.h),Math.hypot(p.x-g.x-g.w,p.y-g.y)))}
   check(section+': resize/grip pointers stay attached to moving selection handles',contacts.length>0&&contacts.every(d=>d<3),{samples:contacts.length,max:Math.max(...contacts)});
   check(section+': no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));await page.screenshot({path:out+'/'+section+'-finished.png'});
  }finally{await context.close()}
 }
 check('No runtime errors',report.errors.length===0,report.errors);report.sourceAfter=await fingerprint();check('One coherent app source',report.sourceBefore===report.sourceAfter);report.passed=report.checks.every(c=>c.passed);
}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1}
