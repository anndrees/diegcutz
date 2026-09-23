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
   const text=await response.text(); if(!response.ok){let message=text;try{const parsed=JSON.parse(text) as {message?:string};message=parsed.message||text}catch(parseError){console.warn("Respuesta no JSON del asesor",parseError)}throw new Error(message||"No se pudo obtener la recomendación.")}
   const match=text.match(/RECOMMENDATION_ID:\s*([0-9a-f-]{36})/i); const id=match?.[1]; const clean=text.replace(/RECOMMENDATION_ID:.*$/im,"").trim(); setAnswer(clean||"Esta es nuestra recomendación para ti.");
   if(id&&services.some(s=>s.id===id)){setSelected(id);onSelect(id)}
  }catch(e){setError(e instanceof Error?e.message:"No se pudo obtener la recomendación.")}finally{setLoading(false)}};
 return <div className="style-advisor border border-border bg-card p-5 md:p-7 mb-6"><div className="grid sm:grid-cols-[3rem_1fr] gap-4 mb-5"><div className="w-10 h-10 border border-primary flex items-center justify-center"><Sparkles className="text-primary h-4 w-4"/></div><div><p className="customer-kicker">ASESOR DE ESTILO / IA</p><h3 className="text-2xl mt-2">Encuentra el corte adecuado</h3><p className="text-sm text-muted-foreground mt-1">Describe la ocasión, tu estilo habitual o el cambio que buscas.</p></div></div><Textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,600))} placeholder="Por ejemplo: tengo una boda, quiero verme elegante pero mantener un acabado moderno..." className="min-h-24 resize-none"/><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{description.length}/600</span><Button type="button" variant="premium" onClick={recommend} disabled={loading}>{loading?<Loader2 className="animate-spin"/>:<Sparkles/>}{loading?"Pensando...":"Recomendarme"}</Button></div>{answer&&<div className="mt-4 border-l border-primary pl-4"><p className="text-sm leading-relaxed">{answer}</p>{selected&&<p className="mt-2 text-xs text-primary flex items-center gap-1"><Check className="h-3 w-3"/>Servicio seleccionado; puedes cambiarlo abajo.</p>}</div>}{error&&<p className="mt-3 text-sm text-destructive">{error}</p>}</div>}
