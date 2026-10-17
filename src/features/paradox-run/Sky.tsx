import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {token} from './materials';
// Procedural luminous sky: gradient, sun halo and drifting high clouds. Follows the camera so it never clips.
const vertex=`varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w;}`;
const fragment=`uniform vec3 zenith;uniform vec3 horizon;uniform vec3 haze;uniform vec3 sun;uniform vec3 sunDir;uniform float time;varying vec3 vDir;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){vec3 d=normalize(vDir);float y=max(d.y,0.);vec3 col=mix(horizon,zenith,pow(y,.55));col=mix(haze,col,smoothstep(-.05,.18,d.y));
float s=max(dot(d,normalize(sunDir)),0.);col+=sun*(pow(s,900.)*6.+pow(s,24.)*.35+pow(s,4.)*.12);
if(d.y>0.){vec2 uv=d.xz/(d.y+.12)*1.4+vec2(time*.004,time*.0015);float c=smoothstep(.52,.85,fbm(uv))*smoothstep(0.,.25,d.y);float streak=smoothstep(.6,.9,fbm(uv*vec2(.35,3.)+3.))*.45*smoothstep(.05,.4,d.y);vec3 cloud=mix(vec3(1.),sun,.25+pow(s,6.)*.6);col=mix(col,cloud,clamp(c*.75+streak,0.,.85));}
if(d.y<0.)col=mix(haze,horizon*.8,clamp(-d.y*3.,0.,1.));
gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export function Sky(){const ref=useRef<THREE.Mesh>(null);const uniforms=useMemo(()=>({zenith:{value:new THREE.Color(token('--pr-sky-zenith'))},horizon:{value:new THREE.Color(token('--pr-sky'))},haze:{value:new THREE.Color(token('--pr-sky-haze'))},sun:{value:new THREE.Color(token('--pr-sun'))},sunDir:{value:new THREE.Vector3(.35,.42,-.84)},time:{value:0}}),[]);
 useFrame(({camera},dt)=>{uniforms.time.value+=Math.min(dt,.05);ref.current?.position.copy(camera.position);});
 return <mesh ref={ref} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[500,48,24]}/><shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false}/></mesh>;}
