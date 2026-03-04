import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Scissors } from "lucide-react";

type TimeRange = { start: string; end: string };
type BusinessHour = {
  day_of_week: number;
  is_closed: boolean;
  is_24h: boolean;
  time_ranges: TimeRange[];
};

interface AvailableHoursModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  bookedTimes: string[];
}

export const AvailableHoursModal = ({ open, onOpenChange, date, bookedTimes }: AvailableHoursModalProps) => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadBusinessHours();
    }
  }, [open]);

  const loadBusinessHours = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_hours")
      .select("*")
      .order("day_of_week");

    if (!error && data) {
      setBusinessHours(data.map(d => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? d.time_ranges as TimeRange[] : []
      })));
    }
    setLoading(false);
  };

  const getAvailableHours = (): number[] => {
    if (businessHours.length === 0) return [];
    const dayOfWeek = date.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    if (!dayConfig || dayConfig.is_closed) return [];
    if (dayConfig.is_24h) return Array.from({ length: 23 }, (_, i) => i);

    const hours: Set<number> = new Set();
    dayConfig.time_ranges.forEach(range => {
      const startHour = parseInt(range.start.split(":")[0]);
      const endHour = parseInt(range.end.split(":")[0]);
      for (let h = startHour; h < endHour; h++) hours.add(h);
    });
    return Array.from(hours).sort((a, b) => a - b);
  };

  const allHours = getAvailableHours();
  const freeHours = allHours.filter(h => {
    const timeString = `${h.toString().padStart(2, "0")}:00:00`;
    return !bookedTimes.includes(timeString);
  });
  const isClosed = allHours.length === 0;

  const dayName = format(date, "EEEE", { locale: es });
  const formattedDate = format(date, "d 'de' MMMM", { locale: es });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 overflow-hidden bg-transparent shadow-none [&>button]:hidden">
        {/* Social-media-ready card */}
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "85vh" }}>
          {/* Background with animated gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,80%,8%)] via-[hsl(260,60%,12%)] to-[hsl(200,80%,8%)]" />
          
          {/* Neon glow orbs */}
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-[hsl(280,80%,60%)] opacity-20 blur-[80px]" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-[hsl(190,95%,50%)] opacity-15 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[hsl(330,85%,60%)] opacity-10 blur-[100px]" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(hsl(280,80%,60%) 1px, transparent 1px), linear-gradient(90deg, hsl(280,80%,60%) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full p-6 py-8">
            {/* Header / Brand */}
            <div className="text-center space-y-1">
              <h2 className="text-4xl font-black tracking-wider font-aggressive" style={{
                background: 'linear-gradient(135deg, hsl(280,80%,60%), hsl(190,95%,50%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                DIEGCUTZ
              </h2>
              <div className="flex items-center justify-center gap-2">
                <Scissors className="h-4 w-4 text-[hsl(190,95%,50%)]" />
                <p className="text-xs uppercase tracking-[0.3em] text-[hsl(0,0%,60%)]">Urban Barbershop</p>
                <Scissors className="h-4 w-4 text-[hsl(190,95%,50%)] scale-x-[-1]" />
              </div>
            </div>

            {/* Date section */}
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-[0.25em] text-[hsl(190,95%,50%)] font-semibold">
                {dayName}
              </p>
              <p className="text-3xl font-black text-white tracking-tight">
                {formattedDate.toUpperCase()}
              </p>
              <div className="w-16 h-0.5 mx-auto rounded-full" style={{
                background: 'linear-gradient(90deg, hsl(280,80%,60%), hsl(190,95%,50%))'
              }} />
            </div>

            {/* Hours section */}
            <div className="w-full flex-1 flex flex-col items-center justify-center max-h-[50%]">
              {loading ? (
                <div className="flex items-center gap-2 text-[hsl(0,0%,60%)]">
                  <Clock className="h-5 w-5 animate-spin" />
                  <span>Cargando...</span>
                </div>
              ) : isClosed ? (
                <div className="text-center space-y-3">
                  <div className="text-6xl">🚫</div>
                  <p className="text-2xl font-black text-[hsl(0,85%,60%)] uppercase tracking-wider">Cerrado</p>
                  <p className="text-sm text-[hsl(0,0%,50%)]">No hay citas disponibles este día</p>
                </div>
              ) : freeHours.length === 0 ? (
                <div className="text-center space-y-3">
                  <div className="text-6xl">🔥</div>
                  <p className="text-2xl font-black text-[hsl(330,85%,60%)] uppercase tracking-wider">¡COMPLETO!</p>
                  <p className="text-sm text-[hsl(0,0%,50%)]">Todas las horas están reservadas</p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.25em] text-[hsl(0,0%,50%)] mb-1">Horas disponibles</p>
                    <p className="text-5xl font-black text-white">{freeHours.length}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
                    {freeHours.map(hour => (
                      <div
                        key={hour}
                        className="relative group flex items-center justify-center py-3 rounded-xl border border-[hsl(280,80%,60%,0.3)] bg-[hsl(280,80%,60%,0.08)]"
                        style={{
                          boxShadow: '0 0 12px hsl(280 80% 60% / 0.15), inset 0 1px 0 hsl(280 80% 60% / 0.1)',
                        }}
                      >
                        <Clock className="h-3.5 w-3.5 text-[hsl(190,95%,50%)] mr-1.5" />
                        <span className="text-lg font-bold text-white tracking-wide">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="text-center space-y-3 w-full">
              <div className="px-6 py-3 rounded-xl border border-[hsl(190,95%,50%,0.3)] bg-[hsl(190,95%,50%,0.08)]"
                style={{ boxShadow: '0 0 20px hsl(190 95% 50% / 0.15)' }}
              >
                <p className="text-sm font-bold text-[hsl(190,95%,50%)] uppercase tracking-wider">
                  ¡Reserva tu cita ya! 💈
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(0,0%,40%)]">
                @diegcutz • Link en bio
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
