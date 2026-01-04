import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { AchievementIcon } from "@/components/admin/AchievementIcon";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface UserAchievement {
  achievement_id: string;
  awarded_at: string;
}

interface UserAchievementsProps {
  userId: string;
}

export const UserAchievements = ({ userId }: UserAchievementsProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const [achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from("achievements").select("id, name, description, icon").eq("is_active", true).order("created_at"),
      supabase.from("user_achievements").select("achievement_id, awarded_at").eq("user_id", userId),
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

  if (loading) {
    return null;
  }

  const earnedAchievements = achievements.filter((a) => hasAchievement(a.id));
  const lockedAchievements = achievements.filter((a) => !hasAchievement(a.id));

  if (achievements.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-neon-cyan" />
          Mis Logros ({earnedAchievements.length}/{achievements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {earnedAchievements.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            ¡Aún no tienes logros! Sigue visitándonos para desbloquearlos.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Earned achievements */}
            <div className="flex flex-wrap gap-3">
              {earnedAchievements.map((achievement) => {
                const info = getAchievementInfo(achievement.id);
                return (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-neon-purple/10 border-2 border-neon-purple cursor-help transition-transform hover:scale-105">
                        <div className="p-2 rounded-full bg-neon-purple/30 text-neon-purple">
                          <AchievementIcon icon={achievement.icon} className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-semibold text-center max-w-[80px] truncate">
                          {achievement.name}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-bold">{achievement.name}</p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {info && (
                        <p className="text-xs text-neon-cyan mt-1">
                          Obtenido el {format(new Date(info.awarded_at), "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Locked achievements preview */}
            {lockedAchievements.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Logros por desbloquear ({lockedAchievements.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {lockedAchievements.slice(0, 6).map((achievement) => (
                    <Tooltip key={achievement.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 p-2 rounded-lg bg-muted/30 border border-border opacity-50 cursor-help">
                          <AchievementIcon icon={achievement.icon} className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{achievement.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-bold">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {lockedAchievements.length > 6 && (
                    <div className="flex items-center p-2 text-xs text-muted-foreground">
                      +{lockedAchievements.length - 6} más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
