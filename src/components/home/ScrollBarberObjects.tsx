import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

function ChromeScissors() {
  return (
    <svg viewBox="0 0 260 180" aria-hidden="true">
      <defs>
        <linearGradient id="scissorChrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(var(--foreground))" />
          <stop offset="0.28" stopColor="hsl(var(--muted-foreground))" />
          <stop offset="0.52" stopColor="hsl(var(--foreground))" />
          <stop offset="0.72" stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--muted))" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#scissorChrome)" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M106 102 L226 26" strokeWidth="15" style={{ transformOrigin: "106px 102px" }} />
        <motion.path d="M106 102 L233 145" strokeWidth="15" style={{ transformOrigin: "106px 102px" }} />
        <circle cx="106" cy="102" r="10" strokeWidth="7" />
        <circle cx="61" cy="77" r="31" strokeWidth="13" />
        <circle cx="65" cy="139" r="31" strokeWidth="13" />
        <path d="M88 91 L106 102 L91 126" strokeWidth="13" />
      </g>
    </svg>
  );
}

function ChromeClipper() {
  return (
    <svg viewBox="0 0 190 300" aria-hidden="true">
      <defs>
        <linearGradient id="clipperChrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(var(--foreground))" />
          <stop offset="0.22" stopColor="hsl(var(--primary))" />
          <stop offset="0.42" stopColor="hsl(var(--muted-foreground))" />
          <stop offset="0.62" stopColor="hsl(var(--foreground))" />
          <stop offset="1" stopColor="hsl(var(--muted))" />
        </linearGradient>
      </defs>
      <path d="M42 61 Q95 37 148 61 L137 241 Q132 274 95 281 Q58 274 53 241Z" fill="url(#clipperChrome)" stroke="hsl(var(--foreground) / .55)" strokeWidth="3" />
      <path d="M35 62 L155 62 L145 28 L45 28Z" fill="url(#clipperChrome)" stroke="hsl(var(--foreground) / .55)" strokeWidth="3" />
      {Array.from({ length: 9 }).map((_, index) => <path key={index} d={`M${48 + index * 12} 28 L${51 + index * 12} 8`} stroke="hsl(var(--foreground))" strokeWidth="5" strokeLinecap="round" />)}
      <rect x="82" y="118" width="26" height="54" rx="13" fill="hsl(var(--background) / .72)" stroke="hsl(var(--primary) / .65)" strokeWidth="3" />
      <circle cx="95" cy="205" r="8" fill="hsl(var(--primary))" />
    </svg>
  );
}

export function ScrollBarberObjects() {
  const scope = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: scope, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.6 });
  const scissorsX = useTransform(progress, [0, 1], ["-18vw", "68vw"]);
  const scissorsY = useTransform(progress, [0, 0.5, 1], ["5vh", "42vh", "74vh"]);
  const scissorsRotate = useTransform(progress, [0, 1], [-28, 38]);
  const clipperX = useTransform(progress, [0, 1], ["18vw", "-42vw"]);
  const clipperY = useTransform(progress, [0, 1], ["18vh", "66vh"]);
  const clipperRotate = useTransform(progress, [0, 1], [18, -24]);

  return (
    <div ref={scope} className="scroll-tools" aria-hidden="true">
      <motion.div className="scroll-tool scroll-tool--scissors" style={reducedMotion ? undefined : { x: scissorsX, y: scissorsY, rotate: scissorsRotate }}>
        <ChromeScissors />
      </motion.div>
      <motion.div className="scroll-tool scroll-tool--clipper" style={reducedMotion ? undefined : { x: clipperX, y: clipperY, rotate: clipperRotate }}>
        <ChromeClipper />
      </motion.div>
    </div>
  );
}