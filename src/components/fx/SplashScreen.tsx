import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const TEXT = "DIEGCUTZ";

/**
 * One-time splash on first app load. Shows DIEGCUTZ being "graffiti-sprayed"
 * letter by letter with neon drips, then fades out.
 */
export const SplashScreen = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("diegcutz_splash_shown");
  });

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      sessionStorage.setItem("diegcutz_splash_shown", "1");
      setVisible(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          aria-hidden
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-background overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1] }}
        >
          {/* Background neon grid */}
          <div className="absolute inset-0 bg-neon-grid opacity-50" />
          <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />

          {/* Glow blobs */}
          <motion.div
            className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, hsl(var(--neon-purple) / 0.4), transparent 60%)" }}
            animate={{ scale: [0.8, 1.1, 0.9], opacity: [0.3, 0.6, 0.4] }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
          />

          {/* Letters */}
          <div className="relative flex items-center justify-center">
            {TEXT.split("").map((ch, i) => (
              <motion.span
                key={i}
                className="font-aggressive font-black text-cyan-400 inline-block"
                style={{
                  fontSize: "clamp(3rem, 14vw, 9rem)",
                  textShadow:
                    "0 0 20px rgba(34,211,238,0.9), 0 0 40px rgba(34,211,238,0.6), 0 0 80px rgba(168,85,247,0.4)",
                  letterSpacing: "0.02em",
                }}
                initial={{ opacity: 0, y: -40, rotateX: -90, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.55,
                  delay: 0.15 + i * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Drip strokes — graffiti effect */}
          <svg
            className="absolute pointer-events-none"
            width="80%"
            height="40%"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
            style={{ top: "55%" }}
          >
            {[120, 280, 440, 600].map((x, i) => (
              <motion.line
                key={x}
                x1={x}
                y1={0}
                x2={x}
                y2={140}
                stroke="hsl(var(--neon-cyan))"
                strokeWidth={2}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 6px hsl(var(--neon-cyan)))" }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0.6] }}
                transition={{ duration: 1.2, delay: 1.1 + i * 0.1, ease: "easeOut" }}
              />
            ))}
          </svg>

          {/* Tagline */}
          <motion.p
            className="absolute bottom-[18%] text-xs md:text-sm uppercase tracking-[0.5em] text-neon-cyan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
          >
            Urban Barbershop
          </motion.p>

          {/* Final wipe */}
          <motion.div
            className="absolute inset-0"
            initial={{ x: "-110%" }}
            animate={{ x: "110%" }}
            transition={{ duration: 0.7, delay: 2.0, ease: [0.7, 0, 0.3, 1] }}
            style={{
              background:
                "linear-gradient(110deg, transparent 45%, hsl(var(--neon-cyan)) 49%, hsl(var(--neon-purple)) 50%, hsl(var(--neon-cyan)) 51%, transparent 55%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};