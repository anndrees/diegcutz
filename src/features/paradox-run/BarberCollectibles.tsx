import {useMemo,useRef,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import {token} from './materials';
import type {Vec3} from './types';

export type BarberKind='pole'|'scissors'|'clipper';
export function BarberObject({kind,gold=false}:{kind:BarberKind;gold?:boolean}){
 const chrome=token(gold?'--pr-gold':'--pr-paper'),dark=token('--pr-ink');
 const stripe=useMemo(()=>{const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');if(ctx){ctx.fillStyle=token('--pr-paper');ctx.fillRect(0,0,256,512);for(let y=-256;y<768;y+=112){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y+128);ctx.lineTo(256,y+170);ctx.lineTo(0,y+42);ctx.closePath();ctx.fillStyle=token('--pr-signal');ctx.fill();}}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;},[]);
 useEffect(()=>()=>stripe.dispose(),[stripe]);
 if(kind==='pole')return <group>
  <mesh><cylinderGeometry args={[.22,.22,1.12,32]}/><meshStandardMaterial map={stripe} roughness={.23} metalness={.15}/></mesh>
  <mesh><cylinderGeometry args={[.235,.235,1.16,32]}/><meshPhysicalMaterial color={chrome} transparent opacity={.13} roughness={.08} metalness={.15} clearcoat={1} depthWrite={false}/></mesh>
  {[-1,1].map(n=><group key={n} position-y={n*.64}><mesh><cylinderGeometry args={[.31,.31,.12,32]}/><meshStandardMaterial color={chrome} roughness={.2} metalness={.95}/></mesh><mesh position-y={n*.08}><sphereGeometry args={[.22,24,16]}/><meshStandardMaterial color={chrome} roughness={.18} metalness={.95}/></mesh></group>)}
 </group>;
 if(kind==='clipper')return <group>
  <RoundedBox args={[.65,1.1,.32]} radius={.16} smoothness={3}><meshStandardMaterial color={dark} metalness={.45} roughness={.32}/></RoundedBox>
  <RoundedBox args={[.54,.93,.035]} radius={.08} smoothness={3} position={[0,.04,.17]}><meshStandardMaterial color={chrome} metalness={.92} roughness={.23}/></RoundedBox>
  <mesh position={[0,.59,0]}><boxGeometry args={[.71,.15,.34]}/><meshStandardMaterial color={chrome} metalness={.96} roughness={.16}/></mesh>
  {Array.from({length:11},(_,i)=><mesh key={i} position={[-.32+i*.064,.72,0]}><boxGeometry args={[.037,.18,.29]}/><meshStandardMaterial color={chrome} metalness={.98} roughness={.17}/></mesh>)}
  <mesh position={[.31,-.1,0]}><boxGeometry args={[.05,.2,.15]}/><meshStandardMaterial color={token('--pr-signal')} roughness={.35}/></mesh>
  {[-1,1].map(n=><mesh key={n} position={[n*.16,.36,.197]} rotation-x={Math.PI/2}><cylinderGeometry args={[.027,.027,.015,12]}/><meshStandardMaterial color={dark} metalness={.8} roughness={.2}/></mesh>)}
 </group>;
 const blade=new THREE.Shape();blade.moveTo(0,0);blade.lineTo(.07,.88);blade.quadraticCurveTo(.12,1.07,.16,1.14);blade.lineTo(.18,.15);blade.lineTo(.12,0);blade.closePath();
 return <group rotation-z={-.3}>
  {[-1,1].map(n=><group key={n} rotation-z={n*.22}>
   <mesh><extrudeGeometry args={[blade,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:2,steps:1}]}/><meshStandardMaterial color={chrome} metalness={.98} roughness={.18}/></mesh>
   <mesh position={[.08,-.25,.02]}><capsuleGeometry args={[.032,.45,6,10]}/><meshStandardMaterial color={chrome} metalness={.98} roughness={.2}/></mesh>
   <mesh position={[.08,-.56,.02]}><torusGeometry args={[.15,.035,10,30]}/><meshStandardMaterial color={chrome} metalness={.98} roughness={.18}/></mesh>
  </group>)}
  <mesh position={[.08,.03,.06]} rotation-x={Math.PI/2}><cylinderGeometry args={[.052,.052,.05,16]}/><meshStandardMaterial color={dark} metalness={.8} roughness={.22}/></mesh>
 </group>;
}
export function BarberCollectible({position,kind}:{position:Vec3;kind:BarberKind}){
 const ref=useRef<THREE.Group>(null);
 useFrame(({clock},raw)=>{if(ref.current){ref.current.rotation.y+=Math.min(raw,.05)*.6;ref.current.position.y=position[1]+Math.sin(clock.elapsedTime*1.8)*.14;}});
 return <group ref={ref} position={position} scale={.85}><BarberObject kind={kind}/><mesh position-y={-.95} rotation-x={-Math.PI/2}><ringGeometry args={[.45,.48,32]}/><meshBasicMaterial color={token('--pr-volt')} side={THREE.DoubleSide}/></mesh></group>;
}