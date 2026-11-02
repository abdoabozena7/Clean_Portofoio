import {createRequire} from 'node:module';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/';
const negative=process.argv.includes('--negative-control'),out=`output/playwright/discovery${negative?'-negative':''}`;await mkdir(out,{recursive:true});
async function source(){const paths=[];async function walk(d){for(const f of await readdir(d,{withFileTypes:true})){const p=d+'/'+f.name;if(f.isDirectory())await walk(p);else paths.push(p);}}await walk('src');const h=createHash('sha256');for(const p of paths.sort()){h.update(p);h.update(await readFile(p));}return h.digest('hex');}
const report={url,sourceBefore:await source(),checks:[],observations:[],errors:[],passed:false};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const score=p=>p.locator('.exploration-trigger strong').textContent().then(v=>parseFloat(v));
const trigger=p=>p.getByRole('button',{name:/Discovery score: .*Open exploration map/});
const locate=async(p,s)=>{await p.locator(s).evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-140,behavior:'instant'}));await p.waitForTimeout(450);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url+'#contact',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 check('A fresh session has no invented discovery credit',await score(page)===0);
 check('Discovery includes every actual story row rather than five headline items',await page.locator('[data-discovery-id]').count()>=30,await page.locator('[data-discovery-id]').count());
 check('The percentage trigger is a real circle without a rectangular label frame',await trigger(page).evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return Math.abs(r.width-r.height)<.1&&parseFloat(s.borderRadius)>=r.width/2;}));
 await locate(page,'#project-hivo');const before=await score(page);await page.waitForTimeout(1300);const partial=await score(page);
 check('Standing on an expanded visible story grows the score continuously',partial>before,{before,partial});
 await page.waitForTimeout(3000);const earned=await score(page);await page.mouse.wheel(0,1400);await page.waitForTimeout(100);const skipped=await score(page);
 if(negative)await page.locator('.exploration-trigger strong').evaluate((el,n)=>el.firstChild.textContent=String(n),earned+10);
 check('A fast pass over unfinished stories actually lowers the visible score',await score(page)<earned,{earned,skipped,shown:await score(page)});
 await locate(page,'#project-harrtest');const returnStart=await score(page);await page.waitForTimeout(4000);const recovered=await score(page);
 check('Expanded slow revisiting fills the gap and recovers progress',recovered>returnStart,{returnStart,recovered});
 await trigger(page).click();check('The exploration panel has curved side corners',await page.locator('[data-exploration-map]').evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius)>=20));
 check('The panel keeps optional rules without claiming to detect reading',await page.locator('.discovery-rules').innerText().then(t=>t.includes('About this score'))&&await page.locator('.discovery-rules p').textContent().then(t=>t.includes('not reading')&&t.includes('Earned attention stays earned')));
 const mapScore=await score(page);await page.waitForTimeout(3300);check('An opened panel cannot earn exposure to covered content',await score(page)===mapScore);
 await page.getByRole('button',{name:'AI & agents',exact:true}).click();check('Visitor-selected routes remain functional',await page.getByRole('button',{name:'AI & agents',exact:true}).getAttribute('aria-pressed')==='true');
 await page.keyboard.press('Escape');check('Escape closes the nonmodal map and returns focus',await page.locator('[data-exploration-map]').count()===0&&await trigger(page).evaluate(el=>document.activeElement===el));
 await locate(page,'#project-ya-rab-ostorha');await page.locator('#project-ya-rab-ostorha [data-scan-detail]').evaluateAll(es=>es.forEach(e=>e.inert=true));const hidden=await score(page);await page.waitForTimeout(3600);
 check('A title with inaccessible collapsed details earns no credit',await score(page)===hidden,{hidden,after:await score(page)});
 await page.locator('#project-ya-rab-ostorha [data-scan-detail]').evaluateAll(es=>es.forEach(e=>e.inert=false));await page.waitForTimeout(2200);check('Restoring visible expanded details lets the score grow',await score(page)>hidden);
 await page.getByRole('button',{name:/Zoom in on YA RAB/}).click();const covered=await score(page);await page.waitForTimeout(3200);check('Opening an image does not instantly finish a story or count hidden exposure',await score(page)===covered);await page.keyboard.press('Escape');
 await page.reload({waitUntil:'networkidle'});await page.locator('#contact').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(450);check('Reload clears session-only credits',await score(page)===0);
 const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(4000);check('The game never redirects, blocks scrolling or opens a mandatory popup',Math.abs(await page.evaluate(()=>scrollY)-y)<1&&await page.getByRole('dialog').count()===0&&await page.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'));
 await page.mouse.wheel(0,-300);await page.waitForTimeout(200);check('Native wheel remains available at an incomplete score',Math.abs(await page.evaluate(()=>scrollY)-y)>150);
 await locate(page,'#project-hivo');await page.mouse.wheel(0,650);await page.waitForTimeout(150);if(await page.locator('.quick-pass-cue').count())check('The optional reminder is curved, not a rectangular box',await page.locator('.quick-pass-cue').evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius)>=24));
 await page.screenshot({path:out+'/mobile-circle-and-cue.png'});await trigger(page).click();await page.locator('.discovery-rules summary').click();await page.screenshot({path:out+'/mobile-rounded-map.png'});
 check('No horizontal overflow or exploration persistence is introduced',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth&&localStorage.length===0&&sessionStorage.length===0));await context.close();
 const dctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),d=await dctx.newPage();d.on('pageerror',e=>report.errors.push(e.message));await d.goto(url+'#contact',{waitUntil:'networkidle'});await trigger(d).click();check('Desktop panel offers every real story through the optional full route',await d.locator('.discovery-all .exploration-items li').count()===await d.locator('[data-discovery-id]').count());await d.screenshot({path:out+'/desktop-rounded-map.png'});await dctx.close();
 check('Native discovery journeys produce no runtime errors',!report.errors.length,report.errors);report.sourceAfter=await source();check('Current source stayed coherent through verification',report.sourceBefore===report.sourceAfter);report.passed=report.checks.every(c=>c.passed);
}catch(error){report.failure=error.stack;console.error(error);}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,source:report.sourceBefore,failure:report.failure}));}
