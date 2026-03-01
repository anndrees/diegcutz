import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Timer, Scissors, Music, QrCode, User, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type ActiveBooking = {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  services: string[];
  total_price: number;
  playlist_url?: string | null;
  user_id?: string | null;
  profile?: {
    full_name: string;
    username: string;
  } | null;
};

interface ActiveAppointmentBannerProps {
  onOpenQrScanner: () => void;
}

export const ActiveAppointmentBanner = ({ onOpenQrScanner }: ActiveAppointmentBannerProps) => {
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(60);

  useEffect(() => {
    checkActiveBooking();
    const interval = setInterval(checkActiveBooking, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeBooking) return;

    const updateTime = () => {
      const now = new Date();
      const bookingStart = parseISO(`${activeBooking.booking_date}T${activeBooking.booking_time}`);
      const elapsedMins = differenceInMinutes(now, bookingStart);
      const remainingMins = 60 - elapsedMins;
      setElapsed(Math.max(0, elapsedMins));
      setRemaining(Math.max(0, remainingMins));
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [activeBooking]);

  const checkActiveBooking = async () => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const currentHour = now.getHours();
    const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:00:00`;
    // Also check the previous hour slot
    const prevHour = currentHour - 1;
    const prevTimeStr = `${prevHour.toString().padStart(2, "0")}:00:00`;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, booking_date, booking_time, client_name, services, total_price, playlist_url, user_id,
        profile:profiles(full_name, username)
      `)
      .eq("booking_date", todayStr)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .order("booking_time", { ascending: true });

    if (error || !data) return;

    // Find booking that is currently in progress (started within last hour)
    const active = data.find((b) => {
      const bookingStart = parseISO(`${b.booking_date}T${b.booking_time}`);
      const elapsedMins = differenceInMinutes(now, bookingStart);
      return elapsedMins >= 0 && elapsedMins < 60;
    });

    if (active) {
      setActiveBooking({
        ...active,
        services: Array.isArray(active.services) ? (active.services as string[]) : [],
        profile: Array.isArray(active.profile) ? active.profile[0] : active.profile,
      });
    } else {
      setActiveBooking(null);
    }
  };

  if (!activeBooking) return null;

  const progressPercent = Math.min(100, (elapsed / 60) * 100);

  return (
    <div className="mb-6 relative overflow-hidden rounded-2xl border-2 border-neon-cyan/40 bg-gradient-to-r from-card via-card to-neon-cyan/5">
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 via-transparent to-neon-cyan/5 animate-pulse" />
      
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30">
        <div 
          className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="relative p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Live indicator + Client */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <Scissors className="h-6 w-6 text-neon-cyan" />
              </div>
              {/* Pulsing live dot */}
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                  🔴 EN CURSO
                </span>
              </div>
              <p className="font-bold text-foreground truncate text-lg">
                {activeBooking.user_id && activeBooking.profile ? (
                  <Link 
                    to={`/admin/client/${activeBooking.user_id}`}
                    className="text-neon-cyan hover:underline inline-flex items-center gap-1"
                  >
                    {activeBooking.profile.full_name}
                    <User className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  activeBooking.client_name
                )}
              </p>
            </div>
          </div>

          {/* Time info */}
          <div className="flex items-center gap-4 text-sm shrink-0">
            <div className="flex items-center gap-1.5 bg-neon-purple/10 px-3 py-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-neon-purple" />
              <span className="font-mono font-bold text-neon-purple">{elapsed}min</span>
              <span className="text-muted-foreground text-xs">pasados</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neon-cyan/10 px-3 py-1.5 rounded-lg">
              <Timer className="h-4 w-4 text-neon-cyan" />
              <span className="font-mono font-bold text-neon-cyan">{remaining}min</span>
              <span className="text-muted-foreground text-xs">restantes</span>
            </div>
          </div>

          {/* Price */}
          <div className="shrink-0 text-right">
            <span className="text-2xl font-black text-neon-purple">{activeBooking.total_price}€</span>
          </div>
        </div>

        {/* Services + Actions row */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mt-3 pt-3 border-t border-border/30">
          {/* Services tags */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            {activeBooking.services.map((service, idx) => (
              <span
                key={idx}
                className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium"
              >
                {service}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {activeBooking.playlist_url && (
              <a href={activeBooking.playlist_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10">
                  <Music className="h-4 w-4 mr-1.5" />
                  Playlist
                </Button>
              </a>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenQrScanner}
              className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              <QrCode className="h-4 w-4 mr-1.5" />
              Fidelización
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
