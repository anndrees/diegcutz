import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, MapPin } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { FooterGames } from "./FooterGames";
import { useFooterInvestigation } from "@/hooks/useFooterInvestigation";
import { useIsMobile } from "@/hooks/use-mobile";

export function CustomerFooter() {
  const { footerRef, revealed } = useFooterInvestigation();
  const isMobile = useIsMobile();
  return (
    <footer ref={footerRef} className="customer-footer">
      <div className="customer-footer__lead">
        <p className="customer-kicker">DIEGCUTZ / MONÓVAR</p>
        <h2>Un corte que<br /><span>habla por ti.</span></h2>
        <Link to="/booking" className="customer-footer__cta">Elegir cita <ArrowUpRight /></Link>
      </div>
      <div className="customer-footer__grid">
        <div>
          <div className="brand-lockup brand-lockup--large"><BrandMark variant="light" /><span className="brand-lockup__name">DIEGCUTZ</span></div>
          <p>Estudio de barbería urbana. Precisión, conversación y estilo propio.</p>
        </div>
        <div><p className="customer-kicker">ESTUDIO</p><a href="https://maps.app.goo.gl/H1wTD6r3dBjsqRHA7" target="_blank" rel="noreferrer"><MapPin /> Carrer Sant Antoni · Monóvar</a><a href="https://instagram.com/diegcutz" target="_blank" rel="noreferrer"><Instagram /> @diegcutz</a></div>
        <div><p className="customer-kicker">EXPLORA</p><Link to="/booking">Reservar</Link><Link to="/membership">Membresías</Link><Link to="/giveaways">Sorteos</Link><Link to="/install">Instalar la app</Link>{revealed && <Link to="/expediente">Expediente DC-0529 <ArrowUpRight/></Link>}</div>
        <div><p className="customer-kicker">ACCESO</p><Link to="/auth">Cuenta cliente</Link><Link to="/tv">Modo TV</Link><Link to="/admin" className="hidden md:block">Administración</Link><FooterGames /></div>
      </div>
      <div className="customer-footer__legal">{isMobile ? <span>© <Button variant="ghost" className="footer-copyright" data-footer-investigation>{new Date().getFullYear()}</Button> DIEGCUTZ</span> : <Button variant="ghost" className="footer-copyright" data-footer-investigation>© {new Date().getFullYear()} DIEGCUTZ</Button>}<div><Link to="/privacy">Privacidad</Link><Link to="/terms">Condiciones</Link><Link to="/membership-policy">Membresías</Link></div></div>
    </footer>
  );
}