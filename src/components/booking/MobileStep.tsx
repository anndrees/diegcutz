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
 * Wraps a booking section so that on mobile only the active step is visible,
 * with a horizontal slide animation matching wizard direction.
 * On desktop, always renders children normally.
 */
export const MobileStep = ({ isMobile, active, step, currentStep, children }: Props) => {
  if (!isMobile) return <>{children}</>;
  const direction = step >= currentStep ? 1 : -1;
  return (
    <AnimatePresence mode="wait" initial={false}>
      {active && (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 60 * direction }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 * direction }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="will-change-transform"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};