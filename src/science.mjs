export const mass={H:1.008,C:12.011,N:14.007,O:15.999,Na:22.990,Cl:35.45,S:32.06,P:30.974,Ca:40.078};
export function parseFormula(input){
 const s=String(input).replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/\s/g,'');
 const tokens=s.match(/[A-Z][a-z]?|\d+|[()]/g)||[];
 if(tokens.join('')!==s||!s) throw Error('formula');
 let i=0;
 function group(nested=false){const out={};while(i<tokens.length){let t=tokens[i++];if(t===')'){if(!nested)throw Error('formula');return out;}let obj;if(t==='('){obj=group(true);}else{if(!/^[A-Z]/.test(t))throw Error('formula');obj={[t]:1};}if(!Object.keys(obj).length)throw Error('formula');const k=/^\d+$/.test(tokens[i]||'')?Number(tokens[i++]):1;if(k<1)throw Error('formula');for(const [e,v]of Object.entries(obj))out[e]=(out[e]||0)+v*k;}if(nested)throw Error('formula');return out;}return group();
}
export function molarMass(formula){return Object.entries(parseFormula(formula)).reduce((a,[e,n])=>{if(!mass[e])throw Error('element');return a+mass[e]*n},0);}
export function atomCounts(formulas,coefficients){const out={};formulas.forEach((f,i)=>{for(const[e,n]of Object.entries(parseFormula(f)))out[e]=(out[e]||0)+n*coefficients[i]});return out;}
export function balanced(left,right,lc,rc){const a=atomCounts(left,lc),b=atomCounts(right,rc);return Object.keys({...a,...b}).every(e=>a[e]===b[e]);}
const units={'pa':{dimension:'pressure',scale:1},'kpa':{dimension:'pressure',scale:1000},'bar':{dimension:'pressure',scale:100000},'atm':{dimension:'pressure',scale:101325},'cal':{dimension:'energy',scale:4.184},'g':{dimension:'mass',scale:1},'kg':{dimension:'mass',scale:1000},'mg':{dimension:'mass',scale:.001},'mol':{dimension:'amount',scale:1},'mmol':{dimension:'amount',scale:.001},'l':{dimension:'volume',scale:1},'ml':{dimension:'volume',scale:.001},'j':{dimension:'energy',scale:1},'kj':{dimension:'energy',scale:1000},'kcal':{dimension:'energy',scale:4184},'°c':{dimension:'temp',scale:1},'k':{dimension:'tempk',scale:1},'g/mol':{dimension:'molarMass',scale:1},'mol/l':{dimension:'concentration',scale:1},'m':{dimension:'concentration',scale:1},'g/l':{dimension:'massConc',scale:1},'%':{dimension:'percent',scale:1},'°':{dimension:'angle',scale:1},'min':{dimension:'time',scale:1},'s':{dimension:'time',scale:1/60},'kj/mol':{dimension:'molarEnergy',scale:1},'j/mol':{dimension:'molarEnergy',scale:.001},'kj/k':{dimension:'entropy',scale:1},'j/k':{dimension:'entropy',scale:.001}};
export function numericValue(input,expectedUnit=''){
 const normalized=String(input).replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g,s=>[...s].map(c=>'0123456789+-'['⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻'.indexOf(c)]).join('')).replace(/([\d.,]+)\s*[×*·]\s*10\s*\^?\s*([+-]?\d+)/g,'$1e$2');
 const m=normalized.trim().replace(/−/g,'-').replace(',','.').match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*(.*?)$/);
 if(!m)return NaN;const value=Number(m[1]);const given=m[2].toLowerCase().replace(/\s/g,'').replace(/[·⋅*]/g,'').replace(/mol\^?-1/g,'/mol').replace(/l\^?-1/g,'/l').replaceAll('моль','mol').replaceAll('кдж','kj').replaceAll('дж','j').replaceAll('кг','kg').replaceAll('мг','mg').replaceAll('г','g').replaceAll('мл','ml').replaceAll('л','l');
 if(!given)return value;const target=expectedUnit.toLowerCase().replace(/\s/g,'');if(given===target)return value;const a=units[given],b=units[target];if(!a||!b||a.dimension!==b.dimension)return NaN;return value*a.scale/b.scale;
}
export function checkAnswer(ex,input){
 if(ex.type==='numeric'){const v=numericValue(input,ex.unit);return Number.isFinite(v)&&Math.abs(v-ex.answer)<= (ex.tolerance??Math.max(Math.abs(ex.answer)*.01,.001));}
 if(ex.type==='formula')return String(input).replace(/\s/g,'').replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c))===String(ex.answer).replace(/\s/g,'');
 if(ex.type==='multi')return JSON.stringify([...input].sort((a,b)=>a-b))===JSON.stringify([...ex.answer].sort((a,b)=>a-b));
 if(ex.type==='order'||ex.type==='match')return JSON.stringify(input)===JSON.stringify(ex.answer);
 if(ex.type==='balance') {const arr=input.map(Number); if(arr.some(v=>!Number.isInteger(v)||v<=0))return false;const ratio=arr[0]/ex.answer[0];return arr.every((v,i)=>v===ex.answer[i]*ratio);}
 if(ex.type==='steps')return ex.answer.every((ans,i)=> {if(Number.isFinite(numericValue(ans)))return Math.abs(numericValue(input[i])-numericValue(ans))<=Math.max(Math.abs(numericValue(ans))*.01,.001);return String(input[i]).trim().replace(/\s/g,'')===String(ans).replace(/\s/g,'');});
 return Number(input)===ex.answer;
}
export const heat=(m,c,dT)=>m*c*dT;
export const deltaU=(q,w)=>q+w;
export const energy=(carbs,fat,protein)=>17*carbs+37*fat+17*protein;
export const polarimetry=(specific,length,concentration)=>specific*length*concentration;
