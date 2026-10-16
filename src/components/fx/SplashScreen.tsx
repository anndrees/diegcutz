import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const TEXT = "DIEGCUTZ";

/** Animated loading splash on first app load. Never blocks rendering: the app
 *  loads underneath and the splash is just an overlay that fades out. With
 *  prefers-reduced-motion it shows briefly with no animation. */
export const SplashScreen = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("diegcutz_splash_shown");
  });

  useEffect(() => {
    if (!visible) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => {
      sessionStorage.setItem("diegcutz_splash_shown", "1");
      setVisible(false);
    }, reduced ? 1000 : 1600);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          aria-hidden
          className="splash-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="splash-loader__letters">
            {TEXT.split("").map((ch, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.06}s` }}>{ch}</span>
            ))}
          </div>
          <div className="splash-loader__bar"><i /></div>
          <p className="splash-loader__tag">Barbería urbana · Monóvar</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
