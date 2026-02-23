import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Get all past bookings that haven't been rated
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, user_id, booking_date, client_name")
      .lt("booking_date", today)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .not("user_id", "is", null);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: "No past bookings found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookingIds = bookings.map((b) => b.id);

    // Get existing ratings
    const { data: existingRatings } = await supabase
      .from("ratings")
      .select("booking_id")
      .in("booking_id", bookingIds);

    const ratedIds = new Set((existingRatings || []).map((r) => r.booking_id));

    // Group unrated bookings by user
    const unratedByUser = new Map<string, number>();
    for (const booking of bookings) {
      if (!ratedIds.has(booking.id) && booking.user_id) {
        unratedByUser.set(
          booking.user_id,
          (unratedByUser.get(booking.user_id) || 0) + 1
        );
      }
    }

    console.log(`Found ${unratedByUser.size} users with unrated bookings`);

    let totalSent = 0;

    for (const [userId, count] of unratedByUser) {
      const body = count === 1
        ? "Tienes una visita sin valorar. ¡Tu opinión nos ayuda a mejorar! ⭐"
        : `Tienes ${count} visitas sin valorar. ¡Déjanos tu opinión! ⭐`;

      try {
        const { error } = await supabase.functions.invoke("send-push-notification", {
          body: {
            userId,
            notification: {
              title: "📝 ¿Qué tal tu experiencia?",
              body,
              data: { url: "/" },
            },
          },
        });

        if (!error) totalSent++;
      } catch (e) {
        console.error(`Error sending to ${userId}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Rating reminders sent`,
        usersWithPending: unratedByUser.size,
        notificationsSent: totalSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in rating-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
