import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ForcePasswordChangeProps {
  onPasswordChanged: () => void;
  userId: string;
}

export const ForcePasswordChange = ({ onPasswordChanged, userId }: ForcePasswordChangeProps) => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Asegúrate de escribir la misma contraseña",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) throw authError;

      // Clear the temp password state in profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          temp_password: null,
          temp_password_active: false,
          temp_password_created_at: null,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      toast({
        title: "¡Contraseña actualizada!",
        description: "Ya puedes acceder a tu cuenta con tu nueva contraseña",
      });

      onPasswordChanged();
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-purple/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="bg-card border-2 border-yellow-500/50 rounded-2xl p-8 shadow-2xl animate-scale-in">
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Lock className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-black text-yellow-500 mb-2">
              CAMBIO DE CONTRASEÑA
            </h1>
            <p className="text-muted-foreground">
              Por seguridad, debes establecer una nueva contraseña para continuar
            </p>
          </div>

          {/* Warning box */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-200">
                Estás usando una contraseña temporal. Por tu seguridad, es obligatorio que la cambies antes de poder acceder a la aplicación.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-foreground font-semibold">
                Nueva contraseña
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 pr-10 h-12 text-lg"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-foreground font-semibold">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="pl-10 h-12 text-lg"
                  required
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full h-14 text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-background"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Establecer Nueva Contraseña
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Una vez cambies tu contraseña, podrás acceder normalmente a tu cuenta
          </p>
        </div>
      </div>
    </div>
  );
};
