import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface Caller {
  id: string;
  isAdmin: boolean;
}

/**
 * Identity always comes from a validated session token, never from the request body.
 * Admin status always comes from public.user_roles, never from the client.
 */
export async function getCaller(req: Request, admin: SupabaseClient): Promise<Caller | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return { id: data.user.id, isAdmin: !!role };
}

/** Returns an error response when the caller is not a verified admin, otherwise null. */
export async function requireAdmin(req: Request, admin: SupabaseClient): Promise<Response | null> {
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Necesitas iniciar sesión." }, 401);
  if (!caller.isAdmin) return json({ error: "No tienes permiso para esta acción." }, 403);
  return null;
}
