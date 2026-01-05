import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, Loader2 } from "lucide-react";

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
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};
