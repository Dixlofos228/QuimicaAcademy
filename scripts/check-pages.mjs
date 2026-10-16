import {chromium,firefox,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const base=(process.argv[2]||'http://127.0.0.1:4181/QuimicaAcademy/').replace(/\/?$/,'/');
const output=process.argv[3]||'work/pages-check';
await fs.mkdir(output,{recursive:true});
const results=[];
for(const [name,engine,options] of [['chromium',chromium,{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}],['firefox',firefox,{}]]){
 const browser=await engine.launch(options);
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const route of ['home','lesson/carbon','lesson/carb-classification','lesson/thermo-bomb','lesson/mole','glossary','progress','exam/diagnostic']){
   await page.goto(base+'#'+route);await expect(page.locator('main h1')).toBeVisible();
   if(route.startsWith('lesson/')){await expect(page.locator('.lab-loading')).toHaveCount(0);await expect(page.getByTestId('simulation')).toBeAttached();}
  }
  await page.goto(base+'#sources');await page.locator('.source-thumb').first().click();
  await expect(page.locator('.source-modal img')).toHaveJSProperty('naturalWidth',1500);
  const original=await page.locator('.source-modal>a').getAttribute('href');
  expect(original).toBe('https://github.com/Dixlofos228/QuimicaAcademy/releases/download/course-originals/001.jpg');
  await page.goto(base+'#home');await expect(page.locator('.hero-illustration img')).toHaveJSProperty('naturalWidth',1400);
  await page.screenshot({path:`${output}/${name}-desktop.png`});
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Español',exact:true}).click();
  await expect(page.locator('main h1')).toHaveText('Química que podés entender.');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${output}/${name}-mobile.png`});
  await page.goto(base+'#lesson/thermo-bomb');
  await expect(page.locator('.q-caption')).toBeAttached();
  const background=await page.locator('.lab-stage').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(background).toContain(new URL('art/lab-atmosphere.webp',base).href);
  expect(errors).toEqual([]);
  results.push({browser:name,base,desktop:true,mobile390:true,RU_ES:true,sourcePhoto:true,originalReleaseLink:original,errors});
 }finally{await browser.close();}
}
await fs.writeFile(`${output}/results.json`,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
