import Phaser from "phaser";
import portraitUrl from "@/assets/cut-beat-portrait.jpg";
import { cutPoints, cutTime, judgeCut, MODES, TOTAL_CUTS, type CutGrade, type CutMode } from "./cutBeatRules";

export type CutStats = { score: number; combo: number; bestCombo: number; perfect: number; hits: number; cuts: number; grade: CutGrade | ""; offset: number };
export const emptyStats = (): CutStats => ({ score: 0, combo: 0, bestCombo: 0, perfect: 0, hits: 0, cuts: 0, grade: "", offset: 0 });
type Options = { mode: CutMode; reduced: boolean; onStats: (stats: CutStats) => void; onCountdown: (value: number) => void; onEnd: (stats: CutStats) => void };

export class CutBeatScene extends Phaser.Scene {
  private options: Options;
  private started = false;
  private elapsed = 0;
  private index = 0;
  private stats = emptyStats();
  private lines: Phaser.GameObjects.Graphics | undefined;
  private blade: Phaser.GameObjects.Graphics | undefined;
  private trail: Phaser.GameObjects.Graphics | undefined;
  private colors = { ink: 0, paper: 0, signal: 0, muted: 0 };
  private audio: AudioContext | undefined;
  private muted = false;
  private lastBeat = -1;
  private lastCountdown = -1;
  private targetY = 220;
  private pausedByUser = false;

  constructor(options: Options) { super("cut-beat"); this.options = options; }

  preload() { this.load.image("portrait", portraitUrl); }

  create() {
    const style = getComputedStyle(document.documentElement);
    const color = (name: string) => {
      const [h, s, l] = style.getPropertyValue(name).trim().split(/\s+/).map(parseFloat);
      return Phaser.Display.Color.HSLToColor(h / 360, s / 100, l / 100).color;
    };
    this.colors = { ink: color("--ink"), paper: color("--paper"), signal: color("--signal"), muted: color("--muted-foreground") };
    this.cameras.main.setBackgroundColor(this.colors.paper);
    this.add.image(450, 515, "portrait").setDisplaySize(670, 1005);
    const grid = this.add.graphics();
    grid.lineStyle(1, this.colors.ink, 0.09);
    for (let x = 30; x < 900; x += 60) { grid.lineBetween(x, 0, x, 1000); }
    grid.lineBetween(0, 200, 900, 200); grid.lineBetween(0, 790, 900, 790);
    grid.lineStyle(1, this.colors.ink, 0.35);
    [150, 750].forEach(x => { grid.lineBetween(x, 160, x, 380); grid.lineBetween(x - 8, 160, x + 8, 160); grid.lineBetween(x - 8, 380, x + 8, 380); });
    this.trail = this.add.graphics();
    this.lines = this.add.graphics();
    this.blade = this.add.graphics();
    this.input.on("pointerdown", () => this.cut());
    this.input.keyboard?.on("keydown-SPACE", (event: KeyboardEvent) => { event.preventDefault(); if (!event.repeat) this.cut(); });
    this.input.keyboard?.on("keydown-P", () => this.game.events.emit("toggle-pause"));
    this.game.events.on("cut", this.cut, this);
    this.game.events.on("start-round", this.startRound, this);
    this.game.events.on("pause-round", this.pauseRound, this);
    this.game.events.on("mute-round", (muted: boolean) => { this.muted = muted; });
    this.events.once("shutdown", () => {
      this.game.events.removeAllListeners();
      void this.audio?.close();
    });
    this.game.events.emit("ready");
  }

  private startRound(mode: CutMode) {
    this.options.mode = mode;
    this.elapsed = 0; this.index = 0; this.stats = emptyStats();
    this.lastBeat = -1; this.lastCountdown = -1; this.pausedByUser = false;
    this.trail?.clear(); this.started = true;
    this.options.onStats({ ...this.stats });
    if (!this.audio) { try { this.audio = new AudioContext(); } catch { /* Sound is optional. */ } }
    void this.audio?.resume();
  }

  private pauseRound(paused: boolean) { this.pausedByUser = paused; }

  private playTone(kind: "beat" | "cut" | "miss", accent = false) {
    const audio = this.audio;
    if (!audio || this.muted || audio.state !== "running") return;
    const now = audio.currentTime;
    const osc = audio.createOscillator(); const gain = audio.createGain();
    osc.connect(gain); gain.connect(audio.destination);
    osc.type = kind === "cut" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(kind === "cut" ? 880 : kind === "miss" ? 90 : accent ? 140 : 100, now);
    osc.frequency.exponentialRampToValueAtTime(kind === "cut" ? 160 : 40, now + .12);
    gain.gain.setValueAtTime(kind === "miss" ? .06 : .18, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .16);
    osc.start(now); osc.stop(now + .18);
    if (kind === "beat" && accent) {
      const hat = audio.createOscillator(); const hg = audio.createGain();
      hat.type = "square"; hat.frequency.value = 6000; hg.gain.setValueAtTime(.012, now); hg.gain.exponentialRampToValueAtTime(.001, now + .04);
      hat.connect(hg); hg.connect(audio.destination); hat.start(now); hat.stop(now + .05);
    }
  }

  private cut() {
    if (!this.started || this.pausedByUser || this.elapsed < 3000 || this.index >= TOTAL_CUTS) return;
    const offset = this.elapsed - cutTime(this.index, this.options.mode);
    // Early taps give tactile feedback but cannot consume the next cut.
    if (offset < -300) { this.playTone("miss"); return; }
    this.resolve(judgeCut(offset), offset);
  }

  private resolve(grade: CutGrade, offset: number) {
    const hit = grade !== "MISS";
    this.stats.combo = hit ? this.stats.combo + 1 : 0;
    this.stats.score += cutPoints(grade, this.stats.combo - 1);
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.stats.combo);
    this.stats.perfect += grade === "PERFECT" ? 1 : 0;
    this.stats.hits += hit ? 1 : 0;
    this.stats.cuts++; this.stats.grade = grade; this.stats.offset = Math.round(offset);
    this.options.onStats({ ...this.stats });
    this.playTone(hit ? "cut" : "miss");
    if (hit) this.impact(this.targetY, grade === "PERFECT");
    this.index++;
    if (this.index === TOTAL_CUTS) {
      this.started = false; this.lines?.clear(); this.blade?.clear();
      this.options.onEnd({ ...this.stats });
    }
  }

  private impact(y: number, perfect: boolean) {
    this.trail?.lineStyle(perfect ? 4 : 2, this.colors.signal, .85).lineBetween(310, y, 590, y - 12);
    const slash = this.add.rectangle(450, y, 790, perfect ? 8 : 4, this.colors.signal).setRotation(-.08);
    this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.15, duration: 300, onComplete: () => slash.destroy() });
    if (this.options.reduced) return;
    if (perfect) this.cameras.main.shake(80, .003);
    for (let i = 0; i < 14; i++) {
      const piece = this.add.rectangle(450 + Phaser.Math.Between(-100, 100), y, Phaser.Math.Between(3, 7), Phaser.Math.Between(10, 26), i % 3 ? this.colors.ink : this.colors.signal);
      this.tweens.add({ targets: piece, x: piece.x + Phaser.Math.Between(-180, 180), y: y + Phaser.Math.Between(80, 300), angle: Phaser.Math.Between(-180, 180), alpha: 0, duration: 650, ease: "Cubic.Out", onComplete: () => piece.destroy() });
    }
  }

  update(_time: number, delta: number) {
    if (!this.started || this.pausedByUser) return;
    this.elapsed += Math.min(delta, 100);
    if (this.elapsed < 3000) {
      const count = 3 - Math.floor(this.elapsed / 1000);
      if (count !== this.lastCountdown) { this.lastCountdown = count; this.options.onCountdown(count); this.playTone("beat", true); }
      return;
    }
    if (this.lastCountdown !== 0) { this.lastCountdown = 0; this.options.onCountdown(0); }
    const interval = 60000 / MODES[this.options.mode].bpm;
    const beat = Math.floor((this.elapsed - 3000) / interval);
    if (beat !== this.lastBeat) { this.lastBeat = beat; this.playTone("beat", beat % 4 === 0); }
    if (this.index >= TOTAL_CUTS) return;
    const offset = this.elapsed - cutTime(this.index, this.options.mode);
    this.targetY = 190 + (this.index % 8) * 22;
    const x = 450 + Phaser.Math.Clamp(offset / (interval * .9), -1, 1) * 370;
    const lines = this.lines; const blade = this.blade;
    if (!lines || !blade) return;
    lines.clear(); blade.clear();
    lines.lineStyle(1, this.colors.ink, .3).lineBetween(80, this.targetY, 820, this.targetY);
    lines.lineStyle(2, this.colors.signal, .8).strokeRect(430, this.targetY - 32, 40, 64);
    lines.lineStyle(1, this.colors.signal, .45).lineBetween(450, 140, 450, 395);
    lines.fillStyle(this.colors.signal, .12).fillRect(430, this.targetY - 32, 40, 64);
    blade.lineStyle(3, this.colors.ink).lineBetween(x, this.targetY - 70, x, this.targetY + 70);
    blade.fillStyle(this.colors.signal).fillTriangle(x - 12, this.targetY - 82, x + 12, this.targetY - 82, x, this.targetY - 64);
    blade.fillStyle(this.colors.paper).fillRect(x - 4, this.targetY - 26, 8, 52);
    if (offset > 160) this.resolve("MISS", offset);
  }
}

export function createCutBeat(parent: HTMLElement, options: Options) {
  return new Phaser.Game({ type: Phaser.AUTO, parent, width: 900, height: 1000, transparent: false, antialias: true, scene: new CutBeatScene(options), scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, audio: { noAudio: true }, input: { keyboard: true }, fps: { target: 60 } });
}