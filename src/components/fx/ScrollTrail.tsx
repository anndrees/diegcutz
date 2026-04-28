import { useEffect, useRef } from "react";

/**
 * Canvas of neon particles that react to scroll velocity.
 * On fast scroll, particles emit and leave a glowing trail.
 * On idle, they drift gently. Desktop only by default.
 */
export const ScrollTrail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return; // skip on touch

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; hue: number };
    const particles: P[] = [];
    const MAX = 90;

    let lastScroll = window.scrollY;
    let scrollVel = 0;
    let lastEmit = 0;

    const onScroll = () => {
      const now = window.scrollY;
      scrollVel = now - lastScroll;
      lastScroll = now;

      const t = performance.now();
      if (t - lastEmit < 16) return;
      lastEmit = t;

      const speed = Math.min(Math.abs(scrollVel), 80);
      const count = Math.floor(speed / 8);
      for (let i = 0; i < count && particles.length < MAX; i++) {
        const fromLeft = Math.random() < 0.5;
        particles.push({
          x: fromLeft
            ? Math.random() * window.innerWidth * 0.18
            : window.innerWidth - Math.random() * window.innerWidth * 0.18,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.sign(scrollVel) * (1 + Math.random() * 2),
          life: 0,
          max: 60 + Math.random() * 60,
          size: 1.2 + Math.random() * 2.2,
          hue: Math.random() < 0.5 ? 190 : 280, // cyan or purple
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    const tick = () => {
      // Soft fade for trails
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      // Idle drift particles occasionally
      if (Math.random() < 0.04 && particles.length < 30) {
        const fromLeft = Math.random() < 0.5;
        particles.push({
          x: fromLeft ? 4 : window.innerWidth - 4,
          y: Math.random() * window.innerHeight,
          vx: 0,
          vy: (Math.random() - 0.5) * 0.4,
          life: 0,
          max: 120,
          size: 1 + Math.random() * 1.5,
          hue: Math.random() < 0.5 ? 190 : 280,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.985;
        p.vx *= 0.99;

        const t = p.life / p.max;
        const alpha = Math.max(0, 1 - t);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, ${alpha * 0.9})`;
        ctx.shadowColor = `hsla(${p.hue}, 95%, 60%, ${alpha})`;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.max) particles.splice(i, 1);
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] mix-blend-screen"
    />
  );
};