export const elements='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
const subs='₀₁₂₃₄₅₆₇₈₉',supers='⁰¹²³⁴⁵⁶⁷⁸⁹';
export function normalizeChemical(s){return String(s).trim().replace(/[₀-₉]/g,c=>subs.indexOf(c)).replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])/g,s=>'^'+[...s].map(c=>c==='⁺'?'+':c==='⁻'?'-':supers.indexOf(c)).join('')).replace(/−/g,'-');}
const fail=()=>{throw Error('chemical-syntax');};
/** Bounded recursive grammar; no eval, no HTML, no partial acceptance of junk. */
export function chemicalFormula(input){
 let s=normalizeChemical(input).replace(/\s+/g,'');
 if(!s||s.length>500)fail();
 let phase='';s=s.replace(/\((aq|s|l|g)\)$/,(m,p)=>(phase=p,''));
 if(s==='e^-'||s==='e-')return{source:s,atoms:{},charge:-1,phase,tree:[{type:'electron',id:'electron',text:'e'}]};
 // Bare Fe2+ / Ca2+ convention is ionic for a single non-diatomic element.
 const ionic=s.match(/^([A-Z][a-z]?)([2-9]\d*)([+-])$/);
 if(ionic&&!['H','N','O','F','Cl','Br','I'].includes(ionic[1]))s=ionic[1]+'^'+ionic[2]+ionic[3];
 let charge=0;
 s=s.replace(/\^(\d*)([+-])$|([+-])$/,(m,n,sign,bare)=>{charge=(sign==='-'||bare==='-'?-1:1)*Number(n||1);if(!Number.isSafeInteger(charge)||Math.abs(charge)>100)fail();return '';});
 const chunks=s.split(/[·⋅]/);const atoms={},tree=[];
 chunks.forEach((part,partIndex)=>{
  let multiplier=1;if(partIndex>0){part=part.replace(/^(\d+)/,(m)=>(multiplier=Number(m),''));}
  if(!part||!Number.isSafeInteger(multiplier)||multiplier<1||multiplier>10000)fail();
  let i=0;
  function group(end='',depth=0,path=''){
   if(depth>12)fail();const counts={},nodes=[];
   while(i<part.length&&part[i]!==end){
    const id=`p${partIndex}${path}-${nodes.length}`;let node,composition;
    if(part[i]==='('||part[i]==='['){const open=part[i++],close=open==='('?')':']';const inner=group(close,depth+1,id);if(part[i++]!==close)fail();node={type:'group',id,open,children:inner.nodes};composition=inner.counts;}
    else{const match=part.slice(i).match(/^[A-Z][a-z]?/);if(!match||!elements.includes(match[0]))fail();const symbol=match[0];i+=symbol.length;node={type:'element',id,symbol,atomicNumber:elements.indexOf(symbol)+1};composition={[symbol]:1};}
    const sub=part.slice(i).match(/^\d+/);const count=sub?Number(sub[0]):1;if(sub)i+=sub[0].length;if(!Number.isSafeInteger(count)||count<1||count>10000)fail();node.count=count;nodes.push(node);
    for(const [symbol,n] of Object.entries(composition)){counts[symbol]=(counts[symbol]||0)+n*count;if(counts[symbol]>1e8)fail();}
   }
   if(!nodes.length)fail();return{counts,nodes};
  }
  const parsed=group();if(i!==part.length)fail();tree.push({type:'hydrate',id:`p${partIndex}`,multiplier,children:parsed.nodes});
  for(const [symbol,n] of Object.entries(parsed.counts))atoms[symbol]=(atoms[symbol]||0)+n*multiplier;
 });
 return{source:normalizeChemical(input),atoms,charge,phase,tree};
}
export function compositionKey(f){const p=typeof f==='string'?chemicalFormula(f):f;return Object.entries(p.atoms).sort(([a],[b])=>a.localeCompare(b)).map(([e,n])=>e+n).join('|')+';'+p.charge;}
export function formulaEquivalent(input,expected,mode='composition'){
 try{const a=chemicalFormula(input),b=chemicalFormula(expected);return compositionKey(a)===compositionKey(b)&&(mode!=='structural'||normalizeChemical(input).replace(/\s/g,'')===normalizeChemical(expected).replace(/\s/g,''));}catch{return false;}
}
export function chemicalEquation(input){
 const s=normalizeChemical(input).replace(/<=>|<->|⇄|↔/g,'⇌').replace(/--?>|⟶|⟹/g,'→');if(s.length>1800)fail();
 const sides=s.split(/(⇌|→|=)/);if(sides.length!==3)fail();
 const side=(text)=>text.split(/\s+\+\s+|\+(?=\s*[e\dA-Z([])/).map((raw,i)=>{
  let f=raw.trim(),coefficient=1;const m=f.match(/^([1-9]\d*)\s*/);if(m){coefficient=Number(m[1]);f=f.slice(m[0].length);}
  if(coefficient>10000)fail();return{id:i,coefficient,formula:f,...chemicalFormula(f)};
 });
 const left=side(sides[0]),right=side(sides[2]);if(left.length>16||right.length>16)fail();
 const inventory=species=>species.reduce((out,x)=>{for(const[e,n]of Object.entries(x.atoms))out[e]=(out[e]||0)+n*x.coefficient;out.charge=(out.charge||0)+x.charge*x.coefficient;return out;},{});
 const l=inventory(left),r=inventory(right),balanced=Object.keys({...l,...r}).every(e=>(l[e]||0)===(r[e]||0));
 return{left,right,arrow:sides[1],leftInventory:l,rightInventory:r,balanced};
}
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function equationEquivalent(input,expected,{minimal=true}={}){
 try{
  const a=chemicalEquation(input),b=chemicalEquation(expected);if(!a.balanced||!b.balanced)return false;
  const signature=side=>{const values=new Map();for(const x of side){const key=compositionKey(x);values.set(key,(values.get(key)||0)+x.coefficient);}return [...values.entries()].sort(([a],[b])=>a.localeCompare(b));};
  if(minimal&&[...signature(a.left),...signature(a.right)].map(x=>x[1]).reduce(gcd)!==1)return false;
  const compare=(x,y)=>{if(x.length!==y.length)return false;const scale=x[0][1]/y[0][1];return x.every(([key,n],i)=>key===y[i][0]&&Math.abs(n-y[i][1]*scale)<1e-10)?scale:false;};
  const l=compare(signature(a.left),signature(b.left)),r=compare(signature(a.right),signature(b.right));
  if(l!==false&&r===l&&a.arrow===b.arrow)return true;
  if(a.arrow==='⇌'&&b.arrow==='⇌'){const x=compare(signature(a.left),signature(b.right)),y=compare(signature(a.right),signature(b.left));return x!==false&&x===y;}
  return false;
 }catch{return false;}
}
export function chemicalTex(input){
 const render=p=>p.source==='e^-'||p.source==='e-'?'e^{-}':p.tree.map((chunk,i)=>(i?'\\cdot ':'')+(chunk.multiplier>1?chunk.multiplier:'')+chunk.children.map(function node(n){return(n.type==='element'?`\\mathrm{${n.symbol}}`:n.open+n.children.map(node).join('')+(n.open==='('?')':']'))+(n.count>1?`_{${n.count}}`:'');}).join('')).join('')+(p.charge?`^{${Math.abs(p.charge)>1?Math.abs(p.charge):''}${p.charge>0?'+':'-'}}`:'')+(p.phase?`\\,\\text{(${p.phase})}`:'');
 try{if(/->|→|⇌|<->|<=>/.test(input)){const e=chemicalEquation(input),side=a=>a.map(p=>(p.coefficient>1?p.coefficient:'')+render(p)).join(' + ');return side(e.left)+(e.arrow==='⇌'?'\\rightleftharpoons':'\\rightarrow')+side(e.right);}return render(chemicalFormula(input));}catch{return null;}
}
