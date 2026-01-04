import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SettingsState = {
  google_auth_enabled: boolean;
  min_cancellation_hours: number;
  maintenance_mode: boolean;
  loyalty_program_enabled: boolean;
  chat_enabled: boolean;
  instagram_feed_enabled: boolean;
};

export const SettingsModal = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    google_auth_enabled: true,
    min_cancellation_hours: 48,
    maintenance_mode: false,
    loyalty_program_enabled: true,
    chat_enabled: true,
    instagram_feed_enabled: true,
  });

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value");

    if (data) {
      const newSettings = { ...settings };
      data.forEach((item) => {
        if (item.key === "google_auth_enabled") {
          newSettings.google_auth_enabled = item.value === true;
        } else if (item.key === "min_cancellation_hours") {
          newSettings.min_cancellation_hours = typeof item.value === "number" ? item.value : 48;
        } else if (item.key === "maintenance_mode") {
          newSettings.maintenance_mode = item.value === true;
        } else if (item.key === "loyalty_program_enabled") {
          newSettings.loyalty_program_enabled = item.value === true;
        } else if (item.key === "chat_enabled") {
          newSettings.chat_enabled = item.value === true;
        } else if (item.key === "instagram_feed_enabled") {
          newSettings.instagram_feed_enabled = item.value === true;
        }
      });
      setSettings(newSettings);
    }
  };

  const updateSetting = async (key: keyof SettingsState, value: boolean | number) => {
    setLoading(true);

    // Try to update, if not exists, insert
    const { error: updateError } = await supabase
      .from("app_settings")
      .update({ value: value, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (updateError) {
      // Try insert if update failed (row doesn't exist)
      const { error: insertError } = await supabase
        .from("app_settings")
        .insert({ key, value: value });

      if (insertError) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la configuración",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    setSettings((prev) => ({ ...prev, [key]: value }));
    setLoading(false);

    toast({
      title: "Configuración actualizada",
      description: "Los cambios se han guardado correctamente",
    });
  };

  const settingsItems = [
    {
      key: "google_auth_enabled" as const,
      label: "Google Sign-In",
      description: "Permite a los usuarios iniciar sesión y vincular cuentas con Google",
      type: "switch",
    },
    {
      key: "chat_enabled" as const,
      label: "Chat con clientes",
      description: "Activa el chat flotante para comunicación con clientes",
      type: "switch",
    },
    {
      key: "loyalty_program_enabled" as const,
      label: "Programa de fidelización",
      description: "Sistema de cortes gratis cada 10 reservas",
      type: "switch",
    },
    {
      key: "instagram_feed_enabled" as const,
      label: "Feed de Instagram",
      description: "Muestra la sección de Instagram en la homepage",
      type: "switch",
    },
    {
      key: "maintenance_mode" as const,
      label: "Modo mantenimiento",
      description: "Deshabilita temporalmente las nuevas reservas",
      type: "switch",
      warning: true,
    },
    {
      key: "min_cancellation_hours" as const,
      label: "Tiempo mínimo de cancelación",
      description: "Horas mínimas antes de la cita para permitir cancelaciones",
      type: "number",
      suffix: "horas",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {settingsItems.map((item, index) => (
            <div key={item.key}>
              {index > 0 && <Separator className="mb-6" />}
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 mr-4">
                  <Label 
                    htmlFor={item.key} 
                    className={`text-sm font-medium ${item.warning && settings[item.key] ? "text-destructive" : ""}`}
                  >
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                
                {item.type === "switch" ? (
                  <Switch
                    id={item.key}
                    checked={settings[item.key] as boolean}
                    onCheckedChange={(checked) => updateSetting(item.key, checked)}
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id={item.key}
                      type="number"
                      min={1}
                      max={168}
                      value={settings[item.key] as number}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 48;
                        setSettings((prev) => ({ ...prev, [item.key]: val }));
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 48;
                        updateSetting(item.key, val);
                      }}
                      className="w-20 text-center"
                      disabled={loading}
                    />
                    <span className="text-sm text-muted-foreground">{item.suffix}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
