import {useState} from 'react';
import {Delete,LockKeyhole} from 'lucide-react';
import {Button} from '@/components/ui/button';
export function Keypad({onUnlock,busy}:{onUnlock:(pin:string)=>void;busy:boolean}){
 const [pin,setPin]=useState('');
 function digit(n:string){if(busy)return;const next=(pin+n).slice(0,4);setPin(next);if(next.length===4){onUnlock(next);setPin('');}}
 return <section className="gs-keypad"><LockKeyhole size={28}/><p className="gs-kicker">ARCHIVO RESERVADO / PRUEBAS</p><h2>Abrir expediente</h2><div className="gs-pin" aria-label={`${pin.length} dígitos introducidos`}>{[0,1,2,3].map(i=><i key={i} data-filled={pin.length>i}/>)}</div><div className="gs-digits">{['1','2','3','4','5','6','7','8','9','','0','delete'].map((n,i)=>n===''?<span key={i}/>:<Button key={n} disabled={busy} variant="ghost" aria-label={n==='delete'?'Borrar último dígito':n} onClick={()=>n==='delete'?setPin(p=>p.slice(0,-1)):digit(n)}>{n==='delete'?<Delete/>:n}</Button>)}</div></section>;
}