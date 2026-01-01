import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, Copy, Check, RefreshCw, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PasswordResetSectionProps {
  profile: {
    id: string;
    full_name: string;
    username: string;
    temp_password?: string | null;
    temp_password_active?: boolean;
    temp_password_created_at?: string | null;
  };
  onUpdate: () => void;
}

// Generate a secure random password
const generateSecurePassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const specialChars = "!@#$%&*";
  let password = "";
  
  // Generate 8 random chars
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add 1-2 special chars
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
};

export const PasswordResetSection = ({ profile, onUpdate }: PasswordResetSectionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGeneratePassword = async () => {
    setLoading(true);
    
    const newPassword = generateSecurePassword();
    
    // First update the profile with the temp password
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        temp_password: newPassword,
        temp_password_active: true,
        temp_password_created_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (profileError) {
      setLoading(false);
      toast({
        title: "Error",
        description: "No se pudo generar la contraseña temporal",
        variant: "destructive",
      });
      return;
    }

    // Now update the actual auth password via edge function
    const { error: authError } = await supabase.functions.invoke("reset-user-password", {
      body: { userId: profile.id, newPassword },
    });

    setLoading(false);

    if (authError) {
      // Rollback the profile change
      await supabase
        .from("profiles")
        .update({
          temp_password: null,
          temp_password_active: false,
          temp_password_created_at: null,
        })
        .eq("id", profile.id);

      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña del usuario",
        variant: "destructive",
      });
      return;
    }

    // Mark any pending reset requests as resolved
    await supabase
      .from("password_reset_requests")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: "admin",
      })
      .eq("user_id", profile.id)
      .eq("status", "pending");

    toast({
      title: "Contraseña temporal generada",
      description: "El usuario deberá cambiarla al iniciar sesión",
    });
    
    onUpdate();
  };

  const handleCopyPassword = () => {
    if (profile.temp_password) {
      navigator.clipboard.writeText(profile.temp_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Contraseña copiada al portapapeles" });
    }
  };

  const handleClearTempPassword = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        temp_password: null,
        temp_password_active: false,
        temp_password_created_at: null,
      })
      .eq("id", profile.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar la contraseña temporal",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Contraseña temporal eliminada" });
    onUpdate();
  };

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="w-5 h-5 text-yellow-500" />
          Restablecer Contraseña
        </CardTitle>
        <CardDescription>
          Genera una contraseña temporal que el usuario deberá cambiar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.temp_password_active && profile.temp_password ? (
          <div className="space-y-3">
            <div className="p-4 bg-background border border-border rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Contraseña temporal activa:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono bg-muted px-3 py-2 rounded">
                  {showPassword ? profile.temp_password : "••••••••••"}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {profile.temp_password_created_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Generada el {new Date(profile.temp_password_created_at).toLocaleString("es-ES")}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGeneratePassword}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Generar nueva
              </Button>
              <Button
                variant="ghost"
                onClick={handleClearTempPassword}
                disabled={loading}
                className="text-muted-foreground"
              >
                Limpiar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleGeneratePassword}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <KeyRound className="w-4 h-4 mr-2" />
            )}
            Generar contraseña temporal
          </Button>
        )}
      </CardContent>
    </Card>
  );
};