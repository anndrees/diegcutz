import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShieldAlert, Lock, User as UserIcon, Zap } from "lucide-react";
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
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [glitch, setGlitch] = useState(false);
  const [hudLines, setHudLines] = useState<string[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; dx: number; dy: number; color: string }[]>([]);

  useEffect(() => {
    if (isAuthenticated) return;
    const handler = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handler);
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 180);
    }, 3500);
    return () => {
      window.removeEventListener("mousemove", handler);
      clearInterval(glitchInterval);
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "diego" && password === "DiegCutz#2025Pro") {
      setUnlocking(true);
      sessionStorage.setItem("adminAuth", "true");
      // HUD sequence
      const steps = [
        "> CONECTANDO A MAINFRAME...",
        "> ESCANEANDO HUELLA DIGITAL...",
        "> VERIFICANDO CREDENCIALES...",
        "> DESCIFRANDO TOKEN AES-256...",
        "> ACCESO AUTORIZADO ✓",
      ];
      steps.forEach((line, i) => {
        setTimeout(() => setHudLines((prev) => [...prev, line]), i * 260);
      });
      // Burst of particles
      const colors = ["280 80% 60%", "190 95% 50%", "330 85% 60%"];
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
          description: "Bienvenido al panel, jefe.",
        });
      }, 1700);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setHudLines((prev) => [...prev.slice(-4), "> ERROR: CREDENCIALES INVÁLIDAS ✗"]);
      toast({
        title: "ACCESO DENEGADO",
        description: "Credenciales incorrectas. Intento registrado.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-wild relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 bg-background">
        {/* Animated radial spotlight following cursor */}
        <div
          className="pointer-events-none absolute inset-0 transition-[background] duration-200"
          style={{
            background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, hsl(var(--neon-purple) / 0.18), transparent 60%)`,
          }}
        />
        {/* Neon grid */}
        <div className="pointer-events-none absolute inset-0 admin-login-grid opacity-40" />
        {/* Scanlines */}
        <div className="pointer-events-none absolute inset-0 admin-login-scan" />
        {/* Floating ambient particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 25 }).map((_, i) => (
            <span
              key={i}
              className="absolute block rounded-full admin-floater"
              style={{
                left: `${(i * 37) % 100}%`,
                bottom: `-10px`,
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                background: i % 2 ? "hsl(var(--neon-cyan))" : "hsl(var(--neon-purple))",
                boxShadow: `0 0 8px hsl(var(--neon-${i % 2 ? "cyan" : "purple"}))`,
                animationDelay: `${(i * 0.4) % 8}s`,
                animationDuration: `${8 + (i % 6)}s`,
              }}
            />
          ))}
        </div>
        {/* Floating orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--neon-purple)/0.35)] blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--neon-cyan)/0.3)] blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-[hsl(var(--neon-pink)/0.25)] blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Burst particles on unlock */}
        {unlocking && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="relative">
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute block h-1.5 w-1.5 rounded-full admin-particle"
                  style={{
                    background: `hsl(${p.color})`,
                    boxShadow: `0 0 12px hsl(${p.color}), 0 0 24px hsl(${p.color})`,
                    ['--dx' as any]: `${p.dx}px`,
                    ['--dy' as any]: `${p.dy}px`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Flash on unlock */}
        {unlocking && <div className="pointer-events-none absolute inset-0 z-30 admin-flash" />}

        <div className="relative w-full max-w-md z-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 hover:text-[hsl(var(--neon-cyan))]"
          >
            <ArrowLeft className="mr-2" />
            Volver
          </Button>

          <div
            className={`admin-login-card relative rounded-2xl p-[2px] ${shake ? "animate-login-shake" : ""} ${unlocking ? "animate-login-unlock" : ""}`}
          >
            <div className="relative rounded-2xl bg-[hsl(0_0%_6%/0.85)] backdrop-blur-xl border border-[hsl(var(--neon-purple)/0.4)] p-8 overflow-hidden">
              {/* Corner brackets */}
              <span className="admin-corner top-2 left-2 border-l-2 border-t-2" />
              <span className="admin-corner top-2 right-2 border-r-2 border-t-2" />
              <span className="admin-corner bottom-2 left-2 border-l-2 border-b-2" />
              <span className="admin-corner bottom-2 right-2 border-r-2 border-b-2" />

              <div className="text-center mb-6">
                <div className="relative mx-auto mb-4 h-20 w-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--neon-purple)/0.2)] animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-[hsl(var(--neon-cyan))] animate-spin" style={{ animationDuration: "6s" }} />
                  <ShieldAlert className="h-10 w-10 text-[hsl(var(--neon-purple))] drop-shadow-[0_0_12px_hsl(var(--neon-purple))]" />
                </div>
                <h1
                  data-text="ACCESO RESTRINGIDO"
                  className={`admin-glitch text-3xl md:text-4xl font-black tracking-widest text-[hsl(var(--neon-cyan))] drop-shadow-[0_0_18px_hsl(var(--neon-cyan)/0.7)] ${glitch ? "is-glitching" : ""}`}
                >
                  ACCESO RESTRINGIDO
                </h1>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-2">
                  <Zap className="h-3 w-3 text-[hsl(var(--neon-pink))] animate-pulse" />
                  zona solo para diego
                  <Zap className="h-3 w-3 text-[hsl(var(--neon-pink))] animate-pulse" />
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[hsl(var(--neon-cyan))] uppercase tracking-widest text-xs">
                    Usuario
                  </Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--neon-cyan))] group-focus-within:text-[hsl(var(--neon-purple))] transition-colors" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="diego"
                      required
                      autoComplete="off"
                      className="pl-10 bg-[hsl(0_0%_4%)] border-[hsl(var(--neon-purple)/0.4)] focus-visible:ring-[hsl(var(--neon-cyan))] focus-visible:border-[hsl(var(--neon-cyan))] h-11 font-mono"
                    />
                    <span className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity shadow-[0_0_20px_hsl(var(--neon-cyan)/0.4)]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[hsl(var(--neon-cyan))] uppercase tracking-widest text-xs">
                    Contraseña
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--neon-cyan))] group-focus-within:text-[hsl(var(--neon-purple))] transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="pl-10 bg-[hsl(0_0%_4%)] border-[hsl(var(--neon-purple)/0.4)] focus-visible:ring-[hsl(var(--neon-cyan))] focus-visible:border-[hsl(var(--neon-cyan))] h-11 font-mono tracking-widest"
                    />
                    <span className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity shadow-[0_0_20px_hsl(var(--neon-cyan)/0.4)]" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="neon"
                  disabled={unlocking}
                  className="w-full h-12 text-base relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {unlocking ? "DESBLOQUEANDO..." : "INICIAR SESIÓN"}
                  </span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </Button>

                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground pt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--neon-cyan))] animate-pulse" />
                    sistema online
                  </span>
                  <span className="font-mono">v2.0.26</span>
                </div>

                {/* HUD terminal */}
                {hudLines.length > 0 && (
                  <div className="mt-3 rounded-md border border-[hsl(var(--neon-cyan)/0.3)] bg-black/70 p-3 font-mono text-[11px] leading-relaxed text-[hsl(var(--neon-cyan))] shadow-[0_0_20px_hsl(var(--neon-cyan)/0.2)] max-h-32 overflow-hidden">
                    {hudLines.map((line, i) => (
                      <div
                        key={i}
                        className={`admin-hud-line ${line.includes("✗") ? "text-[hsl(var(--destructive))]" : ""} ${line.includes("✓") ? "text-[hsl(var(--neon-pink))]" : ""}`}
                      >
                        {line}
                        {i === hudLines.length - 1 && <span className="admin-cursor">▍</span>}
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
