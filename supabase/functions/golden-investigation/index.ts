import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const operations=new Set(['state','unlock','answer','visit','notes','admin_state','admin_save','admin_card']);
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!service)return reply({error:'No se pudo conectar con el expediente.'},503);
  const bearer=req.headers.get('Authorization');if(!bearer?.startsWith('Bearer '))return reply({error:'Inicia sesión para abrir el expediente.',code:'auth'},401);
  const auth=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await auth.auth.getUser();if(authError||!user)return reply({error:'La sesión ha caducado.',code:'auth'},401);
  const raw=await req.text();if(raw.length>30000)return reply({error:'Solicitud demasiado grande.'},413);
  const {op,payload={}}=JSON.parse(raw);if(!operations.has(op)||!payload||typeof payload!=='object'||Array.isArray(payload))return reply({error:'Solicitud no válida.'},400);
  const client=createClient(url,service,{auth:{persistSession:false}});
  const {data,error}=await client.rpc('golden_service_action',{actor:user.id,op,payload});
  if(error){console.error('Investigation request failed',error.code);return reply({error:'No se pudo guardar. Vuelve a intentarlo.'},500);}
  return reply(data);
 }catch{return reply({error:'Revisa los datos introducidos.'},400);}
});