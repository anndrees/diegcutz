import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Calendar, Gift, MessageSquare, Megaphone, Clock, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface NotificationPreference {
  booking_confirmations: boolean;
  booking_reminders: boolean;
  chat_messages: boolean;
  giveaways: boolean;
  promotions: boolean;
}

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe, isLoading: subscribeLoading } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreference>({
    booking_confirmations: true,
    booking_reminders: true,
    chat_messages: true,
    giveaways: true,
    promotions: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if PWA is installed
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isStandalone);
  }, []);

  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setPreferences({
          booking_confirmations: data.booking_confirmations,
          booking_reminders: data.booking_reminders,
          chat_messages: data.chat_messages,
          giveaways: data.giveaways,
          promotions: data.promotions,
        });
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const handleToggle = async (key: keyof NotificationPreference) => {
    if (!user) return;

    // If notifications not subscribed, request permission first
    if (!isSubscribed) {
      const success = await subscribe();
      if (!success) return;
    }

    const newValue = !preferences[key];
    const newPrefs = { ...preferences, [key]: newValue };
    setPreferences(newPrefs);
    setSaving(true);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...newPrefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      // Revert on error
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Preferencias actualizadas",
        description: `${key === "booking_confirmations" ? "Confirmaciones de reserva" : 
          key === "booking_reminders" ? "Recordatorios" :
          key === "chat_messages" ? "Mensajes del chat" :
          key === "giveaways" ? "Sorteos" : "Promociones"} ${newValue ? "activado" : "desactivado"}`,
      });
    }
  };

  if (!user) {
    return null;
  }

  // If not installed, show install prompt
  if (!isInstalled) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Download className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Instala la app para gestionar las notificaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Las preferencias de notificación solo están disponibles en la aplicación instalada.
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link to="/install">
                <Download className="mr-2 h-4 w-4" />
                Instalar App
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If not supported
  if (!isSupported) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <BellOff className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Tu dispositivo no soporta notificaciones push.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If permission denied
  if (permission === "denied") {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <BellOff className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Notificaciones bloqueadas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Has bloqueado las notificaciones. Para activarlas, cambia los permisos en la configuración de tu navegador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const preferenceItems = [
    {
      key: "booking_confirmations" as const,
      label: "Confirmaciones de reserva",
      description: "Notificación cuando se confirma tu cita",
      icon: Calendar,
    },
    {
      key: "booking_reminders" as const,
      label: "Recordatorios de citas",
      description: "Aviso 24h y 1h antes de tu cita",
      icon: Clock,
    },
    {
      key: "chat_messages" as const,
      label: "Mensajes del chat",
      description: "Nuevos mensajes del barbero",
      icon: MessageSquare,
    },
    {
      key: "giveaways" as const,
      label: "Sorteos",
      description: "Nuevos sorteos y si eres ganador",
      icon: Gift,
    },
    {
      key: "promotions" as const,
      label: "Promociones",
      description: "Ofertas especiales y novedades",
      icon: Megaphone,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferencias de Notificaciones
        </CardTitle>
        <CardDescription>
          Elige qué notificaciones deseas recibir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSubscribed && (
          <div className="p-4 bg-muted rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Activa las notificaciones</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Para recibir avisos, primero debes activar las notificaciones push.
                </p>
                <Button onClick={subscribe} disabled={subscribeLoading} size="sm">
                  {subscribeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  Activar notificaciones
                </Button>
              </div>
            </div>
          </div>
        )}

        {preferenceItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-start gap-3">
              <item.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <Label htmlFor={item.key} className="font-medium cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Switch
              id={item.key}
              checked={preferences[item.key]}
              onCheckedChange={() => handleToggle(item.key)}
              disabled={saving || subscribeLoading}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};