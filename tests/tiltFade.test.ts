import { describe, expect, it } from 'bun:test';
import { cheatSequence, desktopAllowed, LEVELS, DIFFICULTIES, completed, recordRun, EMPTY_PROGRESS } from '../src/features/tilt-fade/data';
describe('DIEGCUTZ pinball rules', () => {
  it('blocks mobile and tablets even with a large display', () => { expect(desktopAllowed(1400, true, true, true)).toBe(false); expect(desktopAllowed(393, false, false, true)).toBe(false); expect(desktopAllowed(1280, true, true, false)).toBe(true); });
  it('opens local cheats only for the exact 4444 sequence', () => { let s = ''; for (const key of '4444') s = cheatSequence(s, key); expect(s).toBe('4444'); expect(cheatSequence('444', '3')).not.toBe('4444'); expect(cheatSequence('444', 'ArrowLeft')).toBe(''); });
  it('provides 18 levels in six chapters and four difficulty settings', () => { expect(LEVELS.length).toBe(18); expect(new Set(LEVELS.map(l => l.chapter)).size).toBe(6); expect(Object.keys(DIFFICULTIES).length).toBe(4); expect(LEVELS[17].score).toBeGreaterThan(LEVELS[0].score); });
  it('requires all phase objectives, not only points', () => { expect(completed(LEVELS[0], { score: 3000, bumpers: 6, targets: 2, loops: 0 })).toBe(true); expect(completed(LEVELS[0], { score: 3000, bumpers: 5, targets: 2, loops: 0 })).toBe(false); });
  it('never writes assisted runs to campaign progression or records', () => { expect(recordRun(EMPTY_PROGRESS, 8, 'barber', 999999, 3, true)).toEqual(EMPTY_PROGRESS); expect(recordRun(EMPTY_PROGRESS, 0, 'barber', 4000, 3, false).unlocked).toBe(1); });
});