import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url='https://abdoabozena7.github.io/Clean_Portofoio/';
const out='output/playwright/fluid-live';await mkdir(out,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const report={url,sourceCommit:execFileSync('git',['rev-parse','HEAD']).toString().trim(),assets:[],checks:[],errors:[],passed:false};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);console.log(name);};
const html=await readFile('dist/index.html','utf8');const entry=html.match(/assets\/index-[\w-]+\.js/)[0];
// Pages builds asynchronously after the existing gh-pages push. Check the normal URL.
let live='';for(let attempt=0;attempt<60;attempt++){
 const response=await fetch(url,{cache:'no-store'});live=await response.text();
 if(response.ok&&live.includes(entry))break;
 console.log(`Pages is still serving the previous build (${attempt+1}); waiting for ${entry}`);
 await new Promise(resolve=>setTimeout(resolve,10000));
}
let browser;
try{
 check('Normal live URL serves the exact new production entry',live.includes(entry));
 for(const name of (await readdir('dist/assets')).filter(n=>/\.(js|css)$/.test(n))){
  const response=await fetch(url+'assets/'+name,{cache:'no-store'});const remote=Buffer.from(await response.arrayBuffer()),local=await readFile('dist/assets/'+name);
  check(`Published ${name} matches the tested production bytes`,response.ok&&digest(remote)===digest(local));report.assets.push({name,sha256:digest(local),liveSha256:digest(remote)});
 }
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.querySelector('#hero h1')&&!document.querySelector('#hero [data-building]'),null,{timeout:12000});
 check('Live hero keeps the actual name and Microsoft credential',(await page.locator('#hero h1').textContent()).replace(/\s/g,'')==='AbdelrahmanAbozena.'&&(await page.locator('#hero').innerText()).includes('SWE Intern at Microsoft'));
 check('Live About has concise copy and no Showcase link',await page.locator('#about p').count()===2&&await page.getByText('View Showcase Profile',{exact:true}).count()===0);
 check('Live project order starts with Hivo then HarrTest',await page.locator('[data-project]').evaluateAll(es=>es[0].dataset.project==='hivo'&&es[1].dataset.project==='harrtest'));
 await page.screenshot({path:out+'/desktop-hero.png'});
 await page.locator('#project-hivo').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-300,behavior:'instant'}));await page.waitForTimeout(250);await page.mouse.wheel(0,650);
 await page.locator('.quick-pass-cue').waitFor();check('Live skipped highlight produces only a small optional circle reminder',await page.locator('.quick-pass-cue circle').count()===2&&await page.locator('[data-attention-dialog]').count()===0);
 await page.waitForTimeout(1200);const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(3400);
 check('Published page never returns automatically or blocks scrolling',Math.abs(await page.evaluate(()=>scrollY)-y)<1&&await page.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'&&!document.documentElement.dataset.attentionPhase));
 await page.screenshot({path:out+'/desktop-optional-reminder.png'});await page.mouse.wheel(0,180);await page.waitForTimeout(250);check('Live native scrolling remains free with the reminder visible',Math.abs(await page.evaluate(()=>scrollY)-y)>100);
 await page.getByRole('button',{name:/Highlights explored: .*Open exploration map/}).click();await page.locator('.exploration-items').getByRole('button',{name:/Hivo Studio/}).click();await page.waitForFunction(()=>{const r=document.querySelector('#project-hivo').getBoundingClientRect();return r.top>=76&&r.top<innerHeight*.7});
 check('Only explicit Revisit returns to the actual Hivo card',await page.locator('#project-hivo').evaluate(e=>e.getBoundingClientRect().top>=76));
 const certificate=await context.newPage();await certificate.goto(url+'#honors',{waitUntil:'domcontentloaded'});await certificate.getByRole('button',{name:/Zoom in IMPACT/}).click();await certificate.getByRole('dialog').locator('img').evaluate(e=>e.decode());check('Published winning photo opens at genuine resolution',await certificate.getByRole('dialog').locator('img').evaluate(e=>e.naturalWidth===1280&&e.naturalHeight===853));await certificate.keyboard.press('Escape');
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),m=await mobile.newPage();m.on('pageerror',e=>report.errors.push(e.message));await m.goto(url+'#skills',{waitUntil:'domcontentloaded'});await m.evaluate(()=>document.fonts.ready);
 let compact=false;for(let i=0;i<10;i++){await m.mouse.wheel(0,65);await m.waitForTimeout(55);compact ||= await m.locator('[data-scan-active]').count()>0;}
 check('Published mobile retains compaction with no agents below the hero',compact&&await m.locator('[data-agent],[data-scan-editor]').evaluateAll(es=>es.every(e=>+getComputedStyle(e).opacity===0||getComputedStyle(e).display==='none'||!e.getClientRects().length)));check('Published mobile has no horizontal overflow',await m.evaluate(()=>document.documentElement.scrollWidth===innerWidth));check('Published percentage is labelled as highlight exploration, not page distance',await m.getByRole('button',{name:/Highlights explored: .*Open exploration map/}).count()===1);await m.getByRole('button',{name:/Highlights explored: .*Open exploration map/}).click();check('Live exploration map explains its exposure estimate',await m.locator('[data-exploration-map]').innerText().then(t=>t.includes('not reading')&&t.includes('3 seconds')));await m.getByRole('button',{name:'Close exploration map',exact:true}).click();await m.screenshot({path:out+'/mobile-skills.png'});
 await m.waitForTimeout(800);check('Published mobile Skills restores opaque accessible details',await m.locator('#skills [data-scan-detail]').evaluateAll(es=>es.every(e=>!e.inert&&+getComputedStyle(e).opacity>.99)));
 await mobile.close();check('Published desktop/mobile journeys have no runtime errors',report.errors.length===0);
 report.passed=true;
}catch(error){report.failure=error.stack;throw error;}
finally{await browser?.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,failure:report.failure}));}
