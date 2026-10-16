import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Calendar,
  House,
  Users,
  LayoutGrid,
  Scissors,
  Clock,
  Star,
  Trophy,
  Ticket,
  Crown,
  Gift,
  Megaphone,
  Home,
  Tv,
  MessageSquare,
  Bell,
  History,
  HelpCircle,
  QrCode,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/admin/NotificationsDropdown";
import { SettingsModal } from "@/components/admin/SettingsModal";

export const ADMIN_SECTION_TITLES: Record<string, string> = {
  today: "Hoy",
  bookings: "Reservas",
  statistics: "Estadísticas",
  services: "Servicios",
  clients: "Clientes",
  hours: "Horario",
  ratings: "Valoraciones",
  achievements: "Logros",
  coupons: "Cupones",
  memberships: "Membresías",
  giveaways: "Sorteos",
  marquee: "Marquee",
  homepage: "Página principal",
  tv: "Modo TV",
  messages: "Mensajes",
  notifications: "Notificaciones",
  logs: "Historial",
  help: "Ayuda",
};

interface AdminMobileShellProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenQr?: () => void;
  children: React.ReactNode;
}

const moreGroups: {
  title: string;
  items: { id: string; label: string; icon: typeof Scissors }[];
}[] = [
  {
    title: "Gestión",
    items: [
      { id: "services", label: "Servicios", icon: Scissors },
      { id: "hours", label: "Horario", icon: Clock },
      { id: "ratings", label: "Valoraciones", icon: Star },
      { id: "achievements", label: "Logros", icon: Trophy },
      { id: "coupons", label: "Cupones", icon: Ticket },
      { id: "memberships", label: "Membresías", icon: Crown },
    ],
  },
  {
    title: "Contenido",
    items: [
      { id: "giveaways", label: "Sorteos", icon: Gift },
      { id: "marquee", label: "Marquee", icon: Megaphone },
      { id: "homepage", label: "Página principal", icon: Home },
      { id: "tv", label: "Modo TV", icon: Tv },
    ],
  },
  {
    title: "Sistema",
    items: [
      { id: "messages", label: "Mensajes", icon: MessageSquare },
      { id: "notifications", label: "Notificaciones", icon: Bell },
      { id: "logs", label: "Historial", icon: History },
      { id: "help", label: "Ayuda", icon: HelpCircle },
    ],
  },
];

const mainTabs = [
  { id: "statistics", label: "Stats", icon: BarChart3 },
  { id: "bookings", label: "Reservas", icon: Calendar },
  { id: "today", label: "Hoy", icon: House, main: true },
  { id: "clients", label: "Clientes", icon: Users },
];

export const AdminMobileShell = ({
  activeTab,
  onTabChange,
  onLogout,
  onOpenQr,
  children,
}: AdminMobileShellProps) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreSection = !mainTabs.some((t) => t.id === activeTab) && activeTab !== "today";

  useEffect(() => {
    document.body.classList.add("has-admin-tabbar");
    return () => document.body.classList.remove("has-admin-tabbar");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeTab]);

  const go = (id: string) => {
    setMoreOpen(false);
    onTabChange(id);
  };

  return (
    <div className="admin-app">
      {/* Cabecera nativa */}
      <header className="admin-app__header">
        <div className="admin-app__brand">
          <BrandMark variant="ink" className="admin-app__logo" />
          <div className="admin-app__titles">
            <span className="admin-app__kicker">Panel</span>
            <h1 className="admin-app__title">{ADMIN_SECTION_TITLES[activeTab] || "Panel"}</h1>
          </div>
        </div>
        <div className="admin-app__actions">
          <NotificationsDropdown />
          <SettingsModal />
          <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Contenido con transición */}
      <main className="admin-app__content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barra inferior tipo app */}
      <nav className="admin-app__tabbar" aria-label="Navegación del panel">
        {mainTabs.map(({ id, label, icon: Icon, main }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className={`admin-app__tab ${active ? "is-active" : ""} ${main ? "admin-app__tab--main" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              {active && !main && (
                <motion.span
                  layoutId="admin-tab-pill"
                  className="admin-app__tab-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              {main ? (
                <span className="admin-app__tab-main">
                  <Icon />
                </span>
              ) : (
                <Icon />
              )}
              <small>{label}</small>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`admin-app__tab ${isMoreSection ? "is-active" : ""}`}
          aria-label="Más secciones"
        >
          <LayoutGrid />
          <small>Más</small>
        </button>
      </nav>

      {/* Hoja inferior "Más" */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="admin-app__more">
          <SheetHeader>
            <SheetTitle>Todas las secciones</SheetTitle>
          </SheetHeader>
          <div className="admin-app__more-scroll">
            {moreGroups.map((group) => (
              <div key={group.title} className="admin-app__more-group">
                <p className="admin-app__more-heading">{group.title}</p>
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => go(id)}
                    className={`admin-app__more-item ${activeTab === id ? "is-active" : ""}`}
                  >
                    <span className="admin-app__more-icon">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="admin-app__more-label">{label}</span>
                    <ChevronRight className="h-4 w-4 admin-app__more-chevron" />
                  </button>
                ))}
              </div>
            ))}
            {onOpenQr && (
              <div className="admin-app__more-group">
                <p className="admin-app__more-heading">Acciones</p>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onOpenQr();
                  }}
                  className="admin-app__more-item"
                >
                  <span className="admin-app__more-icon">
                    <QrCode className="h-4.5 w-4.5" />
                  </span>
                  <span className="admin-app__more-label">Escanear QR</span>
                  <ChevronRight className="h-4 w-4 admin-app__more-chevron" />
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
