import {supabase} from '@/integrations/supabase/client';
export interface Evidence{id:string;title:string;text:string;image?:string}
export interface Deduction{id:string;question:string;hints:string[];reasoning?:string}
export interface Chapter{id:number;title:string;intro?:string;available:boolean;release_at?:string;visit_required?:boolean;evidence?:Evidence[];deductions?:Deduction[];interviews?:{name:string;topics:{question:string;reply:string}[]}[]}
export interface CaseState{locked?:boolean;status:string;chapters:Chapter[];progress:{solved:string[];notes:string;connections:[string,string][];visited_at?:string;completed_at?:string};room:boolean;admin:boolean;media:Record<string,string>;instagram:Record<string,string>}
export async function investigation<T=CaseState>(op:string,payload:Record<string,unknown>={}):Promise<T>{
 const {data,error}=await supabase.functions.invoke('golden-investigation',{body:{op,payload}});
 if(error)throw Error('No se pudo abrir el expediente. Comprueba tu sesión y vuelve a intentarlo.');
 if(data?.error)throw Error(data.error);
 return data as T;
}