import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const TEXT = "DIEGCUTZ";

/** One-time editorial brand reveal on first app load. */
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
    }, 1100);
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="font-display font-semibold text-primary"
            style={{
              fontSize: "clamp(2.5rem, 10vw, 6rem)",
              letterSpacing: "0.12em",
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {TEXT}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};