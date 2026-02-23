import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { loyalty_token } = await req.json();

    if (!loyalty_token) {
      return new Response(
        JSON.stringify({ error: "Token no proporcionado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by loyalty token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username")
      .eq("loyalty_token", loyalty_token)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "QR no válido. Cliente no encontrado." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the most recent uncredited booking for this user
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id, booking_date, booking_time, total_price")
      .eq("user_id", profile.id)
      .eq("loyalty_credited", false)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .gte("total_price", 5)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get current loyalty data
    const { data: currentLoyalty } = await supabaseAdmin
      .from("loyalty_rewards")
      .select("completed_bookings, free_cuts_available")
      .eq("user_id", profile.id)
      .maybeSingle();

    const currentBookings = currentLoyalty?.completed_bookings || 0;
    const newBookings = currentBookings + 1;
    const shouldAddFreeCut = newBookings % 10 === 0;

    // Credit the loyalty point
    const { error: upsertError } = await supabaseAdmin
      .from("loyalty_rewards")
      .upsert(
        {
          user_id: profile.id,
          completed_bookings: newBookings,
          free_cuts_available: shouldAddFreeCut
            ? (currentLoyalty?.free_cuts_available || 0) + 1
            : currentLoyalty?.free_cuts_available || 0,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Error upserting loyalty:", upsertError);
      return new Response(
        JSON.stringify({ error: "Error al actualizar fidelización" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If there's an uncredited booking, mark it as credited by QR
    if (booking) {
      await supabaseAdmin
        .from("bookings")
        .update({ loyalty_credited: true, loyalty_credited_by: "qr" })
        .eq("id", booking.id);
    }

    // Log admin action
    await supabaseAdmin.from("admin_action_logs").insert({
      action_type: "loyalty_qr_scan",
      description: `Sello de fidelización añadido por QR a ${profile.full_name} (@${profile.username}). Nuevo total: ${newBookings}`,
      target_user_id: profile.id,
      target_user_name: profile.full_name,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "¡Sello añadido correctamente!",
        userName: profile.full_name,
        username: profile.username,
        newCount: newBookings,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
