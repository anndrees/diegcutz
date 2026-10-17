import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {ArrowLeft,Play,Flag,Lock} from 'lucide-react';
import {useRunStore} from './store';
import {formatTime,medalFor,worldSignature} from './rules';
import {recordKey} from './persistence';
import type {Race} from './types';
const MEDALS=['ORO','PLATA','BRONCE'];
// Difficulty grows with the race order; route preview draws checkpoints projected on the city plan.
function Route({race}:{race:Race}){const pts=[race.start,...race.checkpoints].map(c=>c.position);const xs=pts.map(p=>p[0]),zs=pts.map(p=>p[2]);const minX=Math.min(...xs)-8,minZ=Math.min(...zs)-8,w=Math.max(...xs)-minX+8,h=Math.max(...zs)-minZ+8;return <svg className="pr-level-route" viewBox={`${minX} ${minZ} ${w} ${h}`} preserveAspectRatio="xMidYMid meet"><polyline points={pts.map(p=>`${p[0]},${p[2]}`).join(' ')}/>{race.checkpoints.map((c,i)=><circle key={i} cx={c.position[0]} cy={c.position[2]} r={Math.max(w,h)/45} data-axis={c.up[1]!==1}/>)}<rect x={race.start.position[0]-2} y={race.start.position[2]-2} width="4" height="4"/></svg>;}
export function LevelSelect({start}:{start:(race?:string)=>void}){const s=useRunStore();const sig=worldSignature(s.city);const [index,setIndex]=useState(0);const races=s.city.races;const race=races[index];
 const best=(r:Race)=>{const b=s.save.records[recordKey(s.city.id,r.id)];return b?.signature===sig?b:null;};
 const unlocked=(i:number)=>i===0||Boolean(best(races[i-1]))||i<races.length-1;
 const golds=races.filter(r=>{const b=best(r);return b&&b.time<=r.medals[0];}).length;
 const b=best(race),medal=b?medalFor(b.time,race.medals):null;
 return <section className="pr-levels"><header className="pr-levels-head"><div><div className="pr-eyebrow">Selección de nivel</div><h2>CONTRARRELOJES</h2></div><div className="pr-levels-score"><strong>{golds}<small>/{races.length}</small></strong><span>ORO</span></div><Button variant="ghost" onClick={()=>s.setScreen('menu')}><ArrowLeft/>Volver</Button></header>
 <div className="pr-levels-body"><ol className="pr-level-rail">{races.map((r,i)=>{const rb=best(r),open=unlocked(i);return <li key={r.id}><button type="button" disabled={!open} data-selected={i===index} onClick={()=>setIndex(i)} onDoubleClick={()=>open&&start(r.id)}><span className="pr-level-num">{String(i+1).padStart(2,'0')}</span><span className="pr-level-name"><small>{r.district}</small>{r.name}</span><span className="pr-level-state">{!open?<Lock/>:rb?formatTime(rb.time):'—'}</span></button></li>;})}</ol>
 <article className="pr-level-detail" key={race.id}><div className="pr-level-bignum">{String(index+1).padStart(2,'0')}</div><small className="pr-level-district">{race.district}</small><h3>{race.name}</h3><p>{race.description}</p>
 <div className="pr-level-stats"><div><small>Dificultad</small><span className="pr-level-bars">{races.map((_,i)=><i key={i} data-on={i<=index}/>)}</span></div><div><small>Controles</small><strong>{race.checkpoints.length}</strong></div><div><small>Cambios de eje</small><strong>{race.checkpoints.filter(c=>c.up[1]!==1).length}</strong></div><div><small>Mejor</small><strong>{b?formatTime(b.time):'SIN MARCA'}</strong></div></div>
 <Route race={race}/>
 <div className="pr-level-medals">{race.medals.map((m,i)=><div key={i} data-medal={i} data-earned={Boolean(b&&b.time<=m)}><i/><span>{MEDALS[i]}</span><strong>{m}s</strong></div>)}</div>
 <div className="pr-level-actions"><Button className="pr-primary" onClick={()=>start(race.id)}><Play/>Correr {medal?`/ ${medal}`:''}</Button>{b&&s.save.settings.ghost&&<span className="pr-level-ghost"><Flag/>Fantasma de tu mejor partida activo</span>}</div></article></div>
 <footer className="pr-levels-foot">↑ ↓ elegir · Doble clic para correr · Las seis carreras están dentro de la misma ciudad</footer></section>;}
