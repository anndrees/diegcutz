import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Props={onSelect:(id:string)=>void; services:{id:string;name:string}[]};
export function StyleAdvisor({onSelect,services}:Props){
 const [description,setDescription]=useState(""); const [loading,setLoading]=useState(false); const [answer,setAnswer]=useState(""); const [error,setError]=useState(""); const [selected,setSelected]=useState<string|null>(null);
 const recommend=async()=>{if(description.trim().length<10){setError("Cuéntanos un poco más sobre la ocasión o el estilo que buscas.");return} setLoading(true);setError("");setAnswer("");
  try{const {data:{session}}=await supabase.auth.getSession(); if(!session) throw new Error("Inicia sesión para pedir una recomendación.");
   const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-service`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`,apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({description})});
   const text=await response.text(); if(!response.ok){let message=text;try{message=JSON.parse(text).message||text}catch{}throw new Error(message||"No se pudo obtener la recomendación.")}
   const match=text.match(/RECOMMENDATION_ID:\s*([0-9a-f-]{36})/i); const id=match?.[1]; const clean=text.replace(/RECOMMENDATION_ID:.*$/im,"").trim(); setAnswer(clean||"Esta es nuestra recomendación para ti.");
   if(id&&services.some(s=>s.id===id)){setSelected(id);onSelect(id)}
  }catch(e){setError(e instanceof Error?e.message:"No se pudo obtener la recomendación.")}finally{setLoading(false)}};
 return <div className="noir-glass rounded-lg p-5 md:p-6 mb-6"><div className="flex items-start gap-3 mb-4"><Sparkles className="text-primary mt-1"/><div><p className="customer-kicker">ASESOR DE ESTILO</p><h3 className="text-xl">Encuentra el corte adecuado</h3><p className="text-sm text-muted-foreground mt-1">Describe la ocasión, tu estilo habitual o el cambio que buscas.</p></div></div><Textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,600))} placeholder="Por ejemplo: tengo una boda, quiero verme elegante pero mantener un acabado moderno..." className="min-h-24 resize-none"/><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{description.length}/600</span><Button type="button" variant="premium" onClick={recommend} disabled={loading}>{loading?<Loader2 className="animate-spin"/>:<Sparkles/>}{loading?"Pensando...":"Recomendarme"}</Button></div>{answer&&<div className="mt-4 border-l border-primary pl-4"><p className="text-sm leading-relaxed">{answer}</p>{selected&&<p className="mt-2 text-xs text-primary flex items-center gap-1"><Check className="h-3 w-3"/>Servicio seleccionado; puedes cambiarlo abajo.</p>}</div>}{error&&<p className="mt-3 text-sm text-destructive">{error}</p>}</div>}
