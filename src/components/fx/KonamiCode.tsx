import { useEffect, useState, useRef } from "react";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
  "Enter",
];

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  emoji: string;
  size: number;
  drift: number;
}

const EMOJIS = ["💈", "✂️", "🔥", "💎", "⚡", "👑", "🎉", "🚀", "💜", "🩵"];

export const KonamiCode = () => {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ignore typing in inputs/textareas/contentEditable
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.isContentEditable)
      ) {
        return;
      }

      const expected = SEQUENCE[indexRef.current];
      const key =
        expected.length === 1 ? e.key.toLowerCase() : e.key;
      const exp = expected.length === 1 ? expected.toLowerCase() : expected;

      if (key === exp) {
        indexRef.current += 1;
        if (indexRef.current === SEQUENCE.length) {
          indexRef.current = 0;
          trigger();
        }
      } else {
        // allow restart if first key matches
        indexRef.current = key === SEQUENCE[0].toLowerCase() ? 1 : 0;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const trigger = () => {
    if (active) return;

    // build particles
    const list: Particle[] = Array.from({ length: 80 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.5 + Math.random() * 2.5,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      size: 18 + Math.random() * 28,
      drift: (Math.random() - 0.5) * 200,
    }));
    setParticles(list);
    setActive(true);

    // activate rave mode globally
    document.documentElement.classList.add("konami-rave");

    // optional sound (short blip via WebAudio, no file needed)
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.12);
      });
    } catch {
      // ignore audio errors
    }

    window.setTimeout(() => {
      setActive(false);
      setParticles([]);
      document.documentElement.classList.remove("konami-rave");
    }, 6000);
  };

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* radial flash */}
      <div className="absolute inset-0 konami-flash" />

      {/* particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-10%] konami-particle select-none"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // @ts-expect-error css var
            "--drift": `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* center title */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-6 konami-title">
          <div
            className="text-5xl md:text-8xl font-black tracking-tighter"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)), hsl(var(--neon-pink)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter:
                "drop-shadow(0 0 20px hsl(var(--neon-cyan) / 0.8)) drop-shadow(0 0 40px hsl(var(--neon-purple) / 0.6))",
            }}
          >
            DIEGCUTZ
          </div>
          <div
            className="mt-2 text-xl md:text-3xl font-bold uppercase tracking-[0.3em] text-cyan-400"
            style={{
              filter: "drop-shadow(0 0 12px hsl(var(--neon-cyan) / 0.9))",
            }}
          >
            ⚡ MODE UNLOCKED ⚡
          </div>
          <div className="mt-4 text-xs md:text-sm uppercase tracking-widest text-white/70">
            Cheat code activated
          </div>
        </div>
      </div>
    </div>
  );
};
