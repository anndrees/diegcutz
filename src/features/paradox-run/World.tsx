import {useMemo,useLayoutEffect,useRef,Suspense,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {loadMaterials,signTexture,token} from './materials';
import type {City,Entity,Vec3} from './types';
import {useRunStore} from './store';
import {architecturalGeometry} from './renderGeometry';
import {RaceNavigation} from './RaceNavigation';
import {BarberCollectible} from './BarberCollectibles';
import building from './assets/building.asset.json';
import industrial from './assets/industrial.asset.json';
import vent from './assets/vent.asset.json';
import light from './assets/light.asset.json';
const box=new THREE.BoxGeometry(1,1,1);
function Instances({items,material}:{items:{position:Vec3;size:Vec3;rotation?:Vec3}[];material:THREE.Material}){const ref=useRef<THREE.InstancedMesh>(null);useLayoutEffect(()=>{if(!ref.current)return;const o=new THREE.Object3D();items.forEach((e,i)=>{o.position.fromArray(e.position);o.scale.fromArray(e.size);o.rotation.set(...(e.rotation||[0,0,0]));o.updateMatrix();ref.current?.setMatrixAt(i,o.matrix);});ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();},[items]);return <instancedMesh ref={ref} args={[box,material,items.length]} castShadow receiveShadow/>;}
function Architecture({entities,material}:{entities:Entity[];material:THREE.Material}){const geometry=useMemo(()=>architecturalGeometry(entities),[entities]);useEffect(()=>()=>geometry?.dispose(),[geometry]);return geometry?<mesh geometry={geometry} material={material} castShadow receiveShadow/>:null;}
function SourceInstances({url,placements,tint}:{url:string;placements:{position:Vec3;scale:Vec3}[];tint?:string}){const {scene}=useGLTF(url);const geometries=useMemo(()=>{scene.updateWorldMatrix(true,true);const list:THREE.BufferGeometry[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh){let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();g.deleteAttribute('color');g.deleteAttribute('skinIndex');g.deleteAttribute('skinWeight');list.push(g);}});const merged=mergeGeometries(list);list.forEach(g=>g.dispose());return merged;},[scene]);const material=useMemo(()=>new THREE.MeshStandardMaterial({color:tint||token('--pr-dark-concrete'),roughness:.72,metalness:.1}),[tint]);const ref=useRef<THREE.InstancedMesh>(null);useLayoutEffect(()=>{if(!ref.current)return;const o=new THREE.Object3D();placements.forEach((p,i)=>{o.position.fromArray(p.position);o.scale.fromArray(p.scale);o.updateMatrix();ref.current?.setMatrixAt(i,o.matrix);});ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();},[placements]);useEffect(()=>()=>{geometries?.dispose();material.dispose();},[geometries,material]);return geometries?<instancedMesh ref={ref} args={[geometries,material,placements.length]} castShadow receiveShadow/>:null;}
function ArchitectureDetails({entities,materials}:{entities:Entity[];materials:ReturnType<typeof loadMaterials>}){
 const details=useMemo(()=>{
  const seams:{position:Vec3;size:Vec3;rotation:Vec3}[]=[],ribs:typeof seams=[],glass:typeof seams=[],marks:typeof seams=[];
  for(const e of entities){
   const [w,h,d]=e.size,q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...e.rotation)),origin=new THREE.Vector3().fromArray(e.position);
   const put=(list:typeof seams,p:Vec3,size:Vec3)=>list.push({position:new THREE.Vector3().fromArray(p).applyQuaternion(q).add(origin).toArray() as Vec3,size,rotation:e.rotation});
   if(h>=5&&w>=10){
    for(let fy=-h/2+3;fy<h/2;fy+=3){put(seams,[0,fy,d/2+.05],[w,.035,.035]);put(seams,[w/2+.05,fy,0],[.035,.035,d]);}
    for(let fx=-w/2+1;fx<w/2;fx+=2){put(ribs,[fx,0,-d/2-.17],[.18,h,.25]);if(h>20){put(glass,[fx,0,d/2+.085],[1.1,h-4,.035]);put(seams,[fx-.58,0,d/2+.09],[.045,h-4,.05]);put(seams,[fx+.58,0,d/2+.09],[.045,h-4,.05]);}}
   }
   for(const n of e.gravity||[]){
    const axis=n.findIndex(v=>Math.abs(v)>.9);if(axis<0)continue;
    const tangent=axis===0?2:0,remaining=[0,1,2].find(i=>i!==axis&&i!==tangent);if(remaining===undefined)continue;
    const p:Vec3=[0,0,0];p[axis]=n[axis]*(e.size[axis]/2+.07);const size:Vec3=[.1,.1,.1];size[tangent]=Math.max(.3,e.size[tangent]-1);size[axis]=.06;size[remaining]=.18;
    for(const sign of [-1,1]){const pos=[...p] as Vec3;pos[remaining]=sign*Math.max(0,e.size[remaining]/2-.45);put(marks,pos,size);}
   }
  }
  return {seams,ribs,glass,marks};
 },[entities]);
 return <><Instances items={details.seams} material={materials.trim}/><Instances items={details.ribs} material={materials.concrete}/><Instances items={details.glass} material={materials.glass}/><Instances items={details.marks} material={materials.signal}/></>;
}
function Sign({position,text,sub}:{position:Vec3;text:string;sub:string}){const t=useMemo(()=>signTexture(text,sub),[text,sub]);useEffect(()=>()=>t.dispose(),[t]);return <mesh position={position}><planeGeometry args={[12,3]}/><meshBasicMaterial map={t} side={THREE.DoubleSide}/></mesh>;}
function Markers({city}:{city:City}){const found=useRunStore(s=>s.save.secrets);return <>
 {city.races.map((r,i)=><group key={r.id} position={r.start.position}><mesh rotation-x={-Math.PI/2} position-y={-.8}><ringGeometry args={[1.8,2.2,48]}/><meshBasicMaterial color={token('--pr-signal')} side={THREE.DoubleSide}/></mesh><mesh position-y={1.2}><boxGeometry args={[.1,4,.1]}/><meshBasicMaterial color={token('--pr-signal')}/></mesh></group>)}
 <RaceNavigation city={city}/>
 {city.secrets.filter(s=>!found.includes(`${city.id}:${s.id}`)).map((s,i)=><BarberCollectible key={s.id} position={s.position} kind={s.kind||(['pole','scissors','clipper'] as const)[i%3]}/>)}
 </>;}
export function World({city,onSelect}:{city:City;onSelect?:(id:string)=>void}){const materials=useMemo(loadMaterials,[]);useEffect(()=>()=>{Object.values(materials).forEach(m=>{m.map?.dispose();m.normalMap?.dispose();m.roughnessMap?.dispose();m.dispose();});},[materials]);const skyline=useMemo(()=>Array.from({length:35},(_,i)=>({position:[-65+i*10,-18,-75-(i%4)*15]as Vec3,scale:[9+(i%3)*2,9+(i%5)*4,9+(i%3)*2]as Vec3})),[]);const lights=useMemo(()=>Array.from({length:15},(_,i)=>({position:[-25+i*18,0,24]as Vec3,scale:[2,2,2]as Vec3})),[]);const vents=useMemo(()=>city.entities.filter(e=>e.size[1]>5&&e.size[0]>10).map(e=>({position:[e.position[0]-e.size[0]/3,e.position[1]+e.size[1]/2,e.position[2]-e.size[2]/3]as Vec3,scale:[2,2,2]as Vec3})),[city]);return <>
 {(['concrete','dark','red','glass']as const).map(kind=><Architecture key={kind} entities={city.entities.filter(e=>e.kind===kind)} material={materials[kind]}/>)}
 <ArchitectureDetails entities={city.entities} materials={materials}/>
 <Suspense fallback={null}><SourceInstances url={building.url} placements={skyline}/><SourceInstances url={industrial.url} placements={[{position:[-50,-12,35],scale:[12,12,12]},{position:[265,-12,-45],scale:[15,15,15]}]}/><SourceInstances url={light.url} placements={lights}/><SourceInstances url={vent.url} placements={vents}/></Suspense>
 <mesh rotation-x={-Math.PI/2} position={[110,-20,0]} receiveShadow><planeGeometry args={[1000,1000]}/><primitive object={materials.dark} attach="material"/></mesh>
 <Sign position={[0,10,-27.7]} text="PARADOX RUN" sub="DIEGCUTZ / NO HAY UN ÚNICO SUELO"/>
 <Sign position={[87,19,-26.8]} text="02 / TERRAZAS" sub="SIGUE EL IMPULSO / CAMBIA EL EJE"/>
 <Sign position={[-20,4,28.7]} text="NO CORTES CAMINO" sub="EL SUELO TAMBIÉN NECESITA UN DEGRADADO"/>
 <Sign position={[120,26,-24.8]} text="0529 / ARCHIVO" sub="LAS TIJERAS NUNCA SALIERON POR MENSAJERÍA"/>
 <Sign position={[207,45,-4.8]} text="03 / VÉRTICE" sub="ARRIBA ES UNA DECISIÓN"/>
 <Markers city={city}/>
 {onSelect&&city.entities.map(e=><mesh key={e.id} position={e.position} rotation={e.rotation} onClick={event=>{event.stopPropagation();onSelect(e.id);}} visible={false}><boxGeometry args={e.size}/><meshBasicMaterial/></mesh>)}
 </>;}
