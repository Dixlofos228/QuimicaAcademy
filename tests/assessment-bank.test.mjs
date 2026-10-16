import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildLessonBank,selectQuestions} from '../src/assessment/bank.mjs';
import {validateResponse} from '../src/assessment/validation.mjs';
import {algebraEquivalent} from '../src/notation/algebra.mjs';
import {formulaEquivalent,equationEquivalent} from '../src/notation/chemistry.mjs';
const lessons=['foundations','course-a','course-b','course-c'].flatMap(x=>JSON.parse(fs.readFileSync(new URL(`../src/data/${x}.json`,import.meta.url))));
const response=e=>e.type==='guided'?e.stages.map(response):e.answer;
test('61 banks preserve all 246 old questions and provide 920 unique, bilingual questions',()=>{
 const banks=lessons.map(buildLessonBank),all=banks.flat();assert.equal(all.length,920);assert.equal(new Set(all.map(e=>e.id)).size,920);
 for(const[l,bank]of lessons.map((l,i)=>[l,banks[i]])){
  assert.ok(bank.length>=15);for(const old of l.exercises){const copy=bank.find(x=>x.id===old.id);for(const key of ['question','answer','explanation','hints'])assert.deepEqual(copy[key],old[key]);}
  for(const e of bank){assert.ok(['easy','medium','hard'].includes(e.difficulty));assert.equal(e.lessonId,l.id);assert.ok(e.question.ru&&e.question.es&&e.explanation.ru&&e.explanation.es);for(const field of [e.question,e.explanation,...e.options||[],...e.optionReasons||[]])assert.doesNotMatch(field.es,/[А-Яа-яЁё]/,e.id);}
 }
 assert.deepEqual(new Set(all.map(e=>e.type)),new Set(['numeric','formula','multi','error','choice','order','steps','math','guided','equation','match','balance']));
});
test('all canonical answers pass, including every guided stage; corrupt answers fail',()=>{
 for(const e of lessons.flatMap(buildLessonBank)){
  assert.equal(validateResponse(e,response(e)),true,e.id);
  const wrong=e.type==='multi'?[]:['order','match','balance','steps','guided'].includes(e.type)?Array.from({length:e.type==='guided'?e.stages.length:e.answer.length},()=>'-999999'):'not-an-answer';
  assert.equal(validateResponse(e,wrong),false,e.id);
 }
});
test('all 6100 normal thematic samples have ten unique questions, six formats and 3/4/3 levels',()=>{
 for(const lesson of lessons){const bank=buildLessonBank(lesson);for(let seed=1;seed<=100;seed++){
  const selected=selectQuestions(bank,{seed});assert.equal(selected.length,10);assert.equal(new Set(selected.map(q=>q.id)).size,10);assert.ok(new Set(selected.map(q=>q.type)).size>=6,lesson.id);
  assert.deepEqual(['easy','medium','hard'].map(level=>selected.filter(q=>q.difficulty===level).length),[3,4,3],lesson.id);
  for(const e of selected)assert.equal(validateResponse(e,response(e)),true,e.id);
  if(lesson.id==='mole')for(const objective of ['molar-mass','amount','formula-choice','chemical-formula','quantity-meaning','misconception','guided-reasoning'])assert.ok(selected.some(q=>q.objective===objective),objective);
 }}
});
test('level practice has no duplicate padding, and aggregate exams preserve lesson coverage',()=>{
 for(const l of lessons)for(const level of ['easy','medium','hard']){const chosen=selectQuestions(buildLessonBank(l),{seed:7,level});assert.ok(chosen.length);assert.equal(new Set(chosen.map(q=>q.id)).size,chosen.length);assert.ok(chosen.every(q=>q.difficulty===level));}
 const all=selectQuestions(lessons.flatMap(buildLessonBank),{seed:42,count:61,coverLessons:true});assert.equal(new Set(all.map(q=>q.lessonId)).size,61);
});
test('notation-choice distractors do not contain another algebraically or chemically equivalent answer',()=>{
 for(const e of lessons.flatMap(buildLessonBank).filter(e=>e.objective==='notation-choice')){
  const expected=e.options[e.answer].ru;
  for(const[o,i]of e.options.map((o,i)=>[o,i]))if(i!==e.answer){assert.equal(algebraEquivalent(o.ru,expected)||formulaEquivalent(o.ru,expected)||equationEquivalent(o.ru,expected),false,e.id+' '+o.ru);}
 }
});
