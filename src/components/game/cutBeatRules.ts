export type CutGrade = "PERFECT" | "CLEAN" | "MISS";
export const TOTAL_CUTS = 24;
export const MODES = { flow: { bpm: 100, name: "FLOW" }, rush: { bpm: 136, name: "RUSH" } } as const;
export type CutMode = keyof typeof MODES;

export function judgeCut(offsetMs: number): CutGrade {
  const distance = Math.abs(offsetMs);
  return distance <= 70 ? "PERFECT" : distance <= 160 ? "CLEAN" : "MISS";
}

export function cutPoints(grade: CutGrade, combo: number): number {
  return grade === "MISS" ? 0 : (grade === "PERFECT" ? 100 : 60) * Math.min(4, 1 + Math.floor(combo / 6));
}

export function cutTime(index: number, mode: CutMode): number {
  return 3000 + (index + 1) * 60000 / MODES[mode].bpm;
}

export function finalRank(perfect: number, hits: number): string {
  return perfect >= 22 ? "MASTER CUT" : hits >= 20 ? "FRESH CUT" : hits >= 12 ? "BUEN PULSO" : "OTRA RONDA";
}