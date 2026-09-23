import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, LogOut, Menu, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const links = [
  ["/booking", "Reservar"],
  ["/membership", "Membresías"],
  ["/giveaways", "Sorteos"],
  ["/install", "App"],
] as const;

export function CustomerHeader({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  return (
    <header className={cn("customer-header", transparent && "customer-header--transparent")}>
      <div className="customer-header__inner">
        <Link to="/" className="brand-lockup" aria-label="DIEGCUTZ inicio">
          <span className="brand-lockup__mark" aria-hidden="true">DC</span>
          <span className="brand-lockup__name">DIEGCUTZ <small>MONÓVAR</small></span>
        </Link>

        <nav className="customer-nav" aria-label="Navegación principal">
          {links.map(([to, label], index) => (
            <Link key={to} to={to} className={cn(pathname === to && "is-active")}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="customer-header__actions">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to={user ? "/user" : "/auth"}>
              <UserRound />
              {user ? profile?.username || "Mi cuenta" : "Acceder"}
            </Link>
          </Button>
          {user && <Button variant="ghost" size="icon" className="hidden sm:inline-flex customer-header__logout" onClick={handleSignOut} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut /></Button>}
          <Button asChild size="icon" className="hidden md:inline-flex customer-header__reserve" aria-label="Reservar">
            <Link to="/booking"><ArrowUpRight /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(value => !value)} aria-label={open ? "Cerrar menú" : "Abrir menú"}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="customer-mobile-nav" aria-label="Navegación móvil">
          {links.map(([to, label], index) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><ArrowUpRight />
            </Link>
          ))}
          <Link to={user ? "/user" : "/auth"} onClick={() => setOpen(false)}>
            <span>05</span><strong>{user ? "Mi cuenta" : "Acceder"}</strong><ArrowUpRight />
          </Link>
          {user && <Button variant="ghost" className="customer-mobile-nav__logout" onClick={handleSignOut}><span>06</span><strong>Cerrar sesión</strong><LogOut /></Button>}
        </nav>
      )}
    </header>
  );
}