import { useState, useEffect, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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

const ReviewCard = ({ rating, index }: { rating: Rating; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = (rating.profile?.username || "AN").slice(0, 2).toUpperCase();
  
  // Generate a consistent color from username
  const colors = [
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-indigo-500 to-blue-700",
  ];
  const colorIndex = (rating.profile?.username || "").length % colors.length;

  // Parse services - they come as JSON
  const services: string[] = (() => {
    if (!rating.booking?.services) return [];
    const raw = rating.booking.services;
    if (Array.isArray(raw)) {
      return raw.map((s: any) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean);
    }
    return [];
  })();

  return (
    <div
      className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_hsl(280_80%_60%/0.3)]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        {/* Header: Avatar + Username + Date */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center shrink-0 shadow-lg`}>
            <span className="text-sm font-black text-white tracking-tight">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm truncate">
              @{rating.profile?.username || "anónimo"}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(rating.created_at), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= rating.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* Comment */}
        {rating.comment ? (
          <div className="mb-4">
            <p className={`text-sm text-foreground/90 leading-relaxed ${expanded ? "" : "line-clamp-4"}`}>
              "{rating.comment}"
            </p>
            {rating.comment.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
              >
                {expanded ? (
                  <>Ver menos <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Ver más <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {Array.from({ length: rating.rating }).map((_, i) => (
                <Sparkles key={i} className="h-3 w-3 text-amber-400/60" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground italic">Sin comentario</span>
          </div>
        )}

        {/* Services tags */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {services.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium"
              >
                {service}
              </span>
            ))}
            {services.length > 3 && (
              <span className="text-[11px] text-muted-foreground px-2 py-0.5">
                +{services.length - 3} más
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ReviewsShowcase = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      const formattedRatings = data.map((r) => ({
        ...r,
        profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
        booking: Array.isArray(r.booking) ? r.booking[0] : r.booking,
      })) as Rating[];
      setRatings(formattedRatings);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-12 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ratings.length === 0) return null;

  const avgRating = ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;
  const displayed = ratings.slice(0, visibleCount);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-card/80 border border-border/50 rounded-full px-5 py-2 mb-6">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">· {ratings.length} valoraciones</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-3">
            Lo que dicen nuestros{" "}
            <span className="text-neon-purple">clientes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Opiniones reales de quienes ya han pasado por el sillón
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((rating, index) => (
            <ReviewCard key={rating.id} rating={rating} index={index} />
          ))}
        </div>

        {/* Show more button */}
        {visibleCount < ratings.length && (
          <div className="text-center mt-10">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="border-primary/30 hover:border-primary/60 hover:bg-primary/5"
            >
              Ver más opiniones ({ratings.length - visibleCount} restantes)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
