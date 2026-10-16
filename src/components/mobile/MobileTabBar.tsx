import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarPlus, Crown, Gift, House, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import "./mobile-app.css";

const HIDDEN = ["/admin", "/tv", "/auth", "/forgot-password"];

export function MobileTabBar() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const hidden = !isMobile || HIDDEN.some(p => pathname.startsWith(p));

  useEffect(() => {
    document.body.classList.toggle("has-tabbar", !hidden);
    return () => document.body.classList.remove("has-tabbar");
  }, [hidden]);

  if (hidden) return null;

  const account = user ? "/user" : "/auth";
  const tabs = [
    { to: "/", label: "Inicio", icon: House },
    { to: "/giveaways", label: "Sorteos", icon: Gift },
    { to: "/booking", label: "Reservar", icon: CalendarPlus, main: true },
    { to: "/membership", label: "Club", icon: Crown },
    { to: account, label: user ? "Perfil" : "Entrar", icon: UserRound, avatar: !!user },
  ];

  return (
    <nav className="m-tabbar" aria-label="Navegación de la app">
      {tabs.map(({ to, label, icon: Icon, main, avatar }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link key={label} to={to} className={`m-tab ${active ? "is-active" : ""} ${main ? "m-tab--main" : ""}`} aria-current={active ? "page" : undefined} aria-label={label}>
            {main ? (
              <span className="m-tab__main"><Icon /></span>
            ) : avatar ? (
              <span className="m-tab__avatar">{(profile?.username || "TU").slice(0, 2).toUpperCase()}</span>
            ) : (
              <Icon />
            )}
            <small>{label}</small>
            {active && !main && <motion.i layoutId="m-tab-dot" className="m-tab__dot" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
          </Link>
        );
      })}
    </nav>
  );
}
