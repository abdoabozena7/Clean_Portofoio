import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/A-plus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const negative=process.argv.includes('--negative-control');
const out=process.env.PROVE_IT_OUTPUT_DIR||'output/playwright/hero-agents/'+(negative?'negative':'acceptance');
await mkdir(out,{recursive:true});
const sources=['src/components/HeroSection.tsx','src/components/HeroAgentsOverlay.tsx','src/components/AgentConstruction.tsx','src/components/AgentPointer.tsx','src/lib/heroAgents.ts','src/lib/heroOverlayWork.ts','src/lib/agentConfig.ts','src/lib/palette.ts','src/lib/constructionDirector.ts','src/styles/hero-agents.css','src/styles/construction.css','src/hooks/useScrollConstruction.ts','src/lib/nameConstruction.ts','scripts/verify-hero-agents.mjs'];
const hash=async()=>{const h=createHash('sha256');for(const file of sources){h.update(file);h.update(await readFile(file));}return h.digest('hex')};
const report={mode:'live',negative,sourceBefore:await hash(),checks:[],errors:[],journeys:[],passed:false};
const check=(id,passed,evidence)=>{report.checks.push({id,passed:!!passed,evidence});console.log((passed?'PASS ':'FAIL ')+id)};
const baseline=JSON.parse(await readFile('output/playwright/hero-agents/baseline/geometry.json','utf8'));
const distance=(a,b)=>a&&b?Math.hypot(a.x-b.x,a.y-b.y):Infinity;
const span=values=>values.length?Math.max(...values)-Math.min(...values):Infinity;
const percentile=(values,p)=>values.length?[...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*p)]:Infinity;
const browser=await chromium.launch({channel:'msedge',headless:true});
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8080/Clean_Portofoio/';
try{
 await Promise.all((negative?[1440]:[1440,390]).map(async width=>{
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390,recordVideo:{dir:out}});
  try{
   const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(e.message));
   await page.addInitScript(()=>{
    window.__heroAgentFrames=[];
    const screenPoint=(node,x=0,y=0)=>{const m=node.getScreenCTM();if(!m)return null;const p=new DOMPoint(x,y).matrixTransform(m);return{x:p.x,y:p.y}};
    const opacity=node=>{let value=1;for(let at=node;at instanceof Element;at=at.parentElement){const s=getComputedStyle(at);if(s.display==='none'||s.visibility==='hidden')return 0;value*=Number(s.opacity)}return value};
    const bounds=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
    const sampleObject=node=>{
     const strokes=[...node.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')].flatMap(shape=>{
      const s=getComputedStyle(shape),alpha=opacity(shape);if(s.stroke==='none'||alpha<.01||!shape.getTotalLength)return[];
      const length=shape.getTotalLength(),units=Number(shape.getAttribute('pathLength'))||length;
      const dash=parseFloat(s.strokeDasharray),offset=parseFloat(s.strokeDashoffset);
      // Inspect native stroke paint: data-build-progress alone cannot pass creation.
      const reveal=Number.isFinite(dash)&&dash>=units*.98?Math.max(0,Math.min(1,1-offset/units)):null;
      const p=reveal===null?null:shape.getPointAtLength(length*reveal);
      return[{tag:shape.tagName,length,opacity:alpha,dash:s.strokeDasharray,offset:s.strokeDashoffset,reveal,tip:p?screenPoint(shape,p.x,p.y):null}];
     });
     return{name:node.dataset.heroAgent||node.dataset.heroTool,point:screenPoint(node),box:bounds(node),progress:Number(node.dataset.buildProgress),placed:node.dataset.placed==='true',opacity:opacity(node),strokes};
    };
    const sample=()=>{
     const svg=document.querySelector('[data-hero-agents]'),cable=svg?.querySelector('[data-agent-cable]');
     if(cable&&svg.dataset.state==='building'&&window.__heroAgentFrames.length<3000){
      const draw=Number(svg.dataset.drawProgress),p=cable.getPointAtLength(cable.getTotalLength()*draw);
      const pool=[...document.querySelectorAll('[data-agent-layer] .virtual-agent')];
      const activeCreatorCount=pool.filter(node=>{const r=node.querySelector('svg')?.getBoundingClientRect();return opacity(node)>.5&&r&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight}).length;
      const creators=pool.filter(node=>node.hasAttribute('data-overlay-job')).map(node=>{
       const r=node.querySelector('svg')?.getBoundingClientRect();
       return{job:node.dataset.overlayJob,agent:node.dataset.agent,opacity:opacity(node),tip:r?{x:r.x+r.width*.5,y:r.y+r.height/32}:null};
      });
      window.__heroAgentFrames.push({elapsed:Number(svg.dataset.elapsed),phase:svg.dataset.phase,draw,tip:screenPoint(cable,p.x,p.y),activeCreatorCount,creators,actors:[...svg.querySelectorAll('[data-hero-agent]')].map(sampleObject),tools:[...svg.querySelectorAll('[data-hero-tool]')].map(sampleObject),headingReady:document.querySelector('#hero h1')?.dataset.constructed==='true'});
     }
     requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
   });
   if(negative)await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');style.textContent='.virtual-agent[data-overlay-job="draw-cable"]{transform:translate(0px,0px)!important}';document.head.append(style);
   }));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-hero-agents] [data-hero-agent]')].some(n=>+n.dataset.buildProgress>=.4&&+n.dataset.buildProgress<=.7),null,{timeout:30000});
   await page.screenshot({path:path.join(out,width+'-mascot-drawing.png')});
   await page.waitForFunction(()=>{const s=document.querySelector('[data-hero-agents]');return +s?.dataset.drawProgress>=.18&&+s.dataset.drawProgress<.5},null,{timeout:20000});
   await page.screenshot({path:path.join(out,width+'-drawing.png')});
   await page.waitForFunction(()=>document.querySelector('[data-hero-agents]')?.dataset.state==='settled',null,{timeout:20000});
   const frames=await page.evaluate(()=>window.__heroAgentFrames);
   await writeFile(path.join(out,width+'-frames.json'),JSON.stringify(frames));
   const creator=(f,job)=>f.creators.find(c=>c.job===job&&c.opacity>.5&&c.tip);
   const growing=frames.filter(f=>f.draw>.05&&f.draw<.95);
   const drawing=growing.filter(f=>creator(f,'draw-cable'));
   const distances=drawing.map(f=>distance(creator(f,'draw-cable').tip,f.tip));
   check(width+':creatorFollowsGrowingCable',distances.length>10&&drawing.length>=growing.length*.9&&Math.max(...distances)<12,{samples:distances.length,growingSamples:growing.length,max:distances.length?Math.max(...distances):null});
   const cableTravel=drawing.length?distance(creator(drawing.at(-1),'draw-cable').tip,creator(drawing[0],'draw-cable').tip):0;
   check(width+':creatorActuallyTracesCable',cableTravel>width*.15,{travel:cableTravel});
   for(const name of ['teal','amber','coral','code','terminal']){
    const object=f=>[...f.actors,...f.tools].find(n=>n.name===name);
    const creating=frames.filter(f=>creator(f,'draw-'+name)&&object(f)?.progress>.02&&object(f).progress<.98);
    const progress=creating.map(f=>object(f).progress);
    const partial=creating.map(f=>{
     const item=object(f),tip=creator(f,'draw-'+name).tip,strokes=item.strokes.filter(s=>s.reveal!==null&&s.reveal>.01&&s.reveal<.99);
     const b=item.box,dx=Math.max(b.x-tip.x,0,tip.x-b.x-b.width),dy=Math.max(b.y-tip.y,0,tip.y-b.y-b.height);
     return{partialStrokes:strokes.length,reveals:strokes.map(s=>s.reveal),tipDistance:strokes.length?Math.min(...strokes.map(s=>distance(tip,s.tip))):null,nearby:Math.hypot(dx,dy)};
    });
    const painted=partial.filter(f=>f.partialStrokes>0&&f.nearby<65);
    check(width+':'+name+'CreatedByExistingPointer',creating.length>8&&span(progress)>.5&&painted.length>5&&span(painted.flatMap(f=>f.reveals))>.2,{samples:creating.length,progressRange:span(progress),nativePartialStrokeSamples:painted.length,partialTipDistanceP90:percentile(painted.map(f=>f.tipDistance),.9),nearbyDistanceP90:percentile(partial.map(f=>f.nearby),.9)});
    const carrying=frames.filter(f=>creator(f,'place-'+name)&&object(f)?.opacity>.5&&!object(f).placed&&object(f).progress>=.99);
    const offsets=carrying.map(f=>{const a=creator(f,'place-'+name).tip,b=object(f).point;return{x:b.x-a.x,y:b.y-a.y}});
    const positions=carrying.map(f=>object(f).point),travel=positions.length?distance(positions[0],positions.at(-1)):0;
    check(width+':'+name+'PhysicallyCarriedByExistingPointer',offsets.length>8&&span(offsets.map(p=>p.x))<2&&span(offsets.map(p=>p.y))<2&&travel>15,{samples:offsets.length,offsetXRange:span(offsets.map(p=>p.x)),offsetYRange:span(offsets.map(p=>p.y)),travel});
    const placed=frames.filter(f=>object(f)?.placed);
    check(width+':'+name+'PlacedAfterGradualCreation',creating.length&&carrying.length&&placed.length&&creating.at(-1).elapsed<=carrying[0].elapsed&&carrying[0].elapsed<placed[0].elapsed,{createdThrough:creating.at(-1)?.elapsed,carriedFrom:carrying[0]?.elapsed,placedFrom:placed[0]?.elapsed});
    const fixed=placed.map(f=>object(f).point);
    check(width+':'+name+'StationaryAfterPlacement',fixed.length>5&&span(fixed.map(p=>p.x))<1&&span(fixed.map(p=>p.y))<1,{samples:fixed.length,xRange:span(fixed.map(p=>p.x)),yRange:span(fixed.map(p=>p.y))});
   }
   check(width+':startsAfterNativeName',frames.length>20&&frames.every(f=>f.headingReady));
   check(width+':constructionPhasesObserved',['create-mascots','place-mascots','build-cable','perch'].every(phase=>frames.some(f=>f.phase===phase)),{phases:[...new Set(frames.map(f=>f.phase))]});
   const visibleCreators=frames.map(f=>f.creators.filter(c=>c.opacity>.5&&c.tip&&c.tip.x>=0&&c.tip.x<=width&&c.tip.y>=0&&c.tip.y<=900));
   const helperSamples=visibleCreators.flat().filter(c=>/^(?:pin-(?:teal|amber|coral)|align-.+|inspect-.+|seat-junction)$/.test(c.job));
   const helperJobs=[...new Set(helperSamples.map(c=>c.job))],helperAgents=[...new Set(helperSamples.map(c=>c.agent))];
   if(width===1440)check(width+':additionalCreatorsPerformHelperSteps',helperSamples.length>10&&helperJobs.length>=3&&helperAgents.length>=3&&Math.max(...visibleCreators.map(c=>c.length))>3,{samples:helperSamples.length,jobs:helperJobs,agents:helperAgents,maxConcurrent:Math.max(...visibleCreators.map(c=>c.length))});
   else check(width+':mobileRetainsThreeActiveCreators',frames.length>20&&Math.max(...frames.map(f=>f.activeCreatorCount))<=3&&helperSamples.length===0,{maxConcurrent:Math.max(...frames.map(f=>f.activeCreatorCount)),helperSamples:helperSamples.length});
   const final=await page.evaluate(()=>{
    const h=document.querySelector('#hero h1'),svg=document.querySelector('[data-hero-agents]'),s=getComputedStyle(h);
    const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
    const objects=[...svg.querySelectorAll('[data-hero-agent],[data-hero-tool]')];
    const pointers=[...document.querySelectorAll('[data-agent-layer] .virtual-agent')];
    const colorContext=document.createElement('canvas').getContext('2d');
    const normalizeColor=color=>{colorContext.fillStyle='#000';colorContext.fillStyle=color;return colorContext.fillStyle.toLowerCase()};
    const pointerColors=pointers.map(node=>({agent:node.dataset.agent,palette:normalizeColor(getComputedStyle(node).getPropertyValue('--agent-color').trim()),paint:normalizeColor(getComputedStyle(node.querySelector('svg path')).fill)}));
    const accent=svg.querySelector('[data-celebration-right]'),d=accent?.getAttribute('d')||'';
    const number='([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?)';
    const rayDx=[...d.matchAll(new RegExp('l\\s*'+number,'g'))].map(m=>+m[1]);
    const horizontalDx=[...d.matchAll(new RegExp('h\\s*'+number,'g'))].map(m=>+m[1]);
    const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);let periodRight=null;
    while(walker.nextNode()){const text=walker.currentNode,end=text.textContent.trimEnd().length;if(text.textContent[end-1]==='.'){const range=document.createRange();range.setStart(text,end-1);range.setEnd(text,end);periodRight=range.getBoundingClientRect().right}}
    const rightAccent={d,rayDx,horizontalDx,left:accent?.getBoundingClientRect().left,periodRight,color:accent?normalizeColor(getComputedStyle(accent).stroke):null};
    const button=document.querySelector('#hero a[download]'),r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return{text:h.textContent,font:s.font,family:s.fontFamily,size:s.fontSize,lineHeight:s.lineHeight,color:s.color,surnameColor:getComputedStyle(h.querySelector('span')).color,heading:rect(h),elements:[...document.querySelectorAll('#hero h1,#hero [data-microsoft-headline],#hero .palette-tag,#hero a')].map(rect),actors:svg.querySelectorAll('[data-hero-agent]').length,tools:svg.querySelectorAll('[data-hero-tool]').length,raster:svg.querySelectorAll('image,img,foreignObject,canvas').length,allPlaced:objects.every(n=>n.dataset.placed==='true'&&+n.dataset.buildProgress===1),overlayPointers:svg.querySelectorAll('.virtual-agent,.agent-pointer-shape').length,pointerCount:pointers.length,pointerColors,rightAccent,pointerEvents:getComputedStyle(svg).pointerEvents,cvClickable:hit?.closest('a')===button,overflow:document.documentElement.scrollWidth>innerWidth+1,svgRect:rect(svg),state:svg.dataset.state,elapsed:+svg.dataset.elapsed};
   });
   const before=baseline.find(b=>b.width===width),comparison=['text','family','size','lineHeight','color','surnameColor','heading','elements'];
   check(width+':originalLayoutAndTypeUnchanged',comparison.every(key=>JSON.stringify(final[key])===JSON.stringify(before[key])),{differences:comparison.filter(key=>JSON.stringify(final[key])!==JSON.stringify(before[key]))});
   check(width+':nativeSvgMatchesApprovedIngredients',final.actors===3&&final.tools===2&&final.raster===0&&final.allPlaced&&final.overlayPointers===0,final);
   check(width+':overlayDoesNotBlockControls',final.pointerEvents==='none'&&final.cvClickable&&!final.overflow,final);
   check(width+':readable5600msConstruction',final.state==='settled'&&final.elapsed===5600,{state:final.state,elapsed:final.elapsed});
   const palette=['#2bbaa5','#93d3ae','#faecb6','#f9a822','#f96635'];
   check(width+':tenExistingCreatorsUseOriginalPalette',final.pointerCount===10&&final.pointerColors.every(c=>palette.includes(c.palette)&&palette.includes(c.paint)),{count:final.pointerCount,colors:final.pointerColors});
   const accent=final.rightAccent;
   check(width+':rightAmberAccentPointsOutward',accent.rayDx.length>=2&&accent.rayDx.every(dx=>dx>0)&&accent.horizontalDx.length>=1&&accent.horizontalDx.every(dx=>dx>0)&&accent.periodRight!==null&&accent.left>=accent.periodRight-.5&&accent.color==='#f9a822',accent);
   await page.screenshot({path:path.join(out,width+'-settled.png')});
   if(!negative){
    await page.mouse.wheel(0,1100);await page.waitForTimeout(500);
    const leaving=await page.locator('[data-hero-agents]').getAttribute('data-elapsed');
    await page.keyboard.press('Control+Home');await page.waitForTimeout(700);
    check(width+':returnDoesNotReplay',await page.locator('[data-hero-agents]').getAttribute('data-state')==='settled'&&await page.locator('[data-hero-agents]').getAttribute('data-elapsed')===leaving);
    await page.setViewportSize({width:width===390?768:1920,height:900});await page.waitForTimeout(350);
    check(width+':resizeKeepsAnchorsAndProgress',await page.locator('[data-hero-agents]').evaluate(svg=>svg.dataset.state==='settled'&&+svg.dataset.elapsed===5600&&Math.abs(+svg.getAttribute('viewBox').split(' ')[2]-svg.parentElement.getBoundingClientRect().width)<.1&&document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(out,width+'-resized.png')});
   }
   report.journeys.push({width,frames:frames.length,state:final.state});
  }finally{await context.close()}
 }));
 if(!negative){
  const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
  try{
   const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url,{timeout:30000});await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>document.querySelector('[data-hero-agents]')?.dataset.state==='settled');
   check('reducedMotionImmediateFinalIllustration',await page.locator('[data-hero-agents]').evaluate(svg=>+svg.dataset.elapsed===5600&&getComputedStyle(svg).opacity==='1'&&[...svg.querySelectorAll('[data-hero-agent],[data-hero-tool]')].every(e=>e.dataset.placed==='true'&&+e.dataset.buildProgress===1)&&[...svg.querySelectorAll('.hero-mascot-eyes')].every(e=>getComputedStyle(e).animationName==='none')));
   await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(250);
   check('preferenceChangeDoesNotRestart',await page.locator('[data-hero-agents]').getAttribute('data-state')==='settled');
   await page.screenshot({path:path.join(out,'390-reduced.png')});
  }finally{await context.close()}
 }
 check('noRuntimeErrors',report.errors.length===0,report.errors);
 report.sourceAfter=await hash();check('currentSourceCoherent',report.sourceBefore===report.sourceAfter);
 report.passed=report.checks.every(c=>c.passed);
}catch(error){report.failure=error.stack;console.error(error)}finally{
 await browser.close();await writeFile(path.join(out,'result.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,failed:report.checks.filter(c=>!c.passed).map(c=>c.id),failure:report.failure}));
 if(!report.passed)process.exitCode=1;
}
