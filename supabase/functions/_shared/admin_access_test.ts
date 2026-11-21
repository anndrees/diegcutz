import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
const nobody = "00000000-0000-0000-0000-000000000000";

const cases: Array<[string, Record<string, unknown>]> = [
  ["reset-user-password", { userId: nobody, newPassword: "Intruso#123456" }],
  ["delete-user", { userId: nobody }],
  ["merge-users", { primaryUserId: nobody, secondaryUserId: "00000000-0000-0000-0000-000000000001" }],
  ["scan-loyalty-qr", { loyalty_token: "no-existe" }],
  ["send-push-notification-all", { notification: { title: "x", body: "x" }, notificationType: "broadcast" }],
];

for (const [fn, body] of cases) {
  for (const [label, auth] of [["without a session", undefined], ["with only the public key", anon]] as const) {
    Deno.test(`${fn} refuses requests ${label}`, async () => {
      if (!url || !anon) throw Error("Supabase test environment required");
      const headers: Record<string, string> = { "Content-Type": "application/json", apikey: anon };
      if (auth) headers.Authorization = `Bearer ${auth}`;
      const r = await fetch(`${url}/functions/v1/${fn}`, { method: "POST", headers, body: JSON.stringify(body) });
      await r.text();
      assertEquals(r.status, 401);
    });
  }
}
