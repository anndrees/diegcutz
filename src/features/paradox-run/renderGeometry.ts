import * as THREE from 'three';
import type {Entity} from './types';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Physical metres define texel density, independent of building dimensions.
export function architecturalGeometry(entities:Entity[]){
 const parts=entities.map(e=>{
  const g=new THREE.BoxGeometry(...e.size),p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');
  for(let i=0;i<p.count;i++){
   const axis=Math.abs(n.getX(i))>.5?0:Math.abs(n.getY(i))>.5?1:2;
   uv.setXY(i,(axis===0?p.getZ(i):p.getX(i))/3,(axis===1?p.getZ(i):p.getY(i))/3);
  }
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3().fromArray(e.position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...e.rotation)),new THREE.Vector3(1,1,1)));
  return g;
 });
 if(!parts.length)return null;
 const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());return merged;
}