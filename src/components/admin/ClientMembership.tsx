import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Crown, AlertTriangle, ArrowUp, ArrowDown, X, RotateCcw, Pause, Play, StickyNote, Cake } from "lucide-react";
import {
  sendMembershipActivatedNotification, sendMembershipRenewedNotification,
  sendMembershipCancelledNotification, sendMembershipUpgradedNotification,
  sendMembershipDowngradeScheduledNotification,
} from "@/lib/pushNotifications";

interface Membership {
  id: string; name: string; emoji: string; price: number; benefits: string[];
  free_services_per_month: number; includes_beard_count: number;
  product_discount_percent: number; is_coming_soon: boolean; is_active: boolean;
}

interface UserMembership {
  id: string; membership_id: string; start_date: string; end_date: string;
  status: string; free_services_remaining: number; beard_services_remaining: number;
  pending_membership_id: string | null; is_paused: boolean; paused_at: string | null;
  pause_end_date: string | null; admin_notes: string | null; payment_status: string;
}

interface Props { userId: string; userName: string; }

const logHistory = async (userId: string, membershipId: string | null, action: string, details?: string) => {
  await supabase.from("membership_history").insert({ user_id: userId, membership_id: membershipId, action, details });
};

export const ClientMembership = ({ userId, userName }: Props) => {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: string; membership?: Membership } | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeMembership, setUpgradeMembership] = useState<Membership | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [birthday, setBirthday] = useState("");
  const [showBirthdayDialog, setShowBirthdayDialog] = useState(false);

  useEffect(() => { loadData(); }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const [membRes, subRes, profileRes] = await Promise.all([
      supabase.from("memberships").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("user_memberships").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
      supabase.from("profiles").select("birthday").eq("id", userId).single(),
    ]);
    if (membRes.data) setMemberships(membRes.data.map((m: any) => ({ ...m, benefits: Array.isArray(m.benefits) ? m.benefits : [] })));
    setActiveMembership(subRes.data as UserMembership | null);
    if (subRes.data) setAdminNotes((subRes.data as any).admin_notes || "");
    setBirthday((profileRes.data as any)?.birthday || "");
    setLoading(false);
  };

  const activateMembership = async (membership: Membership) => {
    const startDate = new Date(); const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
    const { error } = await supabase.from("user_memberships").insert({
      user_id: userId, membership_id: membership.id,
      start_date: startDate.toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0],
      status: "active", free_services_remaining: membership.free_services_per_month,
      beard_services_remaining: membership.includes_beard_count === -1 ? 999 : membership.includes_beard_count,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("admin_action_logs").insert({ action_type: "membership_activated", description: `Membresía "${membership.name}" activada para ${userName}`, target_user_id: userId, target_user_name: userName });
    await logHistory(userId, membership.id, "activated", `Plan: ${membership.name} (${membership.price}€/mes)`);
    toast({ title: "Membresía activada", description: `${membership.name} activada para ${userName}` });
    sendMembershipActivatedNotification(userId, membership.name, endDate.toISOString().split("T")[0]);
    // Send welcome message via chat
    const { data: conv } = await supabase.from("chat_conversations").select("id").eq("user_id", userId).maybeSingle();
    if (conv) {
      await supabase.from("chat_messages").insert({ conversation_id: conv.id, sender_type: "admin", message: `🎉 ¡Bienvenido al plan ${membership.emoji} ${membership.name}!\n\nTus beneficios:\n${membership.benefits.map(b => `✓ ${b}`).join("\n")}\n\nRecuerda que los beneficios no son acumulables entre periodos. ¡Disfruta!` });
      await supabase.from("chat_conversations").update({ unread_by_user: true, last_message_at: new Date().toISOString() }).eq("id", conv.id);
    }
    loadData();
  };

  const handleUpgrade = async () => {
    if (!upgradeMembership || !activeMembership) return;
    const oldMembership = memberships.find(m => m.id === activeMembership.membership_id);
    await supabase.from("user_memberships").update({ status: "cancelled" }).eq("id", activeMembership.id);
    const startDate = new Date(); const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
    await supabase.from("user_memberships").insert({
      user_id: userId, membership_id: upgradeMembership.id,
      start_date: startDate.toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0],
      status: "active", free_services_remaining: upgradeMembership.free_services_per_month,
      beard_services_remaining: upgradeMembership.includes_beard_count === -1 ? 999 : upgradeMembership.includes_beard_count,
    });
    await supabase.from("admin_action_logs").insert({ action_type: "membership_upgraded", description: `Membresía actualizada a "${upgradeMembership.name}" para ${userName}`, target_user_id: userId, target_user_name: userName });
    await logHistory(userId, upgradeMembership.id, "upgraded", `De ${oldMembership?.name || "?"} a ${upgradeMembership.name}`);
    toast({ title: "Upgrade completado" });
    sendMembershipUpgradedNotification(userId, upgradeMembership.name, endDate.toISOString().split("T")[0]);
    setShowUpgradeDialog(false); setUpgradeMembership(null); loadData();
  };

  const handleDowngrade = async (membership: Membership) => {
    if (!activeMembership) return;
    await supabase.from("user_memberships").update({ pending_membership_id: membership.id }).eq("id", activeMembership.id);
    await supabase.from("admin_action_logs").insert({ action_type: "membership_downgrade_scheduled", description: `Downgrade a "${membership.name}" programado para ${userName}`, target_user_id: userId, target_user_name: userName });
    const currentMembershipData = memberships.find(m => m.id === activeMembership.membership_id);
    await logHistory(userId, membership.id, "downgraded", `Programado de ${currentMembershipData?.name} a ${membership.name}`);
    toast({ title: "Downgrade programado" });
    sendMembershipDowngradeScheduledNotification(userId, currentMembershipData?.name || "actual", membership.name);
    loadData();
  };

  const cancelMembership = async () => {
    if (!activeMembership) return;
    const membershipData = memberships.find(m => m.id === activeMembership.membership_id);
    await supabase.from("user_memberships").update({ status: "cancelled" }).eq("id", activeMembership.id);
    await supabase.from("admin_action_logs").insert({ action_type: "membership_cancelled", description: `Membresía cancelada para ${userName}`, target_user_id: userId, target_user_name: userName });
    await logHistory(userId, activeMembership.membership_id, "cancelled", `Plan: ${membershipData?.name}`);
    toast({ title: "Membresía cancelada" });
    sendMembershipCancelledNotification(userId, membershipData?.name || "");
    setConfirmAction(null); loadData();
  };

  const renewMembership = async () => {
    if (!activeMembership) return;
    const membership = memberships.find(m => m.id === activeMembership.membership_id);
    if (!membership) return;
    const newStart = new Date(activeMembership.end_date + "T00:00:00"); const newEnd = new Date(newStart); newEnd.setDate(newEnd.getDate() + 30);
    await supabase.from("user_memberships").update({
      start_date: newStart.toISOString().split("T")[0], end_date: newEnd.toISOString().split("T")[0],
      free_services_remaining: membership.free_services_per_month,
      beard_services_remaining: membership.includes_beard_count === -1 ? 999 : membership.includes_beard_count,
      renewed_at: new Date().toISOString(), payment_status: "paid",
    }).eq("id", activeMembership.id);
    await logHistory(userId, membership.id, "renewed", `Renovado hasta ${newEnd.toISOString().split("T")[0]}`);
    toast({ title: "Renovada" });
    sendMembershipRenewedNotification(userId, membership.name, newEnd.toISOString().split("T")[0]);
    loadData();
  };

  const handlePause = async () => {
    if (!activeMembership) return;
    const membershipData = memberships.find(m => m.id === activeMembership.membership_id);
    await supabase.from("user_memberships").update({ is_paused: true, paused_at: new Date().toISOString() }).eq("id", activeMembership.id);
    await logHistory(userId, activeMembership.membership_id, "paused", `Membresía ${membershipData?.name} pausada`);
    toast({ title: "Membresía pausada" });
    loadData();
  };

  const handleResume = async () => {
    if (!activeMembership) return;
    const membershipData = memberships.find(m => m.id === activeMembership.membership_id);
    // Extend end_date by the paused days
    const pausedAt = activeMembership.paused_at ? new Date(activeMembership.paused_at) : new Date();
    const pausedDays = Math.ceil((Date.now() - pausedAt.getTime()) / (1000 * 60 * 60 * 24));
    const newEnd = new Date(activeMembership.end_date + "T00:00:00");
    newEnd.setDate(newEnd.getDate() + pausedDays);
    await supabase.from("user_memberships").update({ is_paused: false, paused_at: null, end_date: newEnd.toISOString().split("T")[0] }).eq("id", activeMembership.id);
    await logHistory(userId, activeMembership.membership_id, "resumed", `Reanudada (+${pausedDays} días compensados)`);
    toast({ title: "Membresía reanudada", description: `Se han compensado ${pausedDays} días` });
    loadData();
  };

  const saveNotes = async () => {
    if (!activeMembership) return;
    await supabase.from("user_memberships").update({ admin_notes: adminNotes.trim() || null }).eq("id", activeMembership.id);
    toast({ title: "Notas guardadas" });
    setShowNotesDialog(false);
  };

  const saveBirthday = async () => {
    await supabase.from("profiles").update({ birthday: birthday || null }).eq("id", userId);
    toast({ title: "Cumpleaños guardado" });
    setShowBirthdayDialog(false);
  };

  const daysUntilEnd = activeMembership ? Math.ceil((new Date(activeMembership.end_date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)) : 0;
  const currentMembership = activeMembership ? memberships.find(m => m.id === activeMembership.membership_id) : null;
  const pendingMembership = activeMembership?.pending_membership_id ? memberships.find(m => m.id === activeMembership.pending_membership_id) : null;

  if (loading) return null;

  return (
    <Card className="bg-card border-border mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-2xl">
            <Crown className="text-[#D4AF37]" /> Membresía
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBirthdayDialog(true)}>
              <Cake className="h-3 w-3 mr-1" /> {birthday ? new Date(birthday + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "Cumpleaños"}
            </Button>
            {activeMembership && (
              <Button size="sm" variant="outline" onClick={() => setShowNotesDialog(true)}>
                <StickyNote className="h-3 w-3 mr-1" /> Notas
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current membership info */}
        {activeMembership && currentMembership && (
          <div className="mb-6">
            <div className={`p-4 rounded-xl border-2 ${activeMembership.is_paused ? "border-muted bg-muted/20" : daysUntilEnd <= 4 ? "border-destructive bg-destructive/10" : daysUntilEnd <= 10 ? "border-yellow-500 bg-yellow-500/10" : "border-[#D4AF37]/50 bg-[#D4AF37]/5"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#D4AF37]">{currentMembership.emoji} {currentMembership.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentMembership.price}€/mes</p>
                </div>
                <div className="flex gap-1">
                  {activeMembership.is_paused && <Badge className="bg-muted-foreground">⏸️ Pausada</Badge>}
                  {activeMembership.payment_status !== "paid" && <Badge variant="destructive">💳 Pago pendiente</Badge>}
                  <Badge className={daysUntilEnd <= 4 ? "bg-destructive" : daysUntilEnd <= 10 ? "bg-yellow-500" : "bg-[#D4AF37]"}>
                    {daysUntilEnd} días restantes
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="bg-background/50 p-2 rounded-lg">
                  <p className="text-muted-foreground">Servicios restantes</p>
                  <p className="font-bold text-lg">{activeMembership.free_services_remaining}</p>
                </div>
                <div className="bg-background/50 p-2 rounded-lg">
                  <p className="text-muted-foreground">Barbas restantes</p>
                  <p className="font-bold text-lg">{activeMembership.beard_services_remaining >= 999 ? "∞" : activeMembership.beard_services_remaining}</p>
                </div>
              </div>

              {activeMembership.admin_notes && (
                <div className="p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground mb-3">
                  📝 {activeMembership.admin_notes}
                </div>
              )}

              {daysUntilEnd <= 10 && !activeMembership.is_paused && (
                <div className={`p-2 rounded-lg text-sm ${daysUntilEnd <= 4 ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-500"}`}>
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {daysUntilEnd <= 0 ? "¡Membresía expirada!" : `¡Vence en ${daysUntilEnd} días!`}
                </div>
              )}

              {pendingMembership && (
                <div className="mt-2 p-2 rounded-lg bg-primary/10 text-sm">
                  <ArrowDown className="h-4 w-4 inline mr-1 text-primary" />
                  Downgrade programado a <strong>{pendingMembership.name}</strong>.
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" className="border-[#D4AF37] text-[#D4AF37]" onClick={renewMembership}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Renovar
                </Button>
                {activeMembership.is_paused ? (
                  <Button size="sm" variant="outline" className="border-green-500 text-green-500" onClick={handleResume}>
                    <Play className="h-3 w-3 mr-1" /> Reanudar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={handlePause}>
                    <Pause className="h-3 w-3 mr-1" /> Pausar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => setConfirmAction({ type: "cancel" })}>
                  <X className="h-3 w-3 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Membership tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {memberships.map((m) => {
            const isActive = activeMembership?.membership_id === m.id;
            const isHigher = currentMembership && m.price > currentMembership.price;
            const isLower = currentMembership && m.price < currentMembership.price;
            const isPending = activeMembership?.pending_membership_id === m.id;
            return (
              <button key={m.id} disabled={m.is_coming_soon || isActive}
                onClick={() => {
                  if (!activeMembership) setConfirmAction({ type: "activate", membership: m });
                  else if (isHigher) { setUpgradeMembership(m); setShowUpgradeDialog(true); }
                  else if (isLower && !isPending) setConfirmAction({ type: "downgrade", membership: m });
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${isActive ? "border-[#D4AF37] bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]/30" : m.is_coming_soon ? "border-muted opacity-50 cursor-not-allowed" : isPending ? "border-primary/50 bg-primary/5" : "border-border hover:border-[#D4AF37]/50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#D4AF37]">{m.emoji} {m.name}</span>
                  {isActive && <Badge className="bg-[#D4AF37]">Activa</Badge>}
                  {m.is_coming_soon && <Badge variant="secondary">Próximamente</Badge>}
                  {isPending && <Badge variant="outline" className="border-primary text-primary">Programada</Badge>}
                  {!isActive && !m.is_coming_soon && !isPending && activeMembership && (
                    isHigher ? <ArrowUp className="h-4 w-4 text-green-500" /> : <ArrowDown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-lg font-black">{m.price}€<span className="text-xs font-normal text-muted-foreground">/mes</span></p>
                <ul className="mt-2 space-y-0.5">
                  {m.benefits.map((b, i) => (<li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-[#D4AF37]">✓</span> {b}</li>))}
                </ul>
              </button>
            );
          })}
        </div>
      </CardContent>

      {/* Dialogs */}
      <ConfirmDialog open={confirmAction?.type === "activate"} onOpenChange={() => setConfirmAction(null)}
        title="Activar membresía" description={`¿Activar "${confirmAction?.membership?.name}" para ${userName}?\n\n⚠️ Asegúrate de que el importe ha sido abonado.`}
        confirmText="Activar (ya cobrado)" onConfirm={() => { if (confirmAction?.membership) activateMembership(confirmAction.membership); setConfirmAction(null); }} />
      <ConfirmDialog open={confirmAction?.type === "cancel"} onOpenChange={() => setConfirmAction(null)}
        title="Cancelar membresía" description={`¿Cancelar la membresía de ${userName}?`}
        confirmText="Cancelar membresía" variant="destructive" onConfirm={cancelMembership} />
      <ConfirmDialog open={confirmAction?.type === "downgrade"} onOpenChange={() => setConfirmAction(null)}
        title="Programar downgrade" description={`Al finalizar, se activará "${confirmAction?.membership?.name}".`}
        confirmText="Programar downgrade" onConfirm={() => { if (confirmAction?.membership) handleDowngrade(confirmAction.membership); setConfirmAction(null); }} />

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade de Membresía</DialogTitle>
            <DialogDescription>Actualizar a <strong>{upgradeMembership?.name}</strong> ({upgradeMembership?.price}€/mes).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-500" />
              El cliente tiene {activeMembership?.free_services_remaining} servicios restantes que se perderán.
            </div>
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">⚠️ Asegúrate de que el importe ha sido abonado.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>Cancelar</Button>
            <Button variant="neon" onClick={handleUpgrade}>Confirmar Upgrade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Notas de la Membresía</DialogTitle></DialogHeader>
          <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Notas privadas sobre esta membresía..." className="min-h-[100px]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>Cancelar</Button>
            <Button onClick={saveNotes}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBirthdayDialog} onOpenChange={setShowBirthdayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Cake className="h-5 w-5" /> Fecha de Cumpleaños</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Cumpleaños</Label>
            <Input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBirthdayDialog(false)}>Cancelar</Button>
            <Button onClick={saveBirthday}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
