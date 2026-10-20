import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isAdminAppearanceRoute, readAdminAppearance, saveAdminAppearance, type AdminAppearance } from "@/lib/adminAppearance";

const AppearanceContext = createContext<{ appearance: AdminAppearance; toggle: () => void }>({ appearance: "light", toggle: () => {} });

export function AdminAppearanceProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [appearance, setAppearance] = useState<AdminAppearance>(() => readAdminAppearance(window.localStorage));
  const active = isAdminAppearanceRoute(pathname);

  useLayoutEffect(() => {
    if (active) document.documentElement.dataset.adminTheme = appearance;
    else delete document.documentElement.dataset.adminTheme;
    return () => { delete document.documentElement.dataset.adminTheme; };
  }, [active, appearance]);

  const toggle = () => {
    const next = appearance === "dark" ? "light" : "dark";
    saveAdminAppearance(window.localStorage, next);
    setAppearance(next);
  };

  return <AppearanceContext.Provider value={{ appearance, toggle }}>{children}</AppearanceContext.Provider>;
}

export const useAdminAppearance = () => useContext(AppearanceContext);

export function AdminAppearanceToggle() {
  const { appearance, toggle } = useAdminAppearance();
  const label = appearance === "dark" ? "Activar modo claro" : "Activar modo oscuro";
  return <Tooltip><TooltipTrigger asChild>
    <Button variant="ghost" size="icon" role="switch" aria-checked={appearance === "dark"} aria-label={label} onClick={toggle}>
      {appearance === "dark" ? <Sun /> : <Moon />}
    </Button>
  </TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}