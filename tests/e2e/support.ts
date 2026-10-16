import type {Locator} from '@playwright/test';
export const canonicalAnswer=(e:any):any=>e.type==='guided'?e.stages.map(canonicalAnswer):e.answer;
export async function fillAnswer(host:Locator,e:any,value:any){
 if(e.type==='choice'||e.type==='error'){const options=host.locator('.options input');if(await options.count())await options.nth(Number(value)).check();else await host.locator('select').selectOption(String(value));}
 else if(e.type==='multi'){for(const option of await host.locator('.options input').all())await option.uncheck();for(const i of value)await host.locator('.options input').nth(i).check();}
 else if(['formula','math','equation'].includes(e.type))await host.locator('textarea').fill(String(value));
 else if(e.type==='numeric')await host.locator('input:not([type=radio]):not([type=checkbox]):not([readonly])').first().fill(String(value));
 else if(e.type==='guided')for(let i=0;i<e.stages.length;i++)await fillAnswer(host.locator('fieldset').nth(i),e.stages[i],value[i]);
 else if(e.type==='order'){
  const rows=host.locator('.sequence li');let current=await rows.evaluateAll(nodes=>nodes.map(n=>Number((n as HTMLElement).dataset.optionIndex)));
  for(let i=0;i<value.length;i++){let j=current.indexOf(value[i]);while(j>i){await rows.nth(j).getByRole('button',{name:/Переместить выше|Mover arriba/}).click();[current[j-1],current[j]]=[current[j],current[j-1]];j--;}}
 }else if(e.type==='match')for(let i=0;i<value.length;i++)await host.locator('select').nth(i).selectOption(String(value[i]));
 else for(let i=0;i<value.length;i++)await host.locator('input:not([readonly])').nth(i).fill(String(value[i]));
}
