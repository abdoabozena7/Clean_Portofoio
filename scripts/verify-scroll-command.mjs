import {createRequire} from 'node:module';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/',out=process.env.PORTFOLIO_EVIDENCE_DIR||'output/playwright/scroll-command';await mkdir(out,{recursive:true});
async function hash(){const files=[];async function walk(d){for(const f of await readdir(d,{withFileTypes:true})){const p=d+'/'+f.name;f.isDirectory()?await walk(p):files.push(p)}}await walk('src');const h=createHash('sha256');for(const p of files.sort())h.update(p).update(await readFile(p));return h.digest('hex')}
const report={url,sourceBefore:await hash(),checks:[],journeys:[],errors:[]},check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(passed?'PASS':'FAIL',name)};
const browser=await chromium.launch({channel:'msedge',headless:true});
async function open(mobile){const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,recordVideo:{dir:out}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.section-return-cue').waitFor({state:'attached'});await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});await page.evaluate(()=>{window.__commands=[];window.__inputs=[];window.__cues=0;addEventListener('portfolio:scroll-command',e=>window.__commands.push(e.detail));for(const type of ['wheel','touchstart','touchmove'])addEventListener(type,e=>window.__inputs.push({type,trusted:e.isTrusted,at:e.timeStamp,y:e.touches?.[0]?.clientY}),{passive:true});new MutationObserver(entries=>{window.__cues+=entries.filter(entry=>[...entry.addedNodes].some(node=>node instanceof Element&&node.matches('.return-popup'))).length}).observe(document.querySelector('.section-return-cue'),{childList:true})});await position(page);return {context,page}}
async function position(page){await page.evaluate(()=>scrollTo({top:2200,behavior:'instant'}));await page.waitForTimeout(500)}
async function snapshot(page){return page.evaluate(()=>({y:scrollY,commands:window.__commands.slice(),inputs:window.__inputs.slice(),cues:window.__cues}))}
async function move(client,page,points,delay){await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:700}]});for(const y of points){await page.waitForTimeout(delay);await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y}]})}}
try{
 {const {context,page}=await open(false);try{
  const start=await snapshot(page);await page.mouse.wheel(0,500);await page.waitForTimeout(100);const hard=await snapshot(page);check('FIRST strong wheel command goes UP before a section can be skipped',hard.y<=start.y-450&&hard.commands.some(c=>c.reverse&&c.input==='wheel'),{start,hard});
  await page.waitForTimeout(260);await page.mouse.wheel(0,80);await page.waitForTimeout(180);const slow=await snapshot(page);check('Ordinary command immediately goes DOWN after reversal',slow.y>hard.y+50,{hard:hard.y,slow:slow.y});
  await page.keyboard.press('PageDown');await page.waitForTimeout(500);check('Keyboard PageDown remains native downward',(await snapshot(page)).y>slow.y+300);
  await position(page);await page.mouse.move(1190,600);const wheelStart=await snapshot(page);
  for(let i=0;i<18;i++){await page.mouse.wheel(0,80);await page.waitForTimeout(34)}
  const wheelBurst=await snapshot(page);
  const wheelReversals=wheelBurst.commands.slice(wheelStart.commands.length).filter(command=>command.input==='wheel'&&command.reverse);
  check('Many small native wheel steps reverse by their own delta during one burst',wheelReversals.length>=2&&wheelReversals.every(command=>command.delta===-80),{wheelStart,wheelBurst});
  check('Slow Down is mounted once during a qualifying wheel burst',wheelBurst.cues-wheelStart.cues===1,{wheelStart:wheelStart.cues,wheelBurst:wheelBurst.cues});
  await position(page);const repeatStart=await snapshot(page);
  for(let i=0;i<4;i++){await page.mouse.wheel(0,360);await page.waitForTimeout(270)}
  const repeated=await snapshot(page);
  check('Every rapid repeat, including the third and fourth attempts, reverses',repeated.commands.slice(repeatStart.commands.length).filter(command=>command.input==='wheel'&&command.reverse).length===4,{repeatStart,repeated});
  await position(page);const spaced=await snapshot(page);
  for(let i=0;i<5;i++){await page.mouse.wheel(0,80);await page.waitForTimeout(265)}
  const paced=await snapshot(page);
  check('Spaced wheel steps remain native and downward',paced.y>spaced.y+350&&paced.commands.length===spaced.commands.length,{spaced,paced});
  await page.evaluate(()=>{const area=document.createElement('div');area.id='nested-scroll-test';area.style.cssText='position:fixed;inset:100px auto auto 100px;z-index:9999;width:220px;height:170px;overflow-y:auto;background:white';const content=document.createElement('div');content.style.height='900px';area.append(content);document.body.append(area)});
  const nestedStart=await snapshot(page);await page.mouse.move(160,160);await page.mouse.wheel(0,500);await page.waitForTimeout(180);
  check('A strong wheel in a nested scroller stays inside that scroller',await page.locator('#nested-scroll-test').evaluate(el=>el.scrollTop)>350&&Math.abs((await snapshot(page)).y-nestedStart.y)<3);
  await page.locator('#nested-scroll-test').evaluate(el=>el.remove());
  const textarea=page.locator('#contact textarea');await textarea.fill('command verification');await position(page);await page.mouse.move(1200,600);const editStart=await snapshot(page);await page.mouse.wheel(0,500);await page.waitForTimeout(150);check('Focused form control exempts even a strong command',(await snapshot(page)).y>editStart.y+350&&await textarea.inputValue()==='command verification');
 }finally{await context.close()}}
 {const {context,page}=await open(true);try{
  const client=await context.newCDPSession(page),start=await snapshot(page);
  await move(client,page,[400,100],16);const held=await snapshot(page);
  check('Strong touch command goes UP WHILE finger is held',held.y<start.y-150&&held.commands.some(c=>c.input==='touch'&&c.reverse),{start,held});
  check('Strong touch never first moves DOWN',held.commands.filter(c=>c.input==='touch').every(c=>c.to<=c.from),held.commands);
  await page.screenshot({path:out+'/touch-held-up.png'});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(750);const coast=await snapshot(page);check('Fast touch release continues upward, never flings down',coast.y<=held.y+2,{held:held.y,coast:coast.y});
  await position(page);const slowStart=await snapshot(page);await move(client,page,[675,650,625],80);const slowHeld=await snapshot(page);check('Ordinary touch moves DOWN while held',slowHeld.y>slowStart.y+50,{start:slowStart.y,end:slowHeld.y});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(750);check('Normal touch retains downward release momentum',(await snapshot(page)).y>slowHeld.y);
  await position(page);await move(client,page,[400],16);const mixedFast=await snapshot(page);await page.waitForTimeout(90);await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:375}]});const mixedSlow=await snapshot(page);check('Slowing the SAME held gesture immediately restores downward movement',mixedSlow.y>mixedFast.y+15,{fast:mixedFast.y,slow:mixedSlow.y});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:700}]});const holdStart=await snapshot(page);await page.waitForTimeout(300);const holdEnd=await snapshot(page);check('A new finger press stops prior custom inertia',Math.abs(holdStart.y-holdEnd.y)<3,{start:holdStart.y,end:holdEnd.y});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await position(page);const shortStart=await snapshot(page);
  for(let i=0;i<6;i++){await move(client,page,[655,610,565,520],24);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(20)}
  const shortEnd=await snapshot(page);
  const touchSteps=shortEnd.commands.slice(shortStart.commands.length).filter(command=>command.input==='touch');
  const firstReversed=touchSteps.findIndex(command=>command.reverse);
  check('Separate small native swipes combine and reverse during the same burst',touchSteps.length===24&&firstReversed>=4&&firstReversed<23&&touchSteps[firstReversed].delta===-45,{shortStart,shortEnd,firstReversed});
  check('Small swipes and their momentum announce the cue only once',shortEnd.cues-shortStart.cues===1,{start:shortStart.cues,end:shortEnd.cues});
  await position(page);const spacedStart=await snapshot(page);
  for(let i=0;i<4;i++){await move(client,page,[655],65);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250)}
  const spacedEnd=await snapshot(page);
  check('Short swipes separated by a pause remain downward',spacedEnd.y>spacedStart.y+160&&spacedEnd.commands.slice(spacedStart.commands.length).every(command=>!command.reverse),{spacedStart,spacedEnd});
  await page.locator('#project-hivo').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));await page.getByRole('button',{name:'Zoom in Hivo Studio',exact:true}).tap();const dialog=page.getByRole('dialog');await dialog.waitFor();check('Touch tap still activates real image dialog',await dialog.isVisible());const modalStart=await snapshot(page);await move(client,page,[400,100],16);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);check('Touch inside dialog never moves the page',Math.abs((await snapshot(page)).y-modalStart.y)<3);await page.keyboard.press('Escape');
  const beforeAnchor=await snapshot(page);
  await page.getByRole('button',{name:'Menu',exact:true}).tap();
  await page.locator('nav').getByRole('link',{name:'Experience',exact:true}).tap();
  await page.waitForURL('**/#experience');
  await page.waitForFunction(()=>Math.abs(document.querySelector('#experience').getBoundingClientRect().top)<150);
  const afterAnchor=await snapshot(page);
  check('A menu anchor jumps to its section without becoming a reverse command',afterAnchor.y<beforeAnchor.y&&afterAnchor.commands.length===beforeAnchor.commands.length,{before:beforeAnchor.y,after:afterAnchor.y});
  check('Native touch inputs are trusted and page has no overflow',await page.evaluate(()=>window.__inputs.filter(e=>e.type.startsWith('touch')).length>=8&&window.__inputs.every(e=>e.trusted)&&document.documentElement.scrollWidth===innerWidth));report.journeys.push({name:'native touch',start,held,coast,slowStart,slowHeld});
 }finally{await context.close()}}
 check('No runtime errors',!report.errors.length,report.errors);report.sourceAfter=await hash();check('Application source is coherent',report.sourceBefore===report.sourceAfter);report.passed=report.checks.every(c=>c.passed);
}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1}
