import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClosureContent } from "./ClosureModal";

export function RejectedBookingScreen({ reason }: { reason: string }) {
  const navigate = useNavigate();
  const [left, setLeft] = useState(10);
  useEffect(() => {
    if (left <= 0) { navigate("/", { replace: true }); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, navigate]);
  return (
    <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[210] flex items-center justify-center bg-background/55 p-6 backdrop-blur-2xl">
      <ClosureContent reason={reason}>
        <p className="mt-6 border-t border-foreground/15 pt-6 font-semibold text-destructive">
          Tu reserva no ha sido procesada porque DIEGCUTZ está en periodo de cierre temporal.
        </p>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          Serás redirigido a la página principal en <span className="font-bold text-foreground">{left}</span> segundos.
        </p>
      </ClosureContent>
    </div>
  );
}
