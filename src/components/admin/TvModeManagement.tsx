import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tv, Save, Lock, Eye, EyeOff, RotateCcw, GripVertical, Search, Zap, ZapOff, Clock, Scissors, Star, Gift, Calendar, QrCode, Trophy, Sparkles, Image as ImageIcon, BarChart3, Instagram, Tag, Crown, Users, Megaphone } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type TvSlideKey =
  | "queue" | "services" | "packs" | "memberships" | "giveaways" | "hours"
  | "brand" | "stats" | "reviews" | "coupons" | "social" | "promo"
  | "achievements_feed" | "special_hours_upcoming" | "cuts_today"
  | "next_slot" | "qr_book" | "loyalty_program";

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

const META: Record<TvSlideKey, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  queue:                  { label: "Cola del día",            icon: Users,     color: "text-cyan-400" },
  services:               { label: "Servicios",                icon: Scissors,  color: "text-emerald-400" },
  packs:                  { label: "Packs",                    icon: Tag,       color: "text-fuchsia-400" },
  memberships:            { label: "Membresías",               icon: Crown,     color: "text-amber-400" },
  giveaways:              { label: "Sorteos",                  icon: Gift,      color: "text-pink-400" },
  hours:                  { label: "Horario",                  icon: Clock,     color: "text-sky-400" },
  brand:                  { label: "Marca / Branding",         icon: ImageIcon, color: "text-violet-400" },
  stats:                  { label: "Estadísticas",             icon: BarChart3, color: "text-lime-400" },
  reviews:                { label: "Reseñas",                  icon: Star,      color: "text-yellow-400" },
  coupons:                { label: "Cupones activos",          icon: Tag,       color: "text-rose-400" },
  social:                 { label: "Instagram",                icon: Instagram, color: "text-pink-500" },
  promo:                  { label: "Reserva ya / Promo",       icon: Megaphone, color: "text-orange-400" },
  achievements_feed:      { label: "Logros desbloqueados",     icon: Trophy,    color: "text-amber-300" },
  special_hours_upcoming: { label: "Horarios especiales",      icon: Calendar,  color: "text-indigo-400" },
  cuts_today:             { label: "Cortes hoy en directo",    icon: Sparkles,  color: "text-cyan-300" },
  next_slot:              { label: "Próximo hueco libre",      icon: Clock,     color: "text-teal-400" },
  qr_book:                { label: "QR para reservar",         icon: QrCode,    color: "text-white" },
  loyalty_program:        { label: "Programa de fidelidad",    icon: Crown,     color: "text-amber-400" },
};

function SortableRow({
  s, index, total, onToggle, onPositionChange,
}: {
  s: { key: TvSlideKey; enabled: boolean };
  index: number;
  total: number;
  onToggle: () => void;
  onPositionChange: (newPos: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.key });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : "auto" as any, opacity: isDragging ? 0.85 : 1 };
  const meta = META[s.key];
  const Icon = meta.icon;
  const [posDraft, setPosDraft] = useState<string>(String(index + 1));
  useEffect(() => { setPosDraft(String(index + 1)); }, [index]);

  const commitPos = () => {
    const n = parseInt(posDraft, 10);
    if (!Number.isFinite(n)) { setPosDraft(String(index + 1)); return; }
    const target = Math.max(1, Math.min(total, n)) - 1;
    if (target !== index) onPositionChange(target);
    else setPosDraft(String(index + 1));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-md border bg-card/40 hover:bg-card/80 transition-colors ${
        s.enabled ? "border-border" : "border-border/40 opacity-60"
      } ${isDragging ? "shadow-2xl shadow-neon-cyan/20 border-neon-cyan/60" : ""}`}
    >
      <button
        type="button"
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        type="number"
        min={1}
        max={total}
        value={posDraft}
        onChange={(e) => setPosDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={commitPos}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="h-7 w-12 text-center px-1 text-xs font-mono"
        title="Escribe la posición y pulsa Enter"
      />
      <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
      <span className={`text-sm flex-1 truncate ${s.enabled ? "" : "line-through text-muted-foreground"}`}>{meta.label}</span>
      <Switch checked={s.enabled} onCheckedChange={onToggle} />
    </div>
  );
}

export const TvModeManagement = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TvSettings>(DEFAULT_SETTINGS);
  const [passcode, setPasscode] = useState("1234");
  const [confirmPasscode, setConfirmPasscode] = useState("1234");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMotion, setSavingMotion] = useState(false);
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "tv_settings").maybeSingle();
      if (data?.value) {
        const v = data.value as any as TvSettings;
        const map = new Map(v.slides?.map((s) => [s.key, s.enabled]) ?? []);
        const merged = DEFAULT_SETTINGS.slides.map((d) => ({ key: d.key, enabled: map.get(d.key) ?? d.enabled }));
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

  const persist = async (next: TvSettings, opts?: { silent?: boolean }) => {
    const value = { ...next, passcode };
    const { error } = await supabase.from("app_settings").upsert({ key: "tv_settings", value: value as any }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      return false;
    }
    if (!opts?.silent) toast({ title: "Guardado", description: "Cambios aplicados en /tv en tiempo real" });
    return true;
  };

  const setSlidesAndSave = async (newSlides: TvSettings["slides"]) => {
    const next = { ...settings, slides: newSlides };
    setSettings(next);
    await persist(next, { silent: true });
  };

  const toggle = async (key: TvSlideKey) => {
    const newSlides = settings.slides.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s));
    await setSlidesAndSave(newSlides);
  };

  const onPositionChange = async (key: TvSlideKey, target: number) => {
    const from = settings.slides.findIndex((s) => s.key === key);
    if (from === -1) return;
    await setSlidesAndSave(arrayMove(settings.slides, from, target));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = settings.slides.findIndex((s) => s.key === active.id);
    const to = settings.slides.findIndex((s) => s.key === over.id);
    if (from === -1 || to === -1) return;
    await setSlidesAndSave(arrayMove(settings.slides, from, to));
  };

  const toggleReduceMotion = async (v: boolean) => {
    const next = { ...settings, reduceMotion: v };
    setSettings(next);
    setSavingMotion(true);
    const ok = await persist(next, { silent: true });
    setSavingMotion(false);
    if (!ok) { setSettings({ ...next, reduceMotion: !v }); return; }
    toast({ title: v ? "Reducción de movimiento ON" : "Reducción de movimiento OFF" });
  };

  const resetOrder = async () => {
    const next = { ...settings, slides: [...DEFAULT_SETTINGS.slides] };
    setSettings(next);
    const ok = await persist(next, { silent: true });
    if (ok) toast({ title: "Orden restaurado", description: "Se aplicó el orden predeterminado" });
  };

  const enableAll = async (enabled: boolean) => {
    await setSlidesAndSave(settings.slides.map((s) => ({ ...s, enabled })));
  };

  const savePasscode = async () => {
    if (!/^\d{4,8}$/.test(passcode)) { toast({ title: "Código inválido", description: "4-8 dígitos numéricos", variant: "destructive" }); return; }
    if (passcode !== confirmPasscode) { toast({ title: "Códigos no coinciden", variant: "destructive" }); return; }
    setSaving(true);
    await persist(settings);
    setSaving(false);
  };

  const enabledCount = settings.slides.filter((s) => s.enabled).length;

  const filteredKeys = useMemo(() => {
    if (!search.trim()) return new Set(settings.slides.map((s) => s.key));
    const q = search.toLowerCase();
    return new Set(settings.slides.filter((s) => META[s.key].label.toLowerCase().includes(q)).map((s) => s.key));
  }, [search, settings.slides]);

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-4">
      <Card className="border-neon-cyan/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Tv className="h-5 w-5 text-neon-cyan shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-base">Modo TV</CardTitle>
                <CardDescription className="text-xs">
                  {enabledCount}/{settings.slides.length} slides activos · cambios se guardan al instante
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={settings.reduceMotion ? "secondary" : "outline"}
                onClick={() => toggleReduceMotion(!settings.reduceMotion)}
                disabled={savingMotion}
                className="h-8"
              >
                {settings.reduceMotion ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                <span className="ml-1.5 text-xs">{settings.reduceMotion ? "Mov. reducido" : "Movimiento ON"}</span>
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => enableAll(true)}>Todos</Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => enableAll(false)}>Ninguno</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={resetOrder}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Predeterminado
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar slide..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-2 px-1">
            <GripVertical className="h-3 w-3" /> Arrastra para reordenar · escribe el número para mover a una posición exacta
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={settings.slides.map((s) => s.key)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {settings.slides.map((s, i) => (
                  <div key={s.key} className={filteredKeys.has(s.key) ? "" : "hidden"}>
                    <SortableRow
                      s={s}
                      index={i}
                      total={settings.slides.length}
                      onToggle={() => toggle(s.key)}
                      onPositionChange={(target) => onPositionChange(s.key, target)}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-neon-purple" />
            <div>
              <CardTitle className="text-base">Código de acceso /tv</CardTitle>
              <CardDescription className="text-xs">4-8 dígitos. Por defecto: 1234</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Código</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  inputMode="numeric"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="h-9"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPass((s) => !s)}>
                  {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Confirmar</Label>
              <Input
                type={showPass ? "text" : "password"}
                inputMode="numeric"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={savePasscode} disabled={saving} variant="neon" size="sm">
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Guardando..." : "Guardar código"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
