import { useState, useEffect } from "react";
import { Star, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RatingDialog } from "@/components/RatingDialog";

type PendingBooking = {
  id: string;
  booking_date: string;
  services: any;
};

export const PendingRatingBanner = () => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadPendingRatings();
  }, [user]);

  const loadPendingRatings = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    // Get past bookings that don't have ratings yet
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_date, services")
      .eq("user_id", user.id)
      .lt("booking_date", today)
      .or("is_cancelled.is.null,is_cancelled.eq.false")
      .order("booking_date", { ascending: false })
      .limit(10);

    if (!bookings || bookings.length === 0) return;

    // Get existing ratings for these bookings
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
  };

  const handleRatingSubmitted = () => {
    setPendingBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
    setSelectedBookingId(null);
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
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            {/* Animated star icon */}
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
                onClick={() => handleRate(pendingBookings[0].id)}
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors group"
              >
                Valorar ahora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
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
