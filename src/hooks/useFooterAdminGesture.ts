import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FooterAdminGesture, type FooterAdminPart } from "@/lib/footerAdminGesture";

function partAt(target: EventTarget | null): FooterAdminPart | null {
  if (!(target instanceof Element)) return null;
  const part = target.closest("[data-footer-admin]")?.getAttribute("data-footer-admin");
  return part === "year" || part === "brand" || part === "place" ? part : null;
}

export function useFooterAdminGesture() {
  const navigate = useNavigate();
  useEffect(() => {
    const gesture = new FooterAdminGesture();
    const reset = () => gesture.reset();
    const down = (event: PointerEvent) => gesture.down(partAt(event.target), event.pointerId, event.clientX, event.clientY);
    const move = (event: PointerEvent) => {
      // Hovering between taps is harmless; any movement during contact cancels.
      if (event.buttons || event.pointerType === "touch") gesture.move(event.pointerId, event.clientX, event.clientY);
    };
    const up = (event: PointerEvent) => {
      if (gesture.up(partAt(event.target), event.pointerId, event.clientX, event.clientY)) navigate("/admin");
    };
    const click = (event: MouseEvent) => {
      if (!partAt(event.target) || event.detail === 0) reset();
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("click", click, true);
    const interruptions = ["scroll", "wheel", "touchcancel", "pointercancel", "keydown", "contextmenu", "visibilitychange"];
    interruptions.forEach(type => document.addEventListener(type, reset, true));
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("click", click, true);
      interruptions.forEach(type => document.removeEventListener(type, reset, true));
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset, true);
    };
  }, [navigate]);
}