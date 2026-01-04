import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Check, X } from "lucide-react";
import { AchievementIcon } from "./AchievementIcon";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger_type: string;
  is_active: boolean;
}

interface UserAchievement {
  achievement_id: string;
  awarded_at: string;
  awarded_by: string;
}

interface ClientAchievementsProps {
  userId: string;
}

export const ClientAchievements = ({ userId }: ClientAchievementsProps) => {
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const [achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from("achievements").select("*").eq("is_active", true).order("created_at"),
      supabase.from("user_achievements").select("*").eq("user_id", userId),
    ]);

    if (achievementsRes.data) {
      setAchievements(achievementsRes.data);
    }
    if (userAchievementsRes.data) {
      setUserAchievements(userAchievementsRes.data);
    }
    setLoading(false);
  };

  const hasAchievement = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const getAchievementInfo = (achievementId: string) => {
    return userAchievements.find((ua) => ua.achievement_id === achievementId);
  };

  const toggleAchievement = async (achievement: Achievement) => {
    const has = hasAchievement(achievement.id);

    if (has) {
      // Remove achievement
      const { error } = await supabase
        .from("user_achievements")
        .delete()
        .eq("user_id", userId)
        .eq("achievement_id", achievement.id);

      if (error) {
        toast({ title: "Error", description: "No se pudo quitar el logro", variant: "destructive" });
        return;
      }
      toast({ title: "Logro quitado", description: `Se quitó "${achievement.name}"` });
    } else {
      // Award achievement
      const { error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          awarded_by: "admin",
        });

      if (error) {
        toast({ title: "Error", description: "No se pudo otorgar el logro", variant: "destructive" });
        return;
      }
      toast({ title: "Logro otorgado", description: `Se otorgó "${achievement.name}"` });
    }

    loadData();
  };

  if (loading) {
    return <div className="text-center py-4">Cargando logros...</div>;
  }

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-neon-cyan" />
          Logros ({earnedCount}/{totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {achievements.map((achievement) => {
            const earned = hasAchievement(achievement.id);
            const info = getAchievementInfo(achievement.id);

            return (
              <button
                key={achievement.id}
                onClick={() => toggleAchievement(achievement)}
                className={cn(
                  "relative p-3 rounded-lg border-2 transition-all text-left group",
                  earned
                    ? "border-neon-purple bg-neon-purple/10 hover:bg-neon-purple/20"
                    : "border-border bg-card/50 hover:bg-card opacity-50 hover:opacity-75"
                )}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      earned ? "bg-neon-purple/30 text-neon-purple" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <AchievementIcon icon={achievement.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold", earned ? "text-foreground" : "text-muted-foreground")}>
                      {achievement.name}
                    </p>
                    {earned && info && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(info.awarded_at), "d MMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggle indicator */}
                <div
                  className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs",
                    earned ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {earned ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </div>
              </button>
            );
          })}
        </div>

        {achievements.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No hay logros configurados</p>
        )}
      </CardContent>
    </Card>
  );
};
