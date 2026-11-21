import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Fingerprint, Lock, ShieldCheck, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { adminLoginAttempts } from "@/lib/adminLogin";

interface AdminGuardProps {
  children: React.ReactNode;
}

const WORD = "DIEGCUTZ";

/** Admin access = a real signed-in account with the admin role in the database. */
async function sessionIsAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;
  const { data, error } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
  return !error && data === true;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    let alive = true;
    sessionIsAdmin().then(ok => { if (alive) { setIsAuthenticated(ok); setChecking(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setIsAuthenticated(false);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const deny = (description: string) => {
    setShake(true);
    setError(true);
    setTimeout(() => setShake(false), 600);
    toast({ title: "ACCESO DENEGADO", description, variant: "destructive" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setUnlocking(true);

    let signedIn = false;
    for (const attempt of adminLoginAttempts(username)) {
      const { error } = await supabase.auth.signInWithPassword({ ...attempt, password } as never);
      if (!error) { signedIn = true; break; }
    }
    if (!signedIn) {
      setUnlocking(false);
      deny("Credenciales incorrectas.");
      return;
    }
    if (!(await sessionIsAdmin())) {
      await supabase.auth.signOut();
      setUnlocking(false);
      deny("Esta cuenta no tiene permiso de administrador.");
      return;
    }
    setTimeout(() => {
      setIsAuthenticated(true);
      setUnlocking(false);
      setPassword("");
      toast({ title: "ACCESO CONCEDIDO", description: "Bienvenido al panel de administración." });
    }, 2000);
  };

  if (checking) {
    return <div className="admin-access relative min-h-screen w-full bg-background" aria-busy="true" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-access relative min-h-screen w-full overflow-hidden bg-background">
        <div className="admin-access__chrome admin-access__chrome--one" aria-hidden="true" />
        <div className="admin-access__chrome admin-access__chrome--two" aria-hidden="true" />

        <AnimatePresence>
          {unlocking && (
            <motion.div
              key="admin-unlock"
              aria-hidden
              className="admin-unlock"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeOut" } }}
            >
              <motion.div
                className="admin-unlock__seal"
                initial={{ scale: 1.7, rotate: 10, opacity: 0 }}
                animate={{ scale: 1, rotate: -6, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 17, delay: 0.12 }}
              >
                <div className="admin-unlock__disc" />
                <svg viewBox="0 0 200 200" className="admin-unlock__ring">
                  <defs>
                    <path
                      id="admin-unlock-circle"
                      d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"
                    />
                  </defs>
                  <text textLength="472">
                    <textPath href="#admin-unlock-circle">
                      ACCESO CONCEDIDO · OPERACIONES DIEGCUTZ ·
                    </textPath>
                  </text>
                </svg>
                <div className="admin-unlock__core">
                  <ShieldCheck />
                </div>
              </motion.div>

              <motion.div
                className="admin-unlock__word"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.45 } } }}
              >
                {WORD.split("").map((letter, i) => (
                  <motion.span
                    key={`${letter}-${i}`}
                    variants={{
                      hidden: { opacity: 0, y: "0.6em" },
                      show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                className="admin-unlock__rule"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
              />

              <motion.div
                className="admin-unlock__note"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.1 }}
              >
                <span />
                Preparando el panel
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button variant="ghost" onClick={() => navigate("/")} className="admin-access__back"><ArrowLeft /> Volver</Button>
        <div className="admin-access__layout">
          <section className="admin-access__statement">
            <span>OPERACIONES · DIEGCUTZ</span>
            <h1>CONTROL<br /><em>EN MOVIMIENTO.</em></h1>
            <p>Un espacio de trabajo preciso para reservas, clientes y decisiones del estudio.</p>
            <div><ShieldCheck /><span><strong>Sistema privado</strong><small>Acceso exclusivo para administradores</small></span></div>
          </section>
          <section className={`admin-access__panel ${shake ? "animate-login-shake" : ""}`}>
            <div className="admin-access__panel-head">
              <div><Fingerprint /></div>
              <span>IDENTIDAD ADMIN</span>
            </div>
            <h2>Acceso al panel</h2>
            <p>Introduce tus credenciales para continuar.</p>
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Correo o teléfono</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      autoComplete="username"
                      className="pl-11 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      className="pl-11 h-12 tracking-widest"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={unlocking} className="admin-access__submit w-full h-12 text-base">
                  {unlocking ? "Validando identidad…" : "Entrar al panel"}
                </Button>
                {error && (
                  <div className="admin-access__error">
                    <span />
                    Acceso no válido
                  </div>
                )}
              </form>
          </section>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
