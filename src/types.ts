export type Lang='ru'|'es';
export type I18n={ru:string;es:string};
export type Exercise={id:string;type:'choice'|'multi'|'numeric'|'formula'|'order'|'match'|'balance'|'error'|'steps';question:I18n;options?:I18n[];matches?:I18n[];answer:number|string|number[]|string[];unit?:string;tolerance?:number;explanation:I18n;hints:I18n[]};
export type Term={id:string;name:I18n;definition:I18n;detail:I18n;formula?:string;example:I18n;related?:string[];lessonId?:string};
export type Lesson={id:string;group:string;title:I18n;summary:I18n;goals:I18n[];prereqs:I18n;additional?:boolean;sourceIds:number[];paragraphs:{title:I18n;text:I18n;formal:I18n;simple:I18n}[];formulas:{tex:string;symbols:I18n}[];examples:{title:I18n;steps:I18n[];why:I18n[];result:I18n}[];exercises:Exercise[];terms:Term[];simulation:string;notes?:I18n[]};
export type Progress={version:1;lang:Lang;theme:'dark'|'light';mode:'simple'|'formal';completed:string[];answers:Record<string,{attempts:number;correct:boolean;lessonId:string;lastAnswer:string}>;tests:Record<string,{score:number;total:number;date:string}>;lastLesson:string;favorites:string[];steps:Record<string,number>};
