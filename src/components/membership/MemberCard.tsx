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

export const MemberCard = ({ userName, planName, endDate, memberSince, loyaltyToken }: Props) => {
  const formattedEnd = new Date(endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const formattedSince = new Date(memberSince).toLocaleDateString("es-ES", { month: "short", year: "numeric" });

  return (
    <div className="relative overflow-hidden max-w-sm mx-auto bg-card border border-primary">

      {/* Corner accents */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-primary/60" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-primary/60" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-primary/60" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-primary/60" />

      <div className="relative p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-black text-primary tracking-wider">DIEGCUTZ</h2>
          <p className="text-[10px] text-primary/60 tracking-[0.3em] uppercase">Member Card</p>
        </div>

        {/* Plan badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-primary">{planName}</span>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>

        {/* User info */}
        <div className="text-center mb-4">
          <p className="text-foreground font-bold text-lg">{userName}</p>
          <p className="text-muted-foreground text-xs">Miembro desde {formattedSince}</p>
        </div>

        {/* Dates */}
        <div className="flex justify-between text-xs text-muted-foreground mb-4 px-2">
          <span>Válida hasta: <span className="text-primary">{formattedEnd}</span></span>
        </div>

        {/* QR */}
        {loyaltyToken && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 border border-border">
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

    </div>
  );
};
