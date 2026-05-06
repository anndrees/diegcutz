import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowDown, ArrowUp, Tv, Save, Lock, Eye, EyeOff } from "lucide-react";

export type TvSlideKey =
  | "queue"
  | "services"
  | "packs"
  | "memberships"
  | "giveaways"
  | "hours"
  | "brand"
  | "stats"
  | "reviews"
  | "coupons"
  | "social"
  | "promo"
  | "achievements_feed"
  | "special_hours_upcoming"
  | "cuts_today"
  | "next_slot"
  | "qr_book"
  | "loyalty_program";

export type TvSettings = {
  passcode: string;
  reduceMotion?: boolean;
  slides: { key: TvSlideKey; enabled: boolean }[];
};

const DEFAULT_SETTINGS: TvSettings = {
  passcode: "1234",
  reduceMotion: false,
  slides: [
    { key: "queue", enabled: true },
    { key: "next_slot", enabled: true },
    { key: "cuts_today", enabled: true },
    { key: "services", enabled: true },
    { key: "packs", enabled: true },
    { key: "memberships", enabled: true },
    { key: "giveaways", enabled: true },
    { key: "qr_book", enabled: true },
    { key: "loyalty_program", enabled: true },
    { key: "achievements_feed", enabled: true },
    { key: "special_hours_upcoming", enabled: true },
    { key: "promo", enabled: true },
    { key: "reviews", enabled: true },
    { key: "coupons", enabled: true },
    { key: "stats", enabled: true },
    { key: "social", enabled: true },
    { key: "hours", enabled: true },
    { key: "brand", enabled: true },
  ],
};

const LABELS: Record<TvSlideKey, string> = {
  queue: "Cola del día",
  services: "Servicios",
  packs: "Packs",
  memberships: "Membresías",
  giveaways: "Sorteos",
  hours: "Horario",
  brand: "Marca / Branding",
  stats: "Estadísticas (números)",
  reviews: "Reseñas / Testimonios",
  coupons: "Cupones activos",
  social: "Redes sociales (Instagram)",
  promo: "Próximo hueco / Reserva ya",
  achievements_feed: "Logros desbloqueados (hoy/semana)",
  special_hours_upcoming: "Próximos eventos / horarios especiales",
  cuts_today: "Cortes hoy en directo",
  next_slot: "Próximo hueco libre",
  qr_book: "QR para reservar",
  loyalty_program: "Programa de fidelidad",
};

export const TvModeManagement = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TvSettings>(DEFAULT_SETTINGS);
  const [passcode, setPasscode] = useState("1234");
  const [confirmPasscode, setConfirmPasscode] = useState("1234");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMotion, setSavingMotion] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "tv_settings").maybeSingle();
      if (data?.value) {
        const v = data.value as any as TvSettings;
        // merge with defaults to ensure new slides appear
        const map = new Map(v.slides?.map((s) => [s.key, s.enabled]) ?? []);
        const merged = DEFAULT_SETTINGS.slides.map((d) => ({
          key: d.key,
          enabled: map.get(d.key) ?? d.enabled,
        }));
        const ordered = [
          ...(v.slides?.filter((s) => DEFAULT_SETTINGS.slides.some((d) => d.key === s.key)) || []),
          ...merged.filter((m) => !v.slides?.some((s) => s.key === m.key)),
        ];
        setSettings({ passcode: v.passcode || "1234", reduceMotion: !!v.reduceMotion, slides: ordered });
        setPasscode(v.passcode || "1234");
        setConfirmPasscode(v.passcode || "1234");
      }
      setLoading(false);
    })();
  }, []);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= settings.slides.length) return;
    const arr = [...settings.slides];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSettings({ ...settings, slides: arr });
  };

  const toggle = (i: number) => {
    const arr = [...settings.slides];
    arr[i] = { ...arr[i], enabled: !arr[i].enabled };
    setSettings({ ...settings, slides: arr });
  };

  const toggleReduceMotion = async (v: boolean) => {
    const next = { ...settings, reduceMotion: v };
    setSettings(next);
    setSavingMotion(true);
    const value = { ...next, passcode };
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "tv_settings", value: value as any }, { onConflict: "key" });
    setSavingMotion(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      setSettings({ ...next, reduceMotion: !v });
      return;
    }
    toast({ title: v ? "Reducción de movimiento activada" : "Reducción de movimiento desactivada", description: "Aplicado en /tv en tiempo real" });
  };

  const save = async () => {
    if (!/^\d{4,8}$/.test(passcode)) {
      toast({ title: "Código inválido", description: "Debe ser numérico (4-8 dígitos)", variant: "destructive" });
      return;
    }
    if (passcode !== confirmPasscode) {
      toast({ title: "Códigos no coinciden", description: "Revisa la confirmación", variant: "destructive" });
      return;
    }
    setSaving(true);
    const value = { ...settings, passcode };
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "tv_settings", value: value as any }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      return;
    }
    setSettings(value);
    toast({ title: "Configuración guardada", description: "El modo TV se ha actualizado" });
  };

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Tv className="h-6 w-6 text-neon-cyan" />
            <div>
              <CardTitle>Modo TV</CardTitle>
              <CardDescription>Configura los slides que rotan en /tv y su orden</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-neon-cyan/30 bg-neon-cyan/5">
            <div className="min-w-0">
              <p className="font-semibold">Reducir movimiento</p>
              <p className="text-xs text-muted-foreground">
                Desactiva animaciones pesadas (fondos, partículas, blobs). Útil para TVs antiguas con lag.
              </p>
            </div>
            <Switch
              checked={!!settings.reduceMotion}
              disabled={savingMotion}
              onCheckedChange={toggleReduceMotion}
            />
          </div>
          {settings.slides.map((s, i) => (
            <div
              key={s.key}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                <span className="font-semibold">{LABELS[s.key]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => move(i, 1)}
                  disabled={i === settings.slides.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Switch checked={s.enabled} onCheckedChange={() => toggle(i)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-neon-purple" />
            <div>
              <CardTitle>Código de acceso a /tv</CardTitle>
              <CardDescription>
                Numérico (4-8 dígitos). Por defecto: 1234. Se solicitará al abrir /tv en cualquier dispositivo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Código</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  inputMode="numeric"
                  pattern="\d*"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPass((s) => !s)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>Confirmar código</Label>
              <Input
                type={showPass ? "text" : "password"}
                inputMode="numeric"
                pattern="\d*"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} variant="neon">
          <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </div>
  );
};