import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=process.argv.includes('--baseline'),negative=process.argv.includes('--negative-control'),out=`output/research/scan-continuity${before?'-before':negative?'-negative':''}`;await mkdir(out,{recursive:true});
const hash=async()=>createHash('sha256').update(await readFile('src/hooks/useAdaptiveBrowsing.ts')).digest('hex');
const report={sourceBefore:await hash(),mode:before?'Native historical-hook replay in current app':negative?'Current hook with visible-row preservation fault':'Current hook native journeys',checks:[],journeys:[],errors:[],passed:false};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const touch of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  if(before){
   const source=execFileSync('git',['show','318b54e:src/hooks/useAdaptiveBrowsing.ts'],{encoding:'utf8'});report.historicalHookSha256=createHash('sha256').update(source).digest('hex');
   const {transformSync}=require('esbuild');
   await page.route('**/src/hooks/useAdaptiveBrowsing.ts*',async route=>{
    const original=await (await route.fetch()).text(),reactLine=original.slice(0,original.indexOf('\n'));
    let compiled=transformSync(source,{loader:'tsx',format:'esm',target:'es2022'}).code.replace(/import\s*\{\s*useLayoutEffect\s*\}\s*from\s*["']react["'];?/,reactLine).replaceAll('"@/lib/scrollIntent"','"/Clean_Portofoio/src/lib/scrollIntent.ts"').replaceAll('"@/lib/construction"','"/Clean_Portofoio/src/lib/construction.ts"');
    await route.fulfill({status:200,contentType:'application/javascript',body:compiled});
   });
  }else if(negative){await page.route('**/src/hooks/useAdaptiveBrowsing.ts*',async route=>{const response=await route.fetch();let source=await response.text();source=source.replace(/const frozen = [\s\S]*?;\n/,'const frozen = false;\n');await route.fulfill({response,body:source});});}
  await page.addInitScript(()=>{
   window.__continuity={samples:[],corrections:[],began:false,ended:false};const state=window.__continuity,native=window.scrollTo.bind(window);
   window.scrollTo=(...args)=>{const y=scrollY;native(...args);if(state.began&&!state.ended)state.corrections.push({at:performance.now(),delta:scrollY-y});};
   const begin=()=>{
    if(!state.began){
     const items=[...document.querySelectorAll('#skills .skill-category')];state.row=items.find(e=>{const r=e.getBoundingClientRect();return r.top<=150&&r.bottom>150;})||items.find(e=>{const r=e.getBoundingClientRect();return r.top>=80&&r.top<innerHeight;});
     if(state.row){state.began=true;state.title=state.row.querySelector('h3');state.initial={y:scrollY,title:state.title.getBoundingClientRect().top,bottom:state.row.getBoundingClientRect().bottom,height:state.row.getBoundingClientRect().height,text:state.title.textContent};}
    }
   };window.addEventListener('portfolio:layout-start',begin);
   const sample=()=>{
    if(document.documentElement.dataset.browsing==='scan'&&!state.began)begin();
    if(document.documentElement.dataset.browsing==='scan'&&!state.compactHeights)state.compactHeights=[...document.querySelectorAll('#skills .skill-category')].map(e=>e.getBoundingClientRect().height);
    if(state.began&&!state.ended){const r=state.row.getBoundingClientRect();state.samples.push({at:performance.now(),y:scrollY,title:state.title.getBoundingClientRect().top,bottom:r.bottom,height:r.height,mode:document.documentElement.dataset.browsing});if(!document.documentElement.dataset.browsing)state.ended=true;}
    if(!state.ended)requestAnimationFrame(sample);
   };requestAnimationFrame(sample);
  });
  await page.goto(process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  const initialHeights=await page.locator('.skill-category').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
  await page.locator('.skill-category').first().evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top-250,behavior:'instant'}));await page.waitForTimeout(350);
  if(touch){const cdp=await context.newCDPSession(page),timestamp=Date.now()/1000;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',timestamp,touchPoints:[{x:180,y:700}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',timestamp:timestamp+i*.018,touchPoints:[{x:180,y:700-i*100}]});await page.waitForTimeout(18);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',timestamp:timestamp+.126,touchPoints:[]});}
  else for(let i=0;i<8;i++){await page.mouse.wheel(0,220);await page.waitForTimeout(60);}
  await page.waitForTimeout(1300);
  // A genuinely fast timestamped fling can still have native inertia at1300ms.
  // Check restoration after that real gesture settles, never by aborting it.
  if(touch)await page.waitForFunction(()=>!document.documentElement.dataset.browsing&&!document.querySelector('[data-scan-active]'),null,{timeout:6000});
  const data=await page.evaluate(()=>{const s=window.__continuity;return{initial:s.initial,samples:s.samples,corrections:s.corrections,began:s.began,ended:s.ended,compactHeights:s.compactHeights};});
  const restored=await page.locator('.skill-category').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
  if(data.initial){const during=data.samples.filter(s=>s.mode==='scan');data.materialEdge=data.initial.title>=80&&data.initial.title<764?'title':'bottom';const edge=data.materialEdge;const drift=during.map(s=>(s[edge]-data.initial[edge])+(s.y-data.initial.y)-data.corrections.filter(c=>c.at<=s.at).reduce((sum,c)=>sum+c.delta,0));data.materialDrift=Math.max(0,...drift.map(Math.abs));const last=during.at(-1);data.nativeDistance=last?last.y-data.initial.y-data.corrections.filter(c=>c.at<=last.at).reduce((sum,c)=>sum+c.delta,0):0;data.activeCorrections=last?data.corrections.filter(c=>c.at<=last.at).length:0;}
  report.journeys.push({touch,...data,initialHeights,restored});
  check(`${touch?'Touch':'Wheel'} compacts actual upcoming rows`,data.began&&data.compactHeights?.some((height,i)=>height<initialHeights[i]-10),data.compactHeights);
  check(`${touch?'Touch':'Wheel'} current visible material follows only actual input`,data.materialDrift<1,{edge:data.materialEdge,drift:data.materialDrift});
  check(`${touch?'Touch':'Wheel'} native forward movement continues during collapse`,data.nativeDistance>(touch?50:150),data.nativeDistance);
  if(!before)check(`${touch?'Touch':'Wheel'} active native browsing causes no programmatic scroll corrections`,data.activeCorrections===0,data.activeCorrections);
  check(`${touch?'Touch':'Wheel'} restores exact natural heights`,restored.every((v,i)=>Math.abs(v-initialHeights[i])<.2));
  check(`${touch?'Touch':'Wheel'} restores opaque accessible details`,await page.locator('#skills [data-scan-detail]').evaluateAll(es=>es.every(e=>!e.inert&&+getComputedStyle(e).opacity>.99)));
  check(`${touch?'Touch':'Wheel'} never creates horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await page.screenshot({path:out+`/${touch?'touch':'wheel'}-settled.png`});await context.close();
 }
 check('No runtime errors',report.errors.length===0,report.errors);report.sourceAfter=await hash();check('Hook source stable through native journeys',report.sourceAfter===report.sourceBefore);report.passed=report.checks.every(c=>c.passed);
}catch(e){report.error=e.stack;console.error(e);}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed&&!before)process.exitCode=1;}
