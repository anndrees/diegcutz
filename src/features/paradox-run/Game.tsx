import {Component,Suspense,useEffect,useState,useRef} from 'react';
import {Canvas} from '@react-three/fiber';
import {Environment,Lightformer,useProgress} from '@react-three/drei';
import {Link} from 'react-router-dom';
import {World} from './World';
import {Runtime} from './Runtime';
import {UI} from './UI';
import {useRunStore} from './store';
import {initPhysics} from './physics';
import {runAudio} from './audio';
import {token} from './materials';
import {useEditor,EditorScene,EditorPanel} from './Editor';
import {parseCity} from './rules';
import './paradox.css';
function Progress(){const {active,progress}=useProgress();return active?<div className="pr-loader">CARGANDO CIUDAD / {Math.round(progress)}%</div>:null;}
class GraphicsBoundary extends Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="pr-gate"><div className="pr-gate-inner"><h1>PARADOX RUN</h1><p>No se pudo abrir la ciudad. Recarga la página y comprueba que la aceleración gráfica está activada.</p><Link to="/">Volver a DIEGCUTZ</Link></div></div>:this.props.children;}}
export default function Game(){const [ready,setReady]=useState(false),[error,setError]=useState(false),s=useRunStore(),editor=useEditor(),container=useRef<HTMLDivElement>(null);useEffect(()=>{let active=true;initPhysics().then(()=>{if(active)setReady(true);}).catch(()=>setError(true));const title=document.title;document.title='PARADOX RUN / DIEGCUTZ';return()=>{active=false;document.title=title;runAudio.dispose();document.exitPointerLock();};},[]);const city=s.screen==='editor'?editor.city:s.city;
 function start(race?:string){runAudio.init(s.save.settings.volume);s.start(race);const canvas=container.current?.querySelector('canvas');void canvas?.requestPointerLock();}
 if(error)return <div className="pr-gate"><p>No se pudo cargar el motor del juego. <Link to="/">Volver a DIEGCUTZ</Link></p></div>;
 return <GraphicsBoundary><main className="pr-app" ref={container} data-screen={s.screen}><Canvas shadows={s.save.settings.quality==='high'} dpr={s.save.settings.quality==='high'?[1,1.5]:1} camera={{position:[-26,10,32],fov:78,near:.08,far:600}} gl={{antialias:true}}><color attach="background" args={[token('--pr-sky')]}/><fog attach="fog" args={[token('--pr-sky'),110,450]}/><ambientLight intensity={.65}/><hemisphereLight args={[token('--pr-sky'),token('--pr-ground'),1.5]}/><directionalLight position={[30,90,25]} intensity={2.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-100} shadow-camera-right={260} shadow-camera-top={80} shadow-camera-bottom={-80} shadow-camera-far={240} shadow-bias={-.0005}/><Environment resolution={64}><Lightformer intensity={1} position={[0,50,0]} rotation-x={Math.PI/2} scale={[200,200,1]}/><Lightformer intensity={.4} color={token('--pr-sky')} position={[-40,10,0]} rotation-y={Math.PI/2} scale={[80,30,1]}/></Environment><World city={city}/>{ready&&s.screen!=='editor'&&<Runtime key={s.city.id+JSON.stringify(s.city.entities).length} city={s.city}/>} {s.screen==='editor'&&<EditorScene editor={editor}/>}</Canvas>{ready?<UI start={start} onEditor={()=>s.setScreen('editor')}/>:<div className="pr-loader">PRÉPARANDO COLISIONES / CIUDAD 001</div>}<Progress/>{s.screen==='editor'&&<EditorPanel editor={editor} onTest={()=>{try{const city=parseCity(JSON.stringify(editor.city));city.id=`workshop-${city.id.replace(/^workshop-/,'')}`;runAudio.init(s.save.settings.volume);s.start(undefined,city);void container.current?.querySelector('canvas')?.requestPointerLock();}catch{editor.setError('Revisa tamaños, identificadores y orden de las medallas antes de probar');}}/>}</main></GraphicsBoundary>;
}
