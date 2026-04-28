import { useEffect, useRef, useState } from "react";

/**
 * Custom neon cursor for desktop only.
 * - Small cyan dot follows pointer 1:1
 * - Larger glowing halo follows with smooth lerp
 * - Halo grows + changes color when hovering interactive elements
 */
export const NeonCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    // Disable on touch / coarse pointers
    const mq = window.matchMedia("(pointer: fine)");
    setEnabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }

      // Detect hoverable element under pointer
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest(
        "a, button, [role='button'], input, textarea, select, label, summary, [data-cursor='hover']"
      );
      setHovering(interactive);
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => {
      if (haloRef.current) haloRef.current.style.opacity = "0";
      if (dotRef.current) dotRef.current.style.opacity = "0";
    };
    const onEnter = () => {
      if (haloRef.current) haloRef.current.style.opacity = "1";
      if (dotRef.current) dotRef.current.style.opacity = "1";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    let raf = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.18;
      current.current.y += (target.current.y - current.current.y) * 0.18;
      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Hide native cursor
    document.documentElement.classList.add("neon-cursor-active");

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("neon-cursor-active");
    };
  }, [enabled]);

  if (!enabled) return null;

  const haloSize = hovering ? 64 : 36;
  const haloColor = hovering ? "hsl(var(--neon-purple))" : "hsl(var(--neon-cyan))";

  return (
    <>
      {/* Halo */}
      <div
        ref={haloRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full mix-blend-screen transition-[width,height,background,box-shadow,opacity] duration-200 ease-out"
        style={{
          width: haloSize,
          height: haloSize,
          background: `radial-gradient(circle, ${haloColor} 0%, transparent 70%)`,
          boxShadow: `0 0 30px 4px ${haloColor}, 0 0 60px 10px ${haloColor}`,
          opacity: pressed ? 0.5 : 0.85,
          willChange: "transform",
        }}
      />
      {/* Dot */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white transition-[width,height,opacity] duration-150"
        style={{
          width: pressed ? 5 : 7,
          height: pressed ? 5 : 7,
          boxShadow: "0 0 10px hsl(var(--neon-cyan)), 0 0 20px hsl(var(--neon-cyan))",
          willChange: "transform",
        }}
      />
    </>
  );
};