import * as THREE from 'three';
import concrete from './assets/concrete.asset.json';
import normal from './assets/normal.asset.json';
import roughness from './assets/roughness.asset.json';
export const token=(name:string)=>getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export function loadMaterials(){const loader=new THREE.TextureLoader();const map=loader.load(concrete.url),n=loader.load(normal.url),r=loader.load(roughness.url);for(const t of [map,n,r]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,1);t.anisotropy=8;}map.colorSpace=THREE.SRGBColorSpace;return {
 concrete:new THREE.MeshStandardMaterial({color:token('--pr-concrete'),map,normalMap:n,roughnessMap:r,normalScale:new THREE.Vector2(.35,.35),roughness:.85}),
 dark:new THREE.MeshStandardMaterial({color:token('--pr-dark-concrete'),map,normalMap:n,roughnessMap:r,roughness:.85}),
 red:new THREE.MeshStandardMaterial({color:token('--pr-signal'),map,roughness:.55}),
  glass:new THREE.MeshPhysicalMaterial({color:token('--pr-glass'),metalness:.65,roughness:.12,clearcoat:1,clearcoatRoughness:.15}),
  trim:new THREE.MeshStandardMaterial({color:token('--pr-ink'),roughness:.4,metalness:.65}),
 signal:new THREE.MeshStandardMaterial({color:token('--pr-signal'),emissive:token('--pr-signal'),emissiveIntensity:.3}),
 paper:new THREE.MeshStandardMaterial({color:token('--pr-paper'),roughness:.6}),
 };}
export function signTexture(text:string,sub:string){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle=token('--pr-signal');ctx.fillRect(0,0,1024,256);ctx.fillStyle=token('--pr-paper');ctx.font='bold 110px Archivo, Arial';ctx.fillText(text,36,133);ctx.font='27px monospace';ctx.fillText(sub,40,209);}const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
