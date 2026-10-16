import { create } from 'zustand';
import { DEFAULT_CITY } from './city';
import {readSave,writeSave} from './persistence';
import type {City,Save,Screen,Vec3} from './types';
interface Store {city:City;save:Save;screen:Screen;raceId:string|null;epoch:number;elapsed:number;checkpoint:number;speed:number;position:Vec3;up:Vec3;message:string;target:string|null;invalid:boolean;result:number;storageError:boolean; setScreen:(s:Screen)=>void;setSave:(s:Save)=>void;start:(raceId?:string,city?:City)=>void;}
export const useRunStore=create<Store>((set,get)=>({city:DEFAULT_CITY,save:readSave(),screen:'menu',raceId:null,epoch:0,elapsed:0,checkpoint:0,speed:0,position:DEFAULT_CITY.spawn,up:[0,1,0],message:'',target:null,invalid:false,result:0,storageError:false,setScreen:screen=>set({screen}),setSave:save=>set({save,storageError:!writeSave(save)}),start:(raceId,city)=>{const world=city||get().city;set({city:world,screen:'playing',raceId:raceId||null,epoch:get().epoch+1,elapsed:0,checkpoint:0,invalid:false,result:0,message:raceId?'Cruza las puertas en orden':'ÁGORA / Explora la ciudad',target:null});}}));
