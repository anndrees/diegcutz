import { useState } from "react";
import {
  Calendar,
  BarChart3,
  Scissors,
  Users,
  Clock,
  Star,
  Gift,
  History,
  MessageSquare,
  Menu,
  X,
  Trophy,
  Ticket,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "bookings", label: "Reservas", icon: Calendar },
  { id: "statistics", label: "Estadísticas", icon: BarChart3 },
  { id: "services", label: "Servicios", icon: Scissors },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "hours", label: "Horario", icon: Clock },
  { id: "ratings", label: "Valoraciones", icon: Star },
  { id: "achievements", label: "Logros", icon: Trophy },
  { id: "coupons", label: "Cupones", icon: Ticket },
  { id: "giveaways", label: "Sorteos", icon: Gift },
  { id: "messages", label: "Mensajes", icon: MessageSquare },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "logs", label: "Historial", icon: History },
];

const SidebarContent = ({
  activeTab,
  onTabChange,
  onItemClick,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onItemClick?: () => void;
}) => (
  <ScrollArea className="h-full py-4">
    <div className="space-y-1 px-3">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              onItemClick?.();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-neon-purple text-white shadow-lg shadow-neon-purple/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
            {item.id === "messages" && (
              <span className="ml-auto text-xs bg-neon-cyan text-background px-2 py-0.5 rounded-full">
                Chat
              </span>
            )}
          </button>
        );
      })}
    </div>
  </ScrollArea>
);

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border shadow-lg mt-safe"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-card border-r border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold text-neon-purple">Menu Admin</h2>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SidebarContent
            activeTab={activeTab}
            onTabChange={onTabChange}
            onItemClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-card border-r border-border h-[calc(100vh-12rem)] sticky top-32 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-neon-purple">Panel de Control</h2>
          <p className="text-xs text-muted-foreground">Gestión del negocio</p>
        </div>
        <SidebarContent activeTab={activeTab} onTabChange={onTabChange} />
      </aside>
    </>
  );
};
