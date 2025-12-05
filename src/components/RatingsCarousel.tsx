import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Rating = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile: {
    username: string;
    full_name: string;
  } | null;
  booking: {
    services: string[];
  } | null;
};

export const RatingsCarousel = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    const { data, error } = await supabase
      .from("ratings")
      .select(`
        id,
        rating,
        comment,
        created_at,
        profile:profiles(username, full_name),
        booking:bookings(services)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const formattedRatings = data.map(r => ({
        ...r,
        profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
        booking: Array.isArray(r.booking) ? r.booking[0] : r.booking,
      })) as Rating[];
      setRatings(formattedRatings);
    }
    setLoading(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % ratings.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + ratings.length) % ratings.length);
  };

  useEffect(() => {
    if (ratings.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [ratings.length]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando valoraciones...</div>
      </div>
    );
  }

  if (ratings.length === 0) {
    return null;
  }

  const currentRating = ratings[currentIndex];

  return (
    <section className="py-20 px-4 bg-card/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-5xl font-black text-center mb-4 text-neon-purple">
          💬 OPINIONES
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Lo que dicen nuestros clientes
        </p>

        <div className="relative">
          {/* Navigation Buttons */}
          {ratings.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-neon-cyan hover:bg-neon-cyan/20"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-neon-cyan hover:bg-neon-cyan/20"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Rating Card */}
          <div className="bg-gradient-to-br from-card to-background border-2 border-primary/30 rounded-xl p-8 mx-12 transition-all duration-500">
            <Quote className="h-10 w-10 text-primary/40 mb-4" />
            
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= currentRating.rating
                      ? "fill-neon-cyan text-neon-cyan"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>

            {/* Comment */}
            {currentRating.comment && (
              <p className="text-lg text-foreground mb-6 italic">
                "{currentRating.comment}"
              </p>
            )}

            {/* Services */}
            {currentRating.booking?.services && currentRating.booking.services.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Servicios:</p>
                <div className="flex flex-wrap gap-2">
                  {currentRating.booking.services.map((service, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div>
                <p className="font-bold text-neon-purple">
                  {currentRating.profile?.full_name || "Cliente anónimo"}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{currentRating.profile?.username || "anónimo"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(currentRating.created_at), "d MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>

          {/* Dots Indicator */}
          {ratings.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {ratings.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-neon-cyan w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-12">
          <div className="text-center">
            <p className="text-4xl font-black text-neon-cyan">{ratings.length}</p>
            <p className="text-sm text-muted-foreground">Valoraciones</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-neon-purple">
              {(ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">Media</p>
          </div>
        </div>
      </div>
    </section>
  );
};
