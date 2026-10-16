import {lessons} from '../data/course';
import type {Exercise,Lesson} from '../types';
import {buildLessonBank} from './bank.mjs';
const cache=new Map<string,Exercise[]>();
export function lessonBank(lesson:Lesson):Exercise[]{if(!cache.has(lesson.id))cache.set(lesson.id,buildLessonBank(lesson) as Exercise[]);return cache.get(lesson.id)!;}
export function scopeBank(scope:string){const pool=scope==='all'?lessons:scope==='diagnostic'?lessons.filter(x=>x.additional):lessons.filter(x=>x.id===scope||x.group===scope);return{lessons:pool,questions:pool.flatMap(lessonBank)};}
