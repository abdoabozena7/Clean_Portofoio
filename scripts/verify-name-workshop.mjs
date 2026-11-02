import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const negative=process.argv.includes('--negative-control'),out=`output/playwright/name-workshop${negative?'-negative':''}`;
await mkdir(out,{recursive:true});
const files=['src/lib/nameConstruction.ts','src/styles/name-construction.css','src/hooks/useScrollConstruction.ts','scripts/verify-name-workshop.mjs'];
const fingerprint=async()=>{const hash=createHash('sha256');for(const p of files){hash.update(p);hash.update(await readFile(p));}return hash.digest('hex');};
const report={sourceBefore:await fingerprint(),files,checks:[],errors:[],diagnostics:[],passed:false};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const mobile of[false,true]){
  const label=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile,recordVideo:{dir:out}}),page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  await page.addInitScript(()=>{
   window.workshopSamples=[];let finished=false,before=null;
   const measure=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
   const sample=()=>{
    const h=document.querySelector('#hero h1'),root=document.querySelector('[data-name-assembly]');
    if(h&&root){
     const p=+root.dataset.nameProgress;
     if(document.fonts.status==='loaded'&&p>.025)before??={text:h.textContent,rect:measure(h)};
     const pieces=[...root.querySelectorAll('[data-name-piece]')].map(el=>{const range=document.createRange();range.selectNodeContents(el);const matrix=new DOMMatrix(getComputedStyle(el).transform);return{kind:el.dataset.namePiece,text:el.textContent,rect:measure(range),sx:matrix.a,sy:matrix.d,opacity:+el.style.opacity,color:getComputedStyle(el).color};});
     const frame=root.querySelector('[data-name-frame="0"] rect'),f=frame?measure(frame):null;
     const agents=[...document.querySelectorAll('[data-agent][data-letter]')].filter(el=>+getComputedStyle(el).opacity>.9).map(el=>{const svg=el.querySelector('svg'),r=svg.getBoundingClientRect();return{agent:el.dataset.agent,job:el.dataset.letter,operation:el.querySelector('.agent-action').textContent,tip:{x:r.x+r.width*.5,y:r.y+r.height/32}};});
     const actual=[],walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){const text=walker.currentNode,s=text.textContent,from=s.search(/\S/);if(from<0)continue;const end=s.trimEnd().length,dot=s[end-1]==='.';const range=document.createRange();range.setStart(text,from);range.setEnd(text,dot?end-1:end);actual.push(measure(range));if(dot){range.setStart(text,end-1);range.setEnd(text,end);actual.push(measure(range));}}
     window.workshopSamples.push({p,shot:root.dataset.nameShot,opacity:+root.style.opacity,pieces,agents,frame:f,actual,before});
     if(window.workshopSamples.length>1000)window.workshopSamples.shift();
     if(p>.9&&+root.style.opacity===0){window.workshopEnd={text:h.textContent,rect:measure(h),before};finished=true;}
    }
    if(!finished)requestAnimationFrame(sample);
   };requestAnimationFrame(sample);
  });
  if(negative)await page.addInitScript(()=>{const style=document.createElement('style');style.textContent='.name-workshop-piece{transform:none!important}';document.addEventListener('DOMContentLoaded',()=>document.head.append(style));});
  await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.reload({waitUntil:'domcontentloaded'});
  for(const[shot,progress]of[['carry',.23],['resize',.45],['duplicate',.65],['finish',.95]]){await page.waitForFunction(p=>+document.querySelector('[data-name-assembly]')?.dataset.nameProgress>=p,progress,{timeout:12000});await page.screenshot({path:`${out}/${label}-${shot}.png`});}
  await page.waitForFunction(()=>window.workshopEnd,null,{timeout:12000});
  const {samples,end}=await page.evaluate(()=>({samples:window.workshopSamples,end:window.workshopEnd}));
  await writeFile(`${out}/${label}-samples.json`,JSON.stringify({samples,end},null,2));
  const pieces=s=>Object.fromEntries(s.pieces.map(p=>[p.kind,p]));
  const carry=samples.filter(s=>s.p>=.1&&s.p<=.31),resize=samples.filter(s=>s.p>=.35&&s.p<=.56),duplicates=samples.filter(s=>s.p>=.56&&s.p<=.705);
  const travel=(samples,kind)=>{const positions=samples.map(s=>pieces(s)[kind]?.rect).filter(Boolean);return Math.max(0,...positions.map(a=>Math.hypot(a.x-positions[0].x,a.y-positions[0].y)));};
  check(`${label}: only coherent word blocks and a period, not a glyph pile`,samples.some(s=>s.pieces.length===4)&&samples.every(s=>s.pieces.length<=4));
  check(`${label}: selected first-name word is physically carried`,travel(carry,'first')>20,{travel:travel(carry,'first')});
  const scales=resize.map(s=>pieces(s).first.sx);check(`${label}: obvious handle resize grows the actual word by more than45%`,Math.max(...scales)-Math.min(...scales)>.45,{min:Math.min(...scales),max:Math.max(...scales)});
  const pinned=resize.filter(s=>s.frame&&s.agents.some(a=>a.agent==='layout')&&s.agents.some(a=>a.agent==='text')).map(s=>{const pin=s.agents.find(a=>a.agent==='layout').tip,handle=s.agents.find(a=>a.agent==='text').tip;return{pin:Math.hypot(pin.x-s.frame.x,pin.y-s.frame.y),handle:Math.hypot(handle.x-s.frame.x-s.frame.width,handle.y-s.frame.y-s.frame.height)};});
  check(`${label}: pin and resize agents attach their actual SVG tips to opposing handles`,pinned.length>=3&&pinned.every(e=>e.pin<1&&e.handle<1),pinned);
  check(`${label}: a real first-word duplicate moves into the second row`,duplicates.some(s=>pieces(s).duplicate.text==='Abdelrahman'&&pieces(s).duplicate.opacity>.1)&&travel(duplicates,'duplicate')>20,{travel:travel(duplicates,'duplicate')});
  check(`${label}: copied text becomes the distinct surname before alignment`,samples.some(s=>s.p>.79&&pieces(s).surname.opacity===1&&pieces(s).duplicate.opacity===0&&pieces(s).surname.text==='Abozena'));
  check(`${label}: separate period is deliberately placed`,travel(samples.filter(s=>s.p>.81&&s.p<.89),'period')>8);
  const settled=samples.find(s=>s.p>=.985&&s.opacity===1),real=settled?.pieces.filter(p=>p.kind!=='duplicate');
  const errors=real?.map((p,i)=>Math.max(...['x','y','width','height'].map(key=>Math.abs(p.rect[key]-settled.actual[i][key]))));
  check(`${label}: every landed word/period exactly matches its native text range`,errors?.length===3&&errors.every(error=>error<.2),errors);
  check(`${label}: the actual accessible name and font-settled heading rectangle remain unchanged`,end.text===end.before?.text&&JSON.stringify(end.rect)===JSON.stringify(end.before?.rect));
  check(`${label}: one atomic handoff exposes the actual h1 and clears all name props`,await page.locator('#hero h1').evaluate(el=>!el.hasAttribute('data-building')&&getComputedStyle(el).clipPath==='none')&&await page.locator('[data-name-assembly]').evaluate(el=>+el.style.opacity===0));
  report.diagnostics.push({label,resizeScales:{min:Math.min(...scales),max:Math.max(...scales)},pinSamples:pinned.length,alignmentErrors:errors});await page.screenshot({path:`${out}/${label}-native-final.png`});await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),page=await context.newPage();await page.goto(url,{waitUntil:'networkidle'});
 check('Reduced motion immediately displays the actual name without workshop decoration',await page.locator('#hero h1').evaluate(e=>!e.hasAttribute('data-building'))&&await page.locator('[data-name-assembly]').evaluate(e=>+e.style.opacity===0));await context.close();
 check('No native runtime errors',report.errors.length===0,report.errors);
 report.sourceAfter=await fingerprint();check('Workshop implementation/caller/verifier remain source-coherent',report.sourceBefore===report.sourceAfter);
 report.passed=report.checks.every(c=>c.passed);if(!report.passed)process.exitCode=1;
}catch(error){report.failure=error.stack;process.exitCode=1;console.error(error);}
finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,source:report.sourceBefore,failure:report.failure}));}
