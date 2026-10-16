import {buildMoleBank} from './mole-bank.mjs';
import {blueprints} from './blueprints.mjs';
import {chemicalFormula,chemicalEquation} from '../notation/chemistry.mjs';
import {algebra} from '../notation/algebra.mjs';
const P=(ru,es)=>({ru,es});
const levels=['easy','medium','hard'];
const defaultHint=P('Начните с определения искомой величины и проверьте, какие данные действительно нужны.','Empezá identificando qué se pide y qué datos hacen falta.');
export function buildLessonBank(lesson){
 if(lesson.id==='mole')return moleBank(lesson);
 const b=blueprints[lesson.id];if(!b)throw Error('Missing blueprint '+lesson.id);
 const base=lesson.exercises.map((e,i)=>({...e,lessonId:lesson.id,difficulty:e.type==='error'||e.type==='steps'?'hard':e.type==='choice'||e.type==='formula'?'easy':'medium',objective:'legacy-'+i,optionReasons:e.options&&['choice','error','multi'].includes(e.type)?e.options.map((_,j)=>P(((Array.isArray(e.answer)?e.answer.includes(j):e.answer===j)?'Верный вариант. ':'Проверьте отличие от правильного объяснения: ')+e.explanation.ru,((Array.isArray(e.answer)?e.answer.includes(j):e.answer===j)?'Opción correcta. ':'Compará con la explicación correcta: ')+e.explanation.es)):undefined}));
 const extra=[];
 const make=(type,key,question,answer,explanation,fields={})=>{const e={id:lesson.id+'-v3-'+key,lessonId:lesson.id,type,question,answer,explanation,hints:[defaultHint,P('Сопоставьте запись с формулой и условиями применимости из урока.','Compará la notación con la fórmula y sus condiciones de validez.')],difficulty:'medium',objective:key,...fields};extra.push(e);return e;};
 for(let i=0;i<2;i++){
  const f=b.facts[i],other=b.facts[(i+2)%b.facts.length];
  make('choice','concept-'+i,P('Какое утверждение соответствует теме «'+lesson.title.ru+'»?','¿Qué afirmación corresponde a «'+lesson.title.es+'»?'),0,P(f[0]+' '+lesson.paragraphs[Math.min(i,lesson.paragraphs.length-1)].simple.ru,f[1]+' '+lesson.paragraphs[Math.min(i,lesson.paragraphs.length-1)].simple.es),{difficulty:i?'medium':'easy',options:[P(f[0],f[1]),P(f[2],f[3]),P(other[2],other[3])],optionReasons:[P('Верно: '+f[0],'Correcto: '+f[1]),P('Неверно. '+f[0],'Incorrecto. '+f[1]),P('Неверно. '+other[0],'Incorrecto. '+other[1])]});
 }
 const f2=b.facts[2],f3=b.facts[3],f4=b.facts[4];
 make('multi','linked-concepts',P('Выберите все корректные выводы для этой темы.','Elegí todas las conclusiones correctas para este tema.'),[0,2],P(f2[0]+' '+f3[0],f2[1]+' '+f3[1]),{difficulty:'hard',options:[P(f2[0],f2[1]),P(f2[2],f2[3]),P(f3[0],f3[1]),P(f3[2],f3[3])],optionReasons:[P(f2[0],f2[1]),P('Здесь ошибка: '+f2[0],'El error se corrige así: '+f2[1]),P(f3[0],f3[1]),P('Здесь ошибка: '+f3[0],'El error se corrige así: '+f3[1])]});
 make('error','misconception',P('Ученик утверждает: «'+f4[2]+'». Какое объяснение исправляет ошибку?','Un estudiante afirma: «'+f4[3]+'». ¿Qué explicación corrige el error?'),0,P(f4[0]+' '+lesson.paragraphs.at(-1).simple.ru,f4[1]+' '+lesson.paragraphs.at(-1).simple.es),{difficulty:'hard',options:[P(f4[0],f4[1]),P(f4[2],f4[3]),P('Любые условия и единицы можно игнорировать.','Se pueden ignorar todas las condiciones y unidades.')],optionReasons:[P(f4[0],f4[1]),P('Повторяет ошибку. '+f4[0],'Repite el error. '+f4[1]),P('Условия задают применимость модели; единицы задают смысл величины.','Las condiciones fijan la validez; las unidades, el significado de la magnitud.')]});
 const [entryType,entryAnswer,entryRU,entryES]=b.entry;
 make(entryType,'independent-entry',P(entryRU,entryES),entryAnswer,P('Запись следует из состава или зависимости, указанной в условии. '+b.facts[0][0],'La notación respeta la composición o dependencia del enunciado. '+b.facts[0][1]),{minimal:true,equivalence:lesson.id==='functional'?'structural':'composition'});
 const example=lesson.examples[0];
 make('order','reasoning-order',P('Восстановите порядок именно этого разбора: «'+example.title.ru+'». Следуйте исходным данным, подстановке, вычислению и проверке.','Reconstruí el orden de esta resolución: «'+example.title.es+'». Seguí datos, sustitución, cálculo y verificación.'),example.steps.map((_,i)=>i),P(example.why.map(x=>x.ru).join(' '),example.why.map(x=>x.es).join(' ')),{difficulty:'medium',options:example.steps});
 const terms=lesson.terms.slice(0,4);
 make('match','concept-links',P('Сопоставьте понятия этого урока с их смыслом.','Relacioná conceptos de esta lección y su significado.'),terms.map((_,i)=>i),P(terms.map(t=>t.name.ru+': '+t.definition.ru).join(' '),terms.map(t=>t.name.es+': '+t.definition.es).join(' ')),{difficulty:'easy',options:terms.map(x=>x.name),matches:terms.map(x=>x.definition)});
 const [answer,unit,qru,qes,whyru,whyes]=b.calc;
 make('numeric','application',P(qru,qes),answer,P(whyru,whyes),{unit:unit==='1'?'':unit,tolerance:answer===0?1e-9:Math.abs(answer)*.003});
 make('choice','unit-reasoning',P('В задаче «'+qru+'» как следует понимать единицу итогового результата?','En «'+qes+'», ¿cómo se interpreta la unidad del resultado?'),0,P(whyru+' '+(unit==='1'?'Результат — число или безразмерная доля.':'Искомая величина выражена в '+unit+'.'),whyes+' '+(unit==='1'?'El resultado es un número o fracción adimensional.':'La magnitud pedida se expresa en '+unit+'.')),{difficulty:'easy',options:[P(unit==='1'?'Безразмерное число или доля.':'Единица искомой величины: '+unit+'.',unit==='1'?'Número o fracción adimensional.':'Unidad de lo pedido: '+unit+'.'),P('Любая единица подходит, если совпало число.','Cualquier unidad sirve si coincide el número.'),P('Единицы всегда исчезают после любого вычисления.','Toda operación elimina siempre las unidades.')],optionReasons:[P(whyru,whyes),P('Одно число с другой размерностью обозначает другую величину.','El mismo número con otra dimensión representa otra magnitud.'),P('Единицы сокращаются только по алгебре множителей.','Las unidades solo se cancelan siguiendo la álgebra de factores.')]});
 const wrongs=entryType==='math'?[entryAnswer+'+1',entryAnswer.endsWith('=0')?entryAnswer.replace('+','-'):entryAnswer.replace('=', '=-')]:entryType==='equation'?[entryAnswer.replace(/->|<->/,' + '),entryAnswer.replace(/H2O/g,'H2O2')+' + H2']:['H2','CO2'];
 make('choice','notation-choice',P('Для условия «'+entryRU+'» выберите корректную запись.','Para «'+entryES+'», elegí la notación correcta.'),0,P(entryRU+' Ответ: '+entryAnswer,entryES+' Respuesta: '+entryAnswer),{difficulty:'medium',options:[P(entryAnswer,entryAnswer),P(wrongs[0],wrongs[0]),P(wrongs[1],wrongs[1])],optionReasons:[P('Сохраняет заданный состав, знак и отношение величин.','Respeta la composición, signo y relación pedidos.'),P('Нарушает состав или добавляет не предусмотренную условием операцию.','Cambia la composición o agrega una operación no pedida.'),P('Не соответствует условию задачи или балансу.','No coincide con el enunciado o el balance.')]});
 const S=(id,type,question,answer,fields={})=>({id:lesson.id+'-stage-'+id,type,question,answer,explanation:P(whyru,whyes),hints:[],...fields});
 let stages;
 if(entryType==='formula'){
  const formula=chemicalFormula(entryAnswer),[element,count]=Object.entries(formula.atoms)[0];
  stages=[S('formula','formula',P(entryRU,entryES),entryAnswer,{equivalence:lesson.id==='functional'?'structural':'composition'}),S('count','numeric',P('Сколько атомов '+element+' в одной записанной частице?','¿Cuántos átomos de '+element+' hay en una partícula?'),count,{tolerance:0}),S('charge','numeric',P('Каков полный заряд этой частицы в единицах e?','¿Cuál es la carga total en unidades e?'),formula.charge,{tolerance:0}),S('twice','numeric',P('Сколько атомов '+element+' в двух таких частицах?','¿Cuántos átomos de '+element+' hay en dos partículas?'),count*2,{tolerance:0}),S('meaning','choice',P('Что меняет коэффициент 2 перед всей формулой?','¿Qué cambia un coeficiente 2 delante de toda la fórmula?'),0,{options:[P('Число целых частиц.','El número de partículas completas.'),P('Состав одной частицы.','La composición de una partícula.')]})];
 }else if(entryType==='equation'){
  const eq=chemicalEquation(entryAnswer),left=eq.left[0];stages=[S('equation','equation',P(entryRU,entryES),entryAnswer,{minimal:true}),S('atoms','numeric',P('Сколько атомов '+Object.keys(left.atoms)[0]+' учитывает первый реагент с его коэффициентом?','¿Cuántos átomos de '+Object.keys(left.atoms)[0]+' aporta el primer reactivo con su coeficiente?'),Object.values(left.atoms)[0]*left.coefficient,{tolerance:0}),S('principle','choice',P('Что должно сохраниться при сравнении сторон?','¿Qué debe conservarse entre los lados?'),0,{options:[P('Каждый элемент и полный заряд.','Cada elemento y la carga total.'),P('Только число молекул.','Solo el número de moléculas.')]})];
 }else{
  stages=[S('relationship','math',P(entryRU,entryES),entryAnswer),S('calculation','numeric',P(qru,qes),answer,{unit:unit==='1'?'':unit,tolerance:answer===0?1e-9:Math.abs(answer)*.003}),S('check','choice',P('Как проверить физический смысл полученного результата?','¿Cómo verificás el sentido físico del resultado?'),0,{options:[P('Сверить единицы, знак и условия модели с условием.','Comparar unidades, signo y condiciones del modelo con el enunciado.'),P('Оставить только число и удалить все условия.','Dejar solo el número y borrar las condiciones.')]})];
 }
 make('guided','guided-reasoning',P('Выполните связанный разбор по этапам: '+entryRU,'Resolvé por etapas: '+entryES),[],P(whyru+' '+b.facts[0][0],whyes+' '+b.facts[0][1]),{difficulty:'hard',stages});
 return [...base,...extra];
}
function moleBank(lesson){return buildMoleBank(lesson);}
export function shuffled(items,seed){let x=(seed>>>0)||1;const random=()=>((x=(Math.imul(1664525,x)+1013904223)>>>0)/4294967296);const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function selectQuestions(bank,{seed=Date.now(),count=10,level='mixed',coverLessons=false}={}){
 const eligible=level==='mixed'?bank:bank.filter(x=>x.difficulty===level),pool=shuffled(eligible,seed),selected=[];
 const take=q=>{if(q&&!selected.some(x=>x.id===q.id)&&selected.length<count)selected.push(q);};
 if(coverLessons)for(const id of new Set(pool.map(x=>x.lessonId)))take(pool.find(x=>x.lessonId===id));
 if(bank.every(x=>x.lessonId==='mole')&&level==='mixed')for(const objective of ['molar-mass','amount','formula-choice','chemical-formula','quantity-meaning','misconception','guided-reasoning'])take(pool.find(x=>x.objective===objective));
 if(level==='mixed')for(const difficulty of levels){const quota=difficulty==='medium'?4:3;for(const q of pool.filter(x=>x.difficulty===difficulty&&!selected.some(q=>q.id===x.id)).slice(0,Math.max(0,quota-selected.filter(x=>x.difficulty===difficulty).length)))take(q);}
 for(const q of pool)take(q);
 if(level==='mixed'){
  for(const candidate of pool){
   if(new Set(selected.map(q=>q.type)).size>=6)break;
   if(selected.some(q=>q.type===candidate.type))continue;
   const index=selected.findIndex(q=>q.difficulty===candidate.difficulty&&selected.filter(x=>x.type===q.type).length>1&&(!coverLessons||selected.filter(x=>x.lessonId===q.lessonId).length>1)&&(!bank.every(x=>x.lessonId==='mole')||!['molar-mass','amount','formula-choice','chemical-formula','quantity-meaning','misconception','guided-reasoning'].includes(q.objective)||selected.filter(x=>x.objective===q.objective).length>1));
   if(index>=0)selected[index]=candidate;
  }
 }
 return shuffled(selected,seed^0x1932).map((e,i)=>{
  if(!['choice','error','multi'].includes(e.type))return e;
  const order=shuffled(e.options.map((_,j)=>j),seed+i+1),indices=Array.isArray(e.answer)?e.answer:[e.answer];return{...e,options:order.map(j=>e.options[j]),optionReasons:e.optionReasons&&order.map(j=>e.optionReasons[j]),answer:e.type==='multi'?indices.map(j=>order.indexOf(j)):order.indexOf(e.answer)};
 });
}
