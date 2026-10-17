import {useState,Suspense} from 'react';
import {Canvas} from '@react-three/fiber';
import {Environment,Lightformer,OrbitControls,Html} from '@react-three/drei';
import {Button} from '@/components/ui/button';
import {BarberObject} from '../paradox-run/BarberCollectibles';
import {token} from '../paradox-run/materials';
import '../paradox-run/paradox.css';
import './investigation.css';
export default function Room({onExit}:{onExit:()=>void}){
 const [selected,setSelected]=useState('scissors');
 const content={scissors:['Las tijeras recuperadas','La pieza ceremonial vuelve a su vitrina. La recuperación es ficticia; consulta tus deducciones resueltas para reconstruir el escondite.'],archive:['La cadena completa','Tu archivo conserva las pruebas y los razonamientos resueltos. El conjunto de documentos desmonta la coartada; ninguna sospecha aislada basta.'],letter:['Carta de Inés','Gracias por separar hechos y sospechas. Esta sala es el epílogo del caso. No hay premios ni descuentos activados.']} as const;
 const entry=content[selected as keyof typeof content];
 return <main className="gs-room"><Canvas shadows dpr={[1,1.4]} camera={{position:[0,3.5,7],fov:50}}><color attach="background" args={[token('--gs-dark')]}/><ambientLight intensity={.7}/><directionalLight position={[3,7,4]} intensity={2} castShadow/><Environment resolution={64}><Lightformer position={[0,6,0]} rotation-x={Math.PI/2} intensity={3} scale={8}/><Lightformer position={[-3,3,0]} rotation-y={Math.PI/2} intensity={2} scale={4}/></Environment><Suspense fallback={null}>
 <mesh rotation-x={-Math.PI/2} receiveShadow><planeGeometry args={[16,16]}/><meshStandardMaterial color={token('--gs-room-floor')} roughness={.8}/></mesh>
 {[-1,1].map(n=><mesh key={n} position={[n*5,3,-1]}><boxGeometry args={[.2,6,12]}/><meshStandardMaterial color={token('--gs-dark')} roughness={.7}/></mesh>)}
 <mesh position={[0,3,-5]}><boxGeometry args={[10,6,.3]}/><meshStandardMaterial color={token('--gs-dark')} roughness={.8}/></mesh>
 {[[-2.7,'archive'],[0,'scissors'],[2.7,'letter']].map(([x,id])=><group key={id} position={[Number(x),0,0]} onClick={()=>setSelected(String(id))}><mesh position-y={.6} castShadow><boxGeometry args={[1.65,1.2,1.65]}/><meshStandardMaterial color={token('--gs-dark')} metalness={.25} roughness={.6}/></mesh><mesh position-y={1.23}><boxGeometry args={[1.8,.06,1.8]}/><meshStandardMaterial color={token('--gs-gold')} metalness={.8} roughness={.2}/></mesh><group position-y={2.1}>{id==='scissors'?<BarberObject kind="scissors" gold/>:<mesh rotation-x={-.35}><boxGeometry args={[.8,1,.07]}/><meshStandardMaterial color={token('--gs-room-paper')} roughness={.75}/></mesh>}</group><Html position={[0,3,0]} center><span className="gs-room-label">{id==='scissors'?'LAS TIJERAS':id==='archive'?'RECONSTRUCCIÓN':'EPÍLOGO'}</span></Html></group>)}
 </Suspense><OrbitControls target={[0,1.5,0]} minDistance={4} maxDistance={10} maxPolarAngle={Math.PI/2.1} enablePan={false}/></Canvas><header><span>DC-0529 / SALA DE RECUPERACIÓN</span><Button variant="outline" onClick={onExit}>Cerrar sala</Button></header><section className="gs-room-info"><p className="gs-kicker">EXPEDIENTE CERRADO / 28 DEDUCCIONES</p><h2>{entry[0]}</h2><p>{entry[1]}</p>{Object.entries(content).map(([id,item])=><Button key={id} variant="outline" onClick={()=>setSelected(id)}>{item[0]}</Button>)}</section></main>;
}