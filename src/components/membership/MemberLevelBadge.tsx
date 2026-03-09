import { Crown } from "lucide-react";

interface Props {
  consecutiveMonths: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const LEVELS = [
  { min: 0, name: "Bronze", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", glow: "" },
  { min: 3, name: "Silver", color: "text-gray-300", bg: "bg-gray-300/10 border-gray-300/30", glow: "" },
  { min: 6, name: "Gold", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10 border-[#D4AF37]/30", glow: "shadow-[0_0_10px_rgba(212,175,55,0.3)]" },
  { min: 12, name: "Diamond", color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/30", glow: "shadow-[0_0_10px_rgba(0,200,220,0.3)]" },
];

export const getMemberLevel = (months: number) => {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (months >= l.min) level = l;
  }
  return level;
};

export const MemberLevelBadge = ({ consecutiveMonths, showLabel = true, size = "sm" }: Props) => {
  const level = getMemberLevel(consecutiveMonths);
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${level.bg} ${level.glow}`}>
      <Crown className={`${iconSize} ${level.color}`} />
      {showLabel && <span className={level.color}>{level.name}</span>}
    </div>
  );
};
