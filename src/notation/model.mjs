import {chemicalTex,elements} from './chemistry.mjs';
import {algebraTex} from './algebra.mjs';

const sub='₀₁₂₃₄₅₆₇₈₉',superChars='⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ᵖᴴ',superValues='0123456789+-pH';
const greek={'α':'\\alpha','β':'\\beta','γ':'\\gamma','Δ':'\\Delta','δ':'\\delta','θ':'\\theta','λ':'\\lambda','ξ':'\\xi','ν':'\\nu','ρ':'\\rho','Σ':'\\Sigma','ε':'\\varepsilon'};
export const escapeTex=s=>String(s).replace(/[\\{}$%&#_^~]/g,c=>({'\\':'\\backslash ','{':'\\{','}':'\\}','$':'\\$','%':'\\%','&':'\\&','#':'\\#','_':'\\_','^':'\\char94 ','~':'\\sim '}[c]));
export function plainTex(input){
 const original=String(input).trim();const chemistry=chemicalTex(original);if(chemistry)return chemistry;
 const units=[];
 let protectedInput=original.replace(/(ΔT|[nqmMcCpNC])\(([A-Za-z0-9₀-₉⁺⁻]+)\)/g,(_,name,subject)=>{const id=units.length;units.push((name==='ΔT'?'\\Delta T':name)+'\\left('+ (chemicalTex(subject)||'\\mathrm{'+subject+'}') +'\\right)');return '@'+id+'@';});
 let s=protectedInput.replace(/[−–]/g,'-').replace(/(\d),(\d)/g,'$1.$2').replace(/√\(([^()]*)\)/g,'\\sqrt{$1}').replace(/√([A-Za-z]+)/g,'\\sqrt{$1}').replace(/\^\(([^()]*)\)/g,'^{$1}').replace(/[ᵣₘₐ]/g,c=>'_{'+({'ᵣ':'r','ₘ':'m','ₐ':'a'}[c])+'}').replace(/log₁₀/g,'\\log_{10}').replace(/([₀-₉]+)/g,s=>'_{'+[...s].map(c=>sub.indexOf(c)).join('')+'}').replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ᵖᴴ]+)/g,s=>'^{'+[...s].map(c=>superValues[superChars.indexOf(c)]).join('')+'}');
 s=s.replace(/(?:[A-Z][a-z]?\d*){2,}(?:\^[\d+-]+)?/g,m=>chemicalTex(m)||m);
 s=s.replace(/(?:°·mL\/\(g·dm\)|dm·g\/mL|J\/\(g·K\)|g\/mol|kJ\/mol|mol\/L|kJ\/g|g\/MJ|J\/K|g\/mL|L\/mol|J\/mol|g\/L|J\/g|J|kJ|kcal|mol|mmol|mL|dm|cm|mL|atm|bar|mL|kg|mg|mL|g|L|K|M|°C|°|%)(?![A-Za-z])/g,(m,offset)=>{if(offset>0&&/[A-Za-z]/.test(s[offset-1]))return m;if(['K','L','M'].includes(m)&&!/[0-9}]$/.test(s.slice(0,offset).trim())&&original!==m)return m;const id=units.length;units.push('\\text{'+m.replace(/·/g,'\\,').replace(/%/g,'\\%')+'}');return`@${id}@`;});
 s=s.replace(/\^([+-]?\d+(?:[.,]\d+)?|[A-Za-z])/g,'^{$1}');
 // Compound chemical identifiers stay upright, whereas quantities remain italic.
 s=s.replace(/(?:[A-Z][a-z]?(?:_\{\d+\})?){2,}(?:\^\{[\d+-]+\})?/g,m=>{const raw=m.replace(/_\{(\d+)\}/g,'$1').replace(/\^\{([^}]+)\}/g,'^$1');return chemicalTex(raw)||m;});
 for(const[c,tex]of Object.entries(greek))s=s.replaceAll(c,tex+' ');
 s=s.replace(/×/g,'\\cdot ').replace(/·/g,'\\quad ').replace(/≈/g,'\\approx ').replace(/≠/g,'\\ne ').replace(/≪/g,'\\ll ').replace(/⇒/g,'\\Rightarrow ').replace(/⇌/g,'\\rightleftharpoons ').replace(/→/g,'\\rightarrow ').replace(/ν/g,'\\nu ').replace(/\bPext\b/g,'P_{ext}').replace(/\b([Kp])([cwab])\b/g,'$1_{$2}').replace(/\b([mVUTq])([CLPifrm])\b/g,'$1_{$2}');
 // Convert every mathematical division at its local operator precedence.
 const tokens=s.match(/@\d+@|\\(?:mathrm|text)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\[A-Za-z]+(?:_\{[^}]*\})?|_\{[^}]*\}|\^\{[^}]*\}|\d+(?:[.,]\d+)?|[A-Za-z]+|[()[\]{}]|[+*/=<>:;,-]|[^\s]/g)||[];
 const atom=(i,direction)=>{
  let start=i,end=i;
  if(direction<0&&[')',']'].includes(tokens[i])){let depth=1;start=i-1;while(start>=0&&depth){if([')',']'].includes(tokens[start]))depth++;if(['(','['].includes(tokens[start]))depth--;if(depth)start--;}}
  if(direction>0&&['(','['].includes(tokens[i])){let depth=1;end=i+1;while(end<tokens.length&&depth){if(['(','['].includes(tokens[end]))depth++;if([')',']'].includes(tokens[end]))depth--;if(depth)end++;}}
  if(direction<0&&/^[\^_]/.test(tokens[start]||''))start--;
  // A measured number and its unit are one quantity in a fraction.
  if(direction<0&&/^@\d+@$/.test(tokens[start]||'')&&/^\d+(?:[.,]\d+)?$/.test(tokens[start-1]||''))start--;
  if(direction>0&&/^\d+(?:[.,]\d+)?$/.test(tokens[end]||'')&&/^@\d+@$/.test(tokens[end+1]||''))end++;
  if(direction>0&&/^[\^_]/.test(tokens[end+1]||''))end++;
  return[start,end];
 };
 for(let i=0;i<tokens.length;i++)if(tokens[i]==='/'){
  if(!i||i===tokens.length-1)continue;const[a,b]=atom(i-1,-1),[c,d]=atom(i+1,1);let numerator=tokens.slice(a,b+1).join(' '),denominator=tokens.slice(c,d+1).join(' ');
  if(numerator.startsWith('(')&&numerator.endsWith(')'))numerator=numerator.slice(1,-1);if(denominator.startsWith('(')&&denominator.endsWith(')'))denominator=denominator.slice(1,-1);
  tokens.splice(a,d-a+1,`\\frac{${numerator}}{${denominator}}`);i=a;
 }
 return tokens.join(' ').replace(/@(\d+)@/g,(_,n)=>units[n]).replace(/(\d)\.(\d)/g,'$1{,}$2');
}

/** TeX → semantic AST. Rendering and hit zones are both emitted from this tree. */
export function formulaModel(tex,context={}){
 let i=0,serial=0;const occurrences={},parts=[];
 const node=(type,text,extra={})=>{const key=(type+'-'+text).replace(/[^a-zA-Z0-9-]/g,'').slice(0,36)||type;occurrences[key]=(occurrences[key]||0)+1;const out={id:key+'-'+occurrences[key],type,text,...extra};if(type!=='space'&&type!=='row')parts.push(out);serial++;return out;};
 function group(role='math',until=''){
  const children=[];
  while(i<tex.length&&tex[i]!==until){
   const char=tex[i++];
   if(/\s/.test(char)){children.push({type:'space',text:' '});continue;}
   if(char==='{'){const child=group(role,'}');if(tex[i]==='}')i++;children.push({type:'braces',children:child.children,text:''});continue;}
   if(char==='_'||char==='^'){const next=argument(char==='_'?'index':'power');const script=node(char==='_'?'index':'power',next.children.map(x=>x.text).join(''),{children:next.children,mark:char});const base=children.at(-1);if(char==='_'&&base?.type==='symbol')base.contextIndex=script.text;script.meaning=role==='chemical'||base?.type==='command'&&base.text==='mathrm'||base?.meaning==='composition'?(char==='_'?'composition':'charge'):(char==='_'?'label':'exponent');children.push(script);continue;}
   if(char==='\\'){
    const match=tex.slice(i).match(/^[A-Za-z]+|^./),name=match?.[0]||'';i+=name.length;
    if(['frac','dfrac','tfrac'].includes(name)){const a=argument(role),b=argument(role),num=node('numerator',a.children.map(x=>x.text).join(''),{children:a.children}),den=node('denominator',b.children.map(x=>x.text).join(''),{children:b.children});children.push(node('fraction','/',{numerator:num,denominator:den}));continue;}
    if(['mathrm','text','operatorname','mathbf'].includes(name)){
     const start=i;let raw='';if(tex[i]==='{'){let depth=1,j=i+1;while(j<tex.length&&depth){if(tex[j]==='{')depth++;if(tex[j]==='}')depth--;if(depth)raw+=tex[j];j++;}}
     if(['Glc','Fru','Glcp','TG','D','L','desprot.','prot.','peptide','amino acids','glycerol'].includes(raw)){argument(role);children.push(node('label',raw,{command:name}));}
     else if(name==='text'||/^(?:g|kg|mg|mol|mmol|J|kJ|kcal|L|mL|K|M|cm|dm|bar|atm)(?:\b|\/|\\)/.test(raw)&&!elements.includes(raw)){argument('unit');children.push(node(/^\((?:aq|s|l|g)\)$/.test(raw)?'phase':name==='text'&&!/^(?:g|kg|mg|mol|mmol|J|kJ|kcal|L|mL|K|M|cm|dm|bar|atm|°|\\%)/.test(raw)?'label':'unit',raw,{command:name}));}
     else{const inner=argument(name==='mathrm'?'chemical':role);children.push({type:'command',text:name,children:inner.children});}
     if(i===start)i++;continue;
    }
    if(name==='sqrt'){const a=argument(role);children.push(node('root','√',{children:a.children}));continue;}
    if(name==='overset'||name==='underset'){const a=argument(role),b=argument(role);children.push(node('oxidation',a.children.map(x=>x.text).join(''),{above:a.children,children:b.children,command:name}));continue;}
    if(['quad','qquad',',','!',';',' '].includes(name)){children.push({type:'space',text:'\\'+name+' '});continue;}
    if(name==='left'||name==='right'){while(tex[i]===' ')i++;let delimiter=tex[i++]||'.';if(delimiter==='\\'){const m=tex.slice(i).match(/^[A-Za-z]+/);delimiter+=m?.[0]||'';i+=m?.[0].length||0;}children.push({type:'space',text:'\\'+name+delimiter+' '});continue;}
    children.push(node(['rightarrow','longrightarrow','to','rightleftharpoons','leftrightarrow'].includes(name)?'arrow':['cdot','times','ne','approx','equiv','ln','log','sum'].includes(name)?'operator':'symbol','\\'+name,{role}));continue;
   }
   if(/[0-9]/.test(char)){let text=char;while(/[0-9.]/.test(tex[i]||'')&&i<tex.length)text+=tex[i++];children.push(node('number',text,{role}));continue;}
   const word=(char+tex.slice(i)).match(role==='chemical'?/^(?:glycerol|TG|Glcp|Glc|Fru|peptide)(?![a-z])/:/^equilibrium(?![A-Za-z])/);
   if(word){i+=word[0].length-1;children.push(node('label',word[0],{command:role==='chemical'?'mathrm':'text'}));continue;}
   if(/[A-Za-z]/.test(char)){let text=char;if(role==='math'&&char==='p'&&/^(?:OH|H)/.test(tex.slice(i))){const m=tex.slice(i).match(/^(?:OH|H)/);text+=m[0];i+=m[0].length;}if(role==='chemical'&&/[a-z]/.test(tex[i]||''))text+=tex[i++];children.push(node(role==='chemical'?'element':role==='unit'?'unit':'symbol',text,{role}));continue;}
   children.push(node('operator',char,{role}));
  }return{type:'row',children};
 }
 function argument(role){while(tex[i]===' ')i++;if(tex[i]==='{'){i++;const value=group(role,'}');if(tex[i]==='}')i++;return value;}let char=tex[i++]||'';if(char==='\\'){const m=tex.slice(i).match(/^[A-Za-z]+|^./);char+=m?.[0]||'';i+=m?.[0].length||0;}return{type:'row',children:char?[node(/[0-9]/.test(char)?'number':role==='chemical'?'element':'symbol',char,{role})]:[]};}
 const root=group();
 // Upgrade legacy TeX slashes before rendering. Text/chemical commands and units
 // are opaque; a slash in g/mol remains a unit, not an arithmetic operation.
 const rewrite=n=>{
  if(n.type==='command')return;
  for(const child of n.children||[])rewrite(child);
  if(n.numerator)rewrite(n.numerator);if(n.denominator)rewrite(n.denominator);
  if(!n.children||['index','power','unit','label','phase'].includes(n.type))return;
  const list=n.children;
  const atom=(i,dir)=>{let a=i,b=i;
   if(dir<0&&list[i]?.text===')'){let depth=1;a=i-1;while(a>=0&&depth){if(list[a].text===')')depth++;if(list[a].text==='(')depth--;if(depth)a--;}}
   if(dir>0&&list[i]?.text==='('){let depth=1;b=i+1;while(b<list.length&&depth){if(list[b].text==='(')depth++;if(list[b].text===')')depth--;if(depth)b++;}}
   if(dir<0)while(a>0&&['index','power'].includes(list[a].type))a--;
   if(dir>0)while(['index','power'].includes(list[b+1]?.type))b++;
   return[a,b];};
  for(let at=0;at<list.length;at++)if(list[at].type==='operator'&&list[at].text==='/'){
   while(list[at-1]?.type==='space'){list.splice(at-1,1);at--;}
   while(list[at+1]?.type==='space')list.splice(at+1,1);
   if(!at||at===list.length-1)continue;
   const[a,b]=atom(at-1,-1),[c,d]=atom(at+1,1);if(a<0||d>=list.length)continue;
   const unwrap=values=>values[0]?.text==='('&&values.at(-1)?.text===')'?values.slice(1,-1):values;
   const up=unwrap(list.slice(a,b+1)),down=unwrap(list.slice(c,d+1));
   const numerator=node('numerator',up.map(x=>x.text).join(''),{children:up}),denominator=node('denominator',down.map(x=>x.text).join(''),{children:down});
   list.splice(a,d-a+1,node('fraction','/',{numerator,denominator}));at=a;
  }
 };rewrite(root);
 const canonical=annotatedTex({root},'',false),visible=[];const collect=n=>{if(n.id)visible.push(n);for(const c of ['index','power'].includes(n.type)?[]:n.children||[])collect(c);if(n.numerator)collect(n.numerator);if(n.denominator)collect(n.denominator);for(const c of n.above||[])collect(c);};collect(root);return{root,parts:visible,context,tex:canonical};
}
export function annotatedTex(model,active='',decorate=true){
 const wrap=(n,body)=>decorate?`\\htmlData{ifi-id=${n.id},ifi-role=${n.type}${active===n.id?',ifi-active=yes':''}}{${body}}`:body;
 const rec=n=>{
  if(n.type==='row')return n.children.map(rec).join('');if(n.type==='space')return n.text;if(n.type==='braces')return'{'+n.children.map(rec).join('')+'}';if(n.type==='command')return`\\${n.text}{${n.children.map(rec).join('')}}`;
  if(n.type==='fraction')return wrap(n,`\\frac{${wrap(n.numerator,n.numerator.children.map(rec).join(''))}}{${wrap(n.denominator,n.denominator.children.map(rec).join(''))}}`);
  if(n.type==='index'||n.type==='power')return n.mark+'{'+wrap(n,annotatedTex({root:{type:'row',children:n.children}},'',false))+'}';
  if(n.type==='root')return wrap(n,`\\sqrt{${n.children.map(rec).join('')}}`);
  if(n.type==='oxidation')return wrap(n,`\\${n.command}{${n.above.map(rec).join('')}}{${n.children.map(rec).join('')}}`);
  if(['unit','phase','label'].includes(n.type))return wrap(n,`\\${n.command||'mathrm'}{${n.text}}`);
  return wrap(n,n.text);
 };return rec(model.root);
}

export function notationInText(text){
 const starts=/[A-Za-zαβΔρθξν][A-Za-z0-9₀-₉αβΔρθξν_()[\]]*\s*[=≈]/g;
 const known=new Set('m n M c V N q w H U P T R K Q x a b f l E C L pH pOH Ka Kb Kw Kc Kp pKa pKw NA n0 Vi Vf Ui Uf Ti Tf Pext mol mmol g kg mg J kJ kcal L mL K M bar atm cm dm min s log ln sqrt cal'.split(' '));
 const spans=[];
 for(const match of text.matchAll(starts)){
  let end=match.index+match[0].length;
  while(end<text.length&&end-match.index<140){
   const tail=text.slice(end),space=tail.match(/^\s+/);if(space){end+=space[0].length;continue;}
   const num=tail.match(/^\d+(?:[.,]\d+)?(?:[eE][+-]?\d+)?/);if(num){end+=num[0].length;continue;}
   const word=tail.match(/^[A-Za-zαβΔρθξν]+[0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]*/);
   if(word){if(known.has(word[0])||word[0].length===1||chemicalTex(word[0])){end+=word[0].length;continue;}break;}
   if(/^[+*/=<>≈×·^()[\]{}₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−°%-]/.test(tail)){end++;continue;}break;
  }
  const value=text.slice(match.index,end).trim();if(value&&end-match.index<150)spans.push({start:match.index,end:match.index+value.length,value});
 }
 const chem=/(?<![A-Za-z])(?:[A-Z][a-z]?[\d₀-₉]*){2,}(?:[⁺⁻]|\^[\d+-]+)?/g;
 for(const m of text.matchAll(chem))if(chemicalTex(m[0])&&!spans.some(s=>m.index<s.end&&m.index+m[0].length>s.start))spans.push({start:m.index,end:m.index+m[0].length,value:m[0]});
 spans.sort((a,b)=>a.start-b.start);const out=[];let last=0;
 for(const s of spans){if(s.start<last)continue;if(s.start>last)out.push({text:text.slice(last,s.start)});out.push({formula:s.value,tex:plainTex(s.value)});last=s.end;}
 if(last<text.length)out.push({text:text.slice(last)});return out.length?out:[{text}];
}
