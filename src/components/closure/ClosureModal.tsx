import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, CalendarOff, Pause, X } from "lucide-react";
import { useTemporaryClosure } from "@/hooks/useTemporaryClosure";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import "./closure.css";

export function ClosureModal() {
  const { active, reason, modalOpen, closeModal } = useTemporaryClosure();
  const { pathname } = useLocation();
  const hidden = pathname.startsWith("/admin") || pathname === "/tv";

  if (!active || !modalOpen || hidden) return null;
  return (
    <ClosureSurface onClose={closeModal}>
      <ClosureContent reason={reason} />
    </ClosureSurface>
  );
}

export function ClosureSurface({ onClose, children }: { onClose?: () => void; children: ReactNode }) {
  return (
    <DialogPrimitive.Root open onOpenChange={open => { if (!open) onClose?.(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="closure-frost" />
        <DialogPrimitive.Content className="closure-screen" aria-describedby="closure-description"
          onEscapeKeyDown={event => { if (!onClose) event.preventDefault(); }}
          onInteractOutside={event => event.preventDefault()}>
          <header className="closure-screen__header">
            <div className="closure-screen__brand"><BrandMark /><span>DIEGCUTZ<span>.</span></span></div>
            {onClose && <Button variant="ghost" size="icon" className="closure-screen__close" onClick={onClose} aria-label="Cerrar aviso"><X /></Button>}
          </header>
          <main className="closure-screen__body">{children}</main>
          <footer className="closure-screen__footer">
            <p>MONÓVAR · DIEGCUTZ</p>
            {onClose && <Button variant="secondary" onClick={onClose}>Seguir viendo la web <ArrowRight /></Button>}
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ClosureContent({ reason, children }: { reason: string; children?: ReactNode }) {
  return (
    <div className="closure-content">
      <div>
        <p className="closure-content__label"><Pause aria-hidden="true" /> El estudio está en pausa</p>
        <DialogPrimitive.Title asChild><h2><span>CIERRE</span><span>TEMPORAL</span></h2></DialogPrimitive.Title>
        <p className="closure-content__note">Volveremos a vernos.</p>
      </div>
      <div className="closure-content__reason">
        <p className="closure-content__reason-label">Motivo del cierre</p>
        <DialogPrimitive.Description asChild><p id="closure-description" className="closure-content__reason-text">{reason || "Sin especificar"}</p></DialogPrimitive.Description>
        <div className="closure-content__status"><CalendarOff aria-hidden="true" /><span>Las reservas están desactivadas hasta nuevo aviso. Gracias por tu paciencia.</span></div>
      </div>
      {children}
    </div>
  );
}
