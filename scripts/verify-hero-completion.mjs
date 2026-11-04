import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseline=process.argv.includes('--baseline'),negative=process.argv.includes('--negative-control');
const out=`output/playwright/hero-completion${baseline?'-before':negative?'-negative':''}`;await mkdir(out,{recursive:true});
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/';
const fingerprint=async()=>{const h=createHash('sha256');for(const p of ['src/hooks/useScrollConstruction.ts','scripts/verify-hero-completion.mjs']){h.update(p);h.update(await readFile(p));}return h.digest('hex');};
const report={sourceBefore:await fingerprint(),instrumentation:'Non-behavioral trace hooks inserted into the real Vite module response; negative control additionally reinstates the old hero deadline.',checks:[],journeys:[],errors:[],passed:false};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const mobile of [false,true]){
  const label=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile,recordVideo:{dir:out}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/src/hooks/useScrollConstruction.ts*',async route=>{
   const response=await route.fetch();let code=await response.text();
   if(negative)code=code.replace('if (t.section.id !== "hero" && now - t.visibleSince > (simplified ? 5500 : 8000)) {','if (now - t.visibleSince > (simplified ? 5500 : 8000)) {');
   if(!/const finish = \(t\)\s*=>\s*\{/.test(code))throw Error('Vite finish trace insertion not found');
   code=code.replace(/const finish = \(t\)\s*=>\s*\{/,`const finish = (t) => { if(t.section.id==='hero'&&t.el.dataset.constructed!=='true'){window.__heroFinishes??=[];window.__heroFinishes.push({at:performance.now(),progress:t.progress,kind:t.kind,text:t.el.getAttribute('aria-label')||t.el.textContent?.trim().slice(0,70)||t.el.tagName,visible:t.el.getBoundingClientRect().height>0,rect:t.el.getBoundingClientRect().toJSON()});}`);
   code=code.replace(/const paint = \(t\)\s*=>\s*\{/,`const paint = (t) => { if(t.section.id==='hero'){window.__heroPaints??=new Map();window.__heroPaints.set(t.el,{at:performance.now(),progress:t.progress});}`);
   await route.fulfill({response,body:code});
  });
  await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#hero a')].map(el=>document.fonts.load(getComputedStyle(el).font,el.textContent||'CV')));});await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  const rects=()=>page.locator('#hero h1,#hero [data-microsoft-headline],#hero .palette-tag,#hero a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}));
  await page.waitForFunction(()=>+document.querySelector('[data-name-assembly]')?.dataset.nameProgress>.025&&document.fonts.status==='loaded');
  // Routing the controller intentionally disables browser cache. The warm-up
  // before reload therefore cannot guarantee the masked CV's bold font is ready.
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('#hero a')].map(el=>document.fonts.load(getComputedStyle(el).font,el.textContent||'CV'))));
  const before=await rects();await page.waitForTimeout(6500);await page.screenshot({path:`${out}/${label}-after-name.png`});
  await page.waitForFunction(()=>!document.querySelector('#hero [data-building]'),null,{timeout:24000});await page.waitForTimeout(100);
  const finishes=await page.evaluate(()=>window.__heroFinishes||[]),unearned=finishes.filter(f=>f.visible&&f.progress<.98&&!['structure'].includes(f.kind));
  const byFrame=new Map();for(const f of unearned){const bucket=Math.floor(f.at/50);byFrame.set(bucket,(byFrame.get(bucket)||0)+1);}
  const biggestBatch=Math.max(0,...byFrame.values());report.journeys.push({label,finishes,unearned,biggestBatch});
  check(`${label}: trace observes real individual hero jobs`,finishes.filter(f=>f.visible&&f.kind!=='structure').length>=10);
  check(`${label}: every visible content target completes its own timeline`,unearned.length===0,unearned);
  check(`${label}: no unfinished end-of-intro batch is exposed`,biggestBatch<3,{biggestBatch});
  const afterGeometry = await rects();
  check(`${label}: original hero geometry stays fixed`,JSON.stringify(before)===JSON.stringify(afterGeometry),{before,after:afterGeometry});
  check(`${label}: finished hero has real readable controls`,await page.locator('#hero a').evaluateAll(es=>es.filter(e=>e.getClientRects().length).every(e=>!e.closest('[data-building]')&&getComputedStyle(e).clipPath==='none')));
  await page.screenshot({path:`${out}/${label}-finished.png`});await context.close();
 }
 check('No native runtime errors',report.errors.length===0,report.errors);report.sourceAfter=await fingerprint();check('Controller and verifier remain coherent',report.sourceBefore===report.sourceAfter);report.passed=report.checks.every(c=>c.passed);
}catch(e){report.failure=e.stack;console.error(e);}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
