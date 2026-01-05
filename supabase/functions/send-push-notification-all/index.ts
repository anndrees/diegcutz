import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  ApplicationServer,
  importVapidKeys,
  type PushSubscription as WebPushSubscription,
  Urgency,
} from "jsr:@negrel/webpush@0.5.0";

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

// Convert raw base64url VAPID keys to JWK format
function rawKeysToJwk(publicKeyB64: string, privateKeyB64: string): { publicKey: JsonWebKey; privateKey: JsonWebKey } {
  // Decode base64url to bytes
  const b64ToBytes = (b64: string): Uint8Array => {
    const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + padding);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  };

  // Convert bytes to base64url
  const bytesToB64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  const publicKeyBytes = b64ToBytes(publicKeyB64);
  const privateKeyBytes = b64ToBytes(privateKeyB64);

  // P-256 public key is 65 bytes: 0x04 prefix + 32 bytes X + 32 bytes Y
  // P-256 private key is 32 bytes (the d value)
  const x = bytesToB64(publicKeyBytes.slice(1, 33));
  const y = bytesToB64(publicKeyBytes.slice(33, 65));
  const d = bytesToB64(privateKeyBytes);

  const publicKey: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
  };

  const privateKey: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
  };

  return { publicKey, privateKey };
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

    // Convert raw keys to JWK format and import
    const jwkKeys = rawKeysToJwk(vapidPublicKey, vapidPrivateKey);
    const vapidKeys = await importVapidKeys(jwkKeys);

    // Create application server with VAPID keys
    const appServer = await ApplicationServer.new({
      contactInformation: "mailto:support@diegcutz.es",
      vapidKeys,
    });

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
        // Create WebPush subscription object
        const pushSubscription: WebPushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        // Subscribe and send push message
        const subscriber = await appServer.subscribe(pushSubscription);
        await subscriber.pushTextMessage(payload, { urgency: Urgency.Normal, ttl: 86400 });

        sentCount++;
        usersNotified.add(sub.user_id);
        console.log("Push sent successfully to:", sub.endpoint.substring(0, 50));
      } catch (error) {
        console.error("Error sending push to subscription:", error);
        
        // Check if subscription is expired (410 Gone)
        const errorStr = String(error);
        if (errorStr.includes("410") || errorStr.includes("Gone") || errorStr.includes("404")) {
          console.log("Subscription expired, removing:", sub.id);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
        
        errors.push(errorStr);
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
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});