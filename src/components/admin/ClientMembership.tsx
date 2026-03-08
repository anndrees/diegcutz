import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Crown, AlertTriangle, ArrowUp, ArrowDown, X, RotateCcw } from "lucide-react";
import {
  sendMembershipActivatedNotification,
  sendMembershipRenewedNotification,
  sendMembershipCancelledNotification,
  sendMembershipUpgradedNotification,
  sendMembershipDowngradeScheduledNotification,
} from "@/lib/pushNotifications";

interface Membership {
  id: string;
  name: string;
  emoji: string;
  price: number;
  benefits: string[];
  free_services_per_month: number;
  includes_beard_count: number;
  product_discount_percent: number;
  is_coming_soon: boolean;
  is_active: boolean;
}

interface UserMembership {
  id: string;
  membership_id: string;
  start_date: string;
  end_date: string;
  status: string;
  free_services_remaining: number;
  beard_services_remaining: number;
  pending_membership_id: string | null;
}

interface Props {
  userId: string;
  userName: string;
}

export const ClientMembership = ({ userId, userName }: Props) => {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: string; membership?: Membership } | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeMembership, setUpgradeMembership] = useState<Membership | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const [membRes, subRes] = await Promise.all([
      supabase.from("memberships").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("user_memberships").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
    ]);

    if (membRes.data) {
      setMemberships(membRes.data.map((m: any) => ({
        ...m,
        benefits: Array.isArray(m.benefits) ? m.benefits : [],
      })));
    }
    setActiveMembership(subRes.data);
    setLoading(false);
  };

  const activateMembership = async (membership: Membership) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { error } = await supabase.from("user_memberships").insert({
      user_id: userId,
      membership_id: membership.id,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
      free_services_remaining: membership.free_services_per_month,
      beard_services_remaining: membership.includes_beard_count === -1 ? 999 : membership.includes_beard_count,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Log admin action
    await supabase.from("admin_action_logs").insert({
      action_type: "membership_activated",
      description: `Membresía "${membership.name}" activada para ${userName}`,
      target_user_id: userId,
      target_user_name: userName,
    });

    toast({ title: "Membresía activada", description: `${membership.name} activada para ${userName}` });
    
    // Send push notification
    const endDateStr = endDate.toISOString().split("T")[0];
    sendMembershipActivatedNotification(userId, membership.name, endDateStr);
    
    loadData();
  };

  const handleUpgrade = async () => {
    if (!upgradeMembership || !activeMembership) return;

    // Cancel current and create new
    await supabase.from("user_memberships").update({ status: "cancelled" }).eq("id", activeMembership.id);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await supabase.from("user_memberships").insert({
      user_id: userId,
      membership_id: upgradeMembership.id,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
      free_services_remaining: upgradeMembership.free_services_per_month,
      beard_services_remaining: upgradeMembership.includes_beard_count === -1 ? 999 : upgradeMembership.includes_beard_count,
    });

    await supabase.from("admin_action_logs").insert({
      action_type: "membership_upgraded",
      description: `Membresía actualizada a "${upgradeMembership.name}" para ${userName}`,
      target_user_id: userId,
      target_user_name: userName,
    });

    toast({ title: "Upgrade completado", description: `Membresía actualizada a ${upgradeMembership.name}` });
    setShowUpgradeDialog(false);
    setUpgradeMembership(null);
    loadData();
  };

  const handleDowngrade = async (membership: Membership) => {
    if (!activeMembership) return;

    // Set pending membership for when current expires
    await supabase.from("user_memberships").update({
      pending_membership_id: membership.id,
    }).eq("id", activeMembership.id);

    await supabase.from("admin_action_logs").insert({
      action_type: "membership_downgrade_scheduled",
      description: `Downgrade a "${membership.name}" programado para ${userName} al finalizar membresía actual`,
      target_user_id: userId,
      target_user_name: userName,
    });

    toast({ title: "Downgrade programado", description: `Al finalizar la membresía actual, se activará ${membership.name}` });
    loadData();
  };

  const cancelMembership = async () => {
    if (!activeMembership) return;

    await supabase.from("user_memberships").update({ status: "cancelled" }).eq("id", activeMembership.id);

    await supabase.from("admin_action_logs").insert({
      action_type: "membership_cancelled",
      description: `Membresía cancelada para ${userName}`,
      target_user_id: userId,
      target_user_name: userName,
    });

    toast({ title: "Membresía cancelada", description: "La membresía ha sido cancelada" });
    setConfirmAction(null);
    loadData();
  };

  const renewMembership = async () => {
    if (!activeMembership) return;

    const membership = memberships.find(m => m.id === activeMembership.membership_id);
    if (!membership) return;

    const newStart = new Date(activeMembership.end_date + "T00:00:00");
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 30);

    await supabase.from("user_memberships").update({
      start_date: newStart.toISOString().split("T")[0],
      end_date: newEnd.toISOString().split("T")[0],
      free_services_remaining: membership.free_services_per_month,
      beard_services_remaining: membership.includes_beard_count === -1 ? 999 : membership.includes_beard_count,
      renewed_at: new Date().toISOString(),
    }).eq("id", activeMembership.id);

    toast({ title: "Renovada", description: `Membresía renovada hasta ${newEnd.toISOString().split("T")[0]}` });
    loadData();
  };

  const daysUntilEnd = activeMembership ? Math.ceil((new Date(activeMembership.end_date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)) : 0;
  const currentMembership = activeMembership ? memberships.find(m => m.id === activeMembership.membership_id) : null;
  const pendingMembership = activeMembership?.pending_membership_id ? memberships.find(m => m.id === activeMembership.pending_membership_id) : null;

  if (loading) return null;

  return (
    <Card className="bg-card border-border mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Crown className="text-[#D4AF37]" />
          Membresía
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current membership info */}
        {activeMembership && currentMembership && (
          <div className="mb-6">
            <div className={`p-4 rounded-xl border-2 ${daysUntilEnd <= 4 ? "border-destructive bg-destructive/10" : daysUntilEnd <= 10 ? "border-yellow-500 bg-yellow-500/10" : "border-[#D4AF37]/50 bg-[#D4AF37]/5"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#D4AF37]">{currentMembership.emoji} {currentMembership.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentMembership.price}€/mes</p>
                </div>
                <Badge className={daysUntilEnd <= 4 ? "bg-destructive" : daysUntilEnd <= 10 ? "bg-yellow-500" : "bg-[#D4AF37]"}>
                  {daysUntilEnd} días restantes
                </Badge>
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

              {daysUntilEnd <= 10 && (
                <div className={`p-2 rounded-lg text-sm ${daysUntilEnd <= 4 ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-500"}`}>
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {daysUntilEnd <= 0 ? "¡Membresía expirada!" : `¡Vence en ${daysUntilEnd} días! Recuerda cobrar la renovación.`}
                </div>
              )}

              {pendingMembership && (
                <div className="mt-2 p-2 rounded-lg bg-primary/10 text-sm">
                  <ArrowDown className="h-4 w-4 inline mr-1 text-primary" />
                  Downgrade programado a <strong>{pendingMembership.name}</strong> al finalizar.
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" className="border-[#D4AF37] text-[#D4AF37]" onClick={renewMembership}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Renovar
                </Button>
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
              <button
                key={m.id}
                disabled={m.is_coming_soon || isActive}
                onClick={() => {
                  if (!activeMembership) {
                    setConfirmAction({ type: "activate", membership: m });
                  } else if (isHigher) {
                    setUpgradeMembership(m);
                    setShowUpgradeDialog(true);
                  } else if (isLower && !isPending) {
                    setConfirmAction({ type: "downgrade", membership: m });
                  }
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  isActive ? "border-[#D4AF37] bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]/30"
                  : m.is_coming_soon ? "border-muted opacity-50 cursor-not-allowed"
                  : isPending ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-[#D4AF37]/50"
                }`}
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
                  {m.benefits.map((b, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1">
                      <span className="text-[#D4AF37]">✓</span> {b}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </CardContent>

      {/* Activate Confirmation */}
      <ConfirmDialog
        open={confirmAction?.type === "activate"}
        onOpenChange={() => setConfirmAction(null)}
        title="Activar membresía"
        description={`¿Activar "${confirmAction?.membership?.name}" (${confirmAction?.membership?.price}€/mes) para ${userName}?\n\n⚠️ IMPORTANTE: Asegúrate de que el importe de la membresía ha sido abonado antes de activarla.`}
        confirmText="Activar (ya cobrado)"
        onConfirm={() => {
          if (confirmAction?.membership) activateMembership(confirmAction.membership);
          setConfirmAction(null);
        }}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={confirmAction?.type === "cancel"}
        onOpenChange={() => setConfirmAction(null)}
        title="Cancelar membresía"
        description={`¿Cancelar la membresía de ${userName}? Los beneficios se perderán inmediatamente.`}
        confirmText="Cancelar membresía"
        variant="destructive"
        onConfirm={cancelMembership}
      />

      {/* Downgrade Confirmation */}
      <ConfirmDialog
        open={confirmAction?.type === "downgrade"}
        onOpenChange={() => setConfirmAction(null)}
        title="Programar downgrade"
        description={`Al finalizar la membresía actual, se activará "${confirmAction?.membership?.name}" (${confirmAction?.membership?.price}€/mes). El cliente mantendrá los beneficios actuales hasta que expire.`}
        confirmText="Programar downgrade"
        onConfirm={() => {
          if (confirmAction?.membership) handleDowngrade(confirmAction.membership);
          setConfirmAction(null);
        }}
      />

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade de Membresía</DialogTitle>
            <DialogDescription>
              Vas a actualizar la membresía de {userName} a <strong>{upgradeMembership?.name}</strong> ({upgradeMembership?.price}€/mes).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-500" />
              <strong>Beneficios pendientes:</strong> El cliente tiene {activeMembership?.free_services_remaining} servicios restantes de su membresía actual. Al hacer upgrade, estos se perderán y se activarán los nuevos beneficios inmediatamente.
            </div>
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
              ⚠️ <strong>IMPORTANTE:</strong> Asegúrate de que el importe de la nueva membresía ha sido abonado (o la diferencia cobrada) antes de confirmar el upgrade.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>Cancelar</Button>
            <Button variant="neon" onClick={handleUpgrade}>Confirmar Upgrade (ya cobrado)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
