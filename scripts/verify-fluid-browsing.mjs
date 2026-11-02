import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baselineOnly=process.argv.includes('--baseline');
const metricsOnly=process.argv.includes('--metrics-only');
const negative=process.argv.includes('--negative-control');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/';
const oldUrl='http://127.0.0.1:8082/Clean_Portofoio/';
const out=negative?'output/research/fluid-review/negative':'output/research/fluid-review';await mkdir(out,{recursive:true});
// Preserve the original LF benchmark identity across Windows checkout newlines.
const hash=b=>createHash('sha256').update(typeof b==='string'?b.replace(/\r\n/g,'\n'):b).digest('hex');
async function source(){const files=[];async function walk(d){for(const f of await readdir(d,{withFileTypes:true})){const p=d+'/'+f.name;if(f.isDirectory())await walk(p);else files.push(p);}}await walk('src');const h=createHash('sha256');for(const f of files.sort()){h.update(f);h.update(await readFile(f));}return h.digest('hex');}
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={url,sourceBefore:baselineOnly?null:await source(),checks:[],errors:[],observations:[],passed:false};
const check=(name,pass,evidence)=>{report.checks.push({name,passed:!!pass,evidence});console.log(`${pass?'PASS':'FAIL'} ${name}`);};
const phase=async(name,fn)=>{try{await fn();}catch(e){check(name+' completes',false,e.stack);}};
async function setup(address=url,mobile=true,reduced=false,instrument=false){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 if(instrument)await page.addInitScript(()=>{
  const nativeRect=Element.prototype.getBoundingClientRect,nativeRaf=requestAnimationFrame.bind(window),nativeRangeRect=Range.prototype.getBoundingClientRect,nativeRangeRects=Range.prototype.getClientRects,nativePrevent=Event.prototype.preventDefault;
  const stats={elements:0,ranges:0,raf:0,prevented:[],longtasks:[],trace:[],tracking:false};window.__fluid=stats;
  Element.prototype.getBoundingClientRect=function(...args){stats.elements++;return nativeRect.apply(this,args);};
  Range.prototype.getBoundingClientRect=function(...args){stats.ranges++;return nativeRangeRect.apply(this,args);};
  Range.prototype.getClientRects=function(...args){stats.ranges++;return nativeRangeRects.apply(this,args);};
  window.requestAnimationFrame=callback=>nativeRaf(time=>{stats.raf++;callback(time);});
  Event.prototype.preventDefault=function(...args){if(['wheel','touchmove','keydown'].includes(this.type))stats.prevented.push({type:this.type,key:this.key,at:performance.now()});return nativePrevent.apply(this,args);};
  try{new PerformanceObserver(list=>list.getEntries().forEach(e=>stats.longtasks.push({duration:e.duration,start:e.startTime}))).observe({type:'longtask',buffered:true});}catch{}
  const sample=()=>{if(stats.tracking){const root=document.querySelector('[data-scan-active]');stats.trace.push({at:performance.now(),y:scrollY,mode:document.documentElement.dataset.browsing,group:root?.dataset.scanGroup,agents:[...document.querySelectorAll('[data-agent],[data-scan-editor]')].filter(e=>+getComputedStyle(e).opacity>.1&&getComputedStyle(e).display!=='none').length,titles:[...document.querySelectorAll('[data-project] h3,.skill-category h3')].map(h=>{const r=nativeRect.call(h);return{text:h.textContent,top:r.top,bottom:r.bottom};}).filter(r=>r.bottom>0&&r.top<innerHeight)});}nativeRaf(sample);};nativeRaf(sample);
 });
 await page.goto(address,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});return{context,page};
}
async function position(page,selector,top=350){await page.locator(selector).first().evaluate((el,top)=>{const h=el.matches('h3')?el:el.querySelector('h3');scrollTo({top:scrollY+h.getBoundingClientRect().top-top,behavior:'instant'});},top);await page.waitForTimeout(900);}
async function benchmark(address,label){
 const results=[];
 for(const [group,selector] of [['skills','.skill-category'],['projects','#project-harrtest']]){
  const{context,page}=await setup(address,true,false,true);await position(page,selector);
  const entry=await page.evaluate(()=>performance.getEntriesByType('resource').find(e=>/assets\/index-[\w-]+\.js/.test(e.name))?.name||'vite-source');
  await page.evaluate(()=>{const s=window.__fluid;s.elements=0;s.ranges=0;s.raf=0;s.prevented=[];s.longtasks=[];s.trace=[];s.tracking=true;});
  const started=performance.now();
  for(let i=0;i<12;i++){await page.mouse.wheel(0,65);await page.waitForTimeout(60);}
  await page.waitForTimeout(1100);
  const active=await page.evaluate(()=>{window.__fluid.tracking=false;return structuredClone(window.__fluid);});
  const beforeIdle=active.raf;await page.waitForTimeout(450);const idleRaf=await page.evaluate(()=>window.__fluid.raf)-beforeIdle;
  await page.screenshot({path:`${out}/${label}-${group}.png`});
  results.push({group,entry,duration:performance.now()-started,elements:active.elements,ranges:active.ranges,raf:active.raf,idleRaf,prevented:active.prevented,longtasks:active.longtasks,maxVisibleAgents:Math.max(0,...active.trace.map(t=>t.agents)),trace:active.trace});await context.close();
 }
 return{kind:'Native instrumented same-journey comparison; not field CWV',viewport:{width:390,height:844},input:'12 trusted wheel events65px,60ms waits,1100ms settle,450msidle',benchmarkHash:hash(benchmark.toString()),results};
}
const mobileAgents=page=>page.locator('[data-agent],[data-scan-editor]').evaluateAll(es=>es.filter(e=>+getComputedStyle(e).opacity>.1&&getComputedStyle(e).display!=='none'&&getComputedStyle(e.closest('[data-scan-agent]')||e).display!=='none').length);
const critical=[['microsoft',"[data-attention-id='experience-microsoft']"],['harbin',"[data-attention-id='education-harbin']"],['impact',"[data-attention-id='honors-impact']"],['depi',"[data-attention-id='honors-depi']"],['hivo','#project-hivo']];
async function checkIdlePosition(page,label){
 await page.waitForTimeout(1000);const before=await page.evaluate(()=>scrollY);
 if(negative)await page.evaluate(()=>setTimeout(()=>scrollTo({top:0,behavior:'instant'}),1000));
 await page.waitForTimeout(6200);const after=await page.evaluate(()=>scrollY);
 check(label+' never returns automatically after waiting',Math.abs(before-after)<1,{before,after,localInjectedFault:negative});
}
async function touchFlick(context,page){
 const cdp=await context.newCDPSession(page),timestamp=Date.now()/1000;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',timestamp,touchPoints:[{x:180,y:710}]});
 for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',timestamp:timestamp+i*.025,touchPoints:[{x:180,y:710-i*65}]});await page.waitForTimeout(25);}
 const fingerEnd=await page.locator('#project-hivo h3').evaluate(e=>({y:scrollY,top:e.getBoundingClientRect().top}));await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',timestamp:timestamp+.225,touchPoints:[]});await page.waitForTimeout(500);return fingerEnd;
}
try{
 if(baselineOnly){const baseline=await benchmark(oldUrl,'before');await writeFile(out+'/baseline.json',JSON.stringify(baseline,null,2));console.log(JSON.stringify(baseline.results.map(({trace,...x})=>x)));report.passed=true;}
 else{
  if(negative){await phase('Unwanted-return negative control',async()=>{const{context,page}=await setup();await position(page,'#project-hivo');await page.mouse.wheel(0,650);await checkIdlePosition(page,'Critical Hivo');await context.close();});report.sourceAfter=await source();report.passed=report.checks.every(c=>c.passed);}
  else{
  const after=await benchmark(url,'after'),before=JSON.parse(await readFile(out+'/baseline.json','utf8'));
  report.comparison={before,after};
  check('Identical instrumented journey algorithm',before.benchmarkHash===after.benchmarkHash);
  for(let i=0;i<after.results.length;i++){const a=after.results[i],b=before.results[i];check(a.group+' mobile below-hero decorative agents removed',a.maxVisibleAgents===0,{before:b.maxVisibleAgents,after:a.maxVisibleAgents});check(a.group+' native wheel input is never cancelled',a.prevented.length===0,a.prevented);check(a.group+' idle decorative RAF is absent',a.idleRaf===0,{before:b.idleRaf,after:a.idleRaf});}
  if(!metricsOnly){
  await phase('All named highlights remain optional',async()=>{
   for(const[label,selector]of critical){
    const{context,page}=await setup(url,true,false,true);await position(page,selector,300);await page.evaluate(()=>{window.__fluid.prevented=[];});await page.mouse.wheel(0,650);await page.waitForTimeout(350);
    check(label+' has no mandatory popup or review state',await page.locator('[data-attention-dialog]').count()===0&&await page.getByRole('dialog').count()===0&&!['warning','reviewing','relocating'].includes(await page.locator('html').getAttribute('data-attention-phase')));
    check(label+' displays only a small optional circular reminder',await page.locator('.quick-pass-cue').count()===1&&await page.locator('.quick-pass-cue').evaluate(el=>{const r=el.getBoundingClientRect();return r.width<=innerWidth-24&&r.height<=110&&!!el.querySelector('.cue-circle circle');}));
    const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,120);await page.waitForTimeout(120);const moved=await page.evaluate(()=>scrollY);check(label+' wheel continues freely after reminder',Math.abs(moved-y)>50);
    check(label+' does not cancel native input',await page.evaluate(()=>window.__fluid.prevented.length===0));
    await checkIdlePosition(page,label);await page.screenshot({path:`${out}/${label}-optional.png`});
    if(label==='hivo'){
     const button=page.getByRole('button',{name:'Revisit Hivo Studio'});await button.tap();await page.waitForTimeout(800);
     check('Explicit touch Revisit reaches full Hivo without a lock',await page.locator('#project-hivo h3').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=76&&r.bottom<innerHeight;})&&await page.locator('#project-hivo [data-scan-detail]').evaluateAll(es=>es.every(e=>!e.inert&&+getComputedStyle(e).opacity>.99)));
     check('Explicit Revisit removes reminder',await page.locator('.quick-pass-cue').count()===0);
     const start=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,100);await page.waitForTimeout(100);check('Scrolling remains free immediately after explicit Revisit',Math.abs(await page.evaluate(()=>scrollY)-start)>50);
    }
    await context.close();
   }
  });
  await phase('Touch keyboard and nonforced reminder cleanup',async()=>{
   const{context,page}=await setup(url,true,false,true);await position(page,'#project-hivo',300);
   await page.evaluate(()=>{window.__touchScrollCalls=[];const original=window.scrollTo.bind(window);window.scrollTo=(...args)=>{window.__touchScrollCalls.push({at:performance.now(),args});return original(...args);};});
   const before=await page.locator('#project-hivo h3').evaluate(e=>({y:scrollY,top:e.getBoundingClientRect().top})),fingerEnd=await touchFlick(context,page);
   const after=await page.locator('#project-hivo h3').evaluate(e=>({y:scrollY,top:e.getBoundingClientRect().top}));
   const activeScrollCalls=await page.evaluate(()=>structuredClone(window.__touchScrollCalls));
   const control=await setup(url,true,true);await position(control.page,'#project-hivo',300);const controlBefore=await control.page.locator('#project-hivo h3').evaluate(e=>e.getBoundingClientRect().top),controlFingerEnd=await touchFlick(control.context,control.page);const controlAfter=await control.page.locator('#project-hivo h3').evaluate(e=>e.getBoundingClientRect().top);await control.context.close();
   const materialTravel=before.top-after.top,controlTravel=controlBefore-controlAfter;
   const directTravel=before.top-fingerEnd.top,controlDirectTravel=controlBefore-controlFingerEnd.top;
   check('Native touch preserves the entire finger-driven material distance',directTravel>480&&Math.abs(directTravel-controlDirectTravel)<20,{fingerTravel:520,directTravel,controlDirectTravel,before,fingerEnd});
   check('Native post-release inertia matches the timestamp-controlled no-collapse reference',materialTravel>=controlTravel*.85&&controlTravel>800,{materialTravel,controlTravel,after,controlAfter});
   check('No programmatic scroll correction interrupts active native pan or inertia',activeScrollCalls.length===0,activeScrollCalls);
   check('Native touch input is never cancelled and opens no mandatory dialog',await page.evaluate(()=>window.__fluid.prevented.filter(e=>e.type==='touchmove').length===0)&&await page.getByRole('dialog').count()===0);
   const dismissedText=await page.locator('.quick-pass-cue').allTextContents();if(dismissedText.length)await page.getByRole('button',{name:'Dismiss highlight reminder'}).tap();await page.waitForTimeout(180);const afterDismiss=await page.locator('.quick-pass-cue').allTextContents();check('Dismiss removes the entire currently pending reminder batch',afterDismiss.length===0,{before:dismissedText,after:afterDismiss});
   // The long fling can already pass AI; the earlier China entry was never visited.
   await position(page,"[data-attention-id='education-harbin']",300);await page.mouse.wheel(0,650);await page.waitForTimeout(350);check('A fresh unseen highlight can still offer an optional reminder after dismissal',await page.locator('.quick-pass-cue').count()===1&&await page.locator('.quick-pass-cue').innerText().then(text=>text.includes('China')));
   await context.close();const keyboard=await setup(url,false,false,true);await position(keyboard.page,"[data-attention-id='education-harbin']",300);const y=await keyboard.page.evaluate(()=>scrollY);await keyboard.page.keyboard.press('PageDown');await keyboard.page.waitForTimeout(300);
   check('Native PageDown remains free at the China highlight',await keyboard.page.evaluate(()=>scrollY)>y+200&&await keyboard.page.evaluate(()=>window.__fluid.prevented.filter(e=>e.type==='keydown').length===0)&&await keyboard.page.getByRole('dialog').count()===0);await keyboard.context.close();
   const reverse=await setup();await position(reverse.page,"[data-attention-id='skills-ai']",300);await reverse.page.mouse.wheel(0,650);await reverse.page.waitForTimeout(800);const was=await reverse.page.locator('.quick-pass-cue').innerText();
   await reverse.page.mouse.wheel(0,-600);await reverse.page.waitForTimeout(800);check('Reverse return clears the reminder for the actually revisited skill',!(await reverse.page.locator('.quick-pass-cue').count())||await reverse.page.locator('.quick-pass-cue').innerText()!==was);await reverse.context.close();
  });
  await phase('Mobile hero-only builders and preserved lower controls',async()=>{
   const{context,page}=await setup(url,true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(600);check('Mobile hero retains construction pointers',await mobileAgents(page)>0);
   await page.evaluate(()=>document.getElementById('projects').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(200);check('Mobile lower sections never show agent pointers',await mobileAgents(page)===0);
   for(let i=0;i<9;i++){await page.mouse.wheel(0,65);await page.waitForTimeout(60);}check('Mobile collapse remains active without decorative agents',await page.locator('[data-scan-group="projects"]').getAttribute('data-scan-active')==='true'&&await mobileAgents(page)===0);await page.waitForTimeout(900);
   const item=page.locator('#project-harrtest');await item.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await page.waitForTimeout(150);check('Lower mobile content is real and fully readable',await item.locator('[data-scan-detail]').evaluateAll(es=>es.every(e=>!e.inert&&+getComputedStyle(e).opacity>.99))&&await item.locator('[data-building]').count()===0);
   check('Mobile has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));await page.screenshot({path:`${out}/mobile-lower-readable.png`});await context.close();
  });
  await phase('All five adaptive groups restore their actual natural detail layout',async()=>{
   for(const group of ['experience','education','honors','projects','skills']){
    const{context,page}=await setup();const selector=`[data-scan-group="${group}"]`;await position(page,selector,350);
    const shape=el=>[...el.querySelectorAll('[data-scan-item],[data-project],.skill-category')].map(item=>{const r=item.getBoundingClientRect(),h=item.querySelector('h3'),s=getComputedStyle(h);return{text:h.textContent,top:r.top,width:r.width,height:r.height,font:s.font,line:s.lineHeight,details:[...item.querySelectorAll('[data-scan-detail]')].map(d=>({inert:d.inert,opacity:+getComputedStyle(d).opacity}))};});
    const before=await page.locator(selector).evaluate(shape);let reducedHeight=false,active=false;
    for(let i=0;i<12;i++){await page.mouse.wheel(0,65);await page.waitForTimeout(60);const sample=await page.locator(selector).evaluate(shape);reducedHeight ||=sample.some((item,index)=>item.height<before[index].height-10);active ||=await page.locator(selector).getAttribute('data-scan-active')==='true';}
    const allAlreadyVisible=before.every(item=>item.top<812);
    check(group+' keeps adaptive mode without shrinking already visible short groups',active&&(reducedHeight||allAlreadyVisible),{active,reducedHeight,allAlreadyVisible});await page.waitForTimeout(1100);const after=await page.locator(selector).evaluate(shape);
    check(group+' restores exact natural boxes/fonts and accessible opaque details',after.every((item,index)=>Math.abs(item.width-before[index].width)<.2&&Math.abs(item.height-before[index].height)<.2&&item.font===before[index].font&&item.line===before[index].line&&item.details.every(d=>!d.inert&&d.opacity>.99)),{before,after});await context.close();
   }
  });
  await phase('Desktop slow construction and fast synchronization',async()=>{
   const{context,page}=await setup(url,false);await page.waitForFunction(()=>!document.querySelector('#hero h1').hasAttribute('data-building'),null,{timeout:10000});
   await page.locator('#about img').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-innerHeight-90,behavior:'instant'}));await page.waitForTimeout(250);
   let agents=0,props=0,pending=false;const poses=new Set();for(let i=0;i<30;i++){await page.mouse.wheel(0,20);await page.waitForTimeout(70);const sample=await page.evaluate(()=>({agents:[...document.querySelectorAll('[data-agent]')].filter(e=>+e.style.opacity>.5).length,props:[...document.querySelectorAll('[data-prop]')].filter(e=>+e.style.opacity>.1).length,pose:[...document.querySelectorAll('[data-prop]')].find(e=>+e.style.opacity>.1)?.style.transform,pending:document.querySelector('#about img').hasAttribute('data-building')}));agents=Math.max(agents,sample.agents);props=Math.max(props,sample.props);pending ||=sample.pending;if(sample.pose)poses.add(sample.pose);}
   check('Slow desktop entry exposes real incomplete construction and multiple workers',pending&&agents>=2&&props>0,{pending,agents,props});check('Desktop slow builders visibly carry or resize elements',poses.size>=3,{poses:poses.size});await page.screenshot({path:`${out}/desktop-slow-build.png`});
   await page.keyboard.press('PageDown');await page.waitForTimeout(100);check('Fast desktop navigation immediately exposes reading-area content',await page.locator('[data-building]').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.top<76||r.top>=innerHeight*.8||r.bottom<=76;})));await context.close();
  });
  await phase('Reduced motion and actual deep links',async()=>{
   const{context,page}=await setup(url,true,true);await page.evaluate(()=>location.hash='skills');await page.waitForTimeout(400);for(let i=0;i<6;i++){await page.mouse.wheel(0,80);await page.waitForTimeout(60);}
   check('Reduced motion exposes all real text without builders or compact tween',await mobileAgents(page)===0&&await page.locator('[data-building]').count()===0&&!await page.locator('[data-scan-active]').count());check('Reduced motion never introduces a mandatory popup',await page.getByRole('dialog').count()===0);await context.close();
  });
  }
  check('No runtime browser errors',report.errors.length===0,report.errors);report.sourceAfter=await source();check('Current app source remained coherent',report.sourceBefore===report.sourceAfter);report.passed=report.checks.every(c=>c.passed);
  }
 }
}finally{await browser.close();await writeFile(`${out}/${baselineOnly?'baseline-run':metricsOnly?'metrics-preliminary':'report'}.json`,JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
