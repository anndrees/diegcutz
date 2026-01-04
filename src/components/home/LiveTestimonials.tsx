import { useState, useEffect, useCallback } from "react";
import { Star, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    // Start exit animation after 4 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4000);

    // Remove completely after animation
    const removeTimer = setTimeout(() => {
      onComplete(notification.id);
    }, 4500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, onComplete]);

  const rating = notification.rating;

  return (
    <div
      className={`
        fixed right-4 z-50 w-80 max-w-[calc(100vw-2rem)]
        bg-gradient-to-br from-card to-background
        border-2 border-neon-cyan/50 rounded-xl p-4
        shadow-lg shadow-neon-cyan/20
        transition-all duration-500 ease-out
        ${notification.isVisible && !isExiting 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0"
        }
      `}
      style={{ 
        top: `${80 + notification.position * 110}px`,
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-xl bg-neon-cyan/5 animate-pulse" />
      
      <div className="relative">
        {/* Header with stars */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= rating.rating
                    ? "fill-neon-cyan text-neon-cyan"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(rating.created_at), "d MMM", { locale: es })}
          </span>
        </div>

        {/* Comment */}
        {rating.comment && (
          <p className="text-sm text-foreground line-clamp-2 mb-2 italic">
            "{rating.comment}"
          </p>
        )}

        {/* Author */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-neon-purple/20 flex items-center justify-center">
            <span className="text-xs font-bold text-neon-purple">
              {(rating.profile?.full_name || "A")[0].toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-neon-purple">
            @{rating.profile?.username || "cliente"}
          </span>
        </div>
      </div>

      {/* Animated border */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.3), transparent)`,
            animation: "shimmer 2s linear infinite",
          }}
        />
      </div>
    </div>
  );
};

export const LiveTestimonials = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Show a new testimonial every 6 seconds
  useEffect(() => {
    if (ratings.length === 0) return;

    const showTestimonial = () => {
      const rating = ratings[currentIndex % ratings.length];
      const notificationId = `${rating.id}-${Date.now()}`;
      
      setNotifications(prev => {
        // Only keep max 3 notifications
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

    // Show first one after 3 seconds
    const initialTimeout = setTimeout(showTestimonial, 3000);
    
    // Then show every 6 seconds
    const interval = setInterval(showTestimonial, 6000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [ratings, currentIndex]);

  if (ratings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Custom styles for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      {/* Floating section indicator */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-neon-cyan/30 rounded-full px-3 py-1.5">
        <MessageCircle className="h-4 w-4 text-neon-cyan animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {ratings.length} opiniones
        </span>
      </div>

      {/* Toast notifications */}
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
