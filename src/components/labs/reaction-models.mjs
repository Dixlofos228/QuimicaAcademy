/** Stable atom identities for net-reaction diagrams. These paths are bookkeeping,
 * not trajectories, collisions, or a proposed microscopic mechanism. */
export const ELEMENT_COLORS={H:'#dce5ed',C:'#7199b7',O:'#de9477',N:'#81b5d6',Na:'#a7c9ad'};
export const REACTIONS={
 carbs:{equation:'C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ + C₆H₁₂O₆',reactants:[['sucrose','C12H22O11'],['water','H2O']],products:[['glucose','C6H12O6'],['fructose','C6H12O6']]},
 protein:{equation:'2 H₂N−CH₂−COOH → H₂N−CH₂−CO−NH−CH₂−COOH + H₂O',reactants:[['glycine1','C2H5NO2'],['glycine2','C2H5NO2']],products:[['peptide','C4H8N2O3'],['water','H2O']]},
 ester:{equation:'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O',reactants:[['acid','C2H4O2'],['ethanol','C2H6O']],products:[['ester','C4H8O2'],['water','H2O']]},
 esterification:{equation:'C₃H₈O₃ + 3 C₁₆H₃₂O₂ ⇌ C₅₁H₉₈O₆ + 3 H₂O',reactants:[['glycerol','C3H8O3'],['acid1','C16H32O2'],['acid2','C16H32O2'],['acid3','C16H32O2']],products:[['tripalmitin','C51H98O6'],['water1','H2O'],['water2','H2O'],['water3','H2O']]},
 transesterification:{equation:'C₅₁H₉₈O₆ + 3 CH₃OH ⇌ C₃H₈O₃ + 3 C₁₇H₃₄O₂',reactants:[['tripalmitin','C51H98O6'],['methanol1','CH4O'],['methanol2','CH4O'],['methanol3','CH4O']],products:[['glycerol','C3H8O3'],['methylester1','C17H34O2'],['methylester2','C17H34O2'],['methylester3','C17H34O2']]},
 saponification:{equation:'C₅₁H₉₈O₆ + 3 NaOH → C₃H₈O₃ + 3 C₁₆H₃₁O₂Na',reactants:[['tripalmitin','C51H98O6'],['base1','NaOH'],['base2','NaOH'],['base3','NaOH']],products:[['glycerol','C3H8O3'],['salt1','C16H31O2Na'],['salt2','C16H31O2Na'],['salt3','C16H31O2Na']]},
 hydrogenation:{equation:'C₅₇H₁₀₄O₆ + 3 H₂ → C₅₇H₁₁₀O₆',reactants:[['triolein','C57H104O6'],['hydrogen1','H2'],['hydrogen2','H2'],['hydrogen3','H2']],products:[['tristearin','C57H110O6']]}
};
export function formulaCounts(formula){const out={};for(const match of formula.matchAll(/([A-Z][a-z]?)(\d*)/g))out[match[1]]=(out[match[1]]||0)+Number(match[2]||1);return out;}
export function inventory(species){const atoms=[];for(const [molecule,formula]of species)for(const[element,n]of Object.entries(formulaCounts(formula)))for(let i=1;i<=n;i++)atoms.push({id:`${molecule}:${element}${i}`,element,molecule});return atoms;}
export function atomCounts(atoms){return atoms.reduce((a,x)=>{a[x.element]=(a[x.element]||0)+1;return a;},{});}
export function reactionAtoms(kind){
 const definition=REACTIONS[kind];if(!definition)throw Error(`Unknown reaction ${kind}`);
 const atoms=inventory(definition.reactants),available=[...atoms],destinations=new Map();
 const assign=(molecule,ids)=>{for(const id of ids){const i=available.findIndex(a=>a.id===id);if(i<0)throw Error(`Invalid atom map ${id}`);destinations.set(id,molecule);available.splice(i,1);}};
 if(kind==='protein')assign('water',['glycine1:O2','glycine1:H5','glycine2:H1']);
 if(kind==='ester')assign('water',['acid:O2','acid:H4','ethanol:H6']);
 if(kind==='carbs'){
  assign('glucose',[...atoms.filter(a=>a.molecule==='sucrose'&&((a.element==='C'&&Number(a.id.split('C')[1])<=6)||(a.element==='H'&&Number(a.id.split('H')[1])<=11)||(a.element==='O'&&Number(a.id.split('O')[1])<=6))).map(a=>a.id),'water:H1']);
  assign('fructose',available.map(a=>a.id));
 }
 // Remaining map satisfies the exact molecular composition. For large lipid
 // inventories it is one valid net mapping, not isotopic/mechanistic evidence.
 for(const [molecule,formula]of definition.products){const required=formulaCounts(formula);for(const[element,n]of Object.entries(required)){const assigned=atoms.filter(a=>a.element===element&&destinations.get(a.id)===molecule).length;const choices=available.filter(a=>a.element===element).slice(0,n-assigned);if(choices.length!==n-assigned)throw Error('Atom-map deficit');assign(molecule,choices.map(a=>a.id));}}
 if(available.length)throw Error('Unmapped atoms');return atoms.map(a=>({...a,product:destinations.get(a.id)}));
}
export function conserved(kind){const atoms=reactionAtoms(kind);return REACTIONS[kind].products.every(([m,f])=>JSON.stringify(Object.entries(atomCounts(atoms.filter(a=>a.product===m))).sort())===JSON.stringify(Object.entries(formulaCounts(f)).sort()));}
export function smoothstep(value){const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);}
export function phaseProgress(progress,begin,end){return smoothstep((progress-begin)/(end-begin));}
export function atomPositions(atoms,species,side){
 const positions=new Map();const n=species.length,width=680/n;
 species.forEach(([molecule],i)=>{const group=atoms.filter(a=>side==='reactant'?a.molecule===molecule:a.product===molecule);const columns=Math.ceil(Math.sqrt(group.length*1.55)),spacing=Math.min(18,(width-22)/Math.max(columns-1,1)),rows=Math.ceil(group.length/columns);group.forEach((a,j)=>positions.set(a.id,{x:50+i*width+width/2+(j%columns-(columns-1)/2)*spacing,y:180+(Math.floor(j/columns)-(rows-1)/2)*spacing}));});return positions;
}
export function balanceLedger(h2,o2,h2o){const H=[2*h2,2*h2o],O=[2*o2,h2o];return{H,O,balanced:H[0]===H[1]&&O[0]===O[1]};}
export function polymerTopology(n,kind){const branch=kind==='amylopectin',branchStart=n===4?n-1:n-2,attachment=Math.min(2,branchStart-2),nodes=Array.from({length:n},(_,i)=>({id:i}));const edges=[];for(let i=1;i<n;i++){const isBranch=branch&&i===branchStart;edges.push({from:isBranch?attachment:i-1,to:i,bond:isBranch?'α(1→6)':kind==='cellulose'?'β(1→4)':'α(1→4)'});}return{nodes,edges,branchStart,attachment,formula:`C${6*n}H${10*n+2}O${5*n+1}`};}
export function sugarTest(sugar,test){const positive=test==='fehling'||test==='barfoed'?['glucose','fructose'].includes(sugar):test==='seliwanoff'?['fructose','sucrose'].includes(sugar):sugar==='starch';const initial=test==='fehling'||test==='barfoed'?'#5488b4':test==='lugol'?'#b18b56':'#b4a999';const final=positive?(test==='lugol'?'#3c3b64':test==='seliwanoff'?'#ba6475':'#bd794e'):initial;return{positive,precipitate:positive&&['fehling','barfoed'].includes(test),initial,final,needsHydrolysis:sugar==='sucrose'&&test==='seliwanoff',needsIsomerization:sugar==='fructose'&&test==='fehling'};}
