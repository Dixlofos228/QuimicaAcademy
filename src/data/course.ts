import foundations from './foundations.json';
import a from './course-a.json';
import b from './course-b.json';
import c from './course-c.json';
import type {Lesson} from '../types';
const order=['foundation','organic','carbs','thermo','equilibrium','acidbase','protein','proteins','lipids','colloids'];
export const lessons=([...foundations,...a,...b,...c] as Lesson[]).sort((x,y)=>order.indexOf(x.group)-order.indexOf(y.group));
export const terms=lessons.flatMap(l=>l.terms.map(term=>({...term,lessonId:term.lessonId||l.id}))).filter((x,i,all)=>all.findIndex(y=>y.id===x.id)===i);
