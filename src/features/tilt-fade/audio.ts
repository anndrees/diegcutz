export class PinballAudio {
  context: AudioContext | null = null;
  muted = false;
  start() { if (!this.context) this.context = new AudioContext(); if (this.context.state === 'suspended') void this.context.resume(); }
  play(kind: 'bumper' | 'target' | 'flip' | 'launch' | 'drain' | 'win' | 'loop', strength = 1) {
    if (!this.context || this.muted) return;
    const c = this.context, now = c.currentTime;
    const notes = { bumper: [440, 880], target: [660, 990], flip: [90], launch: [150, 500], drain: [220, 110], win: [523, 659, 784, 1046], loop: [392, 523, 784] }[kind];
    notes.forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = kind === 'flip' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(freq, now + i * .065); o.frequency.exponentialRampToValueAtTime(kind === 'launch' ? freq * 2 : freq * .85, now + i * .065 + .14);
      g.gain.setValueAtTime(0, now + i * .065); g.gain.linearRampToValueAtTime(.08 * strength, now + i * .065 + .005); g.gain.exponentialRampToValueAtTime(.001, now + i * .065 + .2);
      o.connect(g); g.connect(c.destination); o.start(now + i * .065); o.stop(now + i * .065 + .23);
    });
  }
  close() { void this.context?.close(); }
}