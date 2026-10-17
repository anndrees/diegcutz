import { z } from 'zod';
import {Quaternion} from 'three';
import type { City, GhostFrame, Vec3 } from './types';
const vec=z.tuple([z.number().finite().min(-2000).max(2000),z.number().finite().min(-2000).max(2000),z.number().finite().min(-2000).max(2000)]);
const normal=vec.refine(v=>Math.abs(Math.hypot(v[0],v[1],v[2])-1)<.01,'La dirección debe ser un vector unitario');
const checkpoint=z.object({position:vec,up:normal,radius:z.number().min(.5).max(12)});
export const citySchema=z.object({version:z.literal(1),id:z.string().min(1).max(80),name:z.string().min(1).max(80),spawn:vec,entities:z.array(z.object({id:z.string().min(1).max(80),position:vec,size:vec.refine(v=>v.slice(0,3).every(n=>typeof n==='number' && n>.1 && n<=500),'Tamaño no válido'),rotation:vec,kind:z.enum(['concrete','dark','red','glass']),gravity:z.array(normal).max(6).optional()})).min(1).max(600),races:z.array(z.object({id:z.string().min(1).max(80),name:z.string().min(1).max(80),district:z.string().max(80),description:z.string().max(300),start:checkpoint,yaw:z.number().finite(),checkpoints:z.array(checkpoint).min(1).max(40),medals:z.tuple([z.number().positive(),z.number().positive(),z.number().positive()]).refine(v=>v[0]<v[1]&&v[1]<v[2],'Orden de medallas incorrecto')})).max(24),secrets:z.array(z.object({id:z.string().min(1).max(80),position:vec})).max(100)}).superRefine((city,ctx)=>{
 for(const list of [city.entities,city.races,city.secrets]) if(new Set(list.map(e=>e.id)).size!==list.length) ctx.addIssue({code:'custom',message:'Identificadores duplicados'});
});
export function parseCity(text:string):City { if(text.length>2_000_000) throw new Error('El mapa supera el tamaño permitido');return citySchema.parse(JSON.parse(text)) as unknown as City; }
export const pcAllowed=(width:number,fine:boolean,hover:boolean,touchOnly:boolean)=>width>=960&&fine&&hover&&!touchOnly;
export function gravityAllowed(marked:Vec3[]|undefined,normal:Vec3,distance:number,occluded=false){return !occluded&&distance<=45&&distance>=0&&Boolean(marked?.some(n=>n[0]*normal[0]+n[1]*normal[1]+n[2]*normal[2]>.95));}
export function crossedCheckpoint(a:Vec3,b:Vec3,target:Vec3,radius:number){const d=b.map((v,i)=>v-a[i]);const length=d.reduce((s,v)=>s+v*v,0);const t=length===0?0:Math.max(0,Math.min(1,d.reduce((s,v,i)=>s+(target[i]-a[i])*v,0)/length));return Math.hypot(...a.map((v,i)=>v+d[i]*t-target[i]))<=radius;}
export const medalFor=(time:number,thresholds:[number,number,number])=>time<=thresholds[0]?'ORO':time<=thresholds[1]?'PLATA':time<=thresholds[2]?'BRONCE':'COMPLETADA';
export function ghostAt(frames:GhostFrame[],time:number):GhostFrame|null {if(!frames.length||time>frames[frames.length-1].t)return null;let lo=0,hi=frames.length-1;while(lo<hi){const m=Math.floor((lo+hi)/2);if(frames[m].t<time)lo=m+1;else hi=m;}const b=frames[lo],a=frames[Math.max(0,lo-1)],t=b.t===a.t?0:Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t)));return {t:time,p:a.p.map((v,i)=>v+(b.p[i]-v)*t) as Vec3,q:new Quaternion().fromArray(a.q).slerp(new Quaternion().fromArray(b.q),t).normalize().toArray() as GhostFrame['q']};}
export function worldSignature(city:City){const text=JSON.stringify([city.entities,city.races]);let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(16);}
export const formatTime=(s:number)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toFixed(2).padStart(5,'0')}`;

const cityBounds=new WeakMap<City,{min:number;max:number}[]>();
export function outsideCity(city:City,position:Vec3){let bounds=cityBounds.get(city);if(!bounds){bounds=[0,1,2].map(axis=>({min:Math.min(...city.entities.map(e=>e.position[axis]-Math.hypot(...e.size)/2))-30,max:Math.max(...city.entities.map(e=>e.position[axis]+Math.hypot(...e.size)/2))+30}));cityBounds.set(city,bounds);}return bounds.some((b,axis)=>position[axis]<b.min||position[axis]>b.max);}
