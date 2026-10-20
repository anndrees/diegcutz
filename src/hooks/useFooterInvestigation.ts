import { useEffect, useRef, useState } from "react";
import { FooterAdminGesture } from "@/lib/footerAdminGesture";

/** Temporary reveal only: this gesture never authorizes campaign or admin actions. */
export function useFooterInvestigation() {
  const footerRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const gesture = new FooterAdminGesture(["year", "year", "year"]);
    const isTarget = (target: EventTarget | null) => target instanceof Element &&
      !!footerRef.current?.contains(target) && !!target.closest("[data-footer-investigation]");
    const reset = () => gesture.reset();
    const down = (e: PointerEvent) => gesture.down(isTarget(e.target) ? "year" : null, e.pointerId, e.clientX, e.clientY);
    const move = (e: PointerEvent) => {
      if (e.buttons || e.pointerType === "touch") gesture.move(e.pointerId, e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => {
      if (gesture.up(isTarget(e.target) ? "year" : null, e.pointerId, e.clientX, e.clientY)) setRevealed(true);
    };
    const click = (e: MouseEvent) => { if (!isTarget(e.target) || e.detail === 0) reset(); };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("click", click, true);
    const interruptions = ["scroll", "wheel", "touchcancel", "pointercancel", "keydown", "contextmenu", "visibilitychange"];
    interruptions.forEach(type => document.addEventListener(type, reset, true));
    window.addEventListener("blur", reset);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("click", click, true);
      interruptions.forEach(type => document.removeEventListener(type, reset, true));
      window.removeEventListener("blur", reset);
    };
  }, []);
  return { footerRef, revealed };
}