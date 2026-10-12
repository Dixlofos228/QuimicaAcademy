import type {Lang} from '../../types';
export type TimelineState={progress:number;stage:number;playing:boolean;speed:number;seek:(value:number)=>void};
export type LabProps={kind:string;lang:Lang;lessonId:string;timeline:TimelineState;lightweight:boolean};
