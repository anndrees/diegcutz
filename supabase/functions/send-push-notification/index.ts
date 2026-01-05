import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

interface RequestBody {
  userId: string;
  notification: NotificationPayload;
  notificationType?: string;
  userName?: string;
}

// Map notification types to preference fields
const typeToPreference: Record<string, string> = {
  booking_confirmation: "booking_confirmations",
  booking_reminder: "booking_reminders",
  chat_message: "chat_messages",
  giveaway_winner: "giveaways",
  new_giveaway: "giveaways",
  admin_broadcast: "promotions",
  admin_message: "promotions",
  inactive_reminder: "promotions",
};

// Web Push library for Deno
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const encoder = new TextEncoder();

  // Create the JWT for VAPID
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const audience = new URL(subscription.endpoint).origin;
  
  const jwtPayload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: "mailto:anndrees31@gmail.com",
  };

  // Base64URL encode
  const base64url = (data: Uint8Array | string): string => {
    const str = typeof data === "string" ? data : String.fromCharCode(...data);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(jwtPayload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key for signing
  const privateKeyBytes = Uint8Array.from(
    atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = base64url(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Encoding": "aes128gcm",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      TTL: "86400",
      Urgency: "normal",
    },
    body: payload,
  });

  return response;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, notification, notificationType, userName }: RequestBody = await req.json();

    console.log("Sending push notification to user:", userId);
    console.log("Notification type:", notificationType);

    if (!userId || !notification) {
      return new Response(
        JSON.stringify({ error: "User ID and notification are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user's notification preferences
    const preferenceField = typeToPreference[notificationType || "general"];
    if (preferenceField) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      // Check if this notification type is disabled
      const isDisabled = prefs && (prefs as Record<string, unknown>)[preferenceField] === false;
      
      if (isDisabled) {
        console.log(`User ${userId} has disabled ${preferenceField} notifications`);
        
        // Log but mark as skipped
        await supabase.from("notification_history").insert({
          user_id: userId,
          user_name: userName,
          notification_type: notificationType || "general",
          title: notification.title,
          body: notification.body,
          status: "skipped",
          sent_count: 0,
          total_subscriptions: 0,
          error_details: "Usuario desactivó este tipo de notificación",
        });

        return new Response(
          JSON.stringify({ success: true, sent: 0, message: "User disabled this notification type" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user name if not provided
    let resolvedUserName = userName;
    if (!resolvedUserName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      resolvedUserName = profile?.full_name || null;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user:", userId);
      
      // Log to history
      await supabase.from("notification_history").insert({
        user_id: userId,
        user_name: resolvedUserName,
        notification_type: notificationType || "general",
        title: notification.title,
        body: notification.body,
        status: "no_subscribers",
        sent_count: 0,
        total_subscriptions: 0,
      });

      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/pwa-192x192.png",
      badge: notification.badge || "/pwa-192x192.png",
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
    });

    let sentCount = 0;
    const errors: string[] = [];

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        const response = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (response.ok) {
          sentCount++;
          console.log("Push sent successfully to:", sub.endpoint.substring(0, 50));
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired, remove it
          console.log("Subscription expired, removing:", sub.id);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          const errorText = await response.text();
          console.error("Push failed:", response.status, errorText);
          errors.push(`${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.error("Error sending push to subscription:", error);
        errors.push(String(error));
      }
    }

    console.log(`Push notifications sent: ${sentCount}/${subscriptions.length}`);

    // Log to notification history
    await supabase.from("notification_history").insert({
      user_id: userId,
      user_name: resolvedUserName,
      notification_type: notificationType || "general",
      title: notification.title,
      body: notification.body,
      status: sentCount > 0 ? "sent" : "failed",
      sent_count: sentCount,
      total_subscriptions: subscriptions.length,
      error_details: errors.length > 0 ? errors.join("; ") : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
