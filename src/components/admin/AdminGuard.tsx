import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Fingerprint, Lock, ShieldCheck, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("adminAuth") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [hudLines, setHudLines] = useState<string[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; dx: number; dy: number; color: string }[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "diego" && password === "DiegCutz#2025Pro") {
      setUnlocking(true);
      sessionStorage.setItem("adminAuth", "true");
      // HUD sequence
      const steps = [
        "CONECTANDO CON EL ESTUDIO",
        "VALIDANDO IDENTIDAD",
        "SINCRONIZANDO EL PANEL",
        "PREPARANDO EL ESPACIO",
        "ACCESO AUTORIZADO",
      ];
      steps.forEach((line, i) => {
        setTimeout(() => setHudLines((prev) => [...prev, line]), i * 260);
      });
      // Burst of particles
      const colors = ["189 100% 57%", "207 9% 86%", "216 14% 42%"];
      const burst = Array.from({ length: 60 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 60;
        const speed = 80 + Math.random() * 180;
        return {
          id: Date.now() + i,
          x: 50,
          y: 50,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          color: colors[i % colors.length],
        };
      });
      setParticles(burst);
      setTimeout(() => {
        setIsAuthenticated(true);
        toast({
          title: "ACCESO CONCEDIDO",
          description: "Bienvenido al panel de administración.",
        });
      }, 1700);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setHudLines((prev) => [...prev.slice(-4), "CREDENCIALES NO VÁLIDAS"]);
      toast({
        title: "ACCESO DENEGADO",
        description: "Credenciales incorrectas. Intento registrado.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-access relative min-h-screen w-full overflow-hidden bg-background">
        <div className="admin-access__mesh" aria-hidden="true" />
        <div className="admin-access__chrome admin-access__chrome--one" aria-hidden="true" />
        <div className="admin-access__chrome admin-access__chrome--two" aria-hidden="true" />
        {unlocking && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="relative">
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute block h-1.5 w-1.5 rounded-full admin-particle"
                  style={{
                    background: `hsl(${p.color})`,
                    boxShadow: `0 0 12px hsl(${p.color})`,
                    ['--dx' as any]: `${p.dx}px`,
                    ['--dy' as any]: `${p.dy}px`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {unlocking && <div className="pointer-events-none absolute inset-0 z-30 admin-flash" />}
        <Button variant="ghost" onClick={() => navigate("/")} className="admin-access__back"><ArrowLeft /> Volver</Button>
        <div className="admin-access__layout">
          <section className="admin-access__statement">
            <span>OPERACIONES · DIEGCUTZ</span>
            <h1>CONTROL<br /><em>EN MOVIMIENTO.</em></h1>
            <p>Un espacio de trabajo preciso para reservas, clientes y decisiones del estudio.</p>
            <div><ShieldCheck /><span><strong>Sistema privado</strong><small>Acceso exclusivo para administradores</small></span></div>
          </section>
          <section className={`admin-access__panel ${shake ? "animate-login-shake" : ""} ${unlocking ? "animate-login-unlock" : ""}`}>
            <div className="admin-access__panel-head">
              <div><Fingerprint /></div>
              <span>IDENTIDAD ADMIN</span>
            </div>
            <h2>Acceso al panel</h2>
            <p>Introduce tus credenciales para continuar.</p>
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="usuario"
                      required
                      autoComplete="off"
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
                      className="pl-11 h-12 tracking-widest"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={unlocking} className="admin-access__submit w-full h-12 text-base">
                  {unlocking ? "Preparando panel..." : "Entrar al panel"}
                </Button>
                {hudLines.length > 0 && (
                  <div className="admin-access__status">
                    {hudLines.map((line, i) => (
                      <div key={i} className="admin-hud-line"><span />{line}</div>
                    ))}
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
