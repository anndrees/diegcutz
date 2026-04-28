import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

/**
 * Diagonal neon wipe transition between routes.
 * Two diagonal panels sweep across the viewport with neon edges,
 * masking the route swap.
 */
export const RouteTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Wipe overlay — fires on every pathname change */}
      <AnimatePresence>
        <motion.div
          key={`wipe-${location.pathname}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.001 } }}
        >
          {/* Top-left diagonal slab (cyan leading edge) */}
          <motion.div
            className="absolute -inset-[20%]"
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 0.85, ease: [0.7, 0, 0.3, 1] }}
            style={{
              background:
                "linear-gradient(105deg, transparent 0%, transparent 38%, hsl(var(--neon-cyan)) 39%, hsl(var(--neon-purple)) 40%, hsl(var(--background)) 41%, hsl(var(--background)) 60%, hsl(var(--neon-purple)) 61%, hsl(var(--neon-cyan)) 62%, transparent 63%, transparent 100%)",
              boxShadow: "0 0 80px hsl(var(--neon-cyan) / 0.5)",
            }}
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
};