import {assertEquals} from 'https://deno.land/std@0.224.0/assert/mod.ts';
const url=Deno.env.get('SUPABASE_URL')||Deno.env.get('VITE_SUPABASE_URL');
const anon=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');
function env(){if(!url||!anon)throw Error('Supabase test environment required');return {url,anon};}
Deno.test('investigation refuses signed-out requests instead of exposing progress',async()=>{
 const e=env();const response=await fetch(`${e.url}/functions/v1/golden-investigation`,{method:'POST',headers:{'Content-Type':'application/json',apikey:e.anon},body:JSON.stringify({op:'state'})});
 assertEquals(response.status,401);const body=await response.json();assertEquals(body.code,'auth');assertEquals(body.chapters,undefined);
});
Deno.test('anonymous clients cannot retrieve the chapter answer bank',async()=>{
 const e=env();const r=await fetch(`${e.url}/rest/v1/golden_chapters?select=content`,{headers:{apikey:e.anon,Authorization:`Bearer ${e.anon}`}});await r.text();assertEquals(r.status,401);
});
Deno.test('anonymous clients cannot impersonate an investigator through the service routine',async()=>{
 const e=env();const r=await fetch(`${e.url}/rest/v1/rpc/golden_service_action`,{method:'POST',headers:{apikey:e.anon,Authorization:`Bearer ${e.anon}`,'Content-Type':'application/json'},body:JSON.stringify({actor:'00000000-0000-0000-0000-000000000000',op:'state',payload:{}})});await r.text();assertEquals(r.status,401);
});