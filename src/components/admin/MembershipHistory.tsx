import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { History, ArrowUp, ArrowDown, Crown, X, RotateCcw, Pause, Play } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  action: string;
  details: string | null;
  admin_note: string | null;
  created_at: string;
  membership_id: string | null;
  membership?: { name: string; emoji: string } | null;
}

interface Props {
  userId: string;
}

const ACTION_ICONS: Record<string, any> = {
  activated: Crown,
  renewed: RotateCcw,
  cancelled: X,
  upgraded: ArrowUp,
  downgraded: ArrowDown,
  paused: Pause,
  resumed: Play,
};

const ACTION_COLORS: Record<string, string> = {
  activated: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30",
  renewed: "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30",
  cancelled: "text-destructive bg-destructive/10 border-destructive/30",
  upgraded: "text-green-500 bg-green-500/10 border-green-500/30",
  downgraded: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
  paused: "text-muted-foreground bg-muted/50 border-border",
  resumed: "text-primary bg-primary/10 border-primary/30",
};

const ACTION_LABELS: Record<string, string> = {
  activated: "Activada",
  renewed: "Renovada",
  cancelled: "Cancelada",
  upgraded: "Upgrade",
  downgraded: "Downgrade",
  paused: "Pausada",
  resumed: "Reanudada",
};

export const MembershipHistory = ({ userId }: Props) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("membership_history")
      .select("*, membership:memberships(name, emoji)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setHistory(data.map((d: any) => ({
        ...d,
        membership: Array.isArray(d.membership) ? d.membership[0] : d.membership,
      })));
    }
    setLoading(false);
  };

  if (loading) return null;
  if (history.length === 0) return null;

  return (
    <Card className="bg-card border-border mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-muted-foreground" />
          Historial de Membresías
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {history.map((entry) => {
              const Icon = ACTION_ICONS[entry.action] || Crown;
              const colorClass = ACTION_COLORS[entry.action] || ACTION_COLORS.activated;

              return (
                <div key={entry.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className={`absolute left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-3 w-3" />
                  </div>

                  <div className={`p-3 rounded-lg border ${colorClass}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                        {entry.membership && (
                          <span className="text-xs text-muted-foreground">
                            {entry.membership.emoji} {entry.membership.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                    {entry.details && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                    )}
                    {entry.admin_note && (
                      <p className="text-xs italic mt-1 opacity-70">📝 {entry.admin_note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
