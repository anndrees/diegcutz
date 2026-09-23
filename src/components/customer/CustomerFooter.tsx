import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, MapPin } from "lucide-react";

export function CustomerFooter() {
  return (
    <footer className="customer-footer">
      <div className="customer-footer__lead">
        <p className="customer-kicker">DIEGCUTZ / MONÓVAR</p>
        <h2>Un corte que<br /><span>habla por ti.</span></h2>
        <Link to="/booking" className="customer-footer__cta">Elegir cita <ArrowUpRight /></Link>
      </div>
      <div className="customer-footer__grid">
        <div>
          <div className="brand-lockup brand-lockup--large"><span className="brand-lockup__mark">DC</span><span className="brand-lockup__name">DIEGCUTZ</span></div>
          <p>Estudio de barbería urbana. Precisión, conversación y estilo propio.</p>
        </div>
        <div><p className="customer-kicker">ESTUDIO</p><a href="https://maps.google.com/?q=Carrer+Sant+Antoni+Monovar+Alicante" target="_blank" rel="noreferrer"><MapPin /> Carrer Sant Antoni · Monóvar</a><a href="https://instagram.com/diegcutz" target="_blank" rel="noreferrer"><Instagram /> @diegcutz</a></div>
        <div><p className="customer-kicker">EXPLORA</p><Link to="/booking">Reservar</Link><Link to="/membership">Membresías</Link><Link to="/giveaways">Sorteos</Link><Link to="/install">Instalar la app</Link></div>
        <div><p className="customer-kicker">ACCESO</p><Link to="/auth">Cuenta cliente</Link><Link to="/tv">Modo TV</Link><Link to="/admin">Administración</Link></div>
      </div>
      <div className="customer-footer__legal"><span>© {new Date().getFullYear()} DIEGCUTZ</span><div><Link to="/privacy">Privacidad</Link><Link to="/terms">Condiciones</Link><Link to="/membership-policy">Membresías</Link></div></div>
    </footer>
  );
}