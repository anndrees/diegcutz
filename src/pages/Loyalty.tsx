import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Crown, Sparkles, Gift } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const Loyalty = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<{
    completed_bookings: number;
    free_cuts_available: number;
  } | null>(null);
  const [loyaltyToken, setLoyaltyToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStampIndex, setNewStampIndex] = useState<number | null>(null);
  const prevStampsRef = useRef<number>(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(false);

    const [loyaltyRes, profileRes] = await Promise.all([
      supabase
        .from("loyalty_rewards")
        .select("completed_bookings, free_cuts_available")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("loyalty_token")
        .eq("id", user.id)
        .single(),
    ]);

    const data = loyaltyRes.data || { completed_bookings: 0, free_cuts_available: 0 };
    setLoyaltyData(data);
    prevStampsRef.current = data.completed_bookings % 10;
    setLoyaltyToken((profileRes.data as any)?.loyalty_token || null);
    setLoading(false);
  };

  // Subscribe to real-time updates on loyalty_rewards
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("loyalty-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loyalty_rewards",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const newStamps = payload.new.completed_bookings % 10;
            const oldStamps = prevStampsRef.current;
            
            // Trigger animation on the newly stamped circle
            if (newStamps > oldStamps) {
              setNewStampIndex(newStamps - 1); // 0-indexed
              setTimeout(() => setNewStampIndex(null), 1500);
            }
            
            prevStampsRef.current = newStamps;
            setLoyaltyData({
              completed_bookings: payload.new.completed_bookings,
              free_cuts_available: payload.new.free_cuts_available,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const stamps = loyaltyData ? loyaltyData.completed_bookings % 10 : 0;
  const totalVisits = loyaltyData?.completed_bookings || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 pt-safe">
      <style>{`
        @keyframes stamp-in {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes stamp-pop {
          0% { transform: scale(0) rotate(-360deg); opacity: 0; }
          40% { transform: scale(1.6) rotate(20deg); opacity: 1; }
          60% { transform: scale(0.9) rotate(-5deg); }
          80% { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes stamp-glow {
          0% { box-shadow: 0 0 0 0 rgba(212,175,55,0.8); }
          50% { box-shadow: 0 0 30px 10px rgba(212,175,55,0.6); }
          100% { box-shadow: 0 0 15px 5px rgba(212,175,55,0.4); }
        }
        .stamp-pop-in {
          animation: stamp-pop 0.8s ease-out forwards, stamp-glow 1.5s ease-out forwards;
        }
        @keyframes card-shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .stamp-enter {
          animation: stamp-in 0.5s ease-out forwards;
        }
        .card-shine {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(212, 175, 55, 0.1) 45%,
            rgba(212, 175, 55, 0.3) 50%,
            rgba(212, 175, 55, 0.1) 55%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: card-shine 4s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-md mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-3xl font-black text-[#D4AF37] font-aggressive">
              LOYALTY CARD
            </h1>
            <Crown className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <p className="text-muted-foreground">@{profile?.username}</p>
        </div>

        {/* Loyalty Card */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          {/* Card background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
          <div className="absolute inset-0 card-shine" />
          
          {/* Gold border */}
          <div className="absolute inset-0 rounded-2xl border-2 border-[#D4AF37]/50" />
          
          {/* Decorative corner accents */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]/60 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]/60 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]/60 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]/60 rounded-br-lg" />

          <div className="relative p-6 pt-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-[#D4AF37] tracking-wider">
                DIEGCUTZ
              </h2>
              <p className="text-xs text-[#D4AF37]/60 tracking-[0.3em] uppercase mt-1">
                Urban Barbershop · VIP Card
              </p>
            </div>

            {/* Stamps Grid */}
            <div className="grid grid-cols-5 gap-3 mb-6 px-2">
              {Array.from({ length: 10 }, (_, i) => {
                const isStamped = i < stamps;
                const isFree = i === 9; // 10th is the free one
                
                return (
                  <div
                    key={i}
                    className={`
                      relative aspect-square rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isStamped
                        ? "bg-gradient-to-br from-[#D4AF37] to-[#B8860B] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        : isFree
                          ? "border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5"
                          : "border-2 border-[#D4AF37]/20 bg-white/5"
                      }
                    `}
                  >
                    {isStamped ? (
                      <div className={i === newStampIndex ? "stamp-pop-in" : "stamp-enter"} style={i !== newStampIndex ? { animationDelay: `${i * 0.05}s` } : undefined}>
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#1a1a2e]" fill="currentColor">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                      </div>
                    ) : isFree ? (
                      <Gift className="w-5 h-5 text-[#D4AF37]/40" />
                    ) : (
                      <span className="text-[10px] text-[#D4AF37]/30 font-bold">{i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress text */}
            <div className="text-center mb-2">
              <p className="text-lg font-bold text-white">
                {stamps}/10 <span className="text-[#D4AF37]">sellos</span>
              </p>
              <p className="text-xs text-white/40">
                {10 - stamps === 0
                  ? "¡Has completado la tarjeta!"
                  : `Te faltan ${10 - stamps} para tu corte GRATIS`}
              </p>
            </div>

            {/* Free cut badge */}
            {loyaltyData && loyaltyData.free_cuts_available > 0 && (
              <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#B8860B]/20 border border-[#D4AF37]/50 rounded-xl p-3 text-center mb-4">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                  <span className="text-[#D4AF37] font-bold text-lg">
                    ¡CORTE GRATIS DISPONIBLE!
                  </span>
                  <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                </div>
              </div>
            )}

            {/* Total visits */}
            <div className="flex justify-between text-xs text-white/30 px-1 mb-4">
              <span>Total visitas: {totalVisits}</span>
              <span>Tarjetas completadas: {Math.floor(totalVisits / 10)}</span>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-[#D4AF37]/20 my-4" />

            {/* QR Code */}
            {loyaltyToken && (
              <div className="flex flex-col items-center">
                <p className="text-xs text-[#D4AF37]/60 uppercase tracking-widest mb-3">
                  Escanea para sumar sello
                </p>
                <div className="bg-white rounded-xl p-3 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  <QRCodeSVG
                    value={loyaltyToken}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#1a1a2e"
                    bgColor="#ffffff"
                  />
                </div>
                <p className="text-[10px] text-white/20 mt-2 font-mono">
                  {loyaltyToken.slice(0, 8)}...{loyaltyToken.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Cada visita suma un sello automáticamente.</p>
          <p>Al completar 10 sellos, recibirás un <strong className="text-[#D4AF37]">corte GRATIS</strong>.</p>
          <p className="text-xs">Muestra tu QR al barbero para sumar el sello al instante.</p>
        </div>
      </div>
    </div>
  );
};

export default Loyalty;
