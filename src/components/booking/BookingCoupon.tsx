import { Check, Loader2, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Coupon = { code: string; discount_type: string; discount_value: number };
export function BookingCoupon({ code, onCode, applied, loading, error, onApply, onRemove }: {
  code: string; onCode: (value: string) => void; applied: Coupon | null; loading: boolean;
  error: string; onApply: () => void; onRemove: () => void;
}) {
  return <section className="booking-coupon" aria-label="Código de descuento">
    <h3><Ticket /> Código de descuento</h3>
    {applied ? <div className="booking-coupon__applied"><Check /><div><strong>{applied.code}</strong><small>{applied.discount_value}{applied.discount_type === "percentage" ? "%" : "€"} de descuento</small></div><Button variant="ghost" size="icon" onClick={onRemove} aria-label="Quitar cupón"><X /></Button></div> : <>
      <div className="booking-coupon__input"><Input aria-label="Código de descuento" placeholder="Introduce tu código" value={code} onChange={e => onCode(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === "Enter" && code.trim() && !loading) onApply(); }} /><Button variant="outline" onClick={onApply} disabled={loading || !code.trim()}>{loading ? <Loader2 className="animate-spin" /> : "Aplicar"}</Button></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </>}
  </section>;
}