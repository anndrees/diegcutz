import { useEffect, useRef, useState } from "react";

/**
 * Minimal cursor (desktop only): a small ring with a tiny dot in the center.
 * No hover-state changes, no color shifts.
 */
export const NeonCursor = () => {
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setEnabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    const onLeave = () => {
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };
    const onEnter = () => {
      if (ringRef.current) ringRef.current.style.opacity = "1";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.documentElement.classList.add("neon-cursor-active");
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("neon-cursor-active");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full"
      style={{
        width: 22,
        height: 22,
        border: "1.5px solid hsl(var(--neon-cyan))",
        boxShadow: "0 0 8px hsl(var(--neon-cyan) / 0.5)",
        willChange: "transform",
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: 3,
          height: 3,
          background: "hsl(var(--neon-cyan))",
          boxShadow: "0 0 4px hsl(var(--neon-cyan))",
        }}
      />
    </div>
  );
};