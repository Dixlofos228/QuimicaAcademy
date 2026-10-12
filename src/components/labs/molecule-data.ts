/** Deterministic educational coordinates in approximate ångströms.
 * Connectivity, bond orders and explicit hydrogens are chemical data; coordinates
 * are idealized teaching conformations, not an energy-minimized structure.
 */
export type Point3 = [number, number, number];
export type MolecularAtom = {id: string; element: 'C'|'H'|'O'|'N'|'residue'; position: Point3; label?: string; charge?: number};
export type MolecularBond = {a: string; b: string; order: 1|2|3; kind?: 'interaction'; strength?:number};
export type MolecularModel = {id: string; formula: string; atoms: MolecularAtom[]; bonds: MolecularBond[]};
export const atomPalette: Record<MolecularAtom['element'], {color:string;radius:number}> = {
 C:{color:'#8093ae',radius:.29}, H:{color:'#e5edf4',radius:.19}, O:{color:'#ed737a',radius:.30},
 N:{color:'#649ef1',radius:.29}, residue:{color:'#88b7cf',radius:.14},
};
const add=(a:Point3,b:Point3):Point3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const mul=(a:Point3,s:number):Point3=>[a[0]*s,a[1]*s,a[2]*s];
const sub=(a:Point3,b:Point3):Point3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const unit=(a:Point3):Point3=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a:Point3,b:Point3):Point3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function cone(axis:Point3,count:number):Point3[]{
 const u=unit(axis),v=unit(cross(u,Math.abs(u[2])<.8?[0,0,1]:[0,1,0])),w=cross(u,v);
 return Array.from({length:count},(_,i)=>add(mul(u,-1/3),mul(add(mul(v,Math.cos(i*2*Math.PI/3)),mul(w,Math.sin(i*2*Math.PI/3))),Math.sqrt(8/9))));
}
function hydrogenDirections(neighbors:Point3[],order:number,count:number):Point3[]{
 if(count===0)return [];
 if(order===3)return [mul(unit(neighbors[0]),-1)];
 if(order===2){
  if(neighbors.length===1){const u=unit(neighbors[0]),v=unit(cross([0,0,1],u));return [add(mul(u,-.5),mul(v,Math.sqrt(3)/2)),add(mul(u,-.5),mul(v,-Math.sqrt(3)/2))].slice(0,count);}
  return [mul(unit(add(unit(neighbors[0]),unit(neighbors[1]))),-1)];
 }
 if(neighbors.length===1)return cone(neighbors[0],count);
 if(neighbors.length===3)return [mul(unit(neighbors.reduce((s,p)=>add(s,unit(p)),[0,0,0] as Point3)),-1)];
 const u=mul(unit(add(unit(neighbors[0]),unit(neighbors[1]))),-1),v=unit(cross(neighbors[0],neighbors[1]));
 return [add(mul(u,Math.sqrt(1/3)),mul(v,Math.sqrt(2/3))),add(mul(u,Math.sqrt(1/3)),mul(v,-Math.sqrt(2/3)))].slice(0,count);
}
function addCarbonHydrogens(model:MolecularModel){
 for(const atom of [...model.atoms]){
  if(atom.element!=='C')continue;
  const edges=model.bonds.filter(b=>b.kind!=='interaction'&&(b.a===atom.id||b.b===atom.id));
  const remaining=4-edges.reduce((s,b)=>s+b.order,0),neighbors=edges.map(b=>sub(model.atoms.find(a=>a.id===(b.a===atom.id?b.b:b.a))!.position,atom.position));
  const order=Math.max(1,...edges.map(b=>b.order));
  for(const [i,d] of hydrogenDirections(neighbors,order,remaining).entries()){
   const id=`${atom.id}H${i+1}`;model.atoms.push({id,element:'H',position:add(atom.position,mul(d,1.09))});model.bonds.push({a:atom.id,b:id,order:1});
  }
 }
 return model;
}
export function hydrocarbonModel(n:number,order:1|2|3):MolecularModel{
 if(!Number.isInteger(n)||n<2||n>5)throw new Error('Carbon chain must contain 2–5 atoms');
 const atoms:MolecularAtom[]=[{id:'C1',element:'C',position:[0,0,0],label:'C1'}],bonds:MolecularBond[]=[];
 let direction=0;
 for(let i=1;i<n;i++){
  const previous=atoms[i-1].position;
  if(i===2)direction=order===3?0:order===2?Math.PI/3:Math.acos(1/3);
  else if(i>2)direction+=(i%2===0?1:-1)*Math.acos(1/3);
  const length=i===1?(order===3?1.20:order===2?1.34:1.54):1.54;
  atoms.push({id:`C${i+1}`,element:'C',position:add(previous,[Math.cos(direction)*length,Math.sin(direction)*length,0]),label:`C${i+1}`});
  bonds.push({a:`C${i}`,b:`C${i+1}`,order:i===1?order:1});
 }
 return centerModel(addCarbonHydrogens({id:`chain-${n}-${order}`,formula:`C${n}H${2*n+2-2*(order-1)}`,atoms,bonds}));
}
export function functionalModel(name:'ethanol'|'ethanoicacid'|'propanone'|'isobutane'):MolecularModel{
 let model:MolecularModel;
 if(name==='ethanol')model={id:name,formula:'C2H6O',atoms:[{id:'C1',element:'C',position:[-1.54,0,0]},{id:'C2',element:'C',position:[0,0,0]},{id:'O1',element:'O',position:[.48,1.35,0],label:'OH'},{id:'OH',element:'H',position:[1.39,1.64,0]}],bonds:[{a:'C1',b:'C2',order:1},{a:'C2',b:'O1',order:1},{a:'O1',b:'OH',order:1}]};
 else if(name==='ethanoicacid')model={id:name,formula:'C2H4O2',atoms:[{id:'C1',element:'C',position:[-1.50,0,0]},{id:'C2',element:'C',position:[0,0,0]},{id:'O1',element:'O',position:[.61,1.06,0],label:'O'},{id:'O2',element:'O',position:[.68,-1.17,0],label:'OH'},{id:'OH',element:'H',position:[1.63,-1.14,0]}],bonds:[{a:'C1',b:'C2',order:1},{a:'C2',b:'O1',order:2},{a:'C2',b:'O2',order:1},{a:'O2',b:'OH',order:1}]};
 else if(name==='propanone')model={id:name,formula:'C3H6O',atoms:[{id:'C1',element:'C',position:[-1.30,-.75,0]},{id:'C2',element:'C',position:[0,0,0]},{id:'C3',element:'C',position:[1.30,-.75,0]},{id:'O1',element:'O',position:[0,1.23,0],label:'O'}],bonds:[{a:'C1',b:'C2',order:1},{a:'C2',b:'C3',order:1},{a:'C2',b:'O1',order:2}]};
 else{const dirs:Point3[]=[[0,Math.sqrt(2/3),-1/Math.sqrt(3)],[0,-Math.sqrt(2/3),-1/Math.sqrt(3)],[Math.sqrt(2/3),0,1/Math.sqrt(3)]];model={id:name,formula:'C4H10',atoms:[{id:'C1',element:'C',position:[0,0,0]},...dirs.map((d,i)=>({id:`C${i+2}`,element:'C' as const,position:mul(d,1.54)}))],bonds:dirs.map((_,i)=>({a:'C1',b:`C${i+2}`,order:1 as const}))};}
 return centerModel(addCarbonHydrogens(model));
}
export function waterModel():MolecularModel{
 const half=104.5*Math.PI/360;
 return {id:'water',formula:'H2O',atoms:[{id:'O1',element:'O',position:[0,0,0],label:'O'},{id:'H1',element:'H',position:[.957*Math.sin(half),.957*Math.cos(half),0],label:'H1'},{id:'H2',element:'H',position:[-.957*Math.sin(half),.957*Math.cos(half),0],label:'H2'}],bonds:[{a:'O1',b:'H1',order:1},{a:'O1',b:'H2',order:1}]};
}
export function glyceraldehydeModel(isL=false):MolecularModel{
 // True tetrahedral center; x reflection interchanges the two configurations.
 const a=Math.sqrt(2/3),b=1/Math.sqrt(3),top:Point3=[0,a,-b],bottom:Point3=[0,-a,-b],right:Point3=[a,0,b],left:Point3=[-a,0,b];
 const carbonyl=mul(top,1.52),terminal=mul(bottom,1.52),oxygen=mul(right,1.43);
 const atoms:MolecularAtom[]=[{id:'C2',element:'C',position:[0,0,0],label:'C2*'},{id:'C1',element:'C',position:carbonyl,label:'C1'},{id:'C3',element:'C',position:terminal,label:'C3'},{id:'O2',element:'O',position:oxygen,label:'OH'},{id:'C2H',element:'H',position:mul(left,1.09)}];
 const bonds:MolecularBond[]=[{a:'C2',b:'C1',order:1},{a:'C2',b:'C3',order:1},{a:'C2',b:'O2',order:1},{a:'C2',b:'C2H',order:1}];
 const carbonylDirections=hydrogenDirections([mul(top,-1)],2,2);
 atoms.push({id:'O1',element:'O',position:add(carbonyl,mul(carbonylDirections[0],1.23)),label:'O1'},{id:'C1H',element:'H',position:add(carbonyl,mul(carbonylDirections[1],1.09))},{id:'O2H',element:'H',position:add(oxygen,[.70,.55,.34])});
 bonds.push({a:'C1',b:'O1',order:2},{a:'C1',b:'C1H',order:1},{a:'O2',b:'O2H',order:1});
 const dirs=cone(mul(bottom,-1),3);
 atoms.push({id:'O3',element:'O',position:add(terminal,mul(dirs[0],1.43)),label:'O3'});
 bonds.push({a:'C3',b:'O3',order:1});
 for(let i=1;i<3;i++){atoms.push({id:`C3H${i}`,element:'H',position:add(terminal,mul(dirs[i],1.09))});bonds.push({a:'C3',b:`C3H${i}`,order:1});}
 atoms.push({id:'O3H',element:'H',position:add(atoms.find(x=>x.id==='O3')!.position,mul(dirs[0],.96))});bonds.push({a:'O3',b:'O3H',order:1});
 if(isL)for(const atom of atoms)atom.position[0]*=-1;
 return centerModel({id:isL?'L-glyceraldehyde':'D-glyceraldehyde',formula:'C3H6O3',atoms,bonds});
}
export function buteneModel(trans=false):MolecularModel{
 const a=.75,h=Math.sqrt(3)*a;
 return centerModel(addCarbonHydrogens({id:trans?'trans-but-2-ene':'cis-but-2-ene',formula:'C4H8',atoms:[{id:'C1',element:'C',position:[-.67-a,h,0],label:'CH3'},{id:'C2',element:'C',position:[-.67,0,0],label:'C2'},{id:'C3',element:'C',position:[.67,0,0],label:'C3'},{id:'C4',element:'C',position:[.67+a,trans?-h:h,0],label:'CH3'}],bonds:[{a:'C1',b:'C2',order:1},{a:'C2',b:'C3',order:2},{a:'C3',b:'C4',order:1}]}));
}
export function glycineFractions(ph:number):[number,number,number]{
 const h=10**(-ph),k1=10**(-2.34),k2=10**(-9.60),d=h*h+k1*h+k1*k2;
 return [h*h/d,k1*h/d,k1*k2/d];
}
export function glycineModel(form:0|1|2):MolecularModel{
 const atoms:MolecularAtom[]=[{id:'C2',element:'C',position:[0,0,0],label:'Cα'},{id:'N',element:'N',position:[-1.22,.76,0],label:form===2?'N':'N⁺',charge:form===2?0:1},{id:'C1',element:'C',position:[1.22,.76,0],label:'COO'},{id:'O1',element:'O',position:[2.31,.19,0],label:'O'},{id:'O2',element:'O',position:[1.25,2.12,0],label:form===0?'OH':'O⁻',charge:form===0?0:-1}];
 const bonds:MolecularBond[]=[{a:'C2',b:'N',order:1},{a:'C2',b:'C1',order:1},{a:'C1',b:'O1',order:2},{a:'C1',b:'O2',order:1}];
 const directions=cone(sub(atoms[0].position,atoms[1].position),form===2?2:3);
 directions.forEach((d,i)=>{atoms.push({id:`NH${i+1}`,element:'H',position:add(atoms[1].position,mul(d,1.01))});bonds.push({a:'N',b:`NH${i+1}`,order:1});});
 if(form===0){atoms.push({id:'OH',element:'H',position:[2.08,2.60,0]});bonds.push({a:'O2',b:'OH',order:1});}
 return centerModel(addCarbonHydrogens({id:`glycine-${form}`,formula:['C2H6NO2+','C2H5NO2','C2H4NO2−'][form],atoms,bonds}));
}
export function proteinTraceModel(unfolding:number):MolecularModel{
 const u=Math.max(0,Math.min(1,unfolding)),count=32,atoms:MolecularAtom[]=[],bonds:MolecularBond[]=[];
 for(let i=0;i<count;i++){
  const angle=i*.73,native:Point3=[1.8*Math.sin(angle)+.06*i,1.7*Math.cos(angle),.12*(i-count/2)],open:Point3=[(i-(count-1)/2)*.26,.18*Math.sin(i*1.6),.10*Math.cos(i*.5)];
  atoms.push({id:`R${i+1}`,element:'residue',position:add(mul(native,1-u),mul(open,u)),label:String(i+1)});
  if(i)bonds.push({a:`R${i}`,b:`R${i+1}`,order:1});
 }
 // Contacts are qualitative, and are not additional covalent peptide bonds.
 if(u<.75)for(const [a,b] of [[4,20],[10,27],[1,14]])bonds.push({a:`R${a}`,b:`R${b}`,order:1,kind:'interaction',strength:(1-u/.75)**2});
 return {id:'protein-trace',formula:'Cα trace',atoms,bonds};
}
export function centerModel(model:MolecularModel):MolecularModel{
 const min:Point3=[Infinity,Infinity,Infinity],max:Point3=[-Infinity,-Infinity,-Infinity];
 model.atoms.forEach(a=>a.position.forEach((v,i)=>{min[i]=Math.min(min[i],v);max[i]=Math.max(max[i],v);}));
 const center=min.map((v,i)=>(v+max[i])/2) as Point3;
 model.atoms.forEach(a=>{a.position=sub(a.position,center);});return model;
}
export function molecularFormulaCounts(model:MolecularModel):Record<string,number>{
 const counts:Record<string,number>={};for(const a of model.atoms)counts[a.element]=(counts[a.element]??0)+1;return counts;
}
