import test from 'node:test';import assert from 'node:assert/strict';
import {chemicalFormula as parse,formulaEquivalent,chemicalEquation as equation,equationEquivalent,chemicalTex} from '../src/notation/chemistry.mjs';
import {algebraEquivalent,algebraTex} from '../src/notation/algebra.mjs';
import {validateResponse} from '../src/assessment/validation.mjs';
test('nested chemical groups, hydrates, real elements and Unicode are parsed completely',()=>{
 assert.deepEqual(parse('Ca(OH)₂').atoms,{Ca:1,O:2,H:2});assert.deepEqual(parse('Al2(SO4)3').atoms,{Al:2,S:3,O:12});assert.deepEqual(parse('K4[Fe(CN)6]').atoms,{K:4,Fe:1,C:6,N:6});assert.deepEqual(parse('CuSO4·5H2O').atoms,{Cu:1,S:1,O:9,H:10});assert.equal(parse('SO₄²⁻').charge,-2);assert.equal(parse('NH4+').charge,1);assert.deepEqual(parse('Ca2+').atoms,{Ca:1});assert.equal(parse('Fe3+').charge,3);assert.deepEqual(parse('O2+').atoms,{O:2});
 for(const x of ['','H0','Xx2','Na(OH','Ca)2','H2O<script>','2H2O','H2O junk','(H)0','(H2O))'])assert.throws(()=>parse(x),x);
});
test('reaction grading checks species, all atoms, charge, direction and minimum coefficients',()=>{
 assert.equal(equationEquivalent('O2 + 2H2 -> 2H2O','2H2 + O2 -> 2H2O'),true);
 assert.equal(equationEquivalent('4H2+2O2->4H2O','2H2+O2->2H2O'),false);
 assert.equal(equationEquivalent('4H2+2O2->4H2O','2H2+O2->2H2O',{minimal:false}),true);
 assert.equal(equationEquivalent('H2+O2->H2O','2H2+O2->2H2O'),false);
 assert.equal(equationEquivalent('2H2O->2H2+O2','2H2+O2->2H2O'),false);
 assert.equal(equation('NH4^+ + OH^- -> NH3 + H2O').balanced,true);
 assert.equal(equation('Fe^3+ + e^- -> Fe^2+').balanced,true);
 assert.equal(equation('Fe^3+ -> Fe^2+').balanced,false);
 assert.equal(equation('NaOH + HCl -> NaCl + H2O').balanced,true);
 assert.equal(equationEquivalent('H2O->H2O','2H2+O2->2H2O'),false);
 assert.equal(formulaEquivalent('OH2','H2O'),true);assert.equal(formulaEquivalent('OH2','H2O','structural'),false);assert.equal(formulaEquivalent('NH4','NH4+'),false);
});
test('algebraic equivalence is structural rational algebra, not string appearance or samples',()=>{
 for(const x of ['n=m/M','m=n*M','m/M=n','n*M-m=0','2*m=2*n*M'])assert.equal(algebraEquivalent(x,'n=m/M'),true,x);
 for(const x of ['n=M/m','n=m*M','m=n/M','n=m/M+0.001','0=0','n=m/(M+1)','alert(1)','m/m=1'])assert.equal(algebraEquivalent(x,'n=m/M'),false,x);
 assert.equal(algebraEquivalent('n=m/M+1e-20','n=m/M'),false);assert.equal(algebraEquivalent('0.1*m+0.2*m','0.3*m'),true);assert.equal(algebraEquivalent('m*M^-1','m/M'),true);assert.equal(algebraEquivalent('0^-1','1'),false);
 assert.equal(algebraEquivalent('a/(b+c)','a/b+a/c'),false);assert.equal(algebraEquivalent('q+w','w+q'),true);assert.match(algebraTex('n=m/M'),/\\frac\{m\}\{M\}/);
});
test('numeric validators accept conversions but reject incompatible dimensions and empty choices',()=>{
 const e={type:'numeric',answer:.002,unit:'mol',tolerance:1e-6};for(const s of ['0,002 mol','2e-3 mol','2 mmol'])assert.equal(validateResponse(e,s),true,s);for(const s of ['2 mol','0.002 g','oops',''])assert.equal(validateResponse(e,s),false,s);
 assert.equal(validateResponse({type:'choice',answer:0},''),false);assert.equal(validateResponse({type:'multi',answer:[0,2]},[2,0]),true);assert.equal(validateResponse({type:'multi',answer:[0,2]},[0,0,2]),false);
});
