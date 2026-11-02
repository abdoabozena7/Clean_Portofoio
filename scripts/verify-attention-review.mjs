import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const negative = process.argv.includes('--negative-control');
const out = process.env.ATTENTION_REVIEW_OUTPUT || (negative ? 'output/research/attention-review-negative' : 'output/research/attention-review');
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8080/Clean_Portofoio/';
await mkdir(out, { recursive: true });
async function fingerprint() { const files=[]; async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())await walk(p);else files.push(p);}} await walk('src');const h=createHash('sha256');for(const f of files.sort()){h.update(f);h.update(await readFile(f));}return h.digest('hex'); }
const report = { url, sourceBefore: await fingerprint(), checks: [], observations: [], errors: [] };
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const phase=async(name,fn)=>{try{await fn();}catch(error){check(name+' completes',false,error.stack);}};
async function setup(mobile=false,reduced=false){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>{window.__attentionEvents=[];window.addEventListener('portfolio:attention-status',e=>window.__attentionEvents.push({at:performance.now(),phase:e.detail.phase,id:e.detail.item?.id,progress:e.detail.progress}));});
  await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});if(negative)await page.addStyleTag({content:'[data-scan-editor]{transform:none!important}'});return {context,page};
}
const state=page=>page.locator('html').getAttribute('data-attention-phase');
const position=async(page,selector,top=300)=>{await page.locator(selector).evaluate((el,t)=>{const h=el.querySelector('h3');scrollTo({top:scrollY+h.getBoundingClientRect().top-t,behavior:'instant'});},top);await page.waitForTimeout(240);};
const waitPhase=(page,phase,timeout=5000)=>page.waitForFunction(p=>document.documentElement.dataset.attentionPhase===p,phase,{timeout});
const critical=[
  ['experience-microsoft',"[data-attention-id='experience-microsoft']",false,'button'],
  ['education-harbin',"[data-attention-id='education-harbin']",true,'button'],
  ['honors-impact',"[data-attention-id='honors-impact']",false,'button'],
  ['honors-depi',"[data-attention-id='honors-depi']",true,'ring'],
  ['project-hivo','#project-hivo',false,'auto'],
];
try{
for(const [id,selector,mobile,activation] of negative?[]:critical)await phase(id,async()=>{
  const {context,page}=await setup(mobile);
  await position(page,selector);const original=await page.locator(selector).evaluate(el=>el.getBoundingClientRect().height);
  await page.mouse.wheel(0,650);await waitPhase(page,'warning',2000);
  check(id+' fast native wheel opens the named highlight',await page.locator('[data-attention-dialog]').isVisible()&&await page.locator('[data-attention-dialog]').innerText().then(t=>t.includes(id==='project-hivo'?'Hivo':id==='education-harbin'?'Harbin':id==='honors-impact'?'IMPACT':id==='honors-depi'?'DEPI':'Microsoft')));
  await page.waitForTimeout(120);
  const modalBox=await page.locator('[data-attention-dialog]').boundingBox();
  check(id+' warning keeps a compact dialog with side margins',modalBox.width<=401&&modalBox.x>=16&&modalBox.x+modalBox.width<=(mobile?390:1440)-16,modalBox);
  const modalColor=await page.locator('[data-attention-dialog]').evaluate(el=>getComputedStyle(el).backgroundColor);
  check(id+' warning uses the supplied cream palette',modalColor==='rgb(250, 236, 182)',modalColor);
  const ring=await page.locator('[data-attention-ring]').evaluate(el=>({phase:el.dataset.attentionRing,stroke:getComputedStyle(el.querySelector('circle:last-child')).color}));
  check(id+' ring warns in red',ring.phase==='warning'&&ring.stroke==='rgb(188, 62, 39)',ring);
  const warningY=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,400);await page.waitForTimeout(120);
  check(id+' warning blocks scroll',Math.abs(await page.evaluate(()=>scrollY)-warningY)<1);
  await page.screenshot({path:`${out}/${id}-warning.png`});
  if(activation==='auto'){
    await page.waitForTimeout(1700);check(id+' does not return before three seconds',await state(page)==='warning');
  }else if(activation==='ring')await page.locator('[data-attention-ring]').click();
  else if(mobile)await page.locator('.attention-return').tap();
  else await page.locator('.attention-return').click();
  await waitPhase(page,'reviewing',5000);
  const current=await page.locator(selector).evaluate(el=>({h:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,top:el.querySelector('h3').getBoundingClientRect().top,detail:[...el.querySelectorAll('[data-scan-detail]')].map(d=>({opacity:getComputedStyle(d).opacity,inert:d.inert})),siblings:[...el.closest('[data-scan-group]').querySelectorAll('[data-project],[data-scan-item]')].filter(e=>e!==el).map(e=>e.getBoundingClientRect().height)}));
  check(id+' returns to readable complete target',current.top>=76&&current.top<400&&Math.abs(current.h-original)<1&&current.detail.every(d=>d.opacity==='1'&&!d.inert),{original,current});
  check(id+' neighboring rows compact',current.siblings.length>0&&current.siblings.every(h=>h<=113),current.siblings);
  const reviewY=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,700);await page.keyboard.press('PageDown');await page.waitForTimeout(250);
  check(id+' review locks wheel and keyboard for visible countdown',Math.abs(await page.evaluate(()=>scrollY)-reviewY)<1&&await state(page)==='reviewing');
  await page.screenshot({path:`${out}/${id}-reviewing.png`});
  await waitPhase(page,'complete',4500);
  const timeline=await page.evaluate(()=>window.__attentionEvents);const warning=timeline.find(e=>e.phase==='warning');const relocating=timeline.find(e=>e.phase==='relocating');const reviewing=timeline.find(e=>e.phase==='reviewing');const complete=timeline.find(e=>e.phase==='complete');
  check(id+' review exposure is three seconds',complete.at-reviewing.at>=2990&&complete.at-reviewing.at<3500,{duration:complete.at-reviewing.at});
  if(activation==='auto')check(id+' automatic return waits three seconds',relocating.at-warning.at>=2990&&relocating.at-warning.at<3500,{duration:relocating.at-warning.at});
  check(id+' turns green and marks actual exposure',await page.locator('[data-attention-ring]').getAttribute('data-attention-ring')==='complete'&&await page.locator(selector).getAttribute('data-attention-seen')==='true');
  await page.screenshot({path:`${out}/${id}-complete.png`});
  await page.mouse.wheel(0,100);await page.waitForTimeout(100);check(id+' releases scroll after exposure',Math.abs(await page.evaluate(()=>scrollY)-reviewY)>25);
  await page.waitForTimeout(1700);await position(page,selector);await page.mouse.wheel(0,450);await page.waitForTimeout(180);
  check(id+' does not repeat completed highlight',!(await page.locator('[data-attention-dialog]').count())||!(await page.locator('[data-attention-dialog]').innerText()).includes(id==='project-hivo'?'Hivo':id==='education-harbin'?'Harbin':id==='honors-impact'?'IMPACT':id==='honors-depi'?'DEPI':'Microsoft'));
  report.observations.push({id,timeline,current});await context.close();
});
if(!negative)await phase('Escape and programmatic anchors',async()=>{
 const {context,page}=await setup(true);await position(page,'#project-hivo');await page.mouse.wheel(0,650);await waitPhase(page,'warning');await page.keyboard.press('Escape');await page.waitForTimeout(200);
 check('Escape recovers without pretending the highlight was read',await state(page)==='idle'&&await page.locator('#project-hivo').getAttribute('data-attention-seen')!=='true');
 const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,100);await page.waitForTimeout(120);check('Escape releases native scrolling',Math.abs(await page.evaluate(()=>scrollY)-y)>20);
 await page.goto(url+'#honors',{waitUntil:'networkidle'});await page.waitForTimeout(500);check('Fresh programmatic fragment does not gate visitors',await page.locator('[data-attention-dialog]').count()===0);await context.close();
});
await phase('Ordinary reminders and visible reflow',async()=>{
 const {context,page}=await setup(true);await position(page,"[data-attention-id='skills-backend']");
 await page.mouse.wheel(0,400);await page.waitForTimeout(120);
 check('Backend skip has a short playful optional cue',await page.locator('.quick-pass-cue').innerText().then(t=>t.includes('Frontend without a backend?'))&&await page.locator('[data-attention-dialog]').count()===0);
 const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,100);await page.waitForTimeout(100);check('Ordinary cue leaves scrolling free',Math.abs(await page.evaluate(()=>scrollY)-y)>20);
 await page.getByRole('button',{name:'Revisit Backend & MLOps'}).click();await page.waitForTimeout(500);
 check('Actual revisit clears optional notification',await page.locator('.quick-pass-cue').count()===0&&await page.locator("[data-attention-id='skills-backend']").getAttribute('data-attention-seen')==='true');
 await context.close();
 const {context:motionContext,page:motionPage}=await setup(true);
 await motionPage.evaluate(()=>document.getElementById('skills').scrollIntoView({behavior:'instant'}));await motionPage.waitForTimeout(400);
 const natural=await motionPage.locator('.skill-category').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
 const snapshots=[];for(let i=0;i<11;i++){await motionPage.mouse.wheel(0,65);await motionPage.waitForTimeout(45);snapshots.push(await motionPage.locator('[data-scan-editor]').evaluateAll(es=>es.map(e=>({opacity:Number(getComputedStyle(e).opacity),transform:getComputedStyle(e).transform,gutter:e.dataset.gutter,action:e.dataset.action}))));}
 const motion=snapshots.flat().filter(s=>s.opacity>.5);check('Reflow agents visibly travel instead of remaining static',new Set(motion.map(s=>s.transform)).size>=10,{visibleSamples:motion.length,distinct:new Set(motion.map(s=>s.transform)).size});
 check('Skills editor labels stay out of the text',await motionPage.locator('[data-scan-editor][data-gutter="true"] span').evaluateAll(es=>es.length>0&&es.every(e=>getComputedStyle(e).display==='none')));
 const font=await motionPage.locator('.skill-category h3').first().evaluate(e=>({size:parseFloat(getComputedStyle(e).fontSize),weight:parseInt(getComputedStyle(e).fontWeight),color:getComputedStyle(e).color}));check('Skill headings stay bold readable fourteen pixels',font.size>=14&&font.weight>=700,font);
 await motionPage.screenshot({path:`${out}/skills-moving.png`});
 const unfolding=[];for(let i=0;i<20;i++){await motionPage.waitForTimeout(40);unfolding.push(await motionPage.locator('[data-scan-editor]').evaluateAll(es=>es.map(e=>({opacity:Number(getComputedStyle(e).opacity),transform:getComputedStyle(e).transform,action:e.dataset.action}))));}
 const unfold=unfolding.flat().filter(s=>s.opacity>.5&&s.action==='unfold');check('Expansion has distinct moving builder gestures',new Set(unfold.map(s=>s.transform)).size>=3,{samples:unfold.length,distinct:new Set(unfold.map(s=>s.transform)).size});
 const restored=await motionPage.locator('.skill-category').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));check('Restored Skills recover natural exact heights',restored.every((v,i)=>Math.abs(v-natural[i])<.2),{natural,restored});
 await motionPage.screenshot({path:`${out}/skills-restored.png`});await motionContext.close();
});
if(!negative)await phase('Other reminders and native touch/keyboard',async()=>{
 for(const [selector,message,reverse] of [["[data-attention-id='skills-ai']",'AI skills are the main character',true],['#project-harrtest','Ask it for the evidence',false]]){
  const {context,page}=await setup(true);await position(page,selector);await page.mouse.wheel(0,450);await page.waitForTimeout(150);
  check(selector+' important ordinary cue is short and optional',await page.locator('.quick-pass-cue').innerText().then(t=>t.includes(message))&&await page.locator('[data-attention-dialog]').count()===0);
  if(reverse){await page.mouse.wheel(0,-260);await page.waitForTimeout(180);check('Reverse revisit removes the AI reminder',await page.locator('.quick-pass-cue').count()===0);}
  else {await page.getByRole('button',{name:'Dismiss highlight reminder'}).click();await page.waitForTimeout(120);check('Ordinary reminder can be dismissed',await page.locator('.quick-pass-cue').count()===0);}
  await context.close();
 }
 const {context,page}=await setup(true);await position(page,'#project-hivo');const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:710}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:710-i*65}]});await page.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await waitPhase(page,'warning',2000);check('Trusted touch scrolling triggers the named Hivo stop',await page.locator('[data-attention-dialog]').innerText().then(t=>t.includes('Hivo')));await page.keyboard.press('Escape');await context.close();
 const keyboard=await setup();await position(keyboard.page,"[data-attention-id='education-harbin']");await keyboard.page.keyboard.press('PageDown');await waitPhase(keyboard.page,'warning',2000);check('Native PageDown triggers the skipped Harbin highlight',await keyboard.page.locator('[data-attention-dialog]').innerText().then(t=>t.includes('Harbin')));await keyboard.page.keyboard.press('Escape');await keyboard.context.close();
});
if(!negative)await phase('Reduced motion',async()=>{
 const {context,page}=await setup(true,true);await position(page,'#project-hivo');await page.mouse.wheel(0,650);await waitPhase(page,'warning');await page.locator('.attention-return').tap();await waitPhase(page,'reviewing');
 check('Reduced motion hides decorative reflow builders',await page.locator('[data-scan-editor]').evaluateAll(es=>es.every(e=>getComputedStyle(e).display==='none')));await page.keyboard.press('Escape');check('Reduced motion retains Escape recovery',await state(page)==='idle');await context.close();
});
}finally{
 await browser.close();report.sourceAfter=await fingerprint();check('Review source remains coherent',report.sourceBefore===report.sourceAfter);check('No native runtime errors',report.errors.length===0,report.errors);report.passed=report.checks.every(c=>c.passed);await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
}
if(!report.passed)process.exitCode=1;
