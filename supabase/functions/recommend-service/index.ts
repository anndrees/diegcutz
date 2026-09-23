import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/ai-gateway.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-lovable-aig-run-id", "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID" };
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return Response.json({ message: "La recomendación inteligente no está configurada." }, { status: 401, headers: cors });
  const auth = request.headers.get("Authorization");
  if (!auth) return Response.json({ message: "Inicia sesión para pedir una recomendación." }, { status: 401, headers: cors });
  const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_ANON_KEY") || "", { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ message: "La sesión ha caducado." }, { status: 401, headers: cors });
  const [{ data: profile }, { data: services }] = await Promise.all([
    supabase.from("profiles").select("is_banned,is_restricted").eq("id", user.id).single(),
    supabase.from("services").select("id,name,description,price,service_type,coming_soon").eq("coming_soon", false),
  ]);
  if (profile?.is_banned || profile?.is_restricted) return Response.json({ message: "Tu cuenta no puede usar esta función ahora mismo." }, { status: 403, headers: cors });
  if (!services?.length) return Response.json({ message: "Todavía no hay servicios disponibles para recomendar." }, { status: 400, headers: cors });
  const body = await request.json().catch(() => ({}));
  const description = String(body.description || "").trim().slice(0, 600);
  if (description.length < 10) return Response.json({ message: "Cuéntanos un poco más sobre el estilo o la ocasión." }, { status: 400, headers: cors });
  const catalogue = services.map(s => `${s.id} | ${s.name} | ${s.description || "Sin descripción"}`).join("\n");
  const run = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const lovable = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: run.fetch });
  try {
    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      system: "Eres el asesor profesional de DIEGCUTZ. Recomienda exclusivamente uno de los servicios del catálogo. Responde en español, de forma adulta y breve: primero dos frases útiles y termina exactamente con una línea RECOMMENDATION_ID: seguida del UUID elegido. No inventes servicios ni precios.",
      prompt: `CATÁLOGO:\n${catalogue}\n\nCLIENTE:\n${description}`,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    const response = result.toTextStreamResponse({ headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });
    const runId = await run.waitForRunId(); const headers = new Headers(response.headers); if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    console.error("recommend-service", error);
    return Response.json({ message: "No hemos podido completar la recomendación. Inténtalo de nuevo en unos minutos." }, { status: 500, headers: cors });
  }
});
