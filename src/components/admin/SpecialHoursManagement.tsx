import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Plus, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TimeRange = {
  start: string;
  end: string;
};

type SpecialHour = {
  id: string;
  date: string;
  is_closed: boolean;
  time_ranges: TimeRange[];
  note: string | null;
};

export const SpecialHoursManagement = () => {
  const { toast } = useToast();
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<SpecialHour | null>(null);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [isClosed, setIsClosed] = useState(false);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([{ start: "09:00", end: "14:00" }]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSpecialHours();
  }, []);

  const loadSpecialHours = async () => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("special_hours")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios especiales",
        variant: "destructive",
      });
      return;
    }

    setSpecialHours(
      (data || []).map((d) => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? (d.time_ranges as TimeRange[]) : [],
      }))
    );
  };

  const openNewDialog = () => {
    setEditingHour(null);
    setSelectedDate(addDays(new Date(), 1));
    setIsClosed(false);
    setTimeRanges([{ start: "09:00", end: "14:00" }]);
    setNote("");
    setDialogOpen(true);
  };

  const openEditDialog = (hour: SpecialHour) => {
    setEditingHour(hour);
    setSelectedDate(new Date(hour.date + "T00:00:00"));
    setIsClosed(hour.is_closed);
    setTimeRanges(hour.time_ranges.length > 0 ? hour.time_ranges : [{ start: "09:00", end: "14:00" }]);
    setNote(hour.note || "");
    setDialogOpen(true);
  };

  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { start: "17:00", end: "20:00" }]);
  };

  const removeTimeRange = (index: number) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((_, i) => i !== index));
    }
  };

  const updateTimeRange = (index: number, field: "start" | "end", value: string) => {
    const updated = [...timeRanges];
    updated[index][field] = value;
    setTimeRanges(updated);
  };

  const handleSave = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Selecciona una fecha",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const payload = {
      date: dateStr,
      is_closed: isClosed,
      time_ranges: isClosed ? [] : timeRanges,
      note: note.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let error;

    if (editingHour) {
      const { error: updateError } = await supabase
        .from("special_hours")
        .update(payload)
        .eq("id", editingHour.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("special_hours").insert(payload);
      error = insertError;
    }

    setSaving(false);

    if (error) {
      const isDuplicate = error.message?.includes("duplicate") || error.code === "23505";
      toast({
        title: "Error",
        description: isDuplicate
          ? "Ya existe un horario especial para esa fecha"
          : "No se pudo guardar el horario especial",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: editingHour ? "Horario actualizado" : "Horario creado",
      description: `Horario especial para el ${format(selectedDate, "d 'de' MMMM", { locale: es })}`,
    });

    setDialogOpen(false);
    loadSpecialHours();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("special_hours").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario especial",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Horario eliminado",
      description: "El horario especial se ha eliminado",
    });

    loadSpecialHours();
  };

  // Dates that already have special hours (for calendar highlighting)
  const specialDates = specialHours.map((h) => new Date(h.date + "T00:00:00"));

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-neon-cyan" />
              Horarios Especiales
            </CardTitle>
            <CardDescription>
              Configura horarios diferentes para fechas específicas
            </CardDescription>
          </div>
          <Button onClick={openNewDialog} variant="neon" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Añadir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        ) : specialHours.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay horarios especiales configurados
          </p>
        ) : (
          <div className="space-y-3">
            {specialHours.map((hour) => (
              <div
                key={hour.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {format(new Date(hour.date + "T00:00:00"), "EEEE, d 'de' MMMM yyyy", {
                      locale: es,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hour.is_closed ? (
                      <span className="text-destructive font-medium">Cerrado</span>
                    ) : (
                      hour.time_ranges.map((r, i) => (
                        <span key={i}>
                          {r.start.slice(0, 5)} - {r.end.slice(0, 5)}
                          {i < hour.time_ranges.length - 1 && ", "}
                        </span>
                      ))
                    )}
                  </p>
                  {hour.note && <p className="text-xs text-neon-cyan mt-1">{hour.note}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(hour)}>
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(hour.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog para añadir/editar horario especial */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingHour ? "Editar Horario Especial" : "Nuevo Horario Especial"}
            </DialogTitle>
            <DialogDescription>
              Configura un horario diferente para una fecha específica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date picker */}
            <div>
              <Label>Fecha</Label>
              <div className="flex justify-center mt-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  modifiers={{ special: specialDates }}
                  modifiersClassNames={{
                    special: "bg-neon-cyan/20 text-neon-cyan font-bold",
                  }}
                  className="rounded-md border border-border pointer-events-auto"
                />
              </div>
            </div>

            {/* Closed toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is-closed">Marcar como cerrado</Label>
              <Switch
                id="is-closed"
                checked={isClosed}
                onCheckedChange={setIsClosed}
              />
            </div>

            {/* Time ranges (only if not closed) */}
            {!isClosed && (
              <div className="space-y-3">
                <Label>Horarios</Label>
                {timeRanges.map((range, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={range.start}
                      onChange={(e) => updateTimeRange(index, "start", e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={range.end}
                      onChange={(e) => updateTimeRange(index, "end", e.target.value)}
                      className="flex-1"
                    />
                    {timeRanges.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeRange(index)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTimeRange}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir rango
                </Button>
              </div>
            )}

            {/* Note */}
            <div>
              <Label htmlFor="note">Nota (opcional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Festivo local"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="neon" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
