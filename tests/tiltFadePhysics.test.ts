import { describe, expect, it } from 'bun:test';
import { PinballEngine } from '../src/features/tilt-fade/engine';
import { LEVELS } from '../src/features/tilt-fade/data';
globalThis.getComputedStyle = (() => ({ getPropertyValue: () => '#ffffff' })) as unknown as typeof getComputedStyle;
const canvas = {} as HTMLCanvasElement;
const image = {} as HTMLImageElement;
describe('pinball playable physics', () => {
  it('launches a finite dynamic ball that travels out of the plunger lane', () => {
    const e = new PinballEngine(LEVELS[0], 'barber', canvas, image, () => {});
    e.audio.start = () => {};
    e.launch(.8);
    expect(e.balls[0].isStatic).toBe(false);
    expect(Number.isFinite(e.balls[0].mass)).toBe(true);
    for (let i = 0; i < 180; i++) e.step(1 / 120);
    expect(e.balls[0].position.x).toBeLessThan(525);
    expect(Number.isFinite(e.balls[0].position.y)).toBe(true);
    e.destroy();
  });
  it('keeps all eighteen table layouts finite under repeated flips', () => {
    for (const level of LEVELS) {
      const e = new PinballEngine(level, 'legend', canvas, image, () => {}); e.audio.start = () => {}; e.launch(.9); e.cheats.immortal = true;
      for (let i = 0; i < 1200; i++) { if (i % 60 < 20) e.keys.add('ArrowLeft'); else e.keys.delete('ArrowLeft'); if (i % 80 < 20) e.keys.add('ArrowRight'); else e.keys.delete('ArrowRight'); if (e.stats.state === 'ready') e.launch(.8); e.step(1 / 120); }
      for (const b of e.balls) { expect(Number.isFinite(b.position.x)).toBe(true); expect(Number.isFinite(b.position.y)).toBe(true); }
      e.destroy();
    }
  });
});