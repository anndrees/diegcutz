import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, Clock, Loader2 } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  service_type: string;
  coming_soon: boolean;
};

type TimeRange = { start: string; end: string };
type BusinessHour = {
  day_of_week: number;
  is_closed: boolean;
  is_24h: boolean;
  time_ranges: TimeRange[];
};

interface AdminBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientContact: string;
  onBookingCreated: () => void;
}

export const AdminBookingDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientContact,
  onBookingCreated,
}: AdminBookingDialogProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      loadInitialData();
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedServices([]);
    }
  }, [open]);

  useEffect(() => {
    if (selectedDate) loadBookedTimes();
  }, [selectedDate]);

  const loadInitialData = async () => {
    setLoadingData(true);
    const [servicesRes, hoursRes] = await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase.from("business_hours").select("*").order("day_of_week"),
    ]);

    if (servicesRes.data) {
      setServices(
        servicesRes.data
          .filter((s) => !s.coming_soon)
          .map((s) => ({
            id: s.id,
            name: s.name,
            price: parseFloat(s.price.toString()),
            service_type: s.service_type,
            coming_soon: s.coming_soon,
          }))
      );
    }

    if (hoursRes.data) {
      setBusinessHours(
        hoursRes.data.map((d) => ({
          ...d,
          time_ranges: Array.isArray(d.time_ranges) ? (d.time_ranges as TimeRange[]) : [],
        }))
      );
    }
    setLoadingData(false);
  };

  const loadBookedTimes = async () => {
    if (!selectedDate) return;
    const { data } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", format(selectedDate, "yyyy-MM-dd"))
      .or("is_cancelled.is.null,is_cancelled.eq.false");

    setBookedTimes(data?.map((b) => b.booking_time) || []);
  };

  const getAvailableHours = (): number[] => {
    if (!selectedDate || businessHours.length === 0) return [];
    const dayOfWeek = selectedDate.getDay();
    const dayConfig = businessHours.find((h) => h.day_of_week === dayOfWeek);
    if (!dayConfig || dayConfig.is_closed) return [];
    if (dayConfig.is_24h) return Array.from({ length: 23 }, (_, i) => i);

    const hours: Set<number> = new Set();
    dayConfig.time_ranges.forEach((range) => {
      const startH = parseInt(range.start.split(":")[0]);
      const endH = parseInt(range.end.split(":")[0]);
      for (let h = startH; h < endH; h++) hours.add(h);
    });
    return Array.from(hours).sort((a, b) => a - b);
  };

  const isDayClosed = (date: Date): boolean => {
    if (businessHours.length === 0) return false;
    const dayConfig = businessHours.find((h) => h.day_of_week === date.getDay());
    return dayConfig?.is_closed ?? false;
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId]
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, id) => {
      const s = services.find((svc) => svc.id === id);
      return sum + (s?.price || 0);
    }, 0);
  };

  const getSelectedItems = () => {
    return selectedServices.map((id) => {
      const s = services.find((svc) => svc.id === id);
      return s ? `${s.name} (${s.price}€)` : "";
    }).filter(Boolean);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona fecha, hora y al menos un servicio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Check availability
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_date", format(selectedDate, "yyyy-MM-dd"))
      .eq("booking_time", selectedTime)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .limit(1);

    if (existing && existing.length > 0) {
      setLoading(false);
      toast({
        title: "Hora ocupada",
        description: "Esa hora ya está reservada. Elige otra.",
        variant: "destructive",
      });
      loadBookedTimes();
      return;
    }

    const totalPrice = calculateTotal();
    const servicesData = getSelectedItems();

    const { error } = await supabase.from("bookings").insert({
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: selectedTime,
      client_name: clientName,
      client_contact: clientContact,
      services: servicesData,
      total_price: totalPrice,
      original_price: totalPrice,
      user_id: clientId,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la reserva",
        variant: "destructive",
      });
      return;
    }

    // Log admin action
    await supabase.from("admin_action_logs").insert({
      action_type: "booking_assigned",
      description: `Reserva asignada a ${clientName} para el ${format(selectedDate, "d/MM/yyyy")} a las ${selectedTime}`,
      target_user_id: clientId,
      target_user_name: clientName,
    });

    toast({
      title: "¡Reserva creada!",
      description: `Reserva asignada a ${clientName}`,
    });

    onOpenChange(false);
    onBookingCreated();
  };

  const availableHours = getAvailableHours();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Asignar Reserva
          </DialogTitle>
          <DialogDescription>
            Crear reserva para <strong>{clientName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Date */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Fecha</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime("");
                }}
                locale={es}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today || isDayClosed(date);
                }}
                className="rounded-md border pointer-events-auto"
              />
            </div>

            {/* Time */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Hora
                </Label>
                {availableHours.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay horarios disponibles</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableHours.map((hour) => {
                      const timeStr = `${hour.toString().padStart(2, "0")}:00:00`;
                      const isBooked = bookedTimes.includes(timeStr);
                      const isSelected = selectedTime === timeStr;

                      return (
                        <Button
                          key={hour}
                          variant={isSelected ? "neon" : "outline"}
                          size="sm"
                          disabled={isBooked}
                          onClick={() => setSelectedTime(timeStr)}
                          className={isBooked ? "opacity-40 line-through" : ""}
                        >
                          {`${hour.toString().padStart(2, "0")}:00`}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Servicios</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <span className="flex-1 text-sm">{service.name}</span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {service.price}€
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Total */}
            {selectedServices.length > 0 && (
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">{calculateTotal()}€</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="neon"
            onClick={handleSubmit}
            disabled={loading || !selectedDate || !selectedTime || selectedServices.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Reserva"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
