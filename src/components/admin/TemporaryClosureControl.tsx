import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseClosure } from "@/hooks/useTemporaryClosure";

export function TemporaryClosureControl() {
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "temporary_closure").maybeSingle().then(({ data }) => {
      const s = parseClosure(data?.value);
      setActive(s.active);
      setReason(s.reason);
    });
  }, []);

  const save = async (next: boolean) => {
    if (next && !reason.trim()) {
      toast({ title: "Falta el motivo", description: "Escribe el motivo del cierre para activarlo.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "temporary_closure", value: { active: next, reason: reason.trim(), updated_at: new Date().toISOString() }, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    setBusy(false);
    if (error) { toast({ title: "Error", description: "No se pudo guardar el cierre temporal.", variant: "destructive" }); return; }
    setActive(next);
    toast({ title: next ? "Cierre temporal activado" : "DIEGCUTZ vuelve a estar abierto", description: next ? "Nadie puede reservar hasta que lo desactives." : "Las reservas vuelven a estar disponibles." });
  };

  return (
    <div className={`space-y-3 rounded-md border p-4 ${active ? "border-destructive bg-destructive/5" : "border-border"}`}>
      <div>
        <Label htmlFor="closure-reason" className={`text-sm font-medium ${active ? "text-destructive" : ""}`}>
          Cierre temporal {active && "· ACTIVO"}
        </Label>
        <p className="text-xs text-muted-foreground">Muestra un aviso a pantalla completa a todos los clientes y bloquea todas las reservas.</p>
      </div>
      <Textarea id="closure-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
        placeholder="Motivo (p. ej. baja médica, volveremos en cuanto sea posible)" rows={3} disabled={busy} />
      {active ? (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => save(true)}>Actualizar motivo</Button>
          <Button className="flex-1" disabled={busy} onClick={() => save(false)}>Reabrir DIEGCUTZ</Button>
        </div>
      ) : (
        <Button variant="destructive" className="w-full" disabled={busy || !reason.trim()} onClick={() => save(true)}>Activar cierre temporal</Button>
      )}
    </div>
  );
}
