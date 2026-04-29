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
    const { primaryUserId, secondaryUserId } = await req.json();

    if (!primaryUserId || !secondaryUserId) {
      return new Response(
        JSON.stringify({ error: "primaryUserId y secondaryUserId son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (primaryUserId === secondaryUserId) {
      return new Response(
        JSON.stringify({ error: "Los usuarios deben ser distintos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const summary: Record<string, any> = {};

    // ========= LOYALTY (sumar puntos y cortes gratis) =========
    const { data: loyaltyRows } = await admin
      .from("loyalty_rewards")
      .select("*")
      .in("user_id", [primaryUserId, secondaryUserId]);

    const primaryLoyalty = loyaltyRows?.find((l: any) => l.user_id === primaryUserId);
    const secondaryLoyalty = loyaltyRows?.find((l: any) => l.user_id === secondaryUserId);

    const totalCompleted = (primaryLoyalty?.completed_bookings || 0) + (secondaryLoyalty?.completed_bookings || 0);
    const totalFreeCuts = (primaryLoyalty?.free_cuts_available || 0) + (secondaryLoyalty?.free_cuts_available || 0);

    if (primaryLoyalty) {
      await admin.from("loyalty_rewards")
        .update({ completed_bookings: totalCompleted, free_cuts_available: totalFreeCuts, updated_at: new Date().toISOString() })
        .eq("user_id", primaryUserId);
    } else if (totalCompleted > 0 || totalFreeCuts > 0) {
      await admin.from("loyalty_rewards").insert({
        user_id: primaryUserId,
        completed_bookings: totalCompleted,
        free_cuts_available: totalFreeCuts,
      });
    }
    if (secondaryLoyalty) {
      await admin.from("loyalty_rewards").delete().eq("user_id", secondaryUserId);
    }
    summary.loyalty = { completed_bookings: totalCompleted, free_cuts_available: totalFreeCuts };

    // ========= BOOKINGS (mover historial) =========
    const { count: movedBookings } = await admin
      .from("bookings")
      .update({ user_id: primaryUserId }, { count: "exact" })
      .eq("user_id", secondaryUserId);
    summary.bookings_moved = movedBookings ?? 0;

    // ========= RATINGS =========
    await admin.from("ratings").update({ user_id: primaryUserId }).eq("user_id", secondaryUserId);

    // ========= ACHIEVEMENTS (sin duplicar) =========
    const { data: primaryAch } = await admin
      .from("user_achievements").select("achievement_id").eq("user_id", primaryUserId);
    const primaryAchSet = new Set((primaryAch || []).map((a: any) => a.achievement_id));

    const { data: secondaryAch } = await admin
      .from("user_achievements").select("*").eq("user_id", secondaryUserId);

    let achMoved = 0;
    for (const ach of secondaryAch || []) {
      if (!primaryAchSet.has(ach.achievement_id)) {
        await admin.from("user_achievements").update({ user_id: primaryUserId }).eq("id", ach.id);
        achMoved++;
      }
    }
    await admin.from("user_achievements").delete().eq("user_id", secondaryUserId);
    summary.achievements_moved = achMoved;

    // ========= MEMBERSHIPS (quedarse con el de mayor nivel) =========
    const { data: userMems } = await admin
      .from("user_memberships")
      .select("*, memberships(sort_order, name)")
      .in("user_id", [primaryUserId, secondaryUserId])
      .eq("status", "active");

    const primaryMem = userMems?.find((m: any) => m.user_id === primaryUserId);
    const secondaryMem = userMems?.find((m: any) => m.user_id === secondaryUserId);

    if (primaryMem && secondaryMem) {
      const primarySort = (primaryMem as any).memberships?.sort_order ?? 0;
      const secondarySort = (secondaryMem as any).memberships?.sort_order ?? 0;
      if (secondarySort > primarySort) {
        // Cancelar el del principal y mover el del secundario
        await admin.from("user_memberships").update({ status: "cancelled" }).eq("id", primaryMem.id);
        await admin.from("user_memberships").update({ user_id: primaryUserId }).eq("id", secondaryMem.id);
        summary.kept_membership = (secondaryMem as any).memberships?.name;
      } else {
        // Cancelar el del secundario
        await admin.from("user_memberships").update({ status: "cancelled", user_id: primaryUserId }).eq("id", secondaryMem.id);
        summary.kept_membership = (primaryMem as any).memberships?.name;
      }
    } else if (secondaryMem && !primaryMem) {
      await admin.from("user_memberships").update({ user_id: primaryUserId }).eq("id", secondaryMem.id);
      summary.kept_membership = (secondaryMem as any).memberships?.name;
    } else if (primaryMem) {
      summary.kept_membership = (primaryMem as any).memberships?.name;
    }
    // Mover historial de membresías
    await admin.from("membership_history").update({ user_id: primaryUserId }).eq("user_id", secondaryUserId);

    // ========= COUPON USES =========
    await admin.from("coupon_uses").update({ user_id: primaryUserId }).eq("user_id", secondaryUserId);

    // ========= GIVEAWAY PARTICIPANTS (evitar duplicados) =========
    const { data: primaryGiv } = await admin
      .from("giveaway_participants").select("giveaway_id").eq("user_id", primaryUserId);
    const primaryGivSet = new Set((primaryGiv || []).map((g: any) => g.giveaway_id));
    const { data: secGiv } = await admin
      .from("giveaway_participants").select("*").eq("user_id", secondaryUserId);
    for (const g of secGiv || []) {
      if (!primaryGivSet.has(g.giveaway_id)) {
        await admin.from("giveaway_participants").update({ user_id: primaryUserId }).eq("id", g.id);
      }
    }
    await admin.from("giveaway_participants").delete().eq("user_id", secondaryUserId);

    // ========= CHAT (mover) =========
    await admin.from("chat_conversations").update({ user_id: primaryUserId }).eq("user_id", secondaryUserId);

    // ========= NOTIFICATION PREFS (eliminar del secundario) =========
    await admin.from("notification_preferences").delete().eq("user_id", secondaryUserId);
    await admin.from("push_subscriptions").delete().eq("user_id", secondaryUserId);

    // ========= BANEAR cuenta secundaria (no eliminar) =========
    const { data: secProfile } = await admin
      .from("profiles").select("full_name").eq("id", secondaryUserId).maybeSingle();
    await admin.from("profiles")
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: `Fusionada con usuario ${primaryUserId}`,
      })
      .eq("id", secondaryUserId);

    // Banear en auth para impedir login
    try {
      await admin.auth.admin.updateUserById(secondaryUserId, { ban_duration: "876000h" } as any);
    } catch (e) {
      console.error("ban auth error", e);
    }

    // ========= LOG =========
    await admin.from("admin_action_logs").insert({
      action_type: "user_merge",
      description: `Fusionados usuarios. Principal: ${primaryUserId}, absorbido (baneado): ${secondaryUserId}`,
      target_user_id: primaryUserId,
      target_user_name: secProfile?.full_name || null,
      metadata: summary,
    });

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("merge-users error", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});