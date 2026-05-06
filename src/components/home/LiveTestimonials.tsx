import { useState, useEffect, useCallback } from "react";
import { Star, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

type Rating = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile: {
    username: string;
    full_name: string;
  } | null;
};

type ToastNotification = {
  id: string;
  rating: Rating;
  isVisible: boolean;
  position: number;
};

const TestimonialToast = ({ 
  notification, 
  onComplete 
}: { 
  notification: ToastNotification;
  onComplete: (id: string) => void;
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsEntering(false), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (expanded) return;

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 12000);

    const removeTimer = setTimeout(() => {
      onComplete(notification.id);
    }, 13000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, onComplete, expanded]);

  const rating = notification.rating;

  return (
    <div
      className={`
        fixed right-5 z-50 w-[340px] max-w-[calc(100vw-2rem)]
        bg-card/70 backdrop-blur-xl
        border border-neon-cyan/30 rounded-2xl p-4
        shadow-[0_8px_32px_-8px_rgba(0,245,255,0.25)]
        transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isEntering || isExiting
          ? "translate-x-6 opacity-0 scale-95 blur-sm"
          : "translate-x-0 opacity-100 scale-100 blur-0"
        }
      `}
      style={{ 
        top: `${96 + notification.position * 130}px`,
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= rating.rating
                    ? "fill-neon-cyan text-neon-cyan drop-shadow-[0_0_4px_rgba(0,245,255,0.6)]"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {format(new Date(rating.created_at), "d MMM", { locale: es })}
          </span>
        </div>

        {rating.comment && (
          <div className="mb-3">
            <p className={`text-sm text-foreground/90 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              "{rating.comment}"
            </p>
            {rating.comment.length > 60 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline mt-1"
              >
                {expanded ? (
                  <>Ver menos <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Ver más <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-cyan/20 flex items-center justify-center ring-1 ring-neon-purple/30">
            <span className="text-[11px] font-bold text-neon-purple">
              {(rating.profile?.full_name || "A")[0].toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-medium text-foreground/80">
            @{rating.profile?.username || "cliente"}
          </span>
        </div>
      </div>
    </div>
  );
};

export const LiveTestimonials = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

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
        profile:profiles(username, full_name)
      `)
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      const formattedRatings = data.map(r => ({
        ...r,
        profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
      })) as Rating[];
      setRatings(formattedRatings);
    }
  };

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Show testimonials only on desktop
  useEffect(() => {
    if (ratings.length === 0 || isMobile) return;

    const showTestimonial = () => {
      const rating = ratings[currentIndex % ratings.length];
      const notificationId = `${rating.id}-${Date.now()}`;
      
      setNotifications(prev => {
        const updated = prev.length >= 3 ? prev.slice(1) : prev;
        return [
          ...updated.map((n, i) => ({ ...n, position: i })),
          {
            id: notificationId,
            rating,
            isVisible: true,
            position: updated.length,
          },
        ];
      });

      setCurrentIndex(prev => (prev + 1) % ratings.length);
    };

    const initialTimeout = setTimeout(showTestimonial, 8000);
    const interval = setInterval(showTestimonial, 22000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [ratings, currentIndex, isMobile]);

  if (ratings.length === 0) {
    return null;
  }

  // Don't render toasts on mobile at all
  if (isMobile) {
    return (
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-neon-cyan/30 rounded-full px-3 py-1.5">
        <MessageCircle className="h-4 w-4 text-neon-cyan animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {ratings.length} opiniones
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-neon-cyan/30 rounded-full px-3 py-1.5">
        <MessageCircle className="h-4 w-4 text-neon-cyan animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {ratings.length} opiniones
        </span>
      </div>

      {notifications.map((notification) => (
        <TestimonialToast
          key={notification.id}
          notification={notification}
          onComplete={removeNotification}
        />
      ))}
    </>
  );
};