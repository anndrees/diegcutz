import {useMemo,useRef,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {useRunStore} from './store';
import {token,signTexture} from './materials';
import type {City} from './types';

export function raceTarget(city:City,raceId:string|null,index:number){
 const race=city.races.find(r=>r.id===raceId),checkpoint=race?.checkpoints[index];
 return checkpoint&&race?{checkpoint,finish:index===race.checkpoints.length-1}:null;
}
export function RaceNavigation({city}:{city:City}){
 const screen=useRunStore(s=>s.screen),raceId=useRunStore(s=>s.raceId),index=useRunStore(s=>s.checkpoint);
 const target=raceTarget(city,raceId,index),arrow=useRef<THREE.Group>(null),{camera}=useThree();
 const finishTexture=useMemo(()=>signTexture('META','DIEGCUTZ / FIN DEL RECORRIDO'),[]);
 const checker=useMemo(()=>{
  const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');
  if(ctx)for(let x=0;x<16;x++)for(let y=0;y<4;y++){ctx.fillStyle=token((x+y)%2?'--pr-ink':'--pr-paper');ctx.fillRect(x*16,y*16,16,16);}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
 },[]);
 useEffect(()=>()=>{finishTexture.dispose();checker.dispose();},[finishTexture,checker]);
 useFrame((_,raw)=>{
  if(!arrow.current||!target)return;
  const offset=new THREE.Vector3(.62,-.5,-2.5).applyQuaternion(camera.quaternion);
  arrow.current.position.copy(camera.position).add(offset);
  const direction=new THREE.Vector3().fromArray(target.checkpoint.position).sub(arrow.current.position).normalize();
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
  arrow.current.quaternion.slerp(q,1-Math.exp(-18*Math.min(raw,.05)));
 });
 if(!target||screen!=='playing')return null;
 const cp=target.checkpoint,orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3().fromArray(cp.up));
 return <>
  <group ref={arrow} scale={.22} renderOrder={100}>
   <mesh position-y={.3}><coneGeometry args={[.38,.65,5]}/><meshStandardMaterial color={token('--pr-signal')} emissive={token('--pr-signal')} emissiveIntensity={.6} metalness={.4} roughness={.25} depthTest={false}/></mesh>
   <mesh position-y={-.25}><cylinderGeometry args={[.11,.11,.6,10]}/><meshStandardMaterial color={token('--pr-paper')} metalness={.6} roughness={.22} depthTest={false}/></mesh>
  </group>
  <group position={cp.position} quaternion={orientation}>
   {target.finish?<>
    {[-1,1].map(sign=><mesh key={sign} position={[sign*(cp.radius+.4),1,0]}><boxGeometry args={[.25,5,.3]}/><meshStandardMaterial color={token('--pr-signal')} metalness={.5} roughness={.35}/></mesh>)}
    <mesh position-y={3.1}><boxGeometry args={[cp.radius*2+1,.8,.28]}/><meshStandardMaterial map={checker} roughness={.55}/></mesh>
    <mesh position={[0,4,.03]}><planeGeometry args={[5,1.25]}/><meshBasicMaterial map={finishTexture} side={THREE.DoubleSide}/></mesh>
    <mesh rotation-x={-Math.PI/2} position-y={-.72}><planeGeometry args={[cp.radius*2,1.2]}/><meshStandardMaterial map={checker} side={THREE.DoubleSide}/></mesh>
   </>:<mesh><torusGeometry args={[cp.radius,.09,8,48]}/><meshBasicMaterial color={token('--pr-signal')}/></mesh>}
   <Html center position={[0,target.finish?5:cp.radius+1,0]} zIndexRange={[3,0]}><span className="pr-beacon-label">{target.finish?'META':`CONTROL ${index+1}`}</span></Html>
  </group>
 </>;
}