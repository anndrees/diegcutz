import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { desktopAllowed } from './data';
const Game = lazy(() => import('./Game'));
export default function TiltFadeRoute() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => { const check = () => setAllowed(desktopAllowed(innerWidth, matchMedia('(any-pointer: fine)').matches, matchMedia('(any-hover: hover)').matches, /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && !matchMedia('(pointer: fine)').matches))); check(); addEventListener('resize', check); return () => removeEventListener('resize', check); }, []);
  if (!allowed) return <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8"><div className="max-w-md"><p className="font-mono text-sm mb-4">DIEGCUTZ / SOLO PC</p><h1 className="font-black text-5xl">TILT & FADE</h1><p className="my-6">El pinball del estudio se juega en ordenador. No está disponible en móviles ni tablets.</p><Link className="underline" to="/">Volver a DIEGCUTZ</Link></div></main>;
  return <Suspense fallback={<main className="min-h-screen bg-background flex items-center justify-center">Preparando TILT & FADE…</main>}><Game /></Suspense>;
}