import { getCaller, json } from "../_shared/caller.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (typeof userId !== "string" || !userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Only the account owner or a verified admin may delete an account.
    const caller = await getCaller(req, supabaseAdmin);
    if (!caller) return json({ error: "Necesitas iniciar sesión." }, 401);
    if (caller.id !== userId && !caller.isAdmin) return json({ error: "No tienes permiso para esta acción." }, 403);

    // Delete from loyalty_rewards first
    await supabaseAdmin
      .from("loyalty_rewards")
      .delete()
      .eq("user_id", userId);

    // Delete from ratings
    await supabaseAdmin
      .from("ratings")
      .delete()
      .eq("user_id", userId);

    // Delete bookings
    await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("user_id", userId);

    // Delete profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    // Finally delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return new Response(
        JSON.stringify({ error: "Error al eliminar el usuario de autenticación", details: authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuario eliminado completamente" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
