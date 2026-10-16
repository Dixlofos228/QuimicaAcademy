import {chemicalFormula,formulaEquivalent,equationEquivalent,chemicalEquation} from '../notation/chemistry.mjs';
import {algebraEquivalent} from '../notation/algebra.mjs';
import {numericValue} from '../science.mjs';

export function validateResponse(ex,input){
 try{
  if(ex.type==='equation')return equationEquivalent(input,String(ex.answer),{minimal:ex.minimal!==false});
  if(ex.type==='math')return algebraEquivalent(input,String(ex.answer));
  if(ex.type==='formula'){try{chemicalFormula(ex.answer);return formulaEquivalent(input,String(ex.answer),ex.equivalence||'structural');}catch{return algebraEquivalent(input,String(ex.answer));}}
  if(ex.type==='guided')return ex.stages.every((stage,i)=>validateResponse(stage,input?.[i]));
  if(ex.type==='numeric'){
   const value=numericValue(input,ex.unit||''),expected=Number(ex.answer),absolute=ex.tolerance??(expected===0?1e-9:Math.abs(expected)*.005);
   return Number.isFinite(value)&&Math.abs(value-expected)<=absolute;
  }
  if(ex.type==='multi')return Array.isArray(input)&&input.length===ex.answer.length&&new Set(input).size===input.length&&ex.answer.every(n=>input.includes(n));
  if(ex.type==='choice'||ex.type==='error')return input!==''&&input!==null&&Number(input)===ex.answer;
  if(ex.type==='order'||ex.type==='match')return Array.isArray(input)&&input.length===ex.answer.length&&ex.answer.every((n,i)=>String(input[i])===String(n));
  if(ex.type==='balance'){
   if(!Array.isArray(input)||input.length!==ex.answer.length)return false;
   const c=input.map(Number);if(c.some(x=>!Number.isSafeInteger(x)||x<1))return false;
   const ratio=c[0]/ex.answer[0];if(!c.every((x,i)=>x===ratio*ex.answer[i]))return false;
   if(ex.minimal){const gcd=(a,b)=>b?gcd(b,a%b):a;return c.reduce(gcd)===1;}return true;
  }
  if(ex.type==='steps')return Array.isArray(input)&&input.length===ex.answer.length&&ex.answer.every((a,i)=>{
   const expected=numericValue(a);return Number.isFinite(expected)?Number.isFinite(numericValue(input[i]))&&Math.abs(numericValue(input[i])-expected)<=Math.max(.001,Math.abs(expected)*.01):String(input[i]).replace(/\s/g,'')===String(a).replace(/\s/g,'');
  });
  return false;
 }catch{return false;}
}
export function responseDiagnostic(ex,input,lang){
 const ru=lang==='ru';
 if(ex.type==='equation'){
  try{const eq=chemicalEquation(input);if(!eq.balanced){const differences=Object.keys({...eq.leftInventory,...eq.rightInventory}).filter(k=>(eq.leftInventory[k]||0)!==(eq.rightInventory[k]||0));return(ru?'Не сохраняются атомы или заряд: ':'No se conservan átomos o carga: ')+differences.join(', ');}return ru?'Проверьте вещества, направление реакции и минимальные целые коэффициенты.':'Revisá sustancias, sentido de reacción y coeficientes enteros mínimos.';}catch{return ru?'Запись не разобрана. Проверьте символы элементов, скобки и стрелку →. Заряд удобно писать как ^2+ или ^-.':'No se pudo interpretar. Revisá símbolos, paréntesis y flecha →. Podés escribir cargas como ^2+ o ^-.';}
 }
 if(ex.type==='math')return ru?'Проверьте, одинаковое ли допустимое действие выполнено с обеих сторон равенства. В знаменателе не может быть нуля.':'Revisá que ambos lados reciban la misma operación válida. El denominador no puede ser cero.';
 if(ex.type==='numeric')return ru?'Проверьте единицы, знак, порядок действий и округление. Принимаются точка, запятая и запись 2e-3.':'Revisá unidades, signo, operaciones y redondeo. Se aceptan coma, punto y notación 2e-3.';
 if(ex.type==='formula')return ru?'Проверьте регистр символов, индексы, скобки и заряд. Коэффициент перед веществом не заменяет индекс внутри формулы.':'Revisá mayúsculas, subíndices, paréntesis y carga. Un coeficiente delante no reemplaza un subíndice.';
 return ru?'Сопоставьте ответ с условиями задачи и пояснением ниже.':'Compará tu respuesta con las condiciones y la explicación de abajo.';
}
