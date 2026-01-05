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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting inactive users reminder check...");

    // Get users who haven't booked in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all active users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_banned", false);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} active profiles`);

    const inactiveUsers: { id: string; name: string }[] = [];

    for (const profile of profiles || []) {
      // Check if user has any recent bookings
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", profile.id)
        .gte("booking_date", thirtyDaysAgo.toISOString().split("T")[0])
        .limit(1);

      // If no recent bookings, check if they have at least one past booking
      if (!recentBookings || recentBookings.length === 0) {
        const { data: pastBookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("user_id", profile.id)
          .limit(1);

        if (pastBookings && pastBookings.length > 0) {
          inactiveUsers.push({ id: profile.id, name: profile.full_name });
        }
      }
    }

    console.log(`Found ${inactiveUsers.length} inactive users to notify`);

    let notificationsSent = 0;

    // Send notifications using the send-push-notification function
    for (const user of inactiveUsers) {
      try {
        const { data, error } = await supabase.functions.invoke("send-push-notification", {
          body: {
            userId: user.id,
            notification: {
              title: "💈 ¡Te echamos de menos!",
              body: `Hola ${user.name.split(" ")[0]}, hace tiempo que no te vemos. ¿Qué tal un nuevo corte?`,
              tag: "inactive-reminder",
              data: {
                type: "inactive-reminder",
                url: "/booking",
              },
              actions: [{ action: "book", title: "Reservar ahora" }],
            },
          },
        });

        if (!error && data?.sent > 0) {
          notificationsSent++;
          console.log(`Sent reminder to user ${user.id}`);
        }
      } catch (pushError) {
        console.error(`Failed to send reminder to user ${user.id}:`, pushError);
      }
    }

    console.log(`Inactive users reminder completed. Sent ${notificationsSent} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        inactiveUsers: inactiveUsers.length,
        notificationsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in inactive users reminder:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
