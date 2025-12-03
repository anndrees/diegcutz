import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TimeRange = {
  start: string;
  end: string;
};

type BusinessHour = {
  id: string;
  day_of_week: number;
  is_closed: boolean;
  is_24h: boolean;
  time_ranges: TimeRange[];
};

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const BusinessHoursManagement = () => {
  const { toast } = useToast();
  const [originalHours, setOriginalHours] = useState<BusinessHour[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Set<number>>(new Set());
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  useEffect(() => {
    loadBusinessHours();
  }, []);

  // Warn user about unsaved changes when trying to leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingChanges]);

  const loadBusinessHours = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_hours")
      .select("*")
      .order("day_of_week", { ascending: true });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el horario",
        variant: "destructive",
      });
      return;
    }

    const formattedData = (data || []).map(d => ({
      ...d,
      time_ranges: Array.isArray(d.time_ranges) ? d.time_ranges as TimeRange[] : []
    }));
    
    setOriginalHours(JSON.parse(JSON.stringify(formattedData)));
    setBusinessHours(formattedData);
    setPendingChanges(new Set());
  };

  const markAsChanged = (dayOfWeek: number) => {
    setPendingChanges(prev => new Set(prev).add(dayOfWeek));
  };

  const handleToggleClosed = (dayOfWeek: number) => {
    setBusinessHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek 
        ? { ...h, is_closed: !h.is_closed, is_24h: false }
        : h
    ));
    markAsChanged(dayOfWeek);
  };

  const handleToggle24h = (dayOfWeek: number) => {
    setBusinessHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek 
        ? { ...h, is_24h: !h.is_24h, is_closed: false }
        : h
    ));
    markAsChanged(dayOfWeek);
  };

  const handleAddTimeRange = (dayOfWeek: number) => {
    setBusinessHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek 
        ? { ...h, time_ranges: [...h.time_ranges, { start: "09:00", end: "14:00" }] }
        : h
    ));
    markAsChanged(dayOfWeek);
  };

  const handleRemoveTimeRange = (dayOfWeek: number, index: number) => {
    setBusinessHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek 
        ? { ...h, time_ranges: h.time_ranges.filter((_, i) => i !== index) }
        : h
    ));
    markAsChanged(dayOfWeek);
  };

  const handleUpdateTimeRange = (
    dayOfWeek: number,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    setBusinessHours(prev => prev.map(h => {
      if (h.day_of_week === dayOfWeek) {
        const newRanges = [...h.time_ranges];
        newRanges[index] = { ...newRanges[index], [field]: value };
        return { ...h, time_ranges: newRanges };
      }
      return h;
    }));
    markAsChanged(dayOfWeek);
  };

  const saveChangesForDay = async (dayOfWeek: number) => {
    setSaving(true);
    const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!dayHours) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("business_hours")
      .update({
        is_closed: dayHours.is_closed,
        is_24h: dayHours.is_24h,
        time_ranges: dayHours.time_ranges,
        updated_at: new Date().toISOString(),
      })
      .eq("day_of_week", dayOfWeek);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el horario",
        variant: "destructive",
      });
      return;
    }

    // Update original state and remove from pending
    setOriginalHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek ? { ...dayHours } : h
    ));
    setPendingChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(dayOfWeek);
      return newSet;
    });

    toast({
      title: "Guardado",
      description: `Horario de ${DAYS[dayOfWeek]} actualizado correctamente`,
    });
  };

  const discardChangesForDay = (dayOfWeek: number) => {
    const original = originalHours.find(h => h.day_of_week === dayOfWeek);
    if (original) {
      setBusinessHours(prev => prev.map(h => 
        h.day_of_week === dayOfWeek ? JSON.parse(JSON.stringify(original)) : h
      ));
    }
    setPendingChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(dayOfWeek);
      return newSet;
    });
  };

  const hasDayChanges = (dayOfWeek: number) => pendingChanges.has(dayOfWeek);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestión de Horario</span>
            {pendingChanges.size > 0 && (
              <span className="text-sm font-normal text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {pendingChanges.size} día{pendingChanges.size > 1 ? 's' : ''} con cambios sin guardar
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <div className="space-y-6">
              {businessHours.map((dayHours) => {
                const hasChanges = hasDayChanges(dayHours.day_of_week);
                
                return (
                  <div 
                    key={dayHours.day_of_week} 
                    className={`border rounded-lg p-4 transition-colors ${
                      hasChanges ? 'border-amber-500 bg-amber-500/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{DAYS[dayHours.day_of_week]}</h3>
                        {hasChanges && (
                          <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                            Sin guardar
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`closed-${dayHours.day_of_week}`}>Cerrado</Label>
                          <Switch
                            id={`closed-${dayHours.day_of_week}`}
                            checked={dayHours.is_closed}
                            onCheckedChange={() => handleToggleClosed(dayHours.day_of_week)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`24h-${dayHours.day_of_week}`}>24h</Label>
                          <Switch
                            id={`24h-${dayHours.day_of_week}`}
                            checked={dayHours.is_24h}
                            onCheckedChange={() => handleToggle24h(dayHours.day_of_week)}
                            disabled={dayHours.is_closed}
                          />
                        </div>
                      </div>
                    </div>

                    {!dayHours.is_closed && !dayHours.is_24h && (
                      <div className="space-y-3">
                        {dayHours.time_ranges.map((range, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={range.start}
                              onChange={(e) =>
                                handleUpdateTimeRange(
                                  dayHours.day_of_week,
                                  index,
                                  "start",
                                  e.target.value
                                )
                              }
                              className="w-32"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={range.end}
                              onChange={(e) =>
                                handleUpdateTimeRange(
                                  dayHours.day_of_week,
                                  index,
                                  "end",
                                  e.target.value
                                )
                              }
                              className="w-32"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveTimeRange(dayHours.day_of_week, index)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTimeRange(dayHours.day_of_week)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir franja horaria
                        </Button>
                      </div>
                    )}

                    {dayHours.is_closed && (
                      <p className="text-sm text-muted-foreground">Este día está marcado como cerrado</p>
                    )}

                    {dayHours.is_24h && (
                      <p className="text-sm text-muted-foreground">Abierto 24 horas</p>
                    )}

                    {/* Save/Discard buttons for this day */}
                    {hasChanges && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => saveChangesForDay(dayHours.day_of_week)}
                          disabled={saving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => discardChangesForDay(dayHours.day_of_week)}
                          disabled={saving}
                        >
                          Descartar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, se perderán los cambios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Salir sin guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
