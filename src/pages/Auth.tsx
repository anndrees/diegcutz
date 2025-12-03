import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupFullName, setSignupFullName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupContactType, setSignupContactType] = useState<"phone" | "email">("phone");
  const [signupContactValue, setSignupContactValue] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // Helper function to translate error messages
  const translateError = (error: any): string => {
    const message = error?.message || error?.toString() || "";
    
    // Common Supabase auth errors
    if (message.includes("User already registered") || message.includes("user_already_exists")) {
      return "Este email o teléfono ya está registrado. Por favor, inicia sesión o usa otro.";
    }
    if (message.includes("Email not confirmed")) {
      return "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de correo.";
    }
    if (message.includes("Phone not confirmed")) {
      return "Debes confirmar tu teléfono antes de iniciar sesión.";
    }
    if (message.includes("Phone signups are disabled")) {
      return "El registro por teléfono no está disponible en este momento.";
    }
    if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
      return "Usuario o contraseña incorrectos.";
    }
    if (message.includes("Email rate limit exceeded")) {
      return "Demasiados intentos. Por favor, espera unos minutos antes de intentar de nuevo.";
    }
    if (message.includes("timeout") || message.includes("upstream")) {
      return "El servidor está tardando en responder. Por favor, inténtalo de nuevo en unos segundos.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Error de conexión. Verifica tu conexión a internet.";
    }
    if (message.includes("Password should be at least")) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (message.includes("Unable to validate email address")) {
      return "El formato del email no es válido.";
    }
    if (message.includes("Signups not allowed")) {
      return "Los registros están deshabilitados temporalmente.";
    }
    
    // Generic fallback
    return "Ha ocurrido un error. Por favor, inténtalo de nuevo.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // First, get the profile to find the email associated with the username
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("contact_value, contact_method")
      .eq("username", loginUsername)
      .single();

    if (profileError || !profileData) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Usuario no encontrado",
        variant: "destructive",
      });
      return;
    }

    let signInError = null;

    if (profileData.contact_method === "email") {
      const { error } = await supabase.auth.signInWithPassword({
        email: profileData.contact_value,
        password: loginPassword,
      });
      signInError = error;
    } else {
      const normalizedPhone = profileData.contact_value.replace(/\s+/g, "");
      const phone = normalizedPhone.startsWith("+") ? normalizedPhone : `+34${normalizedPhone}`;

      const { error } = await supabase.auth.signInWithPassword({
        phone,
        password: loginPassword,
      });
      signInError = error;
    }

    setLoading(false);

    if (signInError) {
      toast({
        title: "Error",
        description: translateError(signInError),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Bienvenido!",
      description: "Has iniciado sesión correctamente",
    });

    // Redirect to booking or original destination
    const from = location.state?.from || "/booking";
    navigate(from, { replace: true });
  };

  const validateSignupContact = () => {
    if (signupContactType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(signupContactValue);
    } else {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      return phoneRegex.test(signupContactValue.replace(/\s/g, ''));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (signupPassword !== signupConfirmPassword) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 6) {
      setLoading(false);
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!validateSignupContact()) {
      setLoading(false);
      toast({
        title: "Error",
        description: signupContactType === "email" ? "El formato del email no es válido" : "El formato del teléfono no es válido",
        variant: "destructive",
      });
      return;
    }

    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", signupUsername)
      .single();

    if (existingProfile) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Este nombre de usuario ya está en uso",
        variant: "destructive",
      });
      return;
    }

    const redirectUrl = `${window.location.origin}/`;

    let signUpError = null;
    let signUpData = null;

    if (signupContactType === "email") {
      const { data, error } = await supabase.auth.signUp({
        email: signupContactValue,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupFullName,
            username: signupUsername,
            contact_method: signupContactType,
            contact_value: signupContactValue,
          },
        },
      });
      signUpError = error;
      signUpData = data;
    } else {
      const rawPhone = signupContactValue.replace(/\s+/g, "");
      const phone = rawPhone.startsWith("+") ? rawPhone : `+34${rawPhone}`;

      const { data, error } = await supabase.auth.signUp({
        phone,
        password: signupPassword,
        options: {
          data: {
            full_name: signupFullName,
            username: signupUsername,
            contact_method: signupContactType,
            contact_value: phone,
          },
        },
      });
      signUpError = error;
      signUpData = data;
    }

    setLoading(false);

    if (signUpError) {
      toast({
        title: "Error",
        description: translateError(signUpError),
        variant: "destructive",
      });
      return;
    }

    // Check if the user already exists (Supabase returns user but no session for existing users)
    if (signUpData?.user && !signUpData?.session && signupContactType === "phone") {
      // For phone signups, user might already exist
      const { data: existingAuth } = await supabase
        .from("profiles")
        .select("id")
        .eq("contact_value", signupContactValue.startsWith("+") ? signupContactValue : `+34${signupContactValue.replace(/\s+/g, "")}`)
        .single();

      if (existingAuth) {
        toast({
          title: "Error",
          description: "Este teléfono ya está registrado. Por favor, inicia sesión.",
          variant: "destructive",
        });
        return;
      }
    }

    const successMessage = signupContactType === "email"
      ? "Tu cuenta ha sido creada. Revisa tu email para confirmar tu cuenta antes de iniciar sesión."
      : "¡Tu cuenta ha sido creada! Ya puedes iniciar sesión.";

    toast({
      title: "¡Cuenta creada!",
      description: successMessage,
    });

    // Clear signup form
    setSignupFullName("");
    setSignupUsername("");
    setSignupContactValue("");
    setSignupPassword("");
    setSignupConfirmPassword("");
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Volver
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 text-neon-purple font-aggressive">
            DIEGCUTZ
          </h1>
          <p className="text-xl text-muted-foreground">
            Accede a tu cuenta
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="text-primary" />
                  Iniciar Sesión
                </CardTitle>
                <CardDescription>
                  Ingresa con tu usuario y contraseña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-username">Nombre de usuario</Label>
                    <Input
                      id="login-username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="usuario"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="neon"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Iniciando..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="text-neon-cyan" />
                  Crear Cuenta
                </CardTitle>
                <CardDescription>
                  Regístrate para hacer reservas más rápido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-fullname">Nombre completo</Label>
                    <Input
                      id="signup-fullname"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-username">Nombre de usuario</Label>
                    <Input
                      id="signup-username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="usuario"
                      required
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Método de contacto</Label>
                    <RadioGroup 
                      value={signupContactType} 
                      onValueChange={(value) => {
                        setSignupContactType(value as "phone" | "email");
                        setSignupContactValue("");
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="signup-phone" />
                        <Label htmlFor="signup-phone" className="cursor-pointer">Teléfono</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="signup-email" />
                        <Label htmlFor="signup-email" className="cursor-pointer">Email</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="signup-contact">
                      {signupContactType === "phone" ? "Teléfono" : "Email"}
                    </Label>
                    <Input
                      id="signup-contact"
                      type={signupContactType === "email" ? "email" : "tel"}
                      value={signupContactValue}
                      onChange={(e) => setSignupContactValue(e.target.value)}
                      placeholder={signupContactType === "phone" ? "+34 123 456 789" : "tu@email.com"}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-confirm-password">Confirmar contraseña</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="neonCyan"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
