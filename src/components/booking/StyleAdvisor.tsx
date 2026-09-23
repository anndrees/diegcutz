import { useState } from "react";
import { Sparkles, Loader2, Check, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Slot = { date: string; time: string; label: string };
type Props = {
  onSelect: (id: string) => void;
  onSlotSelect?: (slot: { date: string; time: string }) => void;
  services: { id: string; name: string }[];
};

export function StyleAdvisor({ onSelect, onSlotSelect, services }: Props) {
  const [description, setDescription] = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slotApplied, setSlotApplied] = useState(false);

  const recommend = async () => {
    if (description.trim().length < 10) {
      setError("Cuéntanos un poco más sobre la ocasión o el estilo que buscas.");
      return;
    }
    setLoading(true); setError(""); setAnswer(""); setSlot(null); setSlotApplied(false); setSelected([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Inicia sesión para pedir una recomendación.");
      const { data, error: fnError } = await supabase.functions.invoke("recommend-service", {
        body: { description, preferences },
      });
      if (fnError) throw new Error("No hemos podido contactar con el asesor. Inténtalo de nuevo.");
      const payload = data as { message?: string; serviceId?: string | null; serviceIds?: string[]; slot?: Slot | null; hasSlots?: boolean };
      setAnswer(payload?.message || "Esto es lo que te pega más, dime si te encaja.");
      const ids = (payload?.serviceIds?.length ? payload.serviceIds : payload?.serviceId ? [payload.serviceId] : [])
        .filter((id) => services.some((s) => s.id === id));
      if (ids.length) {
        setSelected(ids);
        ids.forEach((id) => onSelect(id));
      }
      if (payload?.slot) setSlot(payload.slot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo obtener la recomendación.");
    } finally {
      setLoading(false);
    }
  };

  const applySlot = () => {
    if (!slot || !onSlotSelect) return;
    onSlotSelect({ date: slot.date, time: slot.time });
    setSlotApplied(true);
  };

  return (
    <div className="style-advisor border border-border bg-card p-5 md:p-7 mb-6">
      <div className="grid sm:grid-cols-[3rem_1fr] gap-4 mb-5">
        <div className="w-10 h-10 border border-primary flex items-center justify-center">
          <Sparkles className="text-primary h-4 w-4" />
        </div>
        <div>
          <p className="customer-kicker">ASESOR DE ESTILO / IA</p>
          <h3 className="text-2xl mt-2">Encuentra el corte y la cita adecuados</h3>
          <p className="text-sm text-muted-foreground mt-1">Describe la ocasión o el corte que buscas y cuándo te viene bien.</p>
        </div>
      </div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 600))}
        placeholder="Por ejemplo: tengo una boda, quiero verme elegante pero mantener un acabado moderno..."
        className="min-h-24 resize-none"
      />
      <Input
        value={preferences}
        onChange={(e) => setPreferences(e.target.value.slice(0, 300))}
        placeholder="Preferencias de día y hora: por ejemplo, viernes o sábado por la tarde"
        className="mt-3"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{description.length}/600</span>
        <Button type="button" variant="premium" onClick={recommend} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {loading ? "Pensando..." : "Recomendarme"}
        </Button>
      </div>
      {answer && (
        <div className="mt-4 border-l border-primary pl-4">
          <p className="text-sm leading-relaxed">{answer}</p>
          {selected && (
            <p className="mt-2 text-xs text-primary flex items-center gap-1">
              <Check className="h-3 w-3" />Servicio seleccionado; puedes cambiarlo abajo.
            </p>
          )}
          {slot && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Hueco sugerido: {slot.label}
              </span>
              {onSlotSelect && (
                <Button type="button" size="sm" variant={slotApplied ? "secondary" : "default"} onClick={applySlot} disabled={slotApplied}>
                  {slotApplied ? "Cita aplicada" : "Usar esta cita"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
