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
}

interface RequestBody {
  notification: NotificationPayload;
  notificationType: string;
  metadata?: Record<string, unknown>;
}

// Map notification types to preference fields
const typeToPreference: Record<string, string> = {
  new_giveaway: "giveaways",
  admin_broadcast: "promotions",
  inactive_reminder: "promotions",
  broadcast: "promotions",
};

// Convert base64url to Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64url(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Web Push library for Deno - using raw EC keys
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const encoder = new TextEncoder();

  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const audience = new URL(subscription.endpoint).origin;
  
  const jwtPayload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: "mailto:support@diegcutz.es",
  };

  const headerB64 = uint8ArrayToBase64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(encoder.encode(JSON.stringify(jwtPayload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Decode the raw private key (32 bytes for P-256)
  const privateKeyBytes = base64urlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64urlToUint8Array(vapidPublicKey);

  // Create JWK from raw keys
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: uint8ArrayToBase64url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64url(publicKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64url(privateKeyBytes),
  };

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureArray = new Uint8Array(signature);
  const signatureB64 = uint8ArrayToBase64url(signatureArray);
  const jwt = `${unsignedToken}.${signatureB64}`;

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      TTL: "86400",
      Urgency: "normal",
    },
    body: payload,
  });

  return response;
}

serve(async (req) => {
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

    const { notification, notificationType, metadata }: RequestBody = await req.json();

    console.log("Sending push notification to ALL users");
    console.log("Notification type:", notificationType);

    if (!notification) {
      return new Response(
        JSON.stringify({ error: "Notification is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get ALL push subscriptions from all users
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*, profiles:user_id(full_name)");

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found");
      
      // Log to history
      await supabase.from("notification_history").insert({
        notification_type: notificationType || "broadcast",
        title: notification.title,
        body: notification.body,
        status: "no_subscribers",
        sent_count: 0,
        total_subscriptions: 0,
        metadata,
      });

      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get notification preferences for filtering
    const preferenceField = typeToPreference[notificationType || "broadcast"];
    let disabledUsers = new Set<string>();
    
    if (preferenceField) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("user_id")
        .eq(preferenceField, false);
      
      if (prefs) {
        disabledUsers = new Set(prefs.map(p => p.user_id));
      }
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/pwa-192x192.png",
      badge: notification.badge || "/pwa-192x192.png",
      tag: notification.tag,
      data: notification.data,
    });

    let sentCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const usersNotified = new Set<string>();

    // Send to all subscriptions
    for (const sub of subscriptions) {
      // Check if user has disabled this notification type
      if (disabledUsers.has(sub.user_id)) {
        skippedCount++;
        console.log(`Skipping user ${sub.user_id} - disabled ${preferenceField}`);
        continue;
      }

      try {
        const response = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (response.ok) {
          sentCount++;
          usersNotified.add(sub.user_id);
          console.log("Push sent successfully to:", sub.endpoint.substring(0, 50));
        } else if (response.status === 410 || response.status === 404) {
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

    console.log(`Push notifications sent: ${sentCount}/${subscriptions.length} (skipped: ${skippedCount})`);

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: notificationType || "broadcast",
      title: notification.title,
      body: notification.body,
      status: sentCount > 0 ? "sent" : "failed",
      sent_count: sentCount,
      total_subscriptions: subscriptions.length,
      error_details: errors.length > 0 ? errors.join("; ") : null,
      metadata: { ...metadata, users_notified: usersNotified.size, skipped: skippedCount },
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: subscriptions.length,
        usersNotified: usersNotified.size,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification-all:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
