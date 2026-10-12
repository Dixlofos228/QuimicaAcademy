#!/usr/bin/env node
/** Repeatable local rendering-cadence benchmark. rAF callbacks are not a GPU
 * presentation-time measurement; the report deliberately keeps that distinction.
 * Playwright creates temporary profiles and closes only these owned processes.
 */
import {chromium,firefox} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';

const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const base=arg('--base-url','http://127.0.0.1:4173'),duration=Number(arg('--duration','3600'));
const output=path.resolve(arg('--output','reports/performance-2.0.json'));
if(!Number.isFinite(duration)||duration<1000||duration>15000)throw new Error('Sample duration must be1000–15000ms');
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw new Error('Benchmark accepts only loopback HTTP origins');
const exec=(binary,args=[])=>{try{return execFileSync(binary,args,{encoding:'utf8',timeout:5000}).trim();}catch{return null;}};
const clients=()=>{try{return JSON.parse(exec('hyprctl',['clients','-j'])||'[]');}catch{return [];}};
const save=report=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
const firefoxCandidates=[process.env.QUIMICA_FIREFOX_EXECUTABLE,firefox.executablePath(),...((fs.existsSync(path.join(process.env.HOME,'.cache/ms-playwright'))?fs.readdirSync(path.join(process.env.HOME,'.cache/ms-playwright')).filter(n=>/^firefox-\d+$/.test(n)).sort().reverse():[]).map(n=>path.join(process.env.HOME,'.cache/ms-playwright',n,'firefox/firefox')))].filter(Boolean);
const firefoxExecutable=firefoxCandidates.find(p=>fs.existsSync(p));
const report={schema:1,recordedAt:new Date().toISOString(),baseUrl:base,sampleDurationMs:duration,viewport:{width:1600,height:1000},host:{cpu:exec('lscpu',['-J']),gpu:exec('nvidia-smi',['--query-gpu=name,driver_version','--format=csv,noheader']),waylandDisplay:process.env.WAYLAND_DISPLAY||null,display:process.env.DISPLAY||null,sessionType:process.env.XDG_SESSION_TYPE||null,hyprlandVersion:exec('hyprctl',['version'])},methodology:{metric:'requestAnimationFrame callback cadence; not certified displayed-frame FPS',samples:'One warm sample per representative workload and browser; timeline duration4200ms, sample3600ms unless overridden',workload:'Real application timeline playback. Molecule: construction plus Playwright mouse drag. Home: pointer parallax via Playwright mouse movement. SVG graphs: playback with parameter updates.',warmupMs:700,profiles:'Temporary Playwright profiles, separate from user profiles',backendEvidence:'Hyprland newly created client xwayland flag + actual WebGL unmasked renderer; Chromium also CDPSystemInfo',limitations:['No GPU frame-presentation timestamps; rAF cadence does not guarantee every frame was painted or presented.','Short samples, one run per scene; not a long-term stress or thermal benchmark.','Browser startup and initial content loading are excluded after warmup.','Pointer input comes from Playwright. This includes rendering work but is not a physical-input latency measurement.']},browsers:[]};
try{report.host.cpu=JSON.parse(report.host.cpu);}catch{}
try{report.host.monitors=JSON.parse(exec('hyprctl',['monitors','-j'])||'[]').map(m=>({width:m.width,height:m.height,refreshRate:m.refreshRate,scale:m.scale}));}catch{}
save(report);
const scenarios=[
 {id:'home-parallax',route:'#home',activity:'pointer'},
 {id:'molecule-build-and-drag',route:'#lesson/carbon',activity:'drag',expectedKind:'bonds'},
 {id:'reaction-atom-tracking',route:'#lesson/hydrolysis',activity:'timeline',expectedKind:'carbs'},
 {id:'calorimeter',route:'#lesson/thermo-bomb',activity:'timeline',expectedKind:'calorimeter'},
 {id:'equilibrium',route:'#lesson/equilibrium-dynamic',activity:'parameter',expectedKind:'equilibrium'},
 {id:'heat-graph',route:'#lesson/thermo-heat',activity:'parameter',expectedKind:'thermo'},
];
async function rendererInfo(page){return page.evaluate(()=>{
 const c=document.querySelector('.molecule-canvas')||document.createElement('canvas'),existing=!!c.isConnected;
 let g;try{g=c.getContext('webgl2')||c.getContext('webgl');}catch{return {available:false};}
 if(!g)return {available:false};const e=g.getExtension('WEBGL_debug_renderer_info');
 const result={available:true,version:g.getParameter(g.VERSION),shadingLanguage:g.getParameter(g.SHADING_LANGUAGE_VERSION),vendor:e?g.getParameter(e.UNMASKED_VENDOR_WEBGL):g.getParameter(g.VENDOR),renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),maxTextureSize:g.getParameter(g.MAX_TEXTURE_SIZE),contextLost:g.isContextLost(),unmaskedExtension:!!e};
 if(!existing)g.getExtension('WEBGL_lose_context')?.loseContext();return result;
});}
async function measure(page){
 return page.evaluate(ms=>new Promise(resolve=>{
  const intervals=[],longTasks=[];let observer=null,start=0,last=0,previousDraws=window.__quimicaDrawCalls||0,gpuFrames=0,timelineFrames=0,previousProgress=null;
  if(window.PerformanceObserver&&PerformanceObserver.supportedEntryTypes.includes('longtask')){observer=new PerformanceObserver(list=>list.getEntries().forEach(e=>longTasks.push({durationMs:e.duration,startTimeMs:e.startTime})));observer.observe({type:'longtask',buffered:false});}
  const tick=now=>{if(!start)start=now;if(last)intervals.push(now-last);last=now;const draws=window.__quimicaDrawCalls||0;if(draws>previousDraws)gpuFrames++;previousDraws=draws;const p=document.querySelector('[data-testid=simulation]')?.getAttribute('data-progress');if(p!==null&&p!==previousProgress)timelineFrames++;previousProgress=p;
   if(now-start<ms){requestAnimationFrame(tick);return;}observer?.disconnect();const sorted=[...intervals].sort((a,b)=>a-b),percentile=q=>sorted[Math.max(0,Math.ceil(sorted.length*q)-1)]??null,elapsed=now-start,median=percentile(.5);
   resolve({elapsedMs:elapsed,callbackIntervals:intervals.length,callbacksPerSecond:intervals.length/elapsed*1000,medianIntervalMs:median,p95IntervalMs:percentile(.95),maxIntervalMs:Math.max(...intervals),cadenceFromMedianHz:median?1000/median:null,intervalsAbove25ms:intervals.filter(t=>t>25).length,intervalsAbove33_34ms:intervals.filter(t=>t>33.34).length,intervalsAbove50ms:intervals.filter(t=>t>50).length,webglFramesWithDrawCalls:gpuFrames,timelineFramesWithChangedProgress:timelineFrames,longTaskApi:!!observer,longTasks,visibility:document.visibilityState,dpr:devicePixelRatio,heapBytes:performance.memory?.usedJSHeapSize??null,timelineFinal:document.querySelector('[data-testid=simulation]')?.getAttribute('data-progress')??null});
  };requestAnimationFrame(tick);
 }),duration);
}
async function activity(page,scenario,box){
 const started=performance.now(),input=page.locator('[data-testid=simulation] .lab-controls input[type=range]').first();
 if(scenario.activity==='drag')await page.mouse.down();
 let step=0;
 while(performance.now()-started<duration){
  const t=(performance.now()-started)/duration;
  if(scenario.activity==='pointer'||scenario.activity==='drag')await page.mouse.move(box.x+box.width*(.5+.30*Math.sin(t*Math.PI*4)),box.y+box.height*(.5+.18*Math.cos(t*Math.PI*4)));
  else if(scenario.activity==='parameter'&&step%18===0&&await input.count()){
   const values=await input.evaluate(e=>({min:Number(e.min||0),max:Number(e.max||100),step:Number(e.step||1)}));const value=values.min+(values.max-values.min)*(.5+.35*Math.sin(t*Math.PI*2)),rounded=values.min+Math.round((value-values.min)/values.step)*values.step;await input.fill(String(Number(rounded.toFixed(8))));
  }
  step++;await new Promise(resolve=>setTimeout(resolve,16));
 }
 if(scenario.activity==='drag')await page.mouse.up();
}
for(const spec of [
 {name:'chromium',type:chromium,executablePath:'/usr/bin/chromium',env:{...process.env},args:['--no-sandbox','--ozone-platform=wayland']},
 {name:'firefox',type:firefox,executablePath:firefoxExecutable,env:{...process.env,MOZ_ENABLE_WAYLAND:'1',GDK_BACKEND:'wayland',XDG_SESSION_TYPE:'wayland'},args:[]},
]){
 const entry={name:spec.name,requestedHeaded:true,requestedWindowSystem:'wayland',executable:spec.executablePath,launchArguments:spec.args,launchEnvironment:spec.name==='firefox'?{MOZ_ENABLE_WAYLAND:'1',GDK_BACKEND:'wayland',XDG_SESSION_TYPE:'wayland'}:{},measurements:[],errors:[]};report.browsers.push(entry);let browser;
 try{
  if(!spec.executablePath)throw new Error('No cached Firefox executable found');
  const before=new Set(clients().map(c=>c.address));
  try{browser=await spec.type.launch({headless:false,executablePath:spec.executablePath,env:spec.env,args:spec.args,timeout:20000});entry.mode='headed';}catch(error){entry.headedFailure=String(error);browser=await spec.type.launch({headless:true,executablePath:spec.executablePath,env:spec.env,args:spec.name==='chromium'?['--no-sandbox']:[],timeout:20000});entry.mode='headless-fallback';}
  entry.version=browser.version();
  const context=await browser.newContext({viewport:report.viewport,locale:'ru-RU',reducedMotion:'no-preference',colorScheme:'dark'});
  await context.addInitScript(()=>{window.__quimicaDrawCalls=0;for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type)for(const method of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const original=type.prototype[method];if(!original)continue;type.prototype[method]=function(...args){window.__quimicaDrawCalls++;return original.apply(this,args);};}});
  const page=await context.newPage();page.on('pageerror',e=>entry.errors.push(e.message));page.setDefaultTimeout(12000);
  await page.goto(base+'/#home',{waitUntil:'networkidle',timeout:20000});await page.bringToFront();await page.waitForTimeout(700);
  entry.windowEvidence=clients().filter(c=>!before.has(c.address)&&String(c.class).toLowerCase().includes(spec.name)).map(c=>({class:c.class,pid:c.pid,xwayland:c.xwayland}));
  entry.nativeWaylandConfirmed=entry.mode==='headed'&&entry.windowEvidence.some(c=>c.xwayland===false);
  entry.webgl=await rendererInfo(page);
  if(/or similar/i.test(entry.webgl.renderer||''))entry.graphicsPrivacyNote='Firefox sanitizes the renderer string; it does not identify the exact physical GPU. Host nvidia-smi records RTX2060 separately.';
  entry.graphicsClassification=/llvmpipe|softpipe|swiftshader|software/i.test(entry.webgl.renderer||'')?'software':/NVIDIA|GeForce|AMD|Radeon|Intel|Iris/i.test(entry.webgl.renderer||'')?'hardware-indicated':'unconfirmed';
  if(spec.name==='chromium'){try{const cdp=await browser.newBrowserCDPSession();entry.cdpGpu=(await cdp.send('SystemInfo.getInfo')).gpu;await cdp.detach();}catch(e){entry.cdpGpuUnavailable=String(e);}}
  for(const scenario of scenarios){
   const sample={id:scenario.id,route:scenario.route,activity:scenario.activity,loadAverage:exec('cat',['/proc/loadavg'])};entry.measurements.push(sample);
   try{
    await page.goto(base+'/'+scenario.route,{waitUntil:'networkidle',timeout:20000});await page.bringToFront();await page.waitForTimeout(700);
    let box;
    if(scenario.activity==='pointer'){box=await page.locator('.hero-illustration').boundingBox();}
    else{const simulation=page.getByTestId('simulation');await simulation.waitFor();await simulation.scrollIntoViewIfNeeded();sample.kind=await simulation.getAttribute('data-kind');if(sample.kind!==scenario.expectedKind)throw new Error('Unexpected scene kind '+sample.kind);await simulation.getByLabel('Перемотка анимации').fill('0');await simulation.getByRole('button',{name:'Запустить',exact:true}).click();if(scenario.activity==='drag'){const stage=simulation.locator('.molecule-stage');await stage.scrollIntoViewIfNeeded();box=await stage.boundingBox();sample.renderer=await stage.getAttribute('data-renderer');sample.webgl=await rendererInfo(page);}}
    if(box)await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
    const timing=measure(page),movement=activity(page,scenario,box);const [metrics]=await Promise.all([timing,movement]);Object.assign(sample,metrics);console.log(spec.name,scenario.id,metrics.callbacksPerSecond.toFixed(1)+' rAF/s',metrics.medianIntervalMs.toFixed(2)+'ms median',metrics.p95IntervalMs.toFixed(2)+'ms p95');save(report);
   }catch(e){sample.error=String(e);console.log(spec.name,scenario.id,'FAILED',String(e).slice(0,180));save(report);}
  }
  await context.close();
 }catch(e){entry.error=String(e);console.log(spec.name,'FAILED',String(e).slice(0,200));}
 finally{if(browser)await browser.close();save(report);}
}
console.log('Saved',output);
