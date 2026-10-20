import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTopHeader } from "./MobileTopHeader";

/** Pages that render without the customer mobile header. */
const HIDDEN = ["/admin", "/tv", "/auth", "/expediente", "/paradox-run", "/tilt-fade"];

export const usePersistentMobileHeader = () => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  return isMobile && !HIDDEN.some(p => pathname.startsWith(p));
};

/** Rendered once outside the route transition so it stays still between pages, like the tab bar. */
export function PersistentMobileHeader() {
  const { pathname } = useLocation();
  if (!usePersistentMobileHeader()) return null;
  return <MobileTopHeader safeArea={pathname !== "/"} />;
}
