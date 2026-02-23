import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Calendar, ArrowRight, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type TimeRange = {
  start: string;
  end: string;
};

type BusinessHour = {
  day_of_week: number;
  is_closed: boolean;
  is_24h: boolean;
  time_ranges: TimeRange[];
};

type SpecialHour = {
  date: string;
  is_closed: boolean;
  time_ranges: TimeRange[];
};

export const NextAvailableSlot = () => {
  const navigate = useNavigate();
  const [nextSlot, setNextSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    findNextAvailableSlot();
  }, []);

  useEffect(() => {
    if (!nextSlot) return;

    const updateCountdown = () => {
      const now = new Date();
      const slotTime = new Date(nextSlot.date);
      slotTime.setHours(nextSlot.hour, 0, 0, 0);

      const diff = slotTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Slot has passed, find next one
        findNextAvailableSlot();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextSlot]);

  const findNextAvailableSlot = async () => {
    setLoading(true);

    try {
      // Load business hours
      const { data: businessHoursData } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week", { ascending: true });

      // Load special hours for next 2 weeks
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const { data: specialHoursData } = await supabase
        .from("special_hours")
        .select("*")
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", twoWeeksLater.toISOString().split("T")[0]);

      // Load existing bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("booking_date, booking_time")
        .gte("booking_date", today.toISOString().split("T")[0])
        .lte("booking_date", twoWeeksLater.toISOString().split("T")[0])
        .or("is_cancelled.is.null,is_cancelled.eq.false");

      const businessHours: BusinessHour[] = (businessHoursData || []).map((d) => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? (d.time_ranges as TimeRange[]) : [],
      }));

      const specialHours: SpecialHour[] = (specialHoursData || []).map((d) => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? (d.time_ranges as TimeRange[]) : [],
      }));

      const bookedSlots = new Set(
        (bookingsData || []).map((b) => `${b.booking_date}_${b.booking_time}`)
      );

      // Find next available slot
      const now = new Date();
      const currentHour = now.getHours();

      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + dayOffset);
        const dateStr = checkDate.toISOString().split("T")[0];
        const dayOfWeek = checkDate.getDay();

        // Check for special hours first
        const specialDay = specialHours.find((s) => s.date === dateStr);

        let availableHours: number[] = [];

        if (specialDay) {
          if (specialDay.is_closed) continue;
          availableHours = getHoursFromRanges(specialDay.time_ranges);
        } else {
          const regularDay = businessHours.find((b) => b.day_of_week === dayOfWeek);
          if (!regularDay || regularDay.is_closed) continue;

          if (regularDay.is_24h) {
            availableHours = Array.from({ length: 24 }, (_, i) => i);
          } else {
            availableHours = getHoursFromRanges(regularDay.time_ranges);
          }
        }

        // Filter out booked slots and past hours
        for (const hour of availableHours) {
          // Skip past hours for today
          if (dayOffset === 0 && hour <= currentHour) continue;

          const slotKey = `${dateStr}_${hour.toString().padStart(2, "0")}:00`;
          if (!bookedSlots.has(slotKey)) {
            setNextSlot({ date: checkDate, hour });
            setLoading(false);
            return;
          }
        }
      }

      setNextSlot(null);
      setLoading(false);
    } catch (error) {
      console.error("Error finding next slot:", error);
      setLoading(false);
    }
  };

  const getHoursFromRanges = (ranges: TimeRange[]): number[] => {
    const hours: number[] = [];
    for (const range of ranges) {
      const startHour = parseInt(range.start.split(":")[0]);
      const endHour = parseInt(range.end.split(":")[0]);
      // Exclude the final hour (bookings last 1 hour)
      for (let h = startHour; h < endHour; h++) {
        hours.push(h);
      }
    }
    return hours.sort((a, b) => a - b);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "HOY";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "MAÑANA";
    } else {
      return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
    }
  };

  const handleBookSlot = () => {
    if (nextSlot) {
      // Save selected slot to localStorage for booking page
      localStorage.setItem(
        "preselected_slot",
        JSON.stringify({
          date: nextSlot.date.toISOString().split("T")[0],
          hour: nextSlot.hour,
        })
      );
      navigate("/booking");
    }
  };

  const urgencyLevel = useMemo(() => {
    const totalMinutes = countdown.hours * 60 + countdown.minutes;
    if (totalMinutes <= 60) return "high";
    if (totalMinutes <= 180) return "medium";
    return "low";
  }, [countdown]);

  if (loading) {
    return (
      <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/50 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-4" />
        <div className="h-16 bg-muted rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!nextSlot) {
    return null;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Animated background glow */}
      <div
        className={`absolute inset-0 rounded-2xl blur-xl opacity-30 ${
          urgencyLevel === "high"
            ? "bg-destructive animate-pulse"
            : urgencyLevel === "medium"
            ? "bg-primary animate-pulse"
            : "bg-secondary"
        }`}
        style={{ animationDuration: urgencyLevel === "high" ? "1s" : "2s" }}
      />

      <div className="relative bg-card/90 backdrop-blur-sm border-2 border-secondary rounded-2xl p-6 md:p-8">
        {/* Urgency badge */}
        {urgencyLevel !== "low" && (
          <div
            className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              urgencyLevel === "high"
                ? "bg-destructive text-destructive-foreground animate-bounce"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {urgencyLevel === "high" ? "🔥 ¡Última hora!" : "⚡ Disponible pronto"}
          </div>
        )}

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-secondary animate-pulse" />
            <span className="text-sm uppercase tracking-widest text-muted-foreground font-bold">
              Próxima cita disponible
            </span>
            <Zap className="w-5 h-5 text-secondary animate-pulse" />
          </div>

          {/* Date and time display */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-secondary">
              <Calendar className="w-6 h-6" />
              <span className="text-2xl md:text-3xl font-black">{formatDate(nextSlot.date)}</span>
            </div>
            <div className="text-3xl text-muted-foreground">•</div>
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-6 h-6" />
              <span className="text-2xl md:text-3xl font-black">
                {nextSlot.hour.toString().padStart(2, "0")}:00
              </span>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex justify-center gap-3 mb-6">
            <CountdownUnit value={countdown.hours} label="horas" />
            <div className="text-4xl font-bold text-muted-foreground self-start mt-2">:</div>
            <CountdownUnit value={countdown.minutes} label="min" />
            <div className="text-4xl font-bold text-muted-foreground self-start mt-2">:</div>
            <CountdownUnit value={countdown.seconds} label="seg" />
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            variant="neon"
            onClick={handleBookSlot}
            className="text-lg px-8 py-6 h-auto group transition-all duration-300 hover:scale-105"
          >
            Reservar este slot
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Same-day contact modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Reserva para hoy
            </DialogTitle>
            <DialogDescription>
              Las reservas para el mismo día requieren confirmación directa con el barbero para asegurar disponibilidad.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Contacta por WhatsApp para reservar el slot de las{" "}
              <span className="font-bold text-foreground">
                {nextSlot?.hour.toString().padStart(2, "0")}:00
              </span>{" "}
              de hoy.
            </p>
            <a
              href={`https://wa.me/34641637576?text=${encodeURIComponent(`Hola! Me gustaría reservar el slot de las ${nextSlot?.hour.toString().padStart(2, "0")}:00 de hoy.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="neon" size="lg" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                Contactar por WhatsApp
              </Button>
            </a>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowContactModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-muted/50 border border-secondary/30 rounded-xl px-4 py-2 min-w-[70px]">
      <span
        className="text-4xl md:text-5xl font-black text-secondary tabular-nums"
        style={{
          textShadow: "0 0 20px hsl(190 95% 50% / 0.5)",
        }}
      >
        {value.toString().padStart(2, "0")}
      </span>
    </div>
    <span className="text-xs uppercase tracking-wider text-muted-foreground mt-1 font-medium">
      {label}
    </span>
  </div>
);

export default NextAvailableSlot;
