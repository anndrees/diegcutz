import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Crown, Trophy, Gift, ArrowRight, AlertTriangle, Loader2, CheckCircle2, Users } from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  username: string;
  contact_value: string;
  is_banned?: boolean | null;
};

type UserStats = {
  completed_bookings: number;
  free_cuts_available: number;
  bookings_count: number;
  membership_name: string | null;
  membership_emoji: string | null;
  membership_sort_order: number | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged?: () => void;
}

export const MergeUsersDialog = ({ open, onOpenChange, onMerged }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [primary, setPrimary] = useState<Profile | null>(null);
  const [secondary, setSecondary] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{ primary?: UserStats; secondary?: UserStats }>({});
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setPrimary(null);
      setSecondary(null);
      setSearch1("");
      setSearch2("");
      setStats({});
      loadProfiles();
    }
  }, [open]);

  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, contact_value, is_banned")
      .order("full_name", { ascending: true });
    setProfiles((data as any) || []);
  };

  const fetchStats = async (userId: string): Promise<UserStats> => {
    const [loyaltyRes, bookingsRes, memRes] = await Promise.all([
      supabase.from("loyalty_rewards").select("completed_bookings, free_cuts_available").eq("user_id", userId).maybeSingle(),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("user_memberships").select("membership_id").eq("user_id", userId).eq("status", "active").maybeSingle(),
    ]);
    let mName: string | null = null, mEmoji: string | null = null, mSort: number | null = null;
    if (memRes.data?.membership_id) {
      const { data: m } = await supabase.from("memberships").select("name, emoji, sort_order").eq("id", memRes.data.membership_id).maybeSingle();
      if (m) { mName = m.name; mEmoji = m.emoji; mSort = m.sort_order; }
    }
    return {
      completed_bookings: loyaltyRes.data?.completed_bookings || 0,
      free_cuts_available: loyaltyRes.data?.free_cuts_available || 0,
      bookings_count: bookingsRes.count || 0,
      membership_name: mName,
      membership_emoji: mEmoji,
      membership_sort_order: mSort,
    };
  };

  const goToStep3 = async () => {
    if (!primary || !secondary) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([fetchStats(primary.id), fetchStats(secondary.id)]);
      setStats({ primary: p, secondary: s });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!primary || !secondary) return;
    setMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke("merge-users", {
        body: { primaryUserId: primary.id, secondaryUserId: secondary.id },
      });
      if (error || data?.error) {
        toast({ title: "Error al fusionar", description: data?.error || error?.message, variant: "destructive" });
        return;
      }
      setStep(4);
      onMerged?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error inesperado", variant: "destructive" });
    } finally {
      setMerging(false);
    }
  };

  const filtered = (q: string, exclude?: string) =>
    profiles
      .filter((p) => !p.is_banned && p.id !== exclude)
      .filter((p) =>
        !q ||
        p.full_name?.toLowerCase().includes(q.toLowerCase()) ||
        p.username?.toLowerCase().includes(q.toLowerCase()) ||
        p.contact_value?.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 8);

  const totals = useMemo(() => {
    if (!stats.primary || !stats.secondary) return null;
    const winnerMem =
      (stats.primary.membership_sort_order ?? -1) >= (stats.secondary.membership_sort_order ?? -1)
        ? stats.primary
        : stats.secondary;
    return {
      points: stats.primary.completed_bookings + stats.secondary.completed_bookings,
      free_cuts: stats.primary.free_cuts_available + stats.secondary.free_cuts_available,
      bookings: stats.primary.bookings_count + stats.secondary.bookings_count,
      membership: winnerMem.membership_name ? `${winnerMem.membership_emoji || ""} ${winnerMem.membership_name}`.trim() : "Ninguna",
    };
  }, [stats]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-neon-cyan" />
            Fusionar usuarios
            <Badge variant="outline" className="ml-2">Paso {step} de 4</Badge>
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Selecciona el usuario PRINCIPAL (el que se conservará)"}
            {step === 2 && "Selecciona el usuario a ABSORBER (será baneado tras la fusión)"}
            {step === 3 && "Revisa el resumen y confirma la fusión"}
            {step === 4 && "Fusión completada"}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1 — Pick primary */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar usuario principal..." value={search1} onChange={(e) => setSearch1(e.target.value)} className="pl-9" />
            </div>
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
              {filtered(search1).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPrimary(p)}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:border-neon-cyan/60 ${primary?.id === p.id ? "border-neon-cyan bg-neon-cyan/10" : "border-border"}`}
                >
                  <p className="font-semibold">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{p.username} · {p.contact_value}</p>
                </button>
              ))}
              {filtered(search1).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>}
            </div>
          </div>
        )}

        {/* STEP 2 — Pick secondary */}
        {step === 2 && (
          <div className="space-y-3">
            {primary && (
              <Card className="p-3 border-neon-cyan/40 bg-neon-cyan/5">
                <p className="text-xs text-muted-foreground mb-1">PRINCIPAL (se conserva):</p>
                <p className="font-semibold">{primary.full_name} <span className="text-muted-foreground text-xs">@{primary.username}</span></p>
              </Card>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar usuario a absorber..." value={search2} onChange={(e) => setSearch2(e.target.value)} className="pl-9" />
            </div>
            <div className="space-y-1.5 max-h-[35vh] overflow-y-auto">
              {filtered(search2, primary?.id).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSecondary(p)}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:border-destructive/60 ${secondary?.id === p.id ? "border-destructive bg-destructive/10" : "border-border"}`}
                >
                  <p className="font-semibold">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{p.username} · {p.contact_value}</p>
                </button>
              ))}
              {filtered(search2, primary?.id).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>}
            </div>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 3 && primary && secondary && totals && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
              <Card className="p-3 border-neon-cyan/40 bg-neon-cyan/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Principal</p>
                <p className="font-bold">{primary.full_name}</p>
                <p className="text-xs text-muted-foreground">@{primary.username}</p>
                <div className="mt-2 text-xs space-y-0.5">
                  <p>🏆 {stats.primary?.completed_bookings} pts</p>
                  <p>🎁 {stats.primary?.free_cuts_available} cortes gratis</p>
                  <p>📅 {stats.primary?.bookings_count} reservas</p>
                  {stats.primary?.membership_name && <p>👑 {stats.primary.membership_emoji} {stats.primary.membership_name}</p>}
                </div>
              </Card>
              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-neon-cyan animate-pulse" />
              </div>
              <Card className="p-3 border-destructive/40 bg-destructive/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Absorber (banear)</p>
                <p className="font-bold">{secondary.full_name}</p>
                <p className="text-xs text-muted-foreground">@{secondary.username}</p>
                <div className="mt-2 text-xs space-y-0.5">
                  <p>🏆 {stats.secondary?.completed_bookings} pts</p>
                  <p>🎁 {stats.secondary?.free_cuts_available} cortes gratis</p>
                  <p>📅 {stats.secondary?.bookings_count} reservas</p>
                  {stats.secondary?.membership_name && <p>👑 {stats.secondary.membership_emoji} {stats.secondary.membership_name}</p>}
                </div>
              </Card>
            </div>

            <Card className="p-4 border-neon-cyan bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10">
              <p className="text-xs uppercase tracking-wider text-neon-cyan font-bold mb-2">Resultado en {primary.full_name}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" /> <strong>{totals.points}</strong> pts totales</div>
                <div className="flex items-center gap-2"><Gift className="h-4 w-4 text-emerald-400" /> <strong>{totals.free_cuts}</strong> cortes gratis</div>
                <div className="flex items-center gap-2">📅 <strong>{totals.bookings}</strong> reservas</div>
                <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-neon-purple" /> {totals.membership}</div>
              </div>
            </Card>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Esta acción es <strong>irreversible</strong>. El usuario absorbido será baneado y no podrá iniciar sesión.
                Sus reservas, puntos, cortes gratis, valoraciones y logros pasarán al principal.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4 — Done */}
        {step === 4 && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
            <p className="font-bold text-lg">¡Fusión completada!</p>
            <p className="text-sm text-muted-foreground">Todos los datos fueron transferidos a {primary?.full_name}.</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button variant="neon" disabled={!primary} onClick={() => setStep(2)}>Siguiente</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button variant="neon" disabled={!secondary || loading} onClick={goToStep3}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Revisar
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)} disabled={merging}>Atrás</Button>
              <Button variant="destructive" onClick={handleMerge} disabled={merging}>
                {merging && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar fusión
              </Button>
            </>
          )}
          {step === 4 && (
            <Button variant="neon" onClick={() => onOpenChange(false)}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};