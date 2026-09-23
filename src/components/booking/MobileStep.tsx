import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isMobile: boolean;
  active: boolean;
  step: number;
  currentStep: number;
  children: ReactNode;
}

/**
 * Shows only the active booking decision with a directional transition.
 */
export const MobileStep = ({ isMobile, active, step, currentStep, children }: Props) => {
  const direction = step >= currentStep ? 1 : -1;
  return (
    <AnimatePresence mode="wait" initial={false}>
      {active && (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: isMobile ? 40 * direction : 18 * direction }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isMobile ? -40 * direction : -18 * direction }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="will-change-transform"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};