import { useEffect, useRef, useState } from "react";
import { Crown, Diamond, Flame, Rocket, Scissors, Sparkles, Zap } from "lucide-react";

const SEQUENCE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a", "Enter"];
const SYMBOLS = [Scissors, Flame, Diamond, Zap, Crown, Sparkles, Rocket];
type Particle = { id:number; left:number; delay:number; duration:number; symbol:number; size:number; drift:number };

export function KonamiCode() {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const index = useRef(0);

  const trigger = () => {
    if (active) return;
    setParticles(Array.from({ length: 54 }, (_, item) => ({ id:Date.now()+item, left:Math.random()*100, delay:Math.random()*1.2, duration:2.5+Math.random()*2.5, symbol:Math.floor(Math.random()*SYMBOLS.length), size:16+Math.random()*26, drift:(Math.random()-.5)*200 })));
    setActive(true);
    document.documentElement.classList.add("konami-rave");
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext:typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      [523.25,659.25,783.99,1046.5].forEach((frequency,note) => { const oscillator=context.createOscillator(); const gain=context.createGain(); oscillator.type="square"; oscillator.frequency.value=frequency; gain.gain.value=.04; oscillator.connect(gain); gain.connect(context.destination); oscillator.start(context.currentTime+note*.12); oscillator.stop(context.currentTime+note*.12+.12); });
    } catch { /* Audio is optional. */ }
    window.setTimeout(() => { setActive(false); setParticles([]); document.documentElement.classList.remove("konami-rave"); }, 6000);
  };

  useEffect(() => {
    const handler = (event:KeyboardEvent) => {
      const target=event.target as HTMLElement|null;
      if(target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||target.isContentEditable)) return;
      const expected=SEQUENCE[index.current]; const key=expected.length===1?event.key.toLowerCase():event.key;
      if(key===(expected.length===1?expected.toLowerCase():expected)){ index.current++; if(index.current===SEQUENCE.length){index.current=0;trigger();} }
      else index.current=key===SEQUENCE[0]?1:0;
    };
    window.addEventListener("keydown",handler); return()=>window.removeEventListener("keydown",handler);
  });

  if(!active) return null;
  return <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"><div className="absolute inset-0 konami-flash" />{particles.map(p=>{const Symbol=SYMBOLS[p.symbol];return <span key={p.id} className="absolute top-[-10%] konami-particle text-primary" style={{left:`${p.left}%`,animationDelay:`${p.delay}s`,animationDuration:`${p.duration}s`,"--drift":`${p.drift}px`} as React.CSSProperties}><Symbol style={{width:p.size,height:p.size}} /></span>})}<div className="absolute inset-0 flex items-center justify-center"><div className="konami-title border border-primary bg-background/95 px-8 py-7 text-center"><Scissors className="mx-auto mb-4 h-8 w-8 text-primary"/><div className="text-5xl md:text-8xl font-display font-semibold tracking-[-.06em]">DIEGCUTZ</div><div className="mt-3 text-xs font-bold uppercase tracking-[.3em] text-primary">Modo secreto desbloqueado</div></div></div></div>;
}