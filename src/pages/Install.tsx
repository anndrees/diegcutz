import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Smartphone, CheckCircle2, Share, MoreVertical } from "lucide-react";
import { NotificationToggle } from "@/components/pwa/NotificationToggle";
import { useAuth } from "@/hooks/useAuth";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
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
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
            <img 
              src="/pwa-192x192.png" 
              alt="DIEGCUTZ" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-black mb-2">Instalar DIEGCUTZ</h1>
          <p className="text-muted-foreground">
            Accede más rápido desde tu pantalla de inicio
          </p>
        </div>

        {isInstalled ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-500">¡App instalada!</h2>
                  <p className="text-muted-foreground mt-1">
                    Ya puedes acceder desde tu pantalla de inicio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {deferredPrompt ? (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <Button 
                    onClick={handleInstall}
                    className="w-full bg-gradient-neon hover:opacity-90 text-lg py-6"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Instalar App
                  </Button>
                </CardContent>
              </Card>
            ) : isIOS ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Cómo instalar en iPhone/iPad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Toca el botón Compartir</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Búscalo en la barra inferior <Share className="h-4 w-4" />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Selecciona "Añadir a pantalla de inicio"</p>
                      <p className="text-sm text-muted-foreground">
                        Desliza hacia abajo en el menú para encontrarlo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Pulsa "Añadir"</p>
                      <p className="text-sm text-muted-foreground">
                        ¡Listo! La app aparecerá en tu pantalla
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : isAndroid ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Cómo instalar en Android
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Abre el menú del navegador</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Toca los tres puntos <MoreVertical className="h-4 w-4" />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Selecciona "Instalar app" o "Añadir a pantalla"</p>
                      <p className="text-sm text-muted-foreground">
                        El texto puede variar según tu navegador
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Confirma la instalación</p>
                      <p className="text-sm text-muted-foreground">
                        ¡Listo! La app aparecerá en tu pantalla
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Abre esta página en tu móvil para instalar la app</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Benefits */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ventajas de la app</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Acceso rápido desde tu pantalla de inicio</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Funciona sin conexión (contenido básico)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Notificaciones de recordatorio de citas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>Experiencia a pantalla completa</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Notifications */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones Push</CardTitle>
              <CardDescription>
                Recibe avisos de tus citas y mensajes importantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationToggle variant="button" className="w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
