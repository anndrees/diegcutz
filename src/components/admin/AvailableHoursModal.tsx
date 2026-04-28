import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Scissors, X } from "lucide-react";

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
    if (open) loadBusinessHours();
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

  const toMinutes = (hhmm: string): number => {
    const [h, m] = hhmm.split(":").map((n) => parseInt(n));
    return (h || 0) * 60 + (m || 0);
  };

  // Returns 1h slots as minutes-from-midnight
  const getAvailableHours = (): number[] => {
    if (businessHours.length === 0) return [];
    const dayOfWeek = date.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    if (!dayConfig || dayConfig.is_closed) return [];
    const slotsSet: Set<number> = new Set();
    if (dayConfig.is_24h) {
      for (let h = 0; h < 23; h++) slotsSet.add(h * 60);
    } else {
      dayConfig.time_ranges.forEach(range => {
        const startMin = toMinutes(range.start);
        const endMin = toMinutes(range.end);
        for (let s = startMin; s + 60 <= endMin; s += 60) slotsSet.add(s);
      });
    }
    return Array.from(slotsSet).sort((a, b) => a - b);
  };

  const allHours = getAvailableHours();
  const bookedMinutes = bookedTimes.map((t) => toMinutes(t));
  const freeHours = allHours.filter((s) => !bookedMinutes.some((b) => Math.abs(s - b) < 60));
  const isClosed = allHours.length === 0;

  const dayName = format(date, "EEEE", { locale: es });
  const dayNumber = format(date, "d");
  const monthName = format(date, "MMMM", { locale: es });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 border-0 overflow-hidden bg-transparent shadow-none [&>button]:hidden">
        <div className="relative w-full rounded-3xl overflow-hidden select-none" style={{ aspectRatio: "9/16", maxHeight: "88vh" }}>
          
          {/* === DEEP DARK BASE === */}
          <div className="absolute inset-0 bg-[#030108]" />

          {/* === MASSIVE NEON GLOW ORBS === */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full animate-pulse" 
            style={{ background: 'radial-gradient(circle, hsl(280 100% 55% / 0.6) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full animate-pulse" 
            style={{ background: 'radial-gradient(circle, hsl(190 100% 50% / 0.5) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-0 w-60 h-60 rounded-full animate-pulse" 
            style={{ background: 'radial-gradient(circle, hsl(330 100% 55% / 0.35) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '2s' }} />
          <div className="absolute bottom-1/3 left-0 w-48 h-48 rounded-full animate-pulse" 
            style={{ background: 'radial-gradient(circle, hsl(260 100% 65% / 0.3) 0%, transparent 70%)', filter: 'blur(40px)', animationDelay: '0.5s' }} />

          {/* === SCAN LINES === */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)',
          }} />

          {/* === DIAGONAL STREAKS === */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 40px, hsl(280 80% 60%) 40px, hsl(280 80% 60%) 41px)',
          }} />

          {/* === CLOSE BUTTON === */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4 text-white/70" />
          </button>

          {/* === CONTENT === */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full px-6 py-8">
            
            {/* ── TOP: BRAND ── */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, hsl(190 95% 50%))' }} />
                <Scissors className="h-4 w-4" style={{ color: 'hsl(190 95% 50%)', filter: 'drop-shadow(0 0 6px hsl(190 95% 50%))' }} />
                <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, hsl(190 95% 50%), transparent)' }} />
              </div>
              <h2 className="text-5xl font-black tracking-[0.15em] font-aggressive" style={{
                background: 'linear-gradient(135deg, hsl(280 100% 70%), hsl(330 100% 65%), hsl(190 100% 55%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px hsl(280 100% 60% / 0.5))',
              }}>
                DIEGCUTZ
              </h2>
              <p className="text-[10px] uppercase tracking-[0.5em] font-semibold" style={{
                color: 'hsl(190 95% 50%)',
                textShadow: '0 0 10px hsl(190 95% 50% / 0.5)',
              }}>Urban Barbershop</p>
            </div>

            {/* ── MIDDLE: DATE + HOURS ── */}
            <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6 py-4">
              
              {/* Date */}
              <div className="text-center space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] font-bold" style={{
                  color: 'hsl(330 100% 65%)',
                  textShadow: '0 0 15px hsl(330 100% 65% / 0.5)',
                }}>{dayName}</p>
                <div className="flex items-baseline justify-center gap-3">
                  <span className="text-8xl font-black text-white leading-none" style={{
                    textShadow: '0 0 40px hsl(280 100% 70% / 0.4), 0 0 80px hsl(280 100% 60% / 0.2)',
                  }}>{dayNumber}</span>
                  <span className="text-2xl font-bold uppercase tracking-wider" style={{
                    color: 'hsl(190 100% 55%)',
                    textShadow: '0 0 20px hsl(190 100% 55% / 0.5)',
                  }}>{monthName}</span>
                </div>
                {/* Neon underline */}
                <div className="w-32 h-1 mx-auto rounded-full mt-2" style={{
                  background: 'linear-gradient(90deg, hsl(280 100% 60%), hsl(190 100% 55%), hsl(330 100% 65%))',
                  boxShadow: '0 0 15px hsl(280 100% 60% / 0.6), 0 0 30px hsl(190 100% 55% / 0.3)',
                }} />
              </div>

              {/* Hours */}
              {loading ? (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 animate-spin" style={{ color: 'hsl(190 95% 50%)' }} />
                  <span className="text-white/50 text-sm">Cargando...</span>
                </div>
              ) : isClosed ? (
                <div className="text-center space-y-4">
                  <div className="text-7xl">🚫</div>
                  <p className="text-3xl font-black uppercase tracking-wider" style={{
                    color: 'hsl(0 85% 60%)',
                    textShadow: '0 0 25px hsl(0 85% 60% / 0.5)',
                  }}>CERRADO</p>
                </div>
              ) : freeHours.length === 0 ? (
                <div className="text-center space-y-4">
                  <div className="text-7xl">🔥</div>
                  <p className="text-3xl font-black uppercase tracking-wider" style={{
                    color: 'hsl(330 100% 65%)',
                    textShadow: '0 0 25px hsl(330 100% 65% / 0.5)',
                  }}>¡COMPLETO!</p>
                  <p className="text-white/40 text-sm">Todo ocupado 💪</p>
                </div>
              ) : (
                <div className="w-full space-y-5">
                  {/* Count badge */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(90deg, transparent, hsl(280 80% 60% / 0.5))' }} />
                    <div className="px-5 py-2 rounded-full border" style={{
                      borderColor: 'hsl(190 100% 55% / 0.4)',
                      background: 'hsl(190 100% 55% / 0.08)',
                      boxShadow: '0 0 20px hsl(190 100% 55% / 0.15), inset 0 0 20px hsl(190 100% 55% / 0.05)',
                    }}>
                      <span className="text-xs uppercase tracking-[0.3em] font-bold" style={{
                        color: 'hsl(190 100% 55%)',
                        textShadow: '0 0 8px hsl(190 100% 55% / 0.5)',
                      }}>
                        {freeHours.length} {freeHours.length === 1 ? 'HUECO' : 'HUECOS'} LIBRES
                      </span>
                    </div>
                    <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(90deg, hsl(280 80% 60% / 0.5), transparent)' }} />
                  </div>
                  
                  {/* Hour pills */}
                  <div className="grid grid-cols-3 gap-2.5 w-full max-w-[300px] mx-auto">
                    {freeHours.map((slotMin, i) => (
                      <div
                        key={slotMin}
                        className="relative flex items-center justify-center py-3.5 rounded-2xl overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, hsl(280 80% 60% / ${0.12 + i * 0.02}) 0%, hsl(190 95% 50% / ${0.08 + i * 0.01}) 100%)`,
                          border: '1px solid hsl(280 80% 60% / 0.25)',
                          boxShadow: `0 0 15px hsl(280 80% 60% / 0.12), 0 0 30px hsl(190 95% 50% / 0.06), inset 0 1px 0 hsl(280 80% 80% / 0.1)`,
                        }}
                      >
                        {/* Inner glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                          background: 'radial-gradient(circle at center, hsl(280 80% 60% / 0.15) 0%, transparent 70%)',
                        }} />
                        <span className="relative text-xl font-black text-white tracking-wider" style={{
                          textShadow: '0 0 15px hsl(280 100% 70% / 0.5)',
                        }}>
                          {`${Math.floor(slotMin / 60).toString().padStart(2, "0")}:${(slotMin % 60).toString().padStart(2, "0")}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── BOTTOM: CTA ── */}
            <div className="text-center space-y-4 w-full">
              {/* CTA Button */}
              <div className="relative mx-auto max-w-[280px]">
                {/* Glow behind */}
                <div className="absolute inset-0 rounded-2xl" style={{
                  background: 'linear-gradient(135deg, hsl(280 100% 60%), hsl(190 100% 55%))',
                  filter: 'blur(15px)',
                  opacity: 0.4,
                }} />
                <div className="relative px-8 py-4 rounded-2xl font-black text-lg uppercase tracking-[0.15em] text-white text-center" style={{
                  background: 'linear-gradient(135deg, hsl(280 100% 55%), hsl(330 100% 55%), hsl(190 100% 50%))',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 3s ease infinite',
                  boxShadow: '0 0 20px hsl(280 100% 60% / 0.4), 0 0 40px hsl(190 100% 55% / 0.2)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}>
                  💈 ¡Reserva ya!
                </div>
              </div>
              
              {/* Social handle */}
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-10" style={{ background: 'linear-gradient(90deg, transparent, hsl(0 0% 30%))' }} />
                <p className="text-[11px] uppercase tracking-[0.25em] font-medium" style={{ color: 'hsl(0 0% 40%)' }}>
                  @diegcutz
                </p>
                <div className="h-px w-10" style={{ background: 'linear-gradient(90deg, hsl(0 0% 30%), transparent)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Gradient animation keyframes */}
        <style>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};
