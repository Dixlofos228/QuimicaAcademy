import {createContext,useContext,useEffect,useId,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import katex from 'katex';
import 'katex/contrib/mhchem';
import {formulaModel,annotatedTex,plainTex,notationInText} from '../notation/model.mjs';
import {explanation} from '../notation/explanations.mjs';
import type {Lang} from '../types';

export const NotationContext=createContext<{lessonId:string;lang:Lang;navigate?:(route:string)=>void}>({lessonId:'',lang:'ru'});
type Props={tex?:string;expression?:string;lang?:Lang;block?:boolean;lessonId?:string;interactive?:boolean};
export function InteractiveFormulaInspector({tex,expression,lang,block=false,lessonId,interactive=true}:Props){
 const inherited=useContext(NotationContext),activeLesson=lessonId??inherited.lessonId;
 const currentLang=lang||inherited.lang,ru=currentLang==='ru';
 const input=tex??plainTex(expression||''),model=useMemo(()=>formulaModel(input,{lessonId:activeLesson}),[input,activeLesson]),source=model.tex;
 const [selected,setSelected]=useState(''),[expanded,setExpanded]=useState(false),[details,setDetails]=useState(false),[copied,setCopied]=useState(false),[anchor,setAnchor]=useState({x:20,y:100}),[position,setPosition]=useState({left:20,top:100});
 const root=useRef<HTMLSpanElement>(null),card=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null),id=useId();
 const part=model.parts.find(p=>p.id===selected),info=part?explanation(part,model):null;
 const html=useMemo(()=>{try{return katex.renderToString(interactive?annotatedTex(model,selected):source,{displayMode:block,throwOnError:true,strict:'ignore',output:'htmlAndMathml',trust:ctx=>ctx.command==='\\htmlData'&&Object.entries((ctx as any).attributes||{}).every(([k,v])=>/^data-ifi-(?:id|role|active)$/.test(k)&&/^[a-zA-Z0-9-]+$/.test(String(v)))});}catch{return null;}},[model,selected,source,block,interactive]);
 const close=()=>{setSelected('');setDetails(false);if(opener.current?.isConnected)opener.current.focus({preventScroll:true});};
 useEffect(()=>{if(selected&&!model.parts.some(p=>p.id===selected))setSelected('');},[model,selected]);
 useEffect(()=>{
  if(!selected)return;const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}};
  const outside=(e:PointerEvent)=>{if(!(e.target as HTMLElement).closest?.('.language-toggle')&&!card.current?.contains(e.target as Node)&&!root.current?.contains(e.target as Node))setSelected('');};
  document.addEventListener('keydown',keyboard,true);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',keyboard,true);document.removeEventListener('pointerdown',outside);};
 },[selected]);
 useEffect(()=>{
  if(!selected)return;const place=()=>{const h=card.current?.offsetHeight||240,w=card.current?.offsetWidth||330;setPosition({left:Math.max(10,Math.min(anchor.x,innerWidth-w-10)),top:Math.max(10,Math.min(anchor.y+10,innerHeight-h-10))});};place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[selected,anchor,details,currentLang]);
 const choose=(key:string,target:HTMLElement)=>{const r=target.getBoundingClientRect();opener.current=target;setAnchor({x:r.left,y:r.bottom});setSelected(key);setDetails(false);};
 const label=(p:typeof model.parts[number])=>p.type==='fraction'?(ru?'Дробная черта':'Raya de fracción'):p.type==='numerator'?(ru?'Числитель':'Numerador'):p.type==='denominator'?(ru?'Знаменатель':'Denominador'):p.text.replace(/\\/g,'');
 const copy=async()=>{try{await navigator.clipboard.writeText(source);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}catch{setExpanded(true);}};
 return <span ref={root} className={`ifi ${block?'ifi-block':'ifi-inline'}`} data-testid="formula-inspector" data-lesson={activeLesson} data-expression={expression} data-tex={source}>
  <span className="ifi-typeset" onClick={e=>{if(!interactive)return;const target=(e.target as HTMLElement).closest<HTMLElement>('[data-ifi-id]');if(target&&model.parts.some(p=>p.id===target.dataset.ifiId))choose(target.dataset.ifiId!,target);}} aria-label={ru?'Математическое выражение':'Expresión matemática'}>{html?<span dangerouslySetInnerHTML={{__html:html}}/>:<code>{tex||expression}</code>}</span>
  {interactive&&<span className="ifi-tools"><button type="button" className="ifi-inspect" aria-label={ru?'Разобрать элементы формулы':'Explorar elementos de la fórmula'} aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>{block?(ru?'Разобрать формулу':'Explorar fórmula'):'?'}</button>{block&&<button type="button" onClick={copy} aria-label={ru?'Копировать формулу':'Copiar fórmula'}>{copied?(ru?'Скопировано':'Copiado'):(ru?'Копировать':'Copiar')}</button>}</span>}
  {expanded&&<span className="ifi-elements" role="group" aria-label={ru?'Элементы формулы':'Elementos de la fórmula'} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const items=Array.from(e.currentTarget.querySelectorAll('button')),index=items.indexOf(document.activeElement as HTMLButtonElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;e.preventDefault();items[next]?.focus();}}>{model.parts.map(p=><button type="button" key={p.id} data-node-id={p.id} aria-pressed={selected===p.id} onClick={e=>choose(p.id,e.currentTarget)}>{label(p)}</button>)}<input readOnly className="ifi-copy-source" aria-label={ru?'Исходная формула для копирования':'Fórmula fuente para copiar'} value={source} onFocus={e=>e.target.select()}/></span>}
  {part&&info&&createPortal(<div ref={card} className="ifi-popover" role="region" aria-labelledby={`${id}-title`} data-testid="formula-explanation" style={position}><div className="ifi-popover-heading"><strong id={`${id}-title`}>{info.title[currentLang]}</strong><button type="button" aria-label={ru?'Закрыть объяснение':'Cerrar explicación'} onClick={close}>×</button></div><p><NotationText text={info.summary[currentLang]} lang={currentLang} lessonId={activeLesson} interactive={false}/></p><button type="button" className="text-button" aria-expanded={details} onClick={()=>setDetails(x=>!x)}>{ru?'Объясни подробнее':'Explicar en detalle'}</button>{details&&<><p><NotationText text={info.detail[currentLang]} lang={currentLang} lessonId={activeLesson} interactive={false}/></p><div className="explanation"><NotationText text={info.example[currentLang]} lang={currentLang} lessonId={activeLesson} interactive={false}/></div>{info.lessonId&&<a href={`#lesson/${info.lessonId}`} onClick={e=>{setSelected('');if(inherited.navigate){e.preventDefault();inherited.navigate('lesson/'+info.lessonId);}}}>{ru?'Открыть связанный урок':'Abrir lección relacionada'} →</a>}</>}</div>,document.body)}
 </span>;
}
export function NotationText({text,lang,lessonId,interactive=true}:{text:string;lang:Lang;lessonId?:string;interactive?:boolean}){
 const chunks=useMemo(()=>notationInText(text),[text]);return <>{chunks.map((c,i)=>c.formula?<InteractiveFormulaInspector key={i} tex={c.tex} expression={c.formula} lang={lang} lessonId={lessonId} interactive={interactive}/>:c.text)}</>;
}
