import {createRequire} from 'node:module';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/';
const negative=process.argv.includes('--negative-control'),out=`output/playwright/exploration${negative?'-negative':''}`;await mkdir(out,{recursive:true});
async function source(){const paths=[];async function walk(d){for(const f of await readdir(d,{withFileTypes:true})){const p=d+'/'+f.name;if(f.isDirectory())await walk(p);else paths.push(p);}}await walk('src');const h=createHash('sha256');for(const p of paths.sort()){h.update(p);h.update(await readFile(p));}return h.digest('hex');}
const report={url,sourceBefore:await source(),checks:[],errors:[],passed:false};
const check=(name,passed,evidence)=>{report.checks.push({name,passed:!!passed,evidence});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const value=p=>p.locator('.exploration-trigger strong').textContent().then(v=>parseInt(v));
const trigger=p=>p.getByRole('button',{name:/Highlights explored: .*Open exploration map/});
const selectors=["[data-attention-id='experience-microsoft']","[data-attention-id='education-harbin']","[data-attention-id='honors-impact']","[data-attention-id='honors-depi']",'#project-hivo'];
const locate=async(p,s)=>{await p.locator(s).evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-140,behavior:'instant'}));await p.waitForTimeout(180);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 check('Exploration starts at zero without a fabricated head start',await value(page)===0);
 for(let i=0;i<8;i++){await page.mouse.wheel(0,1900);await page.waitForTimeout(60);}await page.waitForTimeout(600);
 if(negative)await page.locator('.exploration-trigger strong').evaluate(el=>el.firstChild.textContent='100');
 check('Reaching the footer quickly does not pretend every highlight was explored',await page.evaluate(()=>scrollY>document.documentElement.scrollHeight-innerHeight-800)&&await value(page)<100,{percentage:await value(page)});
 const beforeY=await page.evaluate(()=>scrollY);await page.waitForTimeout(6500);check('Incomplete progress never triggers an automatic return, modal or scroll lock',Math.abs(await page.evaluate(()=>scrollY)-beforeY)<1&&await page.getByRole('dialog').count()===0&&await page.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'));
 await trigger(page).click();check('The map names its exposure rule and its limitation',(await page.locator('[data-exploration-map]').innerText()).includes('3 seconds visible in full detail')&&(await page.locator('[data-exploration-map]').innerText()).includes('not reading'));
 check('All five named highlights are available without blocking other content',await page.locator('.exploration-items li').count()===5);
 await page.getByRole('button',{name:'AI & agents',exact:true}).click();check('Explicit AI route selects an actual AI project recommendation',await page.getByRole('button',{name:'AI & agents',exact:true}).getAttribute('aria-pressed')==='true'&&(await page.locator('.exploration-next').innerText()).includes('local-agent studio'));
 const prior=await value(page);await page.locator('.exploration-next').click();await page.waitForTimeout(350);
 check('A chosen route returns only after the explicit click',await page.locator('#project-hivo').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>76&&r.top<innerHeight*.65;}));
 check('Clicking Revisit alone does not award exposure immediately',await value(page)===prior);
 await page.waitForTimeout(3100);check('Actual visible full-detail exposure advances one truthful step',await value(page)===prior+20);
 await trigger(page).click();await page.keyboard.press('Escape');check('Escape closes the map and restores trigger focus',await page.locator('[data-exploration-map]').count()===0&&await trigger(page).evaluate(el=>el===document.activeElement));
 await page.reload({waitUntil:'networkidle'});check('Reload resets session-only progress',await value(page)===0);
 // A title alone in a compact inaccessible card must not count as reading exposure.
 await locate(page,selectors[0]);await page.locator(selectors[0]).evaluate(el=>{el.dataset.testInert='true';el.querySelector('[data-scan-detail]').inert=true;});await page.waitForTimeout(3400);
 check('Hidden or inert detail does not earn exploration progress',await value(page)===0);
 await page.locator(selectors[0]).evaluate(el=>{el.querySelector('[data-scan-detail]').inert=false;delete el.dataset.testInert;});await page.waitForTimeout(3200);check('Restoring actually visible detail starts earning exposure',await value(page)===20);
 // Programmatic anchors do not award points by themselves. No runtime state is injected.
 await locate(page,selectors[1]);const early=await value(page);await page.waitForTimeout(900);check('A short glance does not earn a highlight',await value(page)===early);
 await trigger(page).click();await page.waitForTimeout(3200);check('Time behind the open exploration map does not earn progress',await value(page)===early);await page.keyboard.press('Escape');
 await page.waitForTimeout(2400);check('Harbin exposure counts after the declared duration',await value(page)===40);
 for(const s of selectors.slice(2)){await locate(page,s);await page.waitForTimeout(3200);}
 check('Five genuinely exposed highlights can reach 100 percent',await value(page)===100);
 await trigger(page).click();check('Completed map visibly checks all five and retains navigation',await page.locator('.exploration-check.is-explored').count()===5&&await page.getByRole('button',{name:'Scroll to top',exact:true}).isVisible());await page.screenshot({path:out+'/mobile-completed-map.png'});await page.getByRole('button',{name:'Close exploration map',exact:true}).click();
 check('No external persistence is used for exploration',await page.evaluate(()=>localStorage.length===0&&sessionStorage.length===0));
 check('The mobile interface remains inside the viewport',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));await context.close();
 const desktop=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),d=await desktop.newPage();d.on('pageerror',e=>report.errors.push(e.message));await d.goto(url+'#honors',{waitUntil:'networkidle'});await d.evaluate(()=>document.fonts.ready);await d.getByRole('button',{name:/Zoom in IMPACT/}).click();
 check('Opening a real credential image is a transparent explicit engagement signal',await value(d)===20);await d.waitForTimeout(3300);check('A covering Zoom dialog does not count hidden sibling highlights',await value(d)===20);await d.keyboard.press('Escape');await trigger(d).click();await d.getByRole('button',{name:'Career & learning',exact:true}).click();check('Career route can be chosen without changing core progress',await value(d)===20&&await d.getByRole('button',{name:'Career & learning',exact:true}).getAttribute('aria-pressed')==='true');await d.screenshot({path:out+'/desktop-career-map.png'});await desktop.close();
 check('Native exploration journeys have no runtime errors',!report.errors.length,report.errors);report.sourceAfter=await source();check('Current source remains coherent through the journey',report.sourceBefore===report.sourceAfter);report.passed=report.checks.every(c=>c.passed);
}catch(error){report.failure=error.stack;console.error(error);}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,source:report.sourceBefore,failure:report.failure}));}
