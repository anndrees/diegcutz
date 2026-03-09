import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown } from "lucide-react";
import { MemberLevelBadge } from "./MemberLevelBadge";

interface RankedMember {
  userId: string;
  userName: string;
  planName: string;
  planEmoji: string;
  totalMonths: number;
}

export const MemberRanking = () => {
  const [ranking, setRanking] = useState<RankedMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    // Get all membership history entries to count months
    const [historyRes, profilesRes, membershipsRes, activeRes] = await Promise.all([
      supabase.from("membership_history").select("user_id, action, created_at"),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("memberships").select("id, name, emoji"),
      supabase.from("user_memberships").select("user_id, membership_id, start_date").eq("status", "active"),
    ]);

    const profiles = new Map((profilesRes.data || []).map(p => [p.id, p.full_name]));
    const membershipMap = new Map((membershipsRes.data || []).map((m: any) => [m.id, m]));
    const activeMemberships = activeRes.data || [];

    // Calculate months active per user (based on renewals + initial activation)
    const userMonths: Record<string, number> = {};
    (historyRes.data || []).forEach((h: any) => {
      if (h.action === "activated" || h.action === "renewed") {
        userMonths[h.user_id] = (userMonths[h.user_id] || 0) + 1;
      }
    });

    // Include active members that might not have history entries
    activeMemberships.forEach(am => {
      if (!userMonths[am.user_id]) {
        userMonths[am.user_id] = 1;
      }
    });

    const ranked: RankedMember[] = Object.entries(userMonths)
      .map(([userId, totalMonths]) => {
        const activeMem = activeMemberships.find(am => am.user_id === userId);
        const plan = activeMem ? membershipMap.get(activeMem.membership_id) : null;
        return {
          userId,
          userName: profiles.get(userId) || "Desconocido",
          planName: plan?.name || "—",
          planEmoji: plan?.emoji || "",
          totalMonths,
        };
      })
      .sort((a, b) => b.totalMonths - a.totalMonths)
      .slice(0, 10);

    setRanking(ranked);
    setLoading(false);
  };

  if (loading) return null;
  if (ranking.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-[#D4AF37]" />
          Ranking de Miembros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.map((member, i) => (
            <div key={member.userId} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? "bg-[#D4AF37]/5 border border-[#D4AF37]/20" : "bg-muted/30"}`}>
              <span className="text-lg w-8 text-center shrink-0">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{member.userName}</p>
                <p className="text-xs text-muted-foreground">{member.planEmoji} {member.planName}</p>
              </div>
              <MemberLevelBadge consecutiveMonths={member.totalMonths} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{member.totalMonths} mes{member.totalMonths !== 1 ? "es" : ""}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
