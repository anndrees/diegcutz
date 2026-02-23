import { useState, useEffect } from "react";
import { Star, X, ArrowRight, Calendar, Clock, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RatingDialog } from "@/components/RatingDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PendingBooking = {
  id: string;
  booking_date: string;
  booking_time: string;
  services: any;
  total_price: number;
};

export const PendingRatingBanner = () => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    if (user) loadPendingRatings();
  }, [user]);

  const loadPendingRatings = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_date, booking_time, services, total_price")
      .eq("user_id", user.id)
      .lt("booking_date", today)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .order("booking_date", { ascending: false })
      .limit(20);

    if (!bookings || bookings.length === 0) return;

    const bookingIds = bookings.map((b) => b.id);
    const { data: existingRatings } = await supabase
      .from("ratings")
      .select("booking_id")
      .in("booking_id", bookingIds);

    const ratedIds = new Set((existingRatings || []).map((r) => r.booking_id));
    const pending = bookings.filter((b) => !ratedIds.has(b.id));

    setPendingBookings(pending);
  };

  const handleRate = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setRatingDialogOpen(true);
    setShowSelector(false);
  };

  const handleRatingSubmitted = () => {
    setPendingBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
    setSelectedBookingId(null);
  };

  const handleBannerClick = () => {
    if (pendingBookings.length === 1) {
      handleRate(pendingBookings[0].id);
    } else {
      setShowSelector(true);
    }
  };

  const formatServices = (services: any): string => {
    if (Array.isArray(services)) {
      return services.map((s: string) => {
        // Remove price from service string like "DEGRADADO (8€)"
        const match = s.match(/^(.+?)\s*\(/);
        return match ? match[1] : s;
      }).join(", ");
    }
    return String(services);
  };

  if (!user || pendingBookings.length === 0 || dismissed) return null;

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500 via-primary to-amber-500 bg-[length:200%_100%] p-[2px] animate-[text-shimmer_3s_linear_infinite]">
          <div className="absolute inset-[2px] bg-card rounded-2xl" />
        </div>

        <div className="relative bg-card/95 backdrop-blur-sm rounded-2xl p-5 border border-transparent">
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>

          {!showSelector ? (
            // Banner view
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400 animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-base mb-1">
                  ¡Tienes {pendingBookings.length} {pendingBookings.length === 1 ? "visita" : "visitas"} sin valorar!
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Tu opinión nos ayuda a mejorar. ¡Déjanos una reseña! ⭐
                </p>

                <button
                  onClick={handleBannerClick}
                  className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors group"
                >
                  Valorar ahora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ) : (
            // Selector view - show all pending bookings
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setShowSelector(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
                <h3 className="font-bold text-foreground text-base">
                  ¿Qué visita quieres valorar?
                </h3>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {pendingBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => handleRate(booking.id)}
                    className="w-full text-left p-3 rounded-xl bg-muted/50 hover:bg-muted border border-border hover:border-amber-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        {format(new Date(booking.booking_date), "d 'de' MMMM yyyy", { locale: es })}
                      </div>
                      <span className="text-sm font-bold text-amber-400">
                        {booking.total_price}€
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.booking_time.slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <Package className="h-3 w-3" />
                        {formatServices(booking.services)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star className="h-3 w-3 fill-amber-400" />
                      Valorar esta visita
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedBookingId && user && (
        <RatingDialog
          bookingId={selectedBookingId}
          userId={user.id}
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </>
  );
};
