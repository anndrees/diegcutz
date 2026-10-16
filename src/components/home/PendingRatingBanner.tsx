import { useState, useEffect } from "react";
import { Star, X, ArrowRight, Clock, Scissors } from "lucide-react";
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
    setPendingBookings(bookings.filter((b) => !ratedIds.has(b.id)));
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
    if (pendingBookings.length === 1) handleRate(pendingBookings[0].id);
    else setShowSelector(true);
  };

  const formatServices = (services: any): string => {
    if (Array.isArray(services)) {
      return services
        .map((s: string) => {
          const match = s.match(/^(.+?)\s*\(/);
          return match ? match[1] : s;
        })
        .join(" · ");
    }
    return String(services);
  };

  if (!user || pendingBookings.length === 0 || dismissed) return null;

  const count = pendingBookings.length;
  const latest = pendingBookings[0];

  return (
    <>
      <div className="rating-notice">
        <button className="rating-notice__close" onClick={() => setDismissed(true)} aria-label="Cerrar aviso">
          <X className="h-4 w-4" />
        </button>

        {!showSelector ? (
          <div className="rating-notice__main">
            <div className="rating-notice__stars" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            <div className="rating-notice__copy">
              <p className="rating-notice__kicker">Tu opinión</p>
              <h3>
                {count === 1 ? "Tienes una visita sin valorar" : `Tienes ${count} visitas sin valorar`}
              </h3>
              <p className="rating-notice__meta">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(`${latest.booking_date}T00:00:00`), "d 'de' MMMM", { locale: es })} · {latest.booking_time.slice(0, 5)}
                <Scissors className="h-3.5 w-3.5" />
                {formatServices(latest.services)}
              </p>
            </div>
            <button className="rating-notice__cta" onClick={handleBannerClick}>
              Valorar ahora <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rating-notice__list">
            <div className="rating-notice__list-head">
              <button onClick={() => setShowSelector(false)} aria-label="Volver">
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              <h3>¿Qué visita quieres valorar?</h3>
            </div>
            <div className="rating-notice__items">
              {pendingBookings.map((booking) => (
                <button key={booking.id} onClick={() => handleRate(booking.id)}>
                  <span>
                    <strong>{format(new Date(`${booking.booking_date}T00:00:00`), "d 'de' MMMM yyyy", { locale: es })}</strong>
                    <small>{booking.booking_time.slice(0, 5)} · {formatServices(booking.services)}</small>
                  </span>
                  <Star className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        )}
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
