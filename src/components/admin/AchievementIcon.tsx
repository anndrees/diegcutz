import {
  Trophy,
  Award,
  Medal,
  Crown,
  Star,
  Heart,
  Gem,
  Sparkles,
  Baby,
  Repeat,
  Clover,
  Sunrise,
  Moon,
  CalendarDays,
  Music,
  Badge,
  Share2,
  MessageSquare,
  Zap,
  Flame,
  Target,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  award: Award,
  medal: Medal,
  crown: Crown,
  star: Star,
  heart: Heart,
  gem: Gem,
  sparkles: Sparkles,
  baby: Baby,
  repeat: Repeat,
  clover: Clover,
  sunrise: Sunrise,
  moon: Moon,
  "calendar-days": CalendarDays,
  music: Music,
  badge: Badge,
  "share-2": Share2,
  "message-square-star": MessageSquare,
  zap: Zap,
  flame: Flame,
  target: Target,
};

interface AchievementIconProps {
  icon: string;
  className?: string;
}

export const AchievementIcon = ({ icon, className }: AchievementIconProps) => {
  const IconComponent = iconMap[icon] || Trophy;
  return <IconComponent className={cn("h-5 w-5", className)} />;
};
