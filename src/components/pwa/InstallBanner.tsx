import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { isRunningAsPWA } from "./InstallPrompt";

export const InstallBanner = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show if NOT running as PWA (i.e., running in browser)
    if (isRunningAsPWA()) {
      setShowBanner(false);
      return;
    }

    // Check if banner was dismissed recently (within 3 days)
    const dismissedAt = localStorage.getItem("pwa-banner-dismissed");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 3) {
        setShowBanner(false);
        return;
      }
    }

    // Show banner after a delay
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  const handleInstallClick = () => {
    navigate("/install");
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-neon px-4 pt-[env(safe-area-inset-top,12px)] pb-3 shadow-lg animate-in slide-in-from-top duration-300" style={{ paddingTop: `calc(env(safe-area-inset-top, 12px) + 12px)` }}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 bg-background/20 rounded-full flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-background" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-background text-sm md:text-base truncate">
              ¡Instala la App DIEGCUTZ!
            </p>
            <p className="text-xs text-background/80 hidden sm:block">
              Acceso rápido, notificaciones y mejor experiencia
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleInstallClick}
            className="bg-background text-primary hover:bg-background/90 font-semibold"
          >
            <Download className="h-4 w-4 mr-1" />
            Instalar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-background hover:bg-background/20 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
