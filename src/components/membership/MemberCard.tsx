import { QRCodeSVG } from "qrcode.react";
import { Crown, Sparkles } from "lucide-react";

interface Props {
  userName: string;
  planName: string;
  planEmoji: string;
  endDate: string;
  memberSince: string;
  loyaltyToken: string | null;
}

export const MemberCard = ({ userName, planName, planEmoji, endDate, memberSince, loyaltyToken }: Props) => {
  const formattedEnd = new Date(endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const formattedSince = new Date(memberSince).toLocaleDateString("es-ES", { month: "short", year: "numeric" });

  return (
    <div className="relative rounded-2xl overflow-hidden max-w-sm mx-auto">
      {/* Card background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.1) 45%, rgba(212,175,55,0.3) 50%, rgba(212,175,55,0.1) 55%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "card-shine 4s ease-in-out infinite",
      }} />
      <div className="absolute inset-0 rounded-2xl border-2 border-[#D4AF37]/50" />

      {/* Corner accents */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]/60 rounded-tl-lg" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]/60 rounded-tr-lg" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]/60 rounded-bl-lg" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]/60 rounded-br-lg" />

      <div className="relative p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-black text-[#D4AF37] tracking-wider">DIEGCUTZ</h2>
          <p className="text-[10px] text-[#D4AF37]/60 tracking-[0.3em] uppercase">Member Card</p>
        </div>

        {/* Plan badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          <span className="text-lg font-bold text-[#D4AF37]">{planEmoji} {planName}</span>
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
        </div>

        {/* User info */}
        <div className="text-center mb-4">
          <p className="text-white font-bold text-lg">{userName}</p>
          <p className="text-white/40 text-xs">Miembro desde {formattedSince}</p>
        </div>

        {/* Dates */}
        <div className="flex justify-between text-xs text-white/40 mb-4 px-2">
          <span>Válida hasta: <span className="text-[#D4AF37]">{formattedEnd}</span></span>
        </div>

        {/* QR */}
        {loyaltyToken && (
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-xl p-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <QRCodeSVG
                value={loyaltyToken}
                size={100}
                level="H"
                fgColor="#1a1a2e"
                bgColor="#ffffff"
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes card-shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
