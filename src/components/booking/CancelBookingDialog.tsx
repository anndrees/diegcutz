import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Calendar as CalendarIcon, X, RotateCcw, Loader2 } from "lucide-react";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    booking_date: string;
    booking_time: string;
    services: any;
    total_price: number;
  };
  onSuccess: () => void;
  mode: "cancel" | "reschedule";
  isAdmin?: boolean;
}

export const CancelBookingDialog = ({
  open,
  onOpenChange,
  booking,
  onSuccess,
  mode,
  isAdmin = false,
}: CancelBookingDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [bookedHours, setBookedHours] = useState<string[]>([]);

  // Check if booking is within 48 hours (only for non-admin)
  const bookingDateTime = parseISO(`${booking.booking_date}T${booking.booking_time}`);
  const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const canCancel = isAdmin || hoursUntilBooking >= 48;

  const loadAvailableHours = async (date: Date) => {
    const dayOfWeek = date.getDay();
    
    // Load business hours for this day
    const { data: businessHoursData } = await supabase
      .from("business_hours")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .single();

    if (!businessHoursData || businessHoursData.is_closed) {
      setAvailableHours([]);
      setBookedHours([]);
      return;
    }

    // Generate available hours from time ranges
    const hours: string[] = [];
    const timeRanges = businessHoursData.time_ranges as { start: string; end: string }[];
    
    for (const range of timeRanges) {
      const startHour = parseInt(range.start.split(":")[0]);
      const endHour = parseInt(range.end.split(":")[0]);
      
      for (let h = startHour; h < endHour; h++) {
        hours.push(`${h.toString().padStart(2, "0")}:00:00`);
      }
    }

    // Load booked hours for this date
    const dateStr = format(date, "yyyy-MM-dd");
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", dateStr)
      .or("is_cancelled.is.null,is_cancelled.eq.false");

    const booked = (bookingsData || []).map((b) => b.booking_time);
    
    setAvailableHours(hours);
    setBookedHours(booked);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (date) {
      loadAvailableHours(date);
    }
  };

  const handleCancel = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
        cancelled_by: isAdmin ? "admin" : "client",
      })
      .eq("id", booking.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reserva cancelada",
      description: "La reserva ha sido cancelada correctamente",
    });
    onSuccess();
    onOpenChange(false);
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Selecciona una fecha y hora",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        is_cancelled: false,
        cancelled_at: null,
        cancelled_by: null,
      })
      .eq("id", booking.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo reubicar la reserva. Es posible que la hora ya esté ocupada.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reserva reubicada",
      description: `Nueva fecha: ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime.slice(0, 5)}`,
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "cancel" ? (
              <>
                <X className="w-5 h-5 text-destructive" />
                Cancelar Reserva
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5 text-neon-cyan" />
                Reubicar Reserva
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Reserva del {format(parseISO(booking.booking_date), "d 'de' MMMM", { locale: es })} a las {booking.booking_time.slice(0, 5)}
          </DialogDescription>
        </DialogHeader>

        {mode === "cancel" ? (
          <div className="py-4">
            {!canCancel ? (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">No es posible cancelar</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Solo puedes cancelar reservas con al menos 48 horas de antelación.
                      Tu reserva es en {Math.round(hoursUntilBooking)} horas.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Por favor, contacta por WhatsApp para casos excepcionales.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">¿Estás seguro?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta acción cancelará tu reserva y liberará el horario para otros clientes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Selecciona nueva fecha:</p>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <p className="text-sm font-medium mb-2">Selecciona hora:</p>
                {availableHours.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay horarios disponibles para este día
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableHours.map((hour) => {
                      const isBooked = bookedHours.includes(hour);
                      return (
                        <Button
                          key={hour}
                          variant={selectedTime === hour ? "neon" : "outline"}
                          size="sm"
                          disabled={isBooked}
                          onClick={() => setSelectedTime(hour)}
                          className="relative"
                        >
                          {hour.slice(0, 5)}
                          {isBooked && (
                            <X className="absolute inset-0 m-auto w-6 h-6 text-destructive" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          {mode === "cancel" ? (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading || !canCancel}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Cancelar Reserva
            </Button>
          ) : (
            <Button
              variant="neon"
              onClick={handleReschedule}
              disabled={loading || !selectedDate || !selectedTime}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CalendarIcon className="w-4 h-4 mr-2" />
              )}
              Confirmar Nueva Fecha
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};