export type Difficulty = 'apprentice' | 'barber' | 'master' | 'legend';
export const DIFFICULTIES: Record<Difficulty, { name: string; gravity: number; lives: number; save: number; speed: number }> = {
  apprentice: { name: 'Aprendiz', gravity: .72, lives: 5, save: 18, speed: 1 },
  barber: { name: 'Barbero', gravity: .9, lives: 3, save: 12, speed: 1.15 },
  master: { name: 'Maestro', gravity: 1.08, lives: 3, save: 7, speed: 1.3 },
  legend: { name: 'Leyenda', gravity: 1.23, lives: 2, save: 4, speed: 1.45 },
};
export const CHAPTERS = [
  { name: 'La primera silla', short: '01 / APERTURA', color: 'mint', icon: 'chair' },
  { name: 'Acero & pulso', short: '02 / TIJERAS', color: 'red', icon: 'scissors' },
  { name: 'El degradado', short: '03 / PRECISIÓN', color: 'mint', icon: 'clipper' },
  { name: 'Navaja de autor', short: '04 / FILO', color: 'gold', icon: 'razor' },
  { name: 'Hora punta', short: '05 / MULTIBOLA', color: 'red', icon: 'pole' },
  { name: 'La firma DIEGCUTZ', short: '06 / LEYENDA', color: 'gold', icon: 'crown' },
];
const TITLES = ['Primer cliente', 'Buen pulso', 'Abrimos el estudio', 'Acero templado', 'Doble filo', 'Corte maestro', 'Low fade', 'Mid fade', 'Skin fade', 'Espuma & acero', 'A contrapelo', 'La línea perfecta', 'Sin cita previa', 'Tres sillas', 'Último turno', 'Firma propia', 'El corte imposible', 'DIEGCUTZ: la leyenda'];
export type Level = { id: number; chapter: number; name: string; score: number; bumpers: number; targets: number; loops: number; layout: number; multiball: boolean };
export const LEVELS: Level[] = TITLES.map((name, id) => ({ id, chapter: Math.floor(id / 3), name, score: 3000 + id * 1600, bumpers: 6 + id * 2, targets: 2 + Math.floor(id / 2), loops: Math.floor(id / 4), layout: id % 6, multiball: id >= 12 }));
export const WIDTH = 600;
export const HEIGHT = 1000;
export const SAVE_KEY = 'dc-tilt-fade-v1';
export type Progress = { unlocked: number; records: Record<string, number>; medals: Record<string, number> };
export const EMPTY_PROGRESS: Progress = { unlocked: 0, records: {}, medals: {} };
export function loadProgress(): Progress {
  try { const p = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return p && Number.isInteger(p.unlocked) && p.unlocked >= 0 && p.unlocked < LEVELS.length ? { unlocked: p.unlocked, records: p.records || {}, medals: p.medals || {} } : { ...EMPTY_PROGRESS }; } catch { return { ...EMPTY_PROGRESS }; }
}
export function saveProgress(p: Progress) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch { /* Local persistence is optional. */ } }
export function desktopAllowed(width: number, fine: boolean, hover: boolean, mobile: boolean) { return width >= 1024 && fine && hover && !mobile; }
export function cheatSequence(previous: string, key: string) { return /^\d$/.test(key) ? (previous + key).slice(-4) : ''; }
export function completed(level: Level, stats: { score: number; bumpers: number; targets: number; loops: number }) { return stats.score >= level.score && stats.bumpers >= level.bumpers && stats.targets >= level.targets && stats.loops >= level.loops; }
export function recordRun(p: Progress, level: number, difficulty: Difficulty, score: number, medal: number, assisted: boolean): Progress {
  if (assisted) return p;
  const key = `${level}:${difficulty}`;
  return { unlocked: Math.min(17, Math.max(p.unlocked, level + 1)), records: { ...p.records, [key]: Math.max(score, p.records[key] || 0) }, medals: { ...p.medals, [key]: Math.max(medal, p.medals[key] || 0) } };
}