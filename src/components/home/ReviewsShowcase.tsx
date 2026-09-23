import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
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

const ReviewCard = ({ rating, index, onInteraction }: { rating: Rating; index: number; onInteraction: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = (rating.profile?.username || "AN").slice(0, 2).toUpperCase();

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
      className="group relative bg-card border border-border p-5 md:p-6 hover:border-primary/60 transition-colors duration-300 shrink-0 w-[85vw] sm:w-[340px] md:w-auto snap-center"
    >
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 border border-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">{initials}</span>
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

        {rating.comment ? (
          <div className="mb-4">
            <p className={`text-sm text-foreground/90 leading-relaxed ${expanded ? "" : "line-clamp-4"}`}>
              "{rating.comment}"
            </p>
            {rating.comment.length > 120 && (
              <button
                onClick={() => {
                  setExpanded(!expanded);
                  onInteraction();
                }}
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

        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {services.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                 className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 font-medium"
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
  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [containerHeight, setContainerHeight] = useState<number | "auto">("auto");
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const VISIBLE_COUNT = isMobile ? 1 : 3;
  const INTERVAL_MS = 10000;

  useEffect(() => {
    loadRatings();
  }, []);

  const reorderNoConsecutiveSameUser = (items: Rating[]): Rating[] => {
    if (items.length <= 1) return items;
    const remaining = [...items];
    const result: Rating[] = [];
    const userKey = (r: Rating) => r.profile?.username || r.id;
    result.push(remaining.shift()!);
    while (remaining.length > 0) {
      const lastUser = userKey(result[result.length - 1]);
      const isLastIteration = remaining.length === 1;
      const firstUser = userKey(result[0]);
      let pickIdx = remaining.findIndex((r) => {
        if (userKey(r) === lastUser) return false;
        if (isLastIteration && userKey(r) === firstUser) return false;
        return true;
      });
      if (pickIdx === -1) {
        pickIdx = remaining.findIndex((r) => userKey(r) !== lastUser);
      }
      if (pickIdx === -1) pickIdx = 0;
      result.push(remaining.splice(pickIdx, 1)[0]);
    }
    return result;
  };

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
      setRatings(reorderNoConsecutiveSameUser(formattedRatings));
    }
    setLoading(false);
  };

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused && ratings.length > VISIBLE_COUNT) {
      timerRef.current = setInterval(() => {
        setDirection(1);
        setStartIndex((prev) => (prev + 1) % ratings.length);
      }, INTERVAL_MS);
    }
  }, [isPaused, ratings.length]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  // Animate container height when content changes (slide change or expand/collapse)
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const newHeight = measureRef.current.offsetHeight;
    setContainerHeight(newHeight);
  }, [startIndex, isMobile, ratings.length]);

  // Observe content size changes (e.g. ver más / ver menos)
  useEffect(() => {
    if (!measureRef.current || typeof ResizeObserver === "undefined") return;
    const el = measureRef.current;
    const ro = new ResizeObserver(() => {
      setContainerHeight(el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [startIndex]);

  const goNext = () => {
    setDirection(1);
    setStartIndex((prev) => (prev + 1) % ratings.length);
    resetTimer();
  };

  const goPrev = () => {
    setDirection(-1);
    setStartIndex((prev) => (prev - 1 + ratings.length) % ratings.length);
    resetTimer();
  };

  const handleInteraction = () => {
    resetTimer();
  };

  const getVisibleRatings = () => {
    if (ratings.length <= VISIBLE_COUNT) return ratings;
    const visible: Rating[] = [];
    for (let i = 0; i < VISIBLE_COUNT; i++) {
      visible.push(ratings[(startIndex + i) % ratings.length]);
    }
    return visible;
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-12 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ratings.length === 0) return null;

  const avgRating = ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;
  const visibleRatings = getVisibleRatings();
  const showArrows = ratings.length > VISIBLE_COUNT;

  return (
    <section className="reviews-editorial py-20 md:py-32 px-4 relative overflow-hidden border-y border-border">
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="reviews-editorial__header mb-14">
          <div className="inline-flex items-center justify-center gap-2 mb-5">
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

          <div><p className="customer-kicker mb-4">VOCES DEL ESTUDIO</p><h2 className="text-4xl md:text-6xl font-semibold text-foreground">Lo que permanece<br /><span className="text-primary">después del corte.</span></h2><p className="text-muted-foreground mt-5">Opiniones reales de quienes ya han pasado por el sillón.</p></div>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Arrows */}
          {showArrows && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="absolute -left-2 md:-left-14 top-1/2 -translate-y-1/2 z-10 bg-card border border-border/50 hover:bg-primary/10 hover:border-primary/40 h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="absolute -right-2 md:-right-14 top-1/2 -translate-y-1/2 z-10 bg-card border border-border/50 hover:bg-primary/10 hover:border-primary/40 h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Cards with slide + height animation */}
          <div
            className="overflow-hidden px-6 md:px-0 transition-[height] duration-500 ease-in-out"
            style={{ height: containerHeight === "auto" ? undefined : containerHeight }}
          >
            <div
              ref={measureRef}
              key={`slide-${startIndex}`}
              className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-5 ${
                direction === 1 ? "animate-slide-in-from-right" : "animate-slide-in-from-left"
              }`}
            >
              {visibleRatings.map((rating) => (
                <ReviewCard
                  key={`${rating.id}-${startIndex}`}
                  rating={rating}
                  index={0}
                  onInteraction={() => {
                    handleInteraction();
                    // Re-measure after expand/collapse
                    requestAnimationFrame(() => {
                      if (measureRef.current) setContainerHeight(measureRef.current.offsetHeight);
                    });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Dots */}
          {showArrows && (
            <div className="flex justify-center gap-1.5 mt-8">
              {ratings.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setStartIndex(idx);
                    resetTimer();
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === startIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/20 w-1.5 hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
