import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { isRunningAsPWA } from "./InstallPrompt";

export const InstallBanner = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const mobileOrTablet = window.matchMedia("(max-width: 1023px) and (pointer: coarse)").matches;
    if (!mobileOrTablet) {
      setShowBanner(false);
      return;
    }

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
    <div className="install-banner-liquid relative w-full bg-primary px-4 py-4 border-b border-primary animate-in slide-in-from-top duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-full border border-background/30 flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-background" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-background text-sm md:text-base truncate">
              Instala DIEGCUTZ
            </p>
            <p className="text-xs text-background/80 hidden sm:block">
               Reserva en segundos y recibe avisos importantes
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
