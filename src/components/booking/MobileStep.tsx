import { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Props {
  isMobile: boolean;
  active: boolean;
  step: number;
  currentStep: number;
  children: ReactNode;
}

const EXIT = 0.32;
const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Shows only the active booking decision. The leaving step folds away first;
 * the next one is revealed afterwards with a red ink wipe, so both never overlap.
 */
export const MobileStep = ({ active, step, currentStep, children }: Props) => {
  const reduce = useReducedMotion();
  const dir = step >= currentStep ? 1 : -1;

  if (reduce) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        {active && (
          <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const hidden = dir > 0 ? "inset(0% 0% 0% 100% round 1.5rem)" : "inset(0% 100% 0% 0% round 1.5rem)";
  return (
    <AnimatePresence initial={false}>
      {active && (
        <motion.div
          key={step}
          className="bstep"
          initial={{ clipPath: hidden, x: 30 * dir }}
          animate={{ clipPath: "inset(0% 0% 0% 0% round 1.5rem)", x: 0, transition: { delay: EXIT, duration: 0.6, ease: EASE } }}
          exit={{ opacity: 0, scale: 0.94, y: -18, filter: "blur(6px)", transition: { duration: EXIT, ease: EASE } }}
          style={{ position: "relative", transformOrigin: "50% 0%" }}
        >
          {children}
          <motion.span
            aria-hidden="true"
            className="bstep__ink"
            initial={{ scaleX: 1, originX: dir > 0 ? 1 : 0 }}
            animate={{ scaleX: 0, transition: { delay: EXIT + 0.35, duration: 0.45, ease: EASE } }}
            exit={{ opacity: 0 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
