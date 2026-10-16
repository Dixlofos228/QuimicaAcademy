const functions=new Set(['sqrt','log','ln','abs']);
const aliases=s=>String(s).replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,'(($1)/($2))').replace(/\\cdot|\\times|[×·]/g,'*').replace(/\\(?:left|right)/g,'').replace(/\\Delta\s*|Δ/g,'d').replace(/[−–]/g,'-').replace(/,/g,'.').replace(/\{/g,'(').replace(/\}/g,')').replace(/₁/g,'_1').replace(/₂/g,'_2').replace(/₀/g,'_0').replace(/²/g,'^2').replace(/³/g,'^3').replace(/\s+/g,'');
export function algebra(input){
 const s=aliases(input).replace(/\[([A-Za-z0-9]+)\]/g,'c_$1').replace(/\bK([acpwb])\b/g,'K_$1').replace(/\bNA\b/g,'N_A').replace(/\b([A-Za-z])(\d+)\b/g,'$1_$2');if(!s||s.length>400)throw Error('math-syntax');
 const tokens=s.match(/(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?|(?:sqrt|log|ln|abs)(?=\()|(?:pOH|pH|dU|dT|dH|dV)|[a-zA-Zαβγρθξν](?:_[a-zA-Z0-9]+)?|[()+\-*/^=]/g)||[];
 if(tokens.join('')!==s)throw Error('math-syntax');let i=0;
 function expression(min=0,depth=0){
  if(depth>40)throw Error('math-depth');let token=tokens[i++],left;
  if(token==='+'||token==='-')left={type:'unary',op:token,value:expression(25,depth+1)};
  else if(token==='('){left=expression(0,depth+1);if(tokens[i++]!==')')throw Error('math-syntax');}
  else if(functions.has(token)){if(tokens[i++]!=='(')throw Error('math-syntax');left={type:'function',name:token,value:expression(0,depth+1)};if(tokens[i++]!==')')throw Error('math-syntax');}
  else if(/^\d|^\./.test(token||'')){if(!Number.isFinite(Number(token)))throw Error('math-number');left={type:'number',value:Number(token),raw:token};}
  else if(/^[a-zA-Zαβγρθξν]/.test(token||''))left={type:'symbol',name:token};else throw Error('math-syntax');
  while(i<tokens.length){
   let op=tokens[i],implicit=!['+','-','*','/','^','=',')'].includes(op);if(implicit)op='*';const precedence={'+':10,'-':10,'*':20,'/':20,'^':30}[op];if(precedence===undefined||precedence<min)break;if(!implicit)i++;
   left={type:'binary',op,left,right:expression(op==='^'?precedence:precedence+1,depth+1)};
  }return left;
 }
 const left=expression();let result=left;if(tokens[i]==='='){i++;result={type:'equation',left,right:expression()};}if(i!==tokens.length)throw Error('math-syntax');return result;
}
export function algebraTex(ast){
 if(typeof ast==='string')ast=algebra(ast);
 const rec=(n,parent=0)=>{
  if(n.type==='number'){const [mantissa,power]=String(n.raw??n.value).toLowerCase().split('e');return (mantissa.startsWith('.')?'0'+mantissa:mantissa).replace('.', '{,}')+(power?'\\times10^{'+Number(power)+'}':'');}
  if(n.type==='symbol')return /^(pH|pOH)$/.test(n.name)?`\\mathrm{${n.name}}`:n.name.startsWith('c_')?'\\left[\\mathrm{'+n.name.slice(2).replace(/(\d+)/g,'_{$1}')+'}\\right]':n.name.replace(/^d([UTHV])$/,'\\Delta $1').replace(/_([A-Za-z0-9]+)/g,'_{$1}');
  if(n.type==='equation')return`${rec(n.left)}=${rec(n.right)}`;
  if(n.type==='function')return n.name==='sqrt'?`\\sqrt{${rec(n.value)}}`:n.name==='abs'?`\\left|${rec(n.value)}\\right|`:`\\${n.name}\\left(${rec(n.value)}\\right)`;
  if(n.type==='unary')return n.op+rec(n.value,25);
  if(n.op==='/')return`\\frac{${rec(n.left)}}{${rec(n.right)}}`;
  if(n.op==='^')return`{${rec(n.left,30)}}^{${rec(n.right)}}`;
  const p={'+':10,'-':10,'*':20}[n.op],body=rec(n.left,p)+(n.op==='*'?'\\cdot ':n.op)+rec(n.right,p+(n.op==='-'?1:0));return p<parent?`\\left(${body}\\right)`:body;
 };return rec(ast);
}
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
const coeff=(p,q=1n)=>{if(!q)throw Error('math-zero');if(q<0n){p=-p;q=-q;}const g=gcd(p,q);return{p:p/g,q:q/g};};
const ZERO=coeff(0n),ONE=coeff(1n),NEG=coeff(-1n);
const cadd=(a,b)=>coeff(a.p*b.q+b.p*a.q,a.q*b.q),cmul=(a,b)=>coeff(a.p*b.p,a.q*b.q);
const numberCoeff=raw=>{const [mantissa,exponent='0']=String(raw).toLowerCase().split('e'),power=Number(exponent);if(!Number.isInteger(power)||Math.abs(power)>300)throw Error('math-number');const [whole='',decimal='']=mantissa.split('.'),digits=(whole||'0')+decimal;let p=BigInt(digits||'0'),q=10n**BigInt(decimal.length);if(power>=0)p*=10n**BigInt(power);else q*=10n**BigInt(-power);return coeff(p,q);};
const clean=p=>Object.fromEntries(Object.entries(p).filter(([,v])=>v.p!==0n));
const add=(a,b,k=ONE)=>{const c={...a};for(const[x,n]of Object.entries(b))c[x]=cadd(c[x]||ZERO,cmul(k,n));return clean(c);};
const multiply=(a,b)=>{const c={};for(const[x,n]of Object.entries(a))for(const[y,m]of Object.entries(b)){const key=[...x.split('|'),...y.split('|')].filter(Boolean).sort().join('|');c[key]=cadd(c[key]||ZERO,cmul(n,m));}if(Object.keys(c).length>300)throw Error('math-complexity');return clean(c);};
const atomKey=n=>JSON.stringify(n,(key,value)=>key==='raw'?undefined:value);
const integerPower=n=>n.type==='number'?n.value:n.type==='unary'&&n.value.type==='number'?(n.op==='-'?-1:1)*n.value.value:NaN;
function rational(n){
 const one={'':ONE};
 if(n.type==='number'){const c=numberCoeff(n.raw??String(n.value));return{n:c.p===0n?{}:{'':c},d:one};}
 if(n.type==='symbol')return{n:{[n.name]:ONE},d:one};
 if(n.type==='function')return{n:{[atomKey(n)]:ONE},d:one};
 if(n.type==='unary'){const a=rational(n.value);return{n:Object.fromEntries(Object.entries(a.n).map(([x,v])=>[x,n.op==='-'?cmul(NEG,v):v])),d:a.d};}
 const a=rational(n.left),b=rational(n.right);
 if(n.op==='+'||n.op==='-')return{n:add(multiply(a.n,b.d),multiply(b.n,a.d),n.op==='-'?NEG:ONE),d:multiply(a.d,b.d)};
 if(n.op==='*')return{n:multiply(a.n,b.n),d:multiply(a.d,b.d)};
 if(n.op==='/'){if(!Object.keys(b.n).length)throw Error('math-zero');return{n:multiply(a.n,b.d),d:multiply(a.d,b.n)};}
 const exponent=integerPower(n.right);
 if(n.op==='^'&&Number.isInteger(exponent)&&Math.abs(exponent)<=6){if(exponent<=0&&!Object.keys(a.n).length)throw Error('math-zero');let p={n:one,d:one};for(let i=0;i<Math.abs(exponent);i++)p={n:multiply(p.n,a.n),d:multiply(p.d,a.d)};if(exponent<0&&!Object.keys(p.n).length)throw Error('math-zero');return exponent<0?{n:p.d,d:p.n}:p;}
 if(n.op==='^')return{n:{['pow:'+atomKey(n)]:ONE},d:one};
 throw Error('math-unsupported');
}
/** Exact rational polynomial comparison within declared nonzero physical domains. */
export function algebraEquivalent(input,expected){
 try{
  const a=algebra(input),b=algebra(expected);if((a.type==='equation')!==(b.type==='equation'))return false;
  const polynomial=x=>{const l=rational(x.left),r=rational(x.right);return add(multiply(l.n,r.d),multiply(r.n,l.d),NEG);};
  const proportional=(x,y)=>{const keys=Object.keys({...x,...y}).sort();if(!keys.length)return false;const base=keys.find(k=>y[k]?.p);if(base===undefined||!x[base]?.p)return false;return keys.every(k=>{const left=cmul(x[k]||ZERO,y[base]),right=cmul(y[k]||ZERO,x[base]);return left.p*right.q===right.p*left.q;});};
  if(a.type==='equation')return proportional(polynomial(a),polynomial(b));
  const x=rational(a),y=rational(b);return Object.keys(add(multiply(x.n,y.d),multiply(y.n,x.d),NEG)).length===0;
 }catch{return false;}
}
