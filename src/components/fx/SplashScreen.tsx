import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import logoLight from "@/assets/logo-dc-light.png";

const TEXT = "DIEGCUTZ";

/** Animated loading splash on every app load. Never blocks rendering: the app
 *  loads underneath and the splash is an overlay removed by a timer (min 1s),
 *  so it also works with prefers-reduced-motion. */
export const SplashScreen = () => {
  const [visible, setVisible] = useState(() => typeof window !== "undefined");
  const [count, setCount] = useState(0);
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!visible) return;
    const total = reduced ? 1000 : 2300;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (total - 300));
      setCount(Math.round(100 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const t = setTimeout(() => setVisible(false), total);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [visible, reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="splash" aria-hidden className="splash-x" exit={{ opacity: 1 }} transition={{ duration: 0.7 }}>
          <motion.div
            className="splash-x__panel splash-x__panel--top"
            exit={reduced ? { opacity: 0 } : { y: "-100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="splash-x__panel splash-x__panel--bottom"
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="splash-x__content"
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            <div className="splash-x__meta splash-x__meta--tl">Barbería urbana</div>
            <div className="splash-x__meta splash-x__meta--tr">38.43°N · 0.84°W</div>
            <div className="splash-x__meta splash-x__meta--bl">Monóvar — Alicante</div>
            <div className="splash-x__count">{String(count).padStart(3, "0")}</div>

            <span className="splash-x__slash" />
            <img src={logoLight} alt="" className="splash-x__logo" />
            <div className="splash-x__word">
              {TEXT.split("").map((ch, i) => (
                <span key={i} className="splash-x__mask">
                  <span style={{ animationDelay: `${0.45 + i * 0.05}s` }}>{ch}</span>
                </span>
              ))}
            </div>
            <div className="splash-x__line"><i style={{ transform: `scaleX(${count / 100})` }} /></div>
            <p className="splash-x__tag">Precisión · Estilo · Actitud</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
