import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClosureContent, ClosureSurface } from "./ClosureModal";

export function RejectedBookingScreen({ reason }: { reason: string }) {
  const navigate = useNavigate();
  const [left, setLeft] = useState(10);
  useEffect(() => {
    if (left <= 0) { navigate("/", { replace: true }); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, navigate]);
  return (
    <ClosureSurface>
      <ClosureContent reason={reason}>
        <div className="closure-rejected" role="alert">
        <p className="font-semibold text-destructive">
          Tu reserva no ha sido procesada porque DIEGCUTZ está en periodo de cierre temporal.
        </p>
        <div className="closure-rejected__count" aria-live="polite"><strong>{left}</strong><p>Segundos para volver a la página principal.</p></div>
        </div>
      </ClosureContent>
    </ClosureSurface>
  );
}
