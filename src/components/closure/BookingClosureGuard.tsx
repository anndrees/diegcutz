import { useEffect, useRef, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTemporaryClosure } from "@/hooks/useTemporaryClosure";

/** Nobody can open /booking while the shop is temporarily closed: redirect home and show the notice.
 *  If the closure starts while someone is already booking, the database rejects the booking and
 *  the page shows the 10-second rejection countdown instead. */
export function BookingClosureGuard({ children }: { children: ReactNode }) {
  const { active, loaded, openModal } = useTemporaryClosure();
  const blockedAtEntry = useRef<boolean | null>(null);
  if (loaded && blockedAtEntry.current === null) blockedAtEntry.current = active;
  useEffect(() => { if (loaded && blockedAtEntry.current) openModal(); }, [loaded, openModal]);
  if (!loaded) return <div className="min-h-screen bg-background" />;
  if (blockedAtEntry.current) return <Navigate to="/" replace />;
  return <>{children}</>;
}
