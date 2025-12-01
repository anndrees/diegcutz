import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

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
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBusinessHours();
  }, []);

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
    
    setBusinessHours(formattedData);
  };

  const handleToggleClosed = async (dayOfWeek: number, isClosed: boolean) => {
    const { error } = await supabase
      .from("business_hours")
      .update({ is_closed: !isClosed, is_24h: false })
      .eq("day_of_week", dayOfWeek);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el horario",
        variant: "destructive",
      });
      return;
    }

    loadBusinessHours();
  };

  const handleToggle24h = async (dayOfWeek: number, is24h: boolean) => {
    const { error } = await supabase
      .from("business_hours")
      .update({ is_24h: !is24h, is_closed: false })
      .eq("day_of_week", dayOfWeek);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el horario",
        variant: "destructive",
      });
      return;
    }

    loadBusinessHours();
  };

  const handleAddTimeRange = async (dayOfWeek: number, currentRanges: TimeRange[]) => {
    const newRanges = [...currentRanges, { start: "09:00", end: "14:00" }];
    
    const { error } = await supabase
      .from("business_hours")
      .update({ time_ranges: newRanges })
      .eq("day_of_week", dayOfWeek);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo añadir la franja horaria",
        variant: "destructive",
      });
      return;
    }

    loadBusinessHours();
  };

  const handleRemoveTimeRange = async (dayOfWeek: number, currentRanges: TimeRange[], index: number) => {
    const newRanges = currentRanges.filter((_, i) => i !== index);
    
    const { error } = await supabase
      .from("business_hours")
      .update({ time_ranges: newRanges })
      .eq("day_of_week", dayOfWeek);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la franja horaria",
        variant: "destructive",
      });
      return;
    }

    loadBusinessHours();
  };

  const handleUpdateTimeRange = async (
    dayOfWeek: number,
    currentRanges: TimeRange[],
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const newRanges = [...currentRanges];
    newRanges[index][field] = value;
    
    const { error } = await supabase
      .from("business_hours")
      .update({ time_ranges: newRanges })
      .eq("day_of_week", dayOfWeek);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la franja horaria",
        variant: "destructive",
      });
      return;
    }

    loadBusinessHours();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Horario</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        ) : (
          <div className="space-y-6">
            {businessHours.map((dayHours) => (
              <div key={dayHours.day_of_week} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{DAYS[dayHours.day_of_week]}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`closed-${dayHours.day_of_week}`}>Cerrado</Label>
                      <Switch
                        id={`closed-${dayHours.day_of_week}`}
                        checked={dayHours.is_closed}
                        onCheckedChange={() => handleToggleClosed(dayHours.day_of_week, dayHours.is_closed)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`24h-${dayHours.day_of_week}`}>24h</Label>
                      <Switch
                        id={`24h-${dayHours.day_of_week}`}
                        checked={dayHours.is_24h}
                        onCheckedChange={() => handleToggle24h(dayHours.day_of_week, dayHours.is_24h)}
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
                              dayHours.time_ranges,
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
                              dayHours.time_ranges,
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
                            handleRemoveTimeRange(dayHours.day_of_week, dayHours.time_ranges, index)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTimeRange(dayHours.day_of_week, dayHours.time_ranges)}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
