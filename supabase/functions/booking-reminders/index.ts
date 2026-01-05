import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  user_id: string;
  client_name: string;
}

async function sendPushToUser(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  notification: { title: string; body: string; data?: Record<string, unknown> }
): Promise<number> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase.functions.invoke("send-push-notification", {
    body: { userId, notification },
  });

  if (error) {
    console.error(`Error sending push to user ${userId}:`, error);
    return 0;
  }

  return data?.sent || 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    
    // Calculate date ranges for 24h and 1h reminders
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Format dates
    const todayDate = now.toISOString().split("T")[0];
    const tomorrowDate = in24h.toISOString().split("T")[0];
    
    // Current hour for 1h reminders (window: current hour + 1 to current hour + 2)
    const currentHour = now.getHours();
    const targetHour1h = (currentHour + 1) % 24;
    
    // 24h reminder hour (same hour tomorrow)
    const targetHour24h = currentHour;

    console.log(`Running booking reminders at ${now.toISOString()}`);
    console.log(`Looking for 1h reminders: ${todayDate} at ${String(targetHour1h).padStart(2, "0")}:00`);
    console.log(`Looking for 24h reminders: ${tomorrowDate} at ${String(targetHour24h).padStart(2, "0")}:00`);

    let totalNotificationsSent = 0;

    // Get bookings for 1h reminder (today, at target hour)
    const { data: bookings1h, error: error1h } = await supabase
      .from("bookings")
      .select("id, booking_date, booking_time, user_id, client_name")
      .eq("booking_date", todayDate)
      .gte("booking_time", `${String(targetHour1h).padStart(2, "0")}:00`)
      .lt("booking_time", `${String(targetHour1h + 1).padStart(2, "0")}:00`)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .not("user_id", "is", null);

    if (error1h) {
      console.error("Error fetching 1h bookings:", error1h);
    } else {
      console.log(`Found ${bookings1h?.length || 0} bookings for 1h reminder`);
      
      for (const booking of bookings1h || []) {
        if (!booking.user_id) continue;
        
        const formattedTime = booking.booking_time.slice(0, 5);
        const sent = await sendPushToUser(supabaseUrl, supabaseKey, booking.user_id, {
          title: "⏰ ¡Tu cita es en 1 hora!",
          body: `Recuerda: tu cita es hoy a las ${formattedTime}. ¡Te esperamos!`,
          data: { type: "booking-reminder-1h", url: "/user", bookingId: booking.id },
        });
        
        totalNotificationsSent += sent;
        console.log(`Sent 1h reminder to user ${booking.user_id}: ${sent} notifications`);
      }
    }

    // Get bookings for 24h reminder (tomorrow, at target hour)
    const { data: bookings24h, error: error24h } = await supabase
      .from("bookings")
      .select("id, booking_date, booking_time, user_id, client_name")
      .eq("booking_date", tomorrowDate)
      .gte("booking_time", `${String(targetHour24h).padStart(2, "0")}:00`)
      .lt("booking_time", `${String(targetHour24h + 1).padStart(2, "0")}:00`)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .not("user_id", "is", null);

    if (error24h) {
      console.error("Error fetching 24h bookings:", error24h);
    } else {
      console.log(`Found ${bookings24h?.length || 0} bookings for 24h reminder`);
      
      for (const booking of bookings24h || []) {
        if (!booking.user_id) continue;
        
        const formattedTime = booking.booking_time.slice(0, 5);
        const formattedDate = new Date(booking.booking_date).toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        
        const sent = await sendPushToUser(supabaseUrl, supabaseKey, booking.user_id, {
          title: "📅 Recordatorio: cita mañana",
          body: `Tu cita es mañana ${formattedDate} a las ${formattedTime}. ¡Te esperamos!`,
          data: { type: "booking-reminder-24h", url: "/user", bookingId: booking.id },
        });
        
        totalNotificationsSent += sent;
        console.log(`Sent 24h reminder to user ${booking.user_id}: ${sent} notifications`);
      }
    }

    console.log(`Total notifications sent: ${totalNotificationsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${totalNotificationsSent} reminder notifications`,
        bookings1h: bookings1h?.length || 0,
        bookings24h: bookings24h?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in booking-reminders function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
