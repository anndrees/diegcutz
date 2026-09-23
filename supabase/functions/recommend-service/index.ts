import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/ai-gateway.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-lovable-aig-run-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};

type TimeRange = { start: string; end: string };

const hoursFromRanges = (ranges: TimeRange[]) => {
  const hours: number[] = [];
  for (const range of ranges || []) {
    const start = parseInt(String(range?.start || "").split(":")[0]);
    const end = parseInt(String(range?.end || "").split(":")[0]);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    for (let h = start; h < end; h++) hours.push(h);
  }
  return [...new Set(hours)].sort((a, b) => a - b);
};

const madridNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return Response.json({ message: "La recomendación inteligente no está configurada." }, { status: 401, headers: cors });
    const auth = request.headers.get("Authorization");
    if (!auth) return Response.json({ message: "Inicia sesión para pedir una recomendación." }, { status: 401, headers: cors });

    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_ANON_KEY") || "", { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ message: "La sesión ha caducado." }, { status: 401, headers: cors });

    const body = await request.json().catch(() => ({}));
    const description = String(body.description || "").trim().slice(0, 600);
    const preferences = String(body.preferences || "").trim().slice(0, 300);
    if (description.length < 10) return Response.json({ message: "Cuéntanos un poco más sobre el estilo o la ocasión." }, { status: 400, headers: cors });

    const today = madridNow();
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 14);

    const [{ data: profile }, { data: services }, { data: businessHours }, { data: specialHours }, { data: bookings }] = await Promise.all([
      supabase.from("profiles").select("is_banned,is_restricted").eq("id", user.id).maybeSingle(),
      supabase.from("services").select("id,name,description,price,service_type,coming_soon").eq("coming_soon", false),
      supabase.from("business_hours").select("day_of_week,is_closed,is_24h,time_ranges"),
      supabase.from("special_hours").select("date,is_closed,time_ranges").gte("date", dateKey(today)).lte("date", dateKey(horizon)),
      supabase.from("bookings").select("booking_date,booking_time").gte("booking_date", dateKey(today)).lte("booking_date", dateKey(horizon)).or("is_cancelled.is.null,is_cancelled.eq.false"),
    ]);

    if (profile?.is_banned || profile?.is_restricted) return Response.json({ message: "Tu cuenta no puede usar esta función ahora mismo." }, { status: 403, headers: cors });
    if (!services?.length) return Response.json({ message: "Todavía no hay servicios disponibles para recomendar." }, { status: 400, headers: cors });

    const booked = new Set((bookings || []).map((b) => `${b.booking_date}_${b.booking_time}`));
    const slots: { date: string; time: string; label: string }[] = [];
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

    for (let offset = 0; offset < 14 && slots.length < 60; offset++) {
      const day = new Date(today);
      day.setDate(today.getDate() + offset);
      const key = dateKey(day);
      const special = (specialHours || []).find((s) => s.date === key);
      let hours: number[] = [];
      if (special) {
        if (special.is_closed) continue;
        hours = hoursFromRanges((special.time_ranges as TimeRange[]) || []);
      } else {
        const regular = (businessHours || []).find((b) => b.day_of_week === day.getDay());
        if (!regular || regular.is_closed) continue;
        hours = regular.is_24h ? Array.from({ length: 24 }, (_, i) => i) : hoursFromRanges((regular.time_ranges as TimeRange[]) || []);
      }
      for (const hour of hours) {
        if (offset === 0 && hour <= today.getHours()) continue;
        const time = `${String(hour).padStart(2, "0")}:00`;
        if (booked.has(`${key}_${time}`) || booked.has(`${key}_${time}:00`)) continue;
        slots.push({ date: key, time, label: `${days[day.getDay()]} ${day.getDate()}/${day.getMonth() + 1} a las ${time}` });
        if (slots.length >= 60) break;
      }
    }

    const catalogue = services.map((s) => `${s.id} | ${s.name} | ${s.price}€ | ${s.description || "Sin descripción"}`).join("\n");
    const slotList = slots.length ? slots.map((s) => `${s.date} ${s.time} (${s.label})`).join("\n") : "SIN HUECOS DISPONIBLES";

    const run = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
    const lovable = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: run.fetch });

    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      system: [
        "Eres el asesor profesional de DIEGCUTZ, barbería en España.",
        "Recomienda exactamente un servicio del catálogo y, si hay huecos, una cita de la lista de huecos disponibles que encaje con las preferencias de día y hora del cliente.",
        "Responde SOLO con un objeto JSON válido, sin markdown, con esta forma:",
        '{"message":"dos frases en español, tono adulto y cercano","serviceId":"uuid del catálogo","slot":{"date":"YYYY-MM-DD","time":"HH:MM"} o null}',
        "Nunca inventes servicios, precios ni huecos que no estén en las listas.",
      ].join(" "),
      prompt: `CATÁLOGO:\n${catalogue}\n\nHUECOS DISPONIBLES:\n${slotList}\n\nCLIENTE:\n${description}\n\nPREFERENCIAS DE DÍA Y HORA:\n${preferences || "Sin preferencias indicadas"}`,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });

    const raw = await result.text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    let parsed: { message?: string; serviceId?: string; slot?: { date?: string; time?: string } | null } = {};
    if (jsonMatch) { try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = {}; } }

    const serviceId = services.some((s) => s.id === parsed.serviceId) ? parsed.serviceId : undefined;
    const slotDate = parsed.slot?.date;
    const slotTime = parsed.slot?.time?.slice(0, 5);
    const slot = slots.find((s) => s.date === slotDate && s.time === slotTime) || null;

    return Response.json({
      message: parsed.message?.trim() || raw.replace(/\{[\s\S]*\}/, "").trim() || "Esta es nuestra recomendación para ti.",
      serviceId: serviceId || null,
      serviceName: services.find((s) => s.id === serviceId)?.name || null,
      slot,
      hasSlots: slots.length > 0,
    }, { headers: cors });
  } catch (error) {
    console.error("recommend-service", error);
    return Response.json({ message: "No hemos podido completar la recomendación. Inténtalo de nuevo en unos minutos." }, { status: 500, headers: cors });
  }
});
