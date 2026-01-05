import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuthEnabled } from "@/hooks/useGoogleAuthEnabled";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LogIn, UserPlus, Check, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Username validation regex: only lowercase a-z, 0-9, underscore, period
const USERNAME_REGEX = /^[a-z0-9_.]+$/;

const sanitizeUsername = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.]/g, ''); // Remove any invalid characters
};

const generateUsernameSuggestions = (base: string): string[] => {
  const sanitized = sanitizeUsername(base);
  if (!sanitized) return [];

  const suggestions: string[] = [];
  const randomNum1 = Math.floor(Math.random() * 999) + 1;
  const randomNum2 = Math.floor(Math.random() * 999) + 1;
  const year = new Date().getFullYear().toString().slice(-2);

  suggestions.push(`${sanitized}${randomNum1}`);
  suggestions.push(`${sanitized}_${year}`);
  suggestions.push(`${sanitized}.${randomNum2}`);

  return suggestions;
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isGoogleAuthEnabled, loading: googleAuthSettingLoading } = useGoogleAuthEnabled();
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated (handles OAuth callback)
  useEffect(() => {
    if (!authLoading && user) {
      const from = location.state?.from || "/";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location.state]);

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

  // Username availability state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  // Google auth linking state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkAccountDialog, setLinkAccountDialog] = useState(false);
  const [linkAccountData, setLinkAccountData] = useState<{
    existingPhone: string;
    googleEmail: string;
    googleName: string;
  } | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkingAccount, setLinkingAccount] = useState(false);

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

  const handleUsernameChange = (value: string) => {
    const sanitized = sanitizeUsername(value);
    setSignupUsername(sanitized);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
  };

  const checkUsernameAvailability = async () => {
    const username = signupUsername.trim();

    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      setUsernameAvailable(false);
      setUsernameSuggestions([]);
      return;
    }

    setCheckingUsername(true);

    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

      if (existingProfile) {
        setUsernameAvailable(false);
        // Generate and check suggestions
        const suggestions = generateUsernameSuggestions(username);
        const availableSuggestions: string[] = [];

        for (const suggestion of suggestions) {
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", suggestion)
            .single();

          if (!data) {
            availableSuggestions.push(suggestion);
          }
        }

        setUsernameSuggestions(availableSuggestions.slice(0, 3));
      } else {
        setUsernameAvailable(true);
        setUsernameSuggestions([]);
      }
    } catch {
      // Error means no profile found, username is available
      setUsernameAvailable(true);
      setUsernameSuggestions([]);
    } finally {
      setCheckingUsername(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSignupUsername(suggestion);
    setUsernameAvailable(true);
    setUsernameSuggestions([]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedLoginUsername = sanitizeUsername(loginUsername);

    // First, get the profile to find the email associated with the username and check ban status
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("contact_value, contact_method, is_banned, ban_reason")
      .eq("username", normalizedLoginUsername)
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

    // Check if user is banned
    if (profileData.is_banned) {
      setLoading(false);
      toast({
        title: "Cuenta suspendida",
        description: profileData.ban_reason || "Tu cuenta ha sido suspendida. Contacta con el administrador.",
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

    // Redirect to original destination or home
    const from = location.state?.from || "/";
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

  const validateUsername = (username: string): string | null => {
    if (username.length < 3) {
      return "El nombre de usuario debe tener al menos 3 caracteres";
    }
    if (username.length > 30) {
      return "El nombre de usuario no puede tener más de 30 caracteres";
    }
    if (!USERNAME_REGEX.test(username)) {
      return "Solo se permiten letras minúsculas, números, punto (.) y guion bajo (_)";
    }
    if (username.startsWith('.') || username.endsWith('.')) {
      return "El nombre de usuario no puede empezar ni terminar con punto";
    }
    if (username.includes('..')) {
      return "El nombre de usuario no puede tener puntos consecutivos";
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const username = signupUsername.trim();

    // Username validation
    const usernameError = validateUsername(username);
    if (usernameError) {
      setLoading(false);
      toast({
        title: "Error",
        description: usernameError,
        variant: "destructive",
      });
      return;
    }

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

    // Check if username already exists (double-check on submit)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single();

    if (existingProfile) {
      setLoading(false);
      setUsernameAvailable(false);
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
            username: username,
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
            username: username,
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
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
  };

  // Generate username from Google name
  const generateUsernameFromName = async (fullName: string): Promise<string> => {
    const nameParts = fullName.toLowerCase().trim().split(/\s+/);
    const firstName = sanitizeUsername(nameParts[0] || "user");
    const lastName = sanitizeUsername(nameParts[nameParts.length - 1] || "");
    
    // Priority 1: Just first name
    const { data: check1 } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", firstName)
      .single();
    
    if (!check1) return firstName;
    
    // Priority 2: firstname + lastname
    if (lastName && firstName !== lastName) {
      const combined = `${firstName}${lastName}`;
      const { data: check2 } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", combined)
        .single();
      
      if (!check2) return combined;
    }
    
    // Priority 3: firstname + random numbers
    for (let i = 0; i < 10; i++) {
      const randomNum = Math.floor(Math.random() * 9999) + 1;
      const withNumbers = `${firstName}${randomNum}`;
      const { data: check3 } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", withNumbers)
        .single();
      
      if (!check3) return withNumbers;
    }
    
    // Fallback
    return `${firstName}${Date.now().toString().slice(-6)}`;
  };

  // Normalize phone number for comparison
  const normalizePhone = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, "").replace(/^00/, "+");
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: translateError(error),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo conectar con Google",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle link account confirmation
  const handleLinkAccount = async () => {
    if (!linkAccountData || !linkPassword) {
      toast({
        title: "Error",
        description: "Introduce tu contraseña actual",
        variant: "destructive",
      });
      return;
    }

    setLinkingAccount(true);

    try {
      // Verify password by trying to sign in
      const { data: profile } = await supabase
        .from("profiles")
        .select("contact_value, contact_method")
        .eq("contact_value", linkAccountData.existingPhone)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "No se encontró la cuenta",
          variant: "destructive",
        });
        setLinkingAccount(false);
        return;
      }

      // Try to sign in with existing credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: profile.contact_value,
        password: linkPassword,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Contraseña incorrecta",
          variant: "destructive",
        });
        setLinkingAccount(false);
        return;
      }

      // Update profile to add Google email
      await supabase
        .from("profiles")
        .update({ 
          // Keep existing phone as primary, but we could add google_email field if needed
        })
        .eq("contact_value", linkAccountData.existingPhone);

      toast({
        title: "¡Cuentas enlazadas!",
        description: "Ahora puedes iniciar sesión con Google o con tu teléfono",
      });

      setLinkAccountDialog(false);
      setLinkAccountData(null);
      setLinkPassword("");

      // Redirect
      const from = location.state?.from || "/";
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron enlazar las cuentas",
        variant: "destructive",
      });
    } finally {
      setLinkingAccount(false);
    }
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
                      onChange={(e) => setLoginUsername(sanitizeUsername(e.target.value))}
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

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">o continúa con</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || !isGoogleAuthEnabled || googleAuthSettingLoading}
                    title={!isGoogleAuthEnabled ? "Google Sign-In está deshabilitado" : undefined}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {googleLoading ? "Conectando..." : !isGoogleAuthEnabled ? "Google (Deshabilitado)" : "Google"}
                  </Button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      ¿Has olvidado tu contraseña?
                    </button>
                  </div>
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
                    <div className="relative">
                      <Input
                        id="signup-username"
                        value={signupUsername}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        onBlur={checkUsernameAvailability}
                        placeholder="usuario"
                        className={`pr-10 ${
                          usernameAvailable === true ? 'border-green-500 focus-visible:ring-green-500' : 
                          usernameAvailable === false ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        required
                      />
                      {checkingUsername && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo letras minúsculas, números, punto (.) y guion bajo (_)
                    </p>
                    {usernameAvailable === false && usernameSuggestions.length > 0 && (
                        <div className="mt-2 space-y-1">
                        <p className="text-xs text-destructive">Este nombre no está disponible. Prueba con:</p>
                          <div className="flex flex-wrap gap-2">
                            {usernameSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => selectSuggestion(suggestion)}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
                        <RadioGroupItem
                          value="email"
                          id="signup-email"
                          disabled
                        />
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="signup-email"
                            className="cursor-pointer text-muted-foreground"
                          >
                            Email
                          </Label>
                          <span className="text-xs text-orange-500">
                            (Temporalmente deshabilitado)
                          </span>
                        </div>
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

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">o regístrate con</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || !isGoogleAuthEnabled || googleAuthSettingLoading}
                    title={!isGoogleAuthEnabled ? "Google Sign-In está deshabilitado" : undefined}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {googleLoading ? "Conectando..." : !isGoogleAuthEnabled ? "Google (Deshabilitado)" : "Google"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Link Account Dialog */}
        <Dialog open={linkAccountDialog} onOpenChange={setLinkAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cuenta existente detectada</DialogTitle>
              <DialogDescription>
                Ya existe una cuenta con el teléfono asociado a tu cuenta de Google ({linkAccountData?.existingPhone}). 
                ¿Quieres enlazar ambas cuentas para poder iniciar sesión de cualquier forma?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Introduce tu contraseña actual</Label>
                <Input
                  type="password"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkAccountDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleLinkAccount} disabled={linkingAccount} variant="neon">
                {linkingAccount ? "Enlazando..." : "Enlazar cuentas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Auth;
