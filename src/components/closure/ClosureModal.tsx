import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useTemporaryClosure } from "@/hooks/useTemporaryClosure";

export function ClosureModal() {
  const { active, reason, modalOpen, closeModal } = useTemporaryClosure();
  const { pathname } = useLocation();
  const hidden = pathname.startsWith("/admin") || pathname === "/tv";

  useEffect(() => {
    if (!active || !modalOpen || hidden) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, modalOpen, hidden, closeModal]);

  if (!active || !modalOpen || hidden) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="closure-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/55 p-6 backdrop-blur-2xl backdrop-saturate-150 animate-in fade-in duration-300">
      <button onClick={closeModal} aria-label="Cerrar aviso"
        className="absolute right-5 top-[calc(env(safe-area-inset-top)+1.25rem)] rounded-full border border-foreground/20 p-2 text-foreground transition hover:bg-foreground/10">
        <X className="h-5 w-5" />
      </button>
      <ClosureContent reason={reason} />
    </div>
  );
}

export function ClosureContent({ reason, children }: { reason: string; children?: React.ReactNode }) {
  return (
    <div className="w-full max-w-xl border border-foreground/15 bg-background/40 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12">
      <div className="mx-auto mb-6 h-1 w-16 -skew-x-12 bg-primary" />
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">DIEGCUTZ</p>
      <h2 id="closure-title" className="font-display text-4xl font-black uppercase leading-none tracking-tight text-foreground md:text-6xl">
        Cierre temporal
      </h2>
      <p className="mt-6 text-sm uppercase tracking-[0.2em] text-muted-foreground">Motivo</p>
      <p className="mt-2 whitespace-pre-line text-lg text-foreground">{reason || "Sin especificar"}</p>
      <p className="mt-6 text-sm text-muted-foreground">Las reservas están desactivadas hasta nuevo aviso. Gracias por tu paciencia.</p>
      {children}
    </div>
  );
}
