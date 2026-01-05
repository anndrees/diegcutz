import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, Loader2, LogOut, Shield } from "lucide-react";

interface CompleteProfileFormProps {
  userId: string;
  currentName: string;
  onProfileCompleted: () => void;
}

export const CompleteProfileForm = ({ userId, currentName, onProfileCompleted }: CompleteProfileFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState(currentName);

  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce tu nombre completo",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(phone)) {
      toast({
        title: "Error",
        description: "Por favor, introduce un número de teléfono válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Normalize phone number
    const rawPhone = phone.replace(/\s+/g, "");
    const normalizedPhone = rawPhone.startsWith("+") ? rawPhone : `+34${rawPhone}`;

    // Check if phone is already in use by another user
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("contact_value", normalizedPhone)
      .neq("id", userId)
      .single();

    if (existingProfile) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Este número de teléfono ya está registrado con otra cuenta",
        variant: "destructive",
      });
      return;
    }

    // Update profile with phone number
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        contact_method: "phone",
        contact_value: normalizedPhone,
        profile_complete: true,
      })
      .eq("id", userId);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Perfil completado!",
      description: "Tu perfil ha sido actualizado correctamente",
    });

    onProfileCompleted();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Completa tu perfil</CardTitle>
          <CardDescription>
            Para continuar, necesitamos tu número de teléfono. Lo usaremos para enviarte recordatorios de tus citas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="612 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Se añadirá automáticamente el prefijo +34 si no lo incluyes
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Completar perfil"
              )}
            </Button>
          </form>

          {/* Privacy disclaimer */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Solo usaremos tu información para enviarte recordatorios de citas y comunicaciones relacionadas con tu reserva. 
                Bajo ningún concepto haremos uso de tus datos para el envío de publicidad.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Consulta nuestra{" "}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                Política de Privacidad
              </Link>{" "}
              y los{" "}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">
                Términos de Servicio
              </Link>
              .
            </p>
          </div>

          {/* Logout section */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Si no deseas proporcionar estos datos, no podrás acceder a la aplicación.
            </p>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};