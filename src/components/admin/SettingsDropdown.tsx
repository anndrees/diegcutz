import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SettingsDropdown = () => {
  const { toast } = useToast();
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "google_auth_enabled")
      .single();

    if (data) {
      setGoogleAuthEnabled(data.value === true);
    }
  };

  const handleGoogleAuthToggle = async (enabled: boolean) => {
    setLoading(true);
    
    const { error } = await supabase
      .from("app_settings")
      .update({ value: enabled, updated_at: new Date().toISOString() })
      .eq("key", "google_auth_enabled");

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
      return;
    }

    setGoogleAuthEnabled(enabled);
    toast({
      title: "Configuración actualizada",
      description: enabled
        ? "Autenticación con Google habilitada"
        : "Autenticación con Google deshabilitada",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Configuración</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="google-auth" className="text-sm font-medium">
                Google Sign-In
              </Label>
              <p className="text-xs text-muted-foreground">
                {googleAuthEnabled ? "Habilitado" : "Deshabilitado"}
              </p>
            </div>
            <Switch
              id="google-auth"
              checked={googleAuthEnabled}
              onCheckedChange={handleGoogleAuthToggle}
              disabled={loading}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
