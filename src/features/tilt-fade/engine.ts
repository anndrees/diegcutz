import Matter from 'matter-js';
import { DIFFICULTIES, WIDTH, HEIGHT, completed, type Difficulty, type Level } from './data';
import { PinballAudio } from './audio';
const { Engine, Bodies, Body, Composite, Events, Vector } = Matter;
export type Stats = { score: number; bumpers: number; targets: number; loops: number; lives: number; combo: number; multiplier: number; balls: number; phase: number; state: 'ready' | 'playing' | 'won' | 'lost'; assisted: boolean; save: number; tilt: number; charge: number; message: string };
export type Cheats = { immortal: boolean; slow: boolean; magnet: boolean; autoFlip: boolean; gravity: number; multiplier: number; trails: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Popup = { x: number; y: number; text: string; life: number };
export class PinballEngine {
  engine = Engine.create({ enableSleeping: false });
  audio = new PinballAudio();
  stats: Stats;
  cheats: Cheats = { immortal: false, slow: false, magnet: false, autoFlip: false, gravity: 1, multiplier: 1, trails: true };
  balls: Matter.Body[] = [];
  walls: Matter.Body[] = [];
  bumpers: Matter.Body[] = [];
  targets: Matter.Body[] = [];
  flippers: Matter.Body[] = [];
  lights = new Map<number, number>();
  history = new Map<number, { x: number; y: number }[]>();
  hitTimes = new Map<number, number>();
  sparks: Spark[] = [];
  popups: Popup[] = [];
  keys = new Set<string>();
  muted = false;
  paused = false;
  time = 0;
  lastHit = -100;
  leftAngle = .28;
  rightAngle = Math.PI - .28;
  saveUntil = 0;
  chargeStarted = 0;
  nudges: number[] = [];
  tiltUntil = 0;
  loopCooldown = new Map<number, number>();
  lastBallPositions = new Map<number, { x: number; y: number }>();
  colors = { ink: '', paper: '', red: '', mint: '', gold: '', steel: '', muted: '' };
  constructor(public level: Level, public difficulty: Difficulty, public canvas: HTMLCanvasElement, public backplate: HTMLImageElement, public onUpdate: (stats: Stats) => void) {
    const css = getComputedStyle(canvas);
    for (const key of Object.keys(this.colors) as (keyof typeof this.colors)[]) this.colors[key] = css.getPropertyValue(`--pin-${key}`).trim();
    this.stats = { score: 0, bumpers: 0, targets: 0, loops: 0, lives: DIFFICULTIES[difficulty].lives, combo: 0, multiplier: 1, balls: 0, phase: 1, state: 'ready', assisted: false, save: 0, tilt: 0, charge: 0, message: 'LA SILLA ESTÁ LISTA' };
    this.engine.gravity.y = DIFFICULTIES[difficulty].gravity;
    const line = (x1: number, y1: number, x2: number, y2: number, thickness = 13, label = 'rail') => {
      const body = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(x2 - x1, y2 - y1), thickness, { isStatic: true, angle: Math.atan2(y2 - y1, x2 - x1), restitution: .7, friction: .005, label });
      this.walls.push(body); return body;
    };
    line(35, 975, 35, 155); line(580, 975, 580, 155); line(526, 990, 526, 275, 11);
    for (let i = 0; i < 16; i++) {
      const a = Math.PI + i * Math.PI / 16, b = Math.PI + (i + 1) * Math.PI / 16;
      line(307 + 272 * Math.cos(a), 170 + 125 * Math.sin(a), 307 + 272 * Math.cos(b), 170 + 125 * Math.sin(b));
    }
    line(35, 700, 162, 824); line(526, 700, 422, 824);
    line(90, 555, 160, 735, 15, 'sling'); line(160, 735, 188, 790, 15, 'sling');
    line(470, 555, 400, 735, 15, 'sling'); line(400, 735, 374, 790, 15, 'sling');
    line(80, 310, 120, 400); line(485, 310, 452, 400);
    const positions = [[215, 265], [360, 265], [285, 385]];
    positions.forEach(([x, y], i) => { const shift = this.level.layout % 3 * 12; this.bumpers.push(Bodies.circle(x + (i === 0 ? -shift : i === 1 ? shift : 0), y + (this.level.layout > 2 ? 30 : 0), 34, { isStatic: true, restitution: 1.3, label: 'bumper' })); });
    if (level.layout === 4 || level.layout === 5) this.bumpers.push(Bodies.circle(285, 545, 25, { isStatic: true, restitution: 1.2, label: 'bumper' }));
    [[120, 450], [170, 478], [220, 500], [350, 500], [400, 478], [450, 450]].forEach(([x, y]) => this.targets.push(Bodies.rectangle(x, y, 31, 12, { isStatic: true, label: 'target', angle: x < 285 ? .4 : -.4, restitution: .9 })));
    this.flippers = [Bodies.rectangle(222, 852, 128, 23, { isStatic: true, label: 'flipper', angle: this.leftAngle, chamfer: { radius: 11 } }), Bodies.rectangle(350, 852, 128, 23, { isStatic: true, label: 'flipper', angle: this.rightAngle, chamfer: { radius: 11 } })];
    Composite.add(this.engine.world, [...this.walls, ...this.bumpers, ...this.targets, ...this.flippers]);
    Events.on(this.engine, 'collisionStart', event => {
      for (const pair of event.pairs) {
        const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB.label === 'ball' ? pair.bodyB : null;
        if (!ball) continue;
        const other = pair.bodyA === ball ? pair.bodyB : pair.bodyA;
        if (other.label === 'bumper' || other.label === 'target' || other.label === 'sling') {
          if (this.time - (this.hitTimes.get(other.id) ?? -10) < .1) continue;
          this.hitTimes.set(other.id, this.time);
          this.lights.set(other.id, this.time + .22);
          const dir = Vector.normalise(Vector.sub(ball.position, other.position));
          Body.setVelocity(ball, Vector.mult(dir, (other.label === 'bumper' ? 11 : 8) * DIFFICULTIES[this.difficulty].speed));
          if (other.label === 'bumper') { this.stats.bumpers++; this.addScore(150, ball.position.x, ball.position.y); this.audio.play('bumper'); }
          if (other.label === 'target') { this.stats.targets++; this.addScore(350, ball.position.x, ball.position.y); this.audio.play('target'); }
          this.burst(ball.position.x, ball.position.y, other.label === 'bumper' ? this.colors.mint : this.colors.red);
          if (this.stats.targets > 0 && this.stats.targets % 6 === 0 && other.label === 'target') {
            this.stats.multiplier = Math.min(8, this.stats.multiplier + 1); this.stats.message = `ACERO PERFECTO · ×${this.stats.multiplier}`;
            if (level.multiball && this.balls.length < 3) this.multiball();
          }
        }
      }
    });
    this.spawn(true); this.emit();
  }
  emit() { this.onUpdate({ ...this.stats, balls: this.balls.length }); }
  spawn(ready = false) {
    const ball = Bodies.circle(ready ? 553 : 285, ready ? 910 : 190, 11, { label: 'ball', restitution: .65, friction: .002, frictionAir: .001, density: .006 });
    if (ready) Body.setStatic(ball, true);
    this.balls.push(ball); Composite.add(this.engine.world, ball); this.history.set(ball.id, []);
    if (!ready) Body.setVelocity(ball, { x: (Math.random() - .5) * 6, y: 3 });
    return ball;
  }
  launch(power = .75) {
    if (this.stats.state !== 'ready' || this.paused) return;
    this.audio.start(); this.audio.play('launch');
    const ball = this.balls.find(b => b.isStatic); if (!ball) return;
    Body.setStatic(ball, false); Body.setVelocity(ball, { x: -2.2, y: -22 - Math.max(.25, power) * 9 });
    this.stats.state = 'playing'; this.saveUntil = this.time + DIFFICULTIES[this.difficulty].save; this.stats.message = 'QUE EMPIECE EL CORTE'; this.stats.charge = 0; this.emit();
  }
  keyDown(key: string) { if (this.keys.has(key)) return; this.keys.add(key); if (key === 'Space' && this.stats.state === 'ready') { this.chargeStarted = this.time; this.audio.start(); } if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(key)) this.audio.play('flip', .6); if (key === 'KeyN') this.nudge(); }
  keyUp(key: string) { this.keys.delete(key); if (key === 'Space') this.launch(Math.min(1, Math.max(.25, (this.time - this.chargeStarted) / 1.2))); }
  addScore(base: number, x: number, y: number) {
    this.stats.combo = this.time - this.lastHit < 2 ? Math.min(12, this.stats.combo + 1) : 1; this.lastHit = this.time;
    const points = Math.round(base * this.stats.multiplier * this.cheats.multiplier * (1 + (this.stats.combo - 1) * .15));
    this.stats.score += points; this.popups.push({ x, y, text: `+${points}`, life: 1 });
  }
  burst(x: number, y: number, color: string) { for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2; this.sparks.push({ x, y, vx: Math.cos(a) * (60 + Math.random() * 140), vy: Math.sin(a) * (60 + Math.random() * 140), color, life: .5 + Math.random() * .3 }); } }
  multiball() { this.audio.start(); while (this.balls.length < 3) this.spawn(); this.saveUntil = this.time + 8; this.stats.message = 'HORA PUNTA · MULTIBOLA'; this.emit(); }
  nudge() {
    if (this.stats.state !== 'playing' || this.time < this.tiltUntil) return;
    this.nudges = this.nudges.filter(t => this.time - t < 5); this.nudges.push(this.time);
    if (this.nudges.length >= 3) { this.tiltUntil = this.time + 3; this.stats.message = 'TILT · MANOS FUERA'; return; }
    this.balls.forEach(b => Body.setVelocity(b, { x: b.velocity.x + (b.position.x < 285 ? 3 : -3), y: b.velocity.y - 4 }));
  }
  rescue() { for (const b of this.balls) { if (b.isStatic) continue; Body.setPosition(b, { x: 285, y: 210 }); Body.setVelocity(b, { x: 0, y: 1 }); this.history.set(b.id, []); } }
  assist() { this.stats.assisted = true; this.emit(); }
  finish(force = false) { if (force) this.assist(); this.stats.state = 'won'; this.stats.phase = 3; this.stats.message = 'CORTE COMPLETADO'; this.audio.play('win'); this.emit(); }
  step(dt: number) {
    if (this.paused || this.stats.state === 'won' || this.stats.state === 'lost') return;
    const scaled = dt * (this.cheats.slow ? .45 : 1); this.time += scaled;
    this.engine.gravity.y = DIFFICULTIES[this.difficulty].gravity * this.cheats.gravity;
    this.stats.charge = this.keys.has('Space') && this.stats.state === 'ready' ? Math.min(1, (this.time - this.chargeStarted) / 1.2) : 0;
    const canFlip = this.time > this.tiltUntil;
    const auto = this.cheats.autoFlip && this.balls.some(b => b.position.y > 735 && b.position.y < 890);
    const left = canFlip && (this.keys.has('ArrowLeft') || this.keys.has('KeyA') || auto), right = canFlip && (this.keys.has('ArrowRight') || this.keys.has('KeyD') || auto);
    const oldAngles = [this.leftAngle, this.rightAngle];
    this.leftAngle += ((left ? -.48 : .28) - this.leftAngle) * .5;
    this.rightAngle += ((right ? Math.PI + .48 : Math.PI - .28) - this.rightAngle) * .5;
    this.flippers.forEach((f, i) => {
      const angle = i === 0 ? this.leftAngle : this.rightAngle, pivotX = i === 0 ? 158 : 414;
      Body.setPosition(f, { x: pivotX + Math.cos(angle) * 64, y: 835 + Math.sin(angle) * 64 }); Body.setAngle(f, angle);
      if ((i === 0 ? left : right) && Math.abs(angle - oldAngles[i]) > .002) {
        for (const b of this.balls) { if (b.isStatic) continue; const local = Vector.rotate(Vector.sub(b.position, f.position), -angle); if (Math.abs(local.x) < 78 && Math.abs(local.y) < 36 && b.position.y < 888) { Body.setVelocity(b, { x: (i === 0 ? 1 : -1) * (3 + Math.abs(local.x) * .07), y: -15 - Math.abs(local.x) * .07 }); this.burst(b.position.x, b.position.y, this.colors.gold); } }
      }
    });
    // Fixed steps plus a velocity cap avoid thin-rail tunnelling.
    for (const b of this.balls) { const speed = Vector.magnitude(b.velocity); if (speed > 32) Body.setVelocity(b, Vector.mult(b.velocity, 32 / speed)); if (this.cheats.magnet && !b.isStatic && b.position.y > 650) Body.applyForce(b, b.position, { x: (285 - b.position.x) * .000015, y: -.0014 }); }
    Engine.update(this.engine, scaled * 1000);
    for (const b of [...this.balls]) {
      const hist = this.history.get(b.id) || []; hist.push({ ...b.position }); if (hist.length > 24) hist.shift(); this.history.set(b.id, hist);
      const previous = this.lastBallPositions.get(b.id);
      if (previous && previous.y >= 180 && b.position.y < 180 && b.position.x > 70 && b.position.x < 500 && this.time - (this.loopCooldown.get(b.id) || -10) > 2) { this.stats.loops++; this.addScore(1000, b.position.x, b.position.y); this.audio.play('loop'); this.loopCooldown.set(b.id, this.time); this.stats.message = 'VUELTA PERFECTA'; }
      this.lastBallPositions.set(b.id, { ...b.position });
      if (b.position.y > 1030 || b.position.x < 0 || b.position.x > 620) {
        Composite.remove(this.engine.world, b); this.balls = this.balls.filter(v => v.id !== b.id); this.history.delete(b.id); this.lastBallPositions.delete(b.id); this.loopCooldown.delete(b.id);
        if (!this.balls.length) {
          if (this.cheats.immortal || this.time < this.saveUntil) { this.spawn(true); this.stats.state = 'ready'; this.stats.message = 'BOLA SALVADA'; }
          else { this.stats.lives--; this.audio.play('drain'); this.stats.combo = 0; if (this.stats.lives <= 0) { this.stats.state = 'lost'; this.stats.message = 'FIN DEL TURNO'; } else { this.spawn(true); this.stats.state = 'ready'; this.stats.message = 'OTRA SILLA TE ESPERA'; } }
        }
      }
    }
    this.stats.phase = this.stats.bumpers >= this.level.bumpers ? this.stats.targets >= this.level.targets ? 3 : 2 : 1;
    this.stats.save = Math.max(0, Math.ceil(this.saveUntil - this.time)); this.stats.tilt = Math.max(0, this.tiltUntil - this.time);
    if (this.time - this.lastHit > 2) this.stats.combo = 0;
    if (completed(this.level, this.stats)) this.finish();
    this.sparks.forEach(s => { s.x += s.vx * scaled; s.y += s.vy * scaled; s.vy += 180 * scaled; s.life -= scaled; }); this.sparks = this.sparks.filter(s => s.life > 0);
    this.popups.forEach(p => { p.y -= 45 * scaled; p.life -= scaled; }); this.popups = this.popups.filter(p => p.life > 0);
  }
  draw() {
    const c = this.canvas.getContext('2d'); if (!c) return;
    c.clearRect(0, 0, WIDTH, HEIGHT); c.drawImage(this.backplate, 0, 0, WIDTH, HEIGHT);
    const { ink, paper, red, mint, gold, steel, muted } = this.colors;
    const poly = (body: Matter.Body, color: string, stroke: string, width = 2) => { c.beginPath(); body.vertices.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fillStyle = color; c.fill(); c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); };
    const text = (t: string, x: number, y: number, size: number, color: string, weight = '600') => { c.font = `${weight} ${size}px Archivo, sans-serif`; c.fillStyle = color; c.textAlign = 'center'; c.fillText(t, x, y); };
    c.save(); c.globalAlpha = .65; c.fillStyle = ink; c.fillRect(120, 112, 338, 82); c.restore();
    text('DIEGCUTZ', 289, 148, 29, paper, '900'); text('T I L T   &   F A D E', 289, 174, 12, gold);
    for (const w of this.walls) {
      c.save(); c.shadowColor = w.label === 'sling' ? red : steel; c.shadowBlur = w.label === 'sling' ? 13 : 4;
      poly(w, ink, w.label === 'sling' ? red : steel, w.label === 'sling' ? 3 : 2); c.restore();
      c.beginPath(); c.moveTo(w.vertices[0].x, w.vertices[0].y); c.lineTo(w.vertices[1].x, w.vertices[1].y); c.strokeStyle = paper; c.lineWidth = .7; c.stroke();
    }
    this.bumpers.forEach((b, i) => {
      const lit = (this.lights.get(b.id) || 0) > this.time, r = b.circleRadius || 34;
      c.save(); c.shadowColor = lit ? gold : mint; c.shadowBlur = lit ? 35 : 12;
      const g = c.createRadialGradient(b.position.x - 10, b.position.y - 12, 1, b.position.x, b.position.y, r); g.addColorStop(0, paper); g.addColorStop(.18, steel); g.addColorStop(.36, ink); g.addColorStop(.73, ink); g.addColorStop(.8, lit ? gold : mint); g.addColorStop(.92, steel); g.addColorStop(1, ink);
      c.beginPath(); c.arc(b.position.x, b.position.y, r, 0, Math.PI * 2); c.fillStyle = g; c.fill(); c.strokeStyle = lit ? gold : mint; c.lineWidth = 2; c.stroke(); c.restore();
      text(['DC', 'CUT', 'FADE', 'VIP'][i], b.position.x, b.position.y + 5, i === 0 ? 18 : 12, lit ? gold : paper);
      c.beginPath(); c.arc(b.position.x, b.position.y, r + 8 + Math.sin(this.time * 3 + i) * 2, 0, Math.PI * 2); c.strokeStyle = muted; c.lineWidth = .7; c.stroke();
    });
    this.targets.forEach((b, i) => { const lit = (this.lights.get(b.id) || 0) > this.time; c.save(); c.shadowColor = red; c.shadowBlur = lit ? 22 : 5; poly(b, lit ? gold : red, paper, 1); c.restore(); text(['S', 'T', 'Y', 'L', 'E', '!'][i], b.position.x, b.position.y - 16, 13, paper); });
    text('ACERO', 286, 450, 11, muted); text('LA FIRMA', 286, 610, 14, gold); text(`× ${this.stats.multiplier}`, 286, 641, 28, paper);
    // The barber pole bonus lamps and precision markings.
    for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? paper : red; c.beginPath(); c.roundRect(52, 485 + i * 15, 19, 11, 3); c.fill(); c.fillStyle = i % 2 ? paper : mint; c.beginPath(); c.roundRect(492, 485 + i * 15, 19, 11, 3); c.fill(); }
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(234 + i * 52, 720, 9, 0, Math.PI * 2); c.fillStyle = this.stats.phase > i ? mint : ink; c.fill(); c.strokeStyle = steel; c.stroke(); } text('PULSO   /   FILO   /   FIRMA', 286, 752, 10, muted);
    this.flippers.forEach((f, i) => { const g = c.createLinearGradient(0, f.position.y - 15, 0, f.position.y + 15); g.addColorStop(0, paper); g.addColorStop(.35, steel); g.addColorStop(.5, paper); g.addColorStop(1, muted); c.save(); c.shadowColor = red; c.shadowBlur = 10; poly(f, g as unknown as string, red, 3); c.restore(); const pivotX = i === 0 ? 158 : 414; c.beginPath(); c.arc(pivotX, 835, 8, 0, 7); c.fillStyle = ink; c.fill(); c.strokeStyle = gold; c.stroke(); });
    c.fillStyle = muted; c.fillRect(542, 925, 22, 36); for (let i = 0; i < 5; i++) { c.strokeStyle = steel; c.beginPath(); c.moveTo(541, 930 + i * 6); c.lineTo(565, 930 + i * 6); c.stroke(); }
    if (this.stats.save > 0) text(`BALL SAVE · ${this.stats.save}`, 286, 936, 12, mint); else text('MONÓVAR · PRECISION CLUB', 286, 953, 10, steel);
    if (this.stats.charge > 0) { c.fillStyle = gold; c.fillRect(542, 910 - this.stats.charge * 150, 20, this.stats.charge * 150); }
    for (const b of this.balls) {
      if (this.cheats.trails && !b.isStatic) { const h = this.history.get(b.id) || []; h.forEach((p, i) => { c.globalAlpha = i / h.length * .3; c.fillStyle = mint; c.beginPath(); c.arc(p.x, p.y, 8 * i / h.length, 0, 7); c.fill(); }); c.globalAlpha = 1; }
      const g = c.createRadialGradient(b.position.x - 4, b.position.y - 5, 0, b.position.x, b.position.y, 12); g.addColorStop(0, paper); g.addColorStop(.3, steel); g.addColorStop(.65, muted); g.addColorStop(.84, ink); g.addColorStop(1, steel); c.save(); c.shadowColor = ink; c.shadowBlur = 7; c.shadowOffsetY = 4; c.fillStyle = g; c.beginPath(); c.arc(b.position.x, b.position.y, 11, 0, 7); c.fill(); c.restore();
    }
    this.sparks.forEach(s => { c.globalAlpha = Math.min(1, s.life * 2); c.fillStyle = s.color; c.fillRect(s.x, s.y, 3, 3); });
    this.popups.forEach(p => { c.globalAlpha = p.life; text(p.text, p.x, p.y, 18, gold); }); c.globalAlpha = 1;
    if (this.stats.tilt > 0) text('TILT', 286, 580, 60, red, '900');
  }
  destroy() { this.audio.close(); Events.off(this.engine, 'collisionStart'); Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}