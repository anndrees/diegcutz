import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Check if app is running as installed PWA
const isRunningAsPWA = (): boolean => {
  // Check display-mode: standalone (most reliable for desktop)
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  
  // Check if launched from home screen on iOS
  if ((navigator as any).standalone === true) {
    return true;
  }
  
  // Check display-mode: fullscreen (some PWAs)
  if (window.matchMedia("(display-mode: fullscreen)").matches) {
    return true;
  }
  
  // Check if in TWA (Trusted Web Activity)
  if (document.referrer.includes("android-app://")) {
    return true;
  }
  
  return false;
};

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as PWA and record it
    if (isRunningAsPWA()) {
      setIsInstalled(true);
      // Record PWA usage if not already recorded
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("pwa_installed_at").eq("id", user.id).single();
          if (profile && !profile.pwa_installed_at) {
            await supabase.from("profiles").update({ pwa_installed_at: new Date().toISOString() }).eq("id", user.id);
          }
        }
      })();
      return;
    }

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = async () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      // Record PWA installation in profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ pwa_installed_at: new Date().toISOString() }).eq("id", user.id);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:max-w-sm safe-area-inset-bottom">
      <Card className="border-primary/30 bg-card/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Instalar DIEGCUTZ</CardTitle>
              <CardDescription className="text-xs">
                Accede más rápido desde tu pantalla de inicio
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Button 
            onClick={handleInstall} 
            className="w-full bg-gradient-neon hover:opacity-90"
          >
            <Download className="mr-2 h-4 w-4" />
            Instalar App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Export utility function for other components
export { isRunningAsPWA };
