import { corsHeaders, json, requireAdmin, serviceClient } from "../_shared/caller.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = serviceClient();
    const denied = await requireAdmin(req, supabaseAdmin);
    if (denied) return denied;

    const { userId, newPassword } = await req.json();
    if (typeof userId !== "string" || typeof newPassword !== "string" || newPassword.length < 8) {
      return json({ error: "userId y una contraseña de al menos 8 caracteres son obligatorios" }, 400);
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      console.error("Error updating password:", error);
      return json({ error: "No se pudo cambiar la contraseña" }, 500);
    }
    return json({ success: true });
  } catch (error: unknown) {
    console.error("Error:", error);
    return json({ error: "Error interno" }, 500);
  }
});
