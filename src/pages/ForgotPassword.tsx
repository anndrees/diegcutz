import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, KeyRound, CheckCircle, Loader2 } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast({
        title: "Error",
        description: "Por favor introduce tu teléfono o nombre de usuario",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Find user by username or phone
    const normalizedIdentifier = identifier.trim().toLowerCase();
    
    // Try to find by username first
    let { data: profile } = await supabase
      .from("profiles")
      .select("id, username, contact_value")
      .eq("username", normalizedIdentifier)
      .single();

    // If not found, try by phone
    if (!profile) {
      const phoneNormalized = identifier.replace(/\s+/g, "");
      const phoneWithPrefix = phoneNormalized.startsWith("+") ? phoneNormalized : `+34${phoneNormalized}`;
      
      const { data: phoneProfile } = await supabase
        .from("profiles")
        .select("id, username, contact_value")
        .eq("contact_value", phoneWithPrefix)
        .single();
      
      profile = phoneProfile;
    }

    // Create password reset request
    const { error } = await supabase
      .from("password_reset_requests")
      .insert({
        user_id: profile?.id || null,
        username: profile?.username || normalizedIdentifier,
        contact_value: profile?.contact_value || identifier,
        status: "pending",
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="bg-card border-border">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-neon-cyan" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-neon-cyan">
                Solicitud Enviada
              </h2>
              <p className="text-muted-foreground mb-6">
                Un administrador ha recibido tu solicitud de restablecimiento de contraseña. 
                Te haremos llegar una solución lo antes posible a través de tu método de contacto.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/auth")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Volver
        </Button>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-neon-purple/20 rounded-full flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-neon-purple" />
              </div>
            </div>
            <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              Introduce tu teléfono o nombre de usuario y un administrador te ayudará a recuperar tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier">Teléfono o nombre de usuario</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="@usuario o +34 612 345 678"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="neon"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Solicitar restablecimiento"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;