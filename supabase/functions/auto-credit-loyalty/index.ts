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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all bookings that ended 1+ hour ago and haven't been credited
    // A booking "ends" at booking_time. We add 1 hour grace period.
    const now = new Date();

    const { data: uncreditedBookings, error } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, total_price, booking_date, booking_time")
      .eq("loyalty_credited", false)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .gte("total_price", 5)
      .not("user_id", "is", null);

    if (error) {
      console.error("Error fetching uncredited bookings:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!uncreditedBookings || uncreditedBookings.length === 0) {
      return new Response(JSON.stringify({ message: "No bookings to credit", credited: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let credited = 0;

    for (const booking of uncreditedBookings) {
      // Check if booking ended 1+ hour ago
      const bookingEnd = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const oneHourAfter = new Date(bookingEnd.getTime() + 60 * 60 * 1000);

      if (now < oneHourAfter) continue; // Not yet 1 hour after booking

      // Get current loyalty data
      const { data: currentLoyalty } = await supabaseAdmin
        .from("loyalty_rewards")
        .select("completed_bookings, free_cuts_available")
        .eq("user_id", booking.user_id)
        .maybeSingle();

      const currentBookings = currentLoyalty?.completed_bookings || 0;
      const newBookings = currentBookings + 1;
      const shouldAddFreeCut = newBookings % 10 === 0;

      // Upsert loyalty
      await supabaseAdmin.from("loyalty_rewards").upsert(
        {
          user_id: booking.user_id,
          completed_bookings: newBookings,
          free_cuts_available: shouldAddFreeCut
            ? (currentLoyalty?.free_cuts_available || 0) + 1
            : currentLoyalty?.free_cuts_available || 0,
        },
        { onConflict: "user_id" }
      );

      // Mark booking as credited
      await supabaseAdmin
        .from("bookings")
        .update({ loyalty_credited: true, loyalty_credited_by: "auto" })
        .eq("id", booking.id);

      credited++;
    }

    console.log(`Auto-credited ${credited} loyalty points`);

    return new Response(
      JSON.stringify({ message: `Credited ${credited} bookings`, credited }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
