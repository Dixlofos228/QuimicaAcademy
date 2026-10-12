import {useState} from 'react';
import type {Lang} from '../types';

/** Ideal calorimetry: the reaction and its thermal surroundings form an insulated setup. */
export function Calorimeter({lang,lessonId}:{lang:Lang;lessonId:string}){
 const [mass,setMass]=useState(100);
 const [deltaT,setDeltaT]=useState(5);
 const [calCapacity,setCalCapacity]=useState(50);
 const str=(ru:string,es:string)=>lang==='ru'?ru:es;
 const isBomb=lessonId.includes('bomb');
 const waterSpecificHeat=4.18; // J/(g·K); temperature differences have the same value in K and °C.
 const totalCapacity=mass*waterSpecificHeat+calCapacity;
 const qAbsorbed=totalCapacity*deltaT;
 const qReaction=qAbsorbed===0?0:-qAbsorbed;
 const format=(value:number,digits=1)=>new Intl.NumberFormat(lang==='ru'?'ru-RU':'es-UY',{
  minimumFractionDigits:digits,maximumFractionDigits:digits,
 }).format(Object.is(value,-0)?0:value);
 const reset=()=>{setMass(100);setDeltaT(5);setCalCapacity(50);};
 const slider=(label:string,value:number,set:(value:number)=>void,min:number,max:number,step:number)=>(
  <label className="slider-label">
   <span>{label}<b>{format(value,step<1?1:0)}</b></span>
   <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event=>set(Number(event.target.value))}/>
  </label>
 );
 // Fixed axes preserve changes in slope: ±20 °C horizontally, ±60 kJ vertically.
 const plotX=(temperature:number)=>340+temperature*12;
 const plotY=(heatJ:number)=>140-heatJ/1000*1.5;
 const result=(label:string,value:string)=><div className="model-result"><small>{label}</small><strong data-testid="model-result">{value}</strong></div>;
 return <>
  <h3>{isBomb?str('Бомбовый калориметр: V = const','Bomba calorimétrica: V = const'):str('Калориметр: p = const','Calorímetro: p = const')}</h3>
  <div className="model-controls">
   {slider(str('Масса воды m (g)','Masa de agua m (g)'),mass,setMass,10,500,10)}
   {slider('ΔT = Tf − Ti (°C)',deltaT,setDeltaT,-20,20,.1)}
   {slider(str('Теплоёмкость калориметра Ccal (J/K)','Capacidad del calorímetro Ccal (J/K)'),calCapacity,setCalCapacity,0,500,1)}
  </div>
  <svg viewBox="0 0 620 280" role="img" aria-label={str('Теплота воды и калориметра и противоположная теплота реакции в зависимости от изменения температуры','Calor del agua y calorímetro y calor opuesto de la reacción en función del cambio de temperatura')}>
   <line x1="100" y1="18" x2="120" y2="18" stroke="var(--accent)" strokeWidth="3"/>
   <text x="128" y="23">{str('Вода + калориметр','Agua + calorímetro')}</text>
   <line x1="360" y1="18" x2="380" y2="18" stroke="var(--warm)" strokeWidth="3" strokeDasharray="5 4"/>
   <text x="388" y="23">{str('Реакция','Reacción')}</text>
   {[-60,-30,0,30,60].map(value=><g key={value}>
    <line x1="100" y1={plotY(value*1000)} x2="580" y2={plotY(value*1000)} stroke="var(--border)" strokeDasharray={value===0?undefined:'3 5'}/>
    <text x="88" y={plotY(value*1000)+5} textAnchor="end">{value>0?'+':''}{value}</text>
   </g>)}
   <line x1="100" y1="140" x2="580" y2="140" stroke="var(--muted)"/>
   <line x1="340" y1="45" x2="340" y2="235" stroke="var(--muted)"/>
   <text x="42" y="43">q (kJ)</text>
   {[-20,-10,0,10,20].map(value=><g key={value}>
    <line x1={plotX(value)} y1="137" x2={plotX(value)} y2="143" stroke="var(--muted)"/>
    <text x={plotX(value)} y="251" textAnchor="middle">{value>0?'+':''}{value}</text>
   </g>)}
   <text x="580" y="274" textAnchor="end">ΔT (°C)</text>
   <line x1={plotX(-20)} y1={plotY(-20*totalCapacity)} x2={plotX(20)} y2={plotY(20*totalCapacity)} stroke="var(--accent)" strokeWidth="3"/>
   <line x1={plotX(-20)} y1={plotY(20*totalCapacity)} x2={plotX(20)} y2={plotY(-20*totalCapacity)} stroke="var(--warm)" strokeWidth="3" strokeDasharray="6 5"/>
   <line x1={plotX(deltaT)} y1="50" x2={plotX(deltaT)} y2="230" stroke="var(--faint)" strokeDasharray="3 5"/>
   <circle cx={plotX(deltaT)} cy={plotY(qAbsorbed)} r="6" fill="var(--accent)"/>
   <circle cx={plotX(deltaT)} cy={plotY(qReaction)} r="9" fill="none" stroke="var(--warm)" strokeWidth="3"/>
  </svg>
  {result(str('Общая теплоёмкость: mc + Ccal','Capacidad total: mc + Ccal'),`${format(totalCapacity,2)} J/K`)}
  {result('qabs = (mc + Ccal)ΔT',`${format(qAbsorbed)} J`)}
  {result('qreaction = −qabs',`${format(qReaction)} J`)}
  {result(isBomb?'ΔUreaction = qV':'ΔHreaction = qp',`${format(qReaction/1000,3)} kJ`)}
  <p>{deltaT>0
   ?str('Вода и калориметр нагреваются: qabs > 0, а реакция отдаёт теплоту: qreaction < 0 (экзотермическая).','Agua y calorímetro se calientan: qabs > 0; la reacción cede calor: qreaction < 0 (exotérmica).')
   :deltaT<0
    ?str('Вода и калориметр охлаждаются: qabs < 0, а реакция получает теплоту: qreaction > 0 (эндотермическая).','Agua y calorímetro se enfrían: qabs < 0; la reacción recibe calor: qreaction > 0 (endotérmica).')
    :str('При ΔT = 0 расчётная теплота равна нулю. Направления теплообмена в этой модели нет.','Con ΔT = 0, el calor calculado es cero. Este modelo no indica una dirección de intercambio térmico.')}
   {' '}{str('На графике в kJ/°C наклоны равны ±(mc + Ccal)/1000; увеличение массы воды или Ccal увеличивает их крутизну.','En el gráfico en kJ/°C, las pendientes son ±(mc + Ccal)/1000; aumentar la masa de agua o Ccal aumenta su inclinación.')}
  </p>
  <p>{isBomb
   ?str('В жёсткой закрытой бомбе объём реакции постоянен. Если отсутствуют другие виды работы, qV = ΔU реакции. Это ещё не ΔH: для идеальных газов ΔH = ΔU + ΔngRT.','En una bomba rígida cerrada, el volumen de reacción es constante. Sin otros tipos de trabajo, qV = ΔU de reacción. Para obtener ΔH de gases ideales se usa ΔH = ΔU + ΔngRT.')
   :str('При постоянном давлении и только работе расширения или сжатия qP = ΔH реакции. Модель лабораторного калориметра предполагает, что тепло реакционной смеси передаётся воде и сосуду, а потерями во внешнюю среду можно пренебречь.','A presión constante y con solo trabajo de expansión o compresión, qP = ΔH de reacción. El modelo del calorímetro de laboratorio supone que el calor de la mezcla se transmite al agua y al recipiente y que las pérdidas al exterior son despreciables.')}
  </p>
  <p>{str('Вода и калориметр имеют одинаковое ΔT. Вода остаётся жидкой; c = 4,18 J/(g·K) и Ccal постоянны. 1 °C изменения температуры = 1 K. Реакция + вода + калориметр рассматриваются как теплоизолированная совокупность: qreaction + qabs = 0. Ccal здесь не включает уже учтённую воду. В лабораторном растворе приближение c ≈ cводы и оценка массы требуют проверки.','Agua y calorímetro tienen el mismo ΔT. El agua permanece líquida; c = 4,18 J/(g·K) y Ccal son constantes. Una diferencia de 1 °C equivale a 1 K. Reacción + agua + calorímetro se consideran térmicamente aislados: qreaction + qabs = 0. Ccal no incluye el agua ya contabilizada. En una solución de laboratorio hay que comprobar la aproximación c ≈ cagua y la estimación de masa.')}</p>
  <p>{str('Вы управляете учебными параметрами; это не измеренные данные конкретной реакции. Результат относится ко всей заданной порции, а не к одному молю.','Estos parámetros son ajustables y didácticos, no mediciones de una reacción concreta. El resultado corresponde a toda la porción, no a un mol.')}</p>
  <div className="actions"><button onClick={reset}>{str('Сбросить калориметр','Reiniciar calorímetro')}</button></div>
 </>;
}
