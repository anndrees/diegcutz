import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Crown, AlertTriangle } from "lucide-react";

interface Membership {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string | null;
  benefits: string[];
  free_services_per_month: number;
  includes_beard_count: number;
  product_discount_percent: number;
  image_consulting: boolean;
  free_product_period_months: number;
  free_products_per_period: number;
  is_active: boolean;
  is_coming_soon: boolean;
  sort_order: number;
}

interface UserMembership {
  id: string;
  user_id: string;
  membership_id: string;
  start_date: string;
  end_date: string;
  status: string;
  free_services_remaining: number;
  beard_services_remaining: number;
  pending_membership_id: string | null;
  membership?: Membership;
  profile?: { full_name: string; username: string };
}

const defaultForm = {
  name: "",
  emoji: "💈",
  price: 0,
  description: "",
  benefits: [""],
  free_services_per_month: 0,
  includes_beard_count: 0,
  product_discount_percent: 0,
  image_consulting: false,
  free_product_period_months: 0,
  free_products_per_period: 0,
  is_active: true,
  is_coming_soon: false,
  sort_order: 0,
};

export const MembershipsManagement = () => {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeSubs, setActiveSubs] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Membership | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [membRes, subsRes] = await Promise.all([
      supabase.from("memberships").select("*").order("sort_order"),
      supabase.from("user_memberships").select("*, membership:memberships(*), profile:profiles(full_name, username)").eq("status", "active"),
    ]);

    if (membRes.data) {
      setMemberships(membRes.data.map((m: any) => ({
        ...m,
        benefits: Array.isArray(m.benefits) ? m.benefits : [],
      })));
    }

    if (subsRes.data) {
      setActiveSubs(subsRes.data.map((s: any) => ({
        ...s,
        profile: Array.isArray(s.profile) ? s.profile[0] : s.profile,
        membership: Array.isArray(s.membership) ? s.membership[0] : s.membership,
      })));
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultForm, sort_order: memberships.length + 1 });
    setShowForm(true);
  };

  const openEdit = (m: Membership) => {
    setEditing(m);
    setForm({
      name: m.name,
      emoji: m.emoji,
      price: m.price,
      description: m.description || "",
      benefits: m.benefits.length > 0 ? m.benefits : [""],
      free_services_per_month: m.free_services_per_month,
      includes_beard_count: m.includes_beard_count,
      product_discount_percent: m.product_discount_percent,
      image_consulting: m.image_consulting,
      free_product_period_months: m.free_product_period_months,
      free_products_per_period: m.free_products_per_period,
      is_active: m.is_active,
      is_coming_soon: m.is_coming_soon,
      sort_order: m.sort_order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const benefits = form.benefits.filter((b) => b.trim() !== "");
    const payload = {
      name: form.name,
      emoji: form.emoji,
      price: form.price,
      description: form.description || null,
      benefits: benefits as any,
      free_services_per_month: form.free_services_per_month,
      includes_beard_count: form.includes_beard_count,
      product_discount_percent: form.product_discount_percent,
      image_consulting: form.image_consulting,
      free_product_period_months: form.free_product_period_months,
      free_products_per_period: form.free_products_per_period,
      is_active: form.is_active,
      is_coming_soon: form.is_coming_soon,
      sort_order: form.sort_order,
    };

    const { error } = editing
      ? await supabase.from("memberships").update(payload).eq("id", editing.id)
      : await supabase.from("memberships").insert(payload);

    if (error) {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
      return;
    }

    toast({ title: "Éxito", description: editing ? "Membresía actualizada" : "Membresía creada" });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("memberships").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    } else {
      toast({ title: "Eliminada", description: "Membresía eliminada correctamente" });
    }
    setShowDeleteConfirm(false);
    setDeleteId(null);
    loadData();
  };

  const addBenefit = () => setForm({ ...form, benefits: [...form.benefits, ""] });
  const removeBenefit = (i: number) => setForm({ ...form, benefits: form.benefits.filter((_, idx) => idx !== i) });
  const updateBenefit = (i: number, val: string) => {
    const updated = [...form.benefits];
    updated[i] = val;
    setForm({ ...form, benefits: updated });
  };

  const daysUntilEnd = (endDate: string) => {
    const end = new Date(endDate + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Expiration Alerts */}
      {activeSubs.filter(s => daysUntilEnd(s.end_date) <= 10).length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              Membresías próximas a vencer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSubs
              .filter(s => daysUntilEnd(s.end_date) <= 10)
              .sort((a, b) => daysUntilEnd(a.end_date) - daysUntilEnd(b.end_date))
              .map(sub => {
                const days = daysUntilEnd(sub.end_date);
                const isUrgent = days <= 4;
                return (
                  <div key={sub.id} className={`p-3 rounded-lg border ${isUrgent ? "border-destructive bg-destructive/10" : "border-yellow-500 bg-yellow-500/10"}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className={`font-bold ${isUrgent ? "text-destructive" : "text-yellow-500"}`}>
                          {sub.profile?.full_name} (@{sub.profile?.username})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sub.membership?.name} — Vence el {sub.end_date} ({days} días restantes)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ⚠️ Recuerda cobrar la renovación antes del {sub.end_date}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isUrgent ? "destructive" : "outline"}
                        className={!isUrgent ? "border-yellow-500 text-yellow-500" : ""}
                        onClick={async () => {
                          const newStart = new Date(sub.end_date + "T00:00:00");
                          const newEnd = new Date(newStart);
                          newEnd.setDate(newEnd.getDate() + 30);

                          const membership = sub.membership as Membership;

                          await supabase.from("user_memberships").update({
                            start_date: newStart.toISOString().split("T")[0],
                            end_date: newEnd.toISOString().split("T")[0],
                            free_services_remaining: membership?.free_services_per_month || 0,
                            beard_services_remaining: membership?.includes_beard_count === -1 ? 999 : (membership?.includes_beard_count || 0),
                            renewed_at: new Date().toISOString(),
                          }).eq("id", sub.id);

                          toast({ title: "Renovada", description: `Membresía de ${sub.profile?.full_name} renovada hasta ${newEnd.toISOString().split("T")[0]}` });
                          loadData();
                        }}
                      >
                        🔄 Renovar
                      </Button>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Membership Plans */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Crown className="text-[#D4AF37]" />
            Planes de Membresía
          </CardTitle>
          <Button variant="neon" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberships.map((m) => {
                const activeCount = activeSubs.filter(s => s.membership_id === m.id).length;
                return (
                  <div key={m.id} className={`relative p-5 rounded-xl border-2 transition-all ${m.is_coming_soon ? "border-muted opacity-60" : "border-[#D4AF37]/30 hover:border-[#D4AF37]/60"}`}>
                    {m.is_coming_soon && (
                      <Badge className="absolute top-3 right-3 bg-muted text-muted-foreground">Próximamente</Badge>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#D4AF37]">{m.emoji} {m.name}</h3>
                        <p className="text-2xl font-black text-foreground">{m.price}€<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteId(m.id); setShowDeleteConfirm(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground mb-3">
                      {m.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#D4AF37] mt-0.5">✓</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                    {activeCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{activeCount} suscriptor{activeCount !== 1 ? "es" : ""} activo{activeCount !== 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl">Suscripciones Activas ({activeSubs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeSubs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No hay suscripciones activas</p>
          ) : (
            <div className="space-y-3">
              {activeSubs.map(sub => {
                const days = daysUntilEnd(sub.end_date);
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-semibold">{sub.profile?.full_name} <span className="text-muted-foreground text-sm">@{sub.profile?.username}</span></p>
                      <p className="text-sm text-[#D4AF37]">{sub.membership?.name} — {sub.free_services_remaining} servicios restantes</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${days <= 4 ? "text-destructive" : days <= 10 ? "text-yellow-500" : "text-muted-foreground"}`}>
                        {days} días
                      </p>
                      <p className="text-xs text-muted-foreground">hasta {sub.end_date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Crear"} Plan de Membresía</DialogTitle>
            <DialogDescription>Configura los detalles del plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <Label>Emoji</Label>
                <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
              </div>
              <div className="col-span-3">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Precio (€/mes)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Beneficios (texto visible)</Label>
              {form.benefits.map((b, i) => (
                <div key={i} className="flex gap-2 mt-1">
                  <Input value={b} onChange={(e) => updateBenefit(i, e.target.value)} placeholder={`Beneficio ${i + 1}`} />
                  {form.benefits.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeBenefit(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addBenefit} className="mt-2">
                <Plus className="h-3 w-3 mr-1" /> Añadir beneficio
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Servicios gratis/mes</Label>
                <Input type="number" value={form.free_services_per_month} onChange={(e) => setForm({ ...form, free_services_per_month: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Barbas incluidas (-1 = ilimitada)</Label>
                <Input type="number" value={form.includes_beard_count} onChange={(e) => setForm({ ...form, includes_beard_count: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>% Dto. productos</Label>
                <Input type="number" value={form.product_discount_percent} onChange={(e) => setForm({ ...form, product_discount_percent: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Productos gratis / periodo</Label>
                <Input type="number" value={form.free_products_per_period} onChange={(e) => setForm({ ...form, free_products_per_period: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Periodo productos gratis (meses, 0=no aplica)</Label>
              <Input type="number" value={form.free_product_period_months} onChange={(e) => setForm({ ...form, free_product_period_months: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Asesoramiento de imagen</Label>
                <Switch checked={form.image_consulting} onCheckedChange={(v) => setForm({ ...form, image_consulting: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Próximamente (visible pero inhabilitado)</Label>
                <Switch checked={form.is_coming_soon} onCheckedChange={(v) => setForm({ ...form, is_coming_soon: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Activo</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="neon" onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar plan de membresía"
        description="¿Estás seguro? Los clientes con esta membresía activa perderán sus beneficios."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
