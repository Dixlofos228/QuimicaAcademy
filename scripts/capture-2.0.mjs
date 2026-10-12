import {chromium} from '@playwright/test';
import fs from 'node:fs';
const base=process.env.QUIMICA_CAPTURE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('reports/screenshots-2.0',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1080}});
 const shot=async name=>page.screenshot({path:`reports/screenshots-2.0/${name}.png`});
 const go=async route=>{await page.goto(`${base}/#${route}`);await page.locator('main h1').waitFor();await page.waitForTimeout(400);};
 await go('home');await shot('home');
 for(const [route,name,position]of [['carbon','molecule',1000],['hydrolysis','reaction',1000],['thermo-bomb','calorimeter',750]]){
  await go(`lesson/${route}`);const sim=page.getByTestId('simulation');await sim.getByRole('slider',{name:'Перемотка анимации'}).fill(String(position));
  if(name==='molecule'){await page.locator('.molecule-canvas,.molecule-vector').first().waitFor();}
  await page.waitForTimeout(400);await sim.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-90));await page.waitForTimeout(250);await shot(name);
  // Isolated lab export hides the fixed toolbar only in this temporary QA page.
  const style=await page.addStyleTag({content:'.topbar{visibility:hidden}'});await sim.screenshot({path:`reports/screenshots-2.0/${name}-lab.png`});await style.evaluate(el=>el.remove());
 }
 await go('lesson/mole');const solver=page.getByTestId('solver').first();await solver.getByRole('button',{name:'4',exact:true}).click();await page.waitForTimeout(400);await solver.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-110));await shot('formula');
 await go('progress');await shot('progress');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Español',exact:true}).click();await page.getByRole('button',{name:'Cambiar tema',exact:true}).click();await go('home');await shot('mobile-es-light');
}finally{await browser.close();}
