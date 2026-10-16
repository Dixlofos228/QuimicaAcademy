import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import katex from 'katex';import {transformSync} from 'esbuild';
import {plainTex,formulaModel,annotatedTex,notationInText} from '../src/notation/model.mjs';
import {buildLessonBank} from '../src/assessment/bank.mjs';
import {explanation} from '../src/notation/explanations.mjs';
const source=fs.readFileSync(new URL('../src/visuals/formula-frames.ts',import.meta.url),'utf8');const {formulaFrames}=await import('data:text/javascript,'+encodeURIComponent(transformSync(source,{loader:'ts',format:'esm'}).code));
const lessons=['foundations','course-a','course-b','course-c'].flatMap(x=>JSON.parse(fs.readFileSync(new URL(`../src/data/${x}.json`,import.meta.url))));
const render=(tex,id)=>katex.renderToString(annotatedTex(formulaModel(tex,{lessonId:id})),{strict:'ignore',throwOnError:true,trust:ctx=>ctx.command==='\\htmlData'&&Object.keys(ctx.attributes||{}).every(k=>/^data-ifi-(?:id|role|active)$/.test(k))});
test('all 80 original lesson formulas and all 270 animated frames render as structured mathematics',()=>{
 let base=0,frames=0;for(const l of lessons)for(const f of l.formulas){assert.match(render(f.tex,l.id),/katex-html/);base++;}
 for(const[id,s]of Object.entries(formulaFrames))for(const frame of s.frames){assert.match(render(plainTex(frame),id.replace(/-\d+$/,'')),/katex-html/);frames++;}assert.equal(base,80);assert.equal(frames,270);
});
test('fractions, chemical indices, phases, powers and roots are real notation rather than CSS text',()=>{
 assert.match(render(plainTex('n=m/M'),'mole'),/<mfrac>/);assert.match(render('c=n/V','strong-acids'),/<mfrac>/);assert.equal((render('U=\\frac{q}{m/M}','thermo-bomb').match(/<mfrac>/g)||[]).length,2);assert.match(plainTex('n=36,03 g/(18,015 g/mol)'),/\\frac\{36\{,\}03/);assert.match(render(plainTex('H2O'),'atoms'),/<msub>/);assert.match(render(plainTex('SO₄²⁻'),'atoms'),/<msubsup>/);
 assert.match(plainTex('M(CO2)=12,011+2×15,999'),/O}_\{2\}/);assert.match(plainTex('x=√(Kₐ×c₀)'),/\\sqrt\s*\{/);assert.match(plainTex('10^(0,9)'),/\^\{0\{,\}9\}/);
 assert.doesNotThrow(()=>render(plainTex('N2+2H2->N2H4(l)'),'thermo-hess'));assert.match(plainTex('c(Fe)=q(Fe)/(m(Fe)*ΔT(Fe))'),/\\frac\{q/);
});
test('semantic IDs and explicit roles come from the AST, with language-safe contextual explanations',()=>{
 const labels=formulaModel('\\mathrm{TG+3H_2O\\rightleftharpoons glycerol+3RCOOH}',{lessonId:'lipid-rancidity'}).parts.filter(n=>n.type==='label').map(n=>n.text);assert.deepEqual(labels,['TG','glycerol']);
 const m=formulaModel('n=\\frac{m}{M}',{lessonId:'mole'});assert.equal(new Set(m.parts.map(x=>x.id)).size,m.parts.length);assert.ok(m.parts.some(x=>x.type==='fraction'));assert.ok(m.parts.some(x=>x.type==='numerator'));assert.ok(m.parts.some(x=>x.type==='denominator'));
 const chem=formulaModel('\\mathrm{C}',{lessonId:'atoms'}),heat=formulaModel('C',{lessonId:'thermo-bomb'});assert.match(explanation(chem.parts[0],chem).summary.ru,/элемент/);assert.match(explanation(heat.parts[0],heat).summary.ru,/калориметра/);
 for(const l of lessons)for(const f of l.formulas){const model=formulaModel(f.tex,{lessonId:l.id});for(const node of model.parts){const e=explanation(node,model);assert.ok(e.title.ru&&e.title.es&&e.summary.ru&&e.summary.es&&e.detail.ru&&e.detail.es);assert.doesNotMatch(e.summary.es,/[А-Яа-яЁё]/);for(const value of [...Object.values(e.summary),...Object.values(e.detail),...Object.values(e.example)])for(const chunk of notationInText(value))if(chunk.formula)assert.doesNotThrow(()=>render(chunk.tex,l.id),l.id+' '+chunk.formula);}}
});
test('prose segmentation preserves Spanish and Russian text around formulas',()=>{
 for(const input of ['La fórmula n=m/M cuenta moles.','n=m/M. La cantidad depende de la muestra.','Концентрация c=n/V при данных условиях.']){const parts=notationInText(input);assert.equal(parts.map(x=>x.formula||x.text).join(''),input);assert.ok(parts.some(x=>x.formula));}
 assert.equal(notationInText('La cantidad de sustancia depende de la muestra.').some(x=>x.formula),false);
});

test('all bilingual lesson and question strings preserve prose and render every detected expression',()=>{
 const scan=(value,id)=>{if(typeof value==='string'){const parts=notationInText(value);assert.equal(parts.map(p=>p.formula||p.text).join(''),value);for(const p of parts)if(p.formula)assert.doesNotThrow(()=>render(p.tex,id),id+' '+p.formula+' :: '+p.tex);}else if(Array.isArray(value))for(const v of value)scan(v,id);else if(value&&typeof value==='object')for(const [key,v]of Object.entries(value))if(!['tex','answer','id','lessonId'].includes(key))scan(v,id);};
 for(const lesson of lessons){scan(lesson,lesson.id);scan(buildLessonBank(lesson),lesson.id);}
});
