import { ReactNode, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/** A single presence boundary keeps the outgoing step in its original layout slot. */
export const MobileStep = ({ currentStep, children }: { currentStep: number; children: ReactNode }) => {
  const reduce = useReducedMotion();
  const previous = useRef(currentStep);
  const direction = currentStep >= previous.current ? 1 : -1;
  previous.current = currentStep;
  return <AnimatePresence mode="wait" initial={false} custom={direction}>
    <motion.div key={currentStep} className="bstep" custom={direction}
      variants={{
        enter: (dir: number) => reduce ? { opacity: 0 } : { opacity: 0, x: 24 * dir, clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" },
        visible: { opacity: 1, x: 0, clipPath: "inset(0 0 0 0)", transition: { duration: reduce ? 0.12 : 0.55, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, scale: reduce ? 1 : 0.97, transition: { duration: reduce ? 0.12 : 0.24 } },
      }} initial="enter" animate="visible" exit="exit">
      {children}
      {!reduce && <motion.span aria-hidden="true" className="bstep__ink" initial={{ scaleX: 1, originX: direction > 0 ? 1 : 0 }} animate={{ scaleX: 0, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }} />}
    </motion.div>
  </AnimatePresence>;
};
