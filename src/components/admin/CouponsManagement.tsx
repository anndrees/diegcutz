import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Ticket, Copy, Calendar, Users, Percent, Euro } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase: number | null;
  max_uses: number | null;
  current_uses: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export function CouponsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    min_purchase: 0,
    max_uses: "",
    start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_date: "",
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const createCoupon = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("coupons").insert({
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_purchase: data.min_purchase || 0,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        start_date: data.start_date,
        end_date: data.end_date || null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Cupón creado correctamente");
      resetForm();
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Ya existe un cupón con ese código");
      } else {
        toast.error("Error al crear el cupón");
      }
    },
  });

  const updateCoupon = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("coupons")
        .update({
          code: data.code.toUpperCase(),
          description: data.description || null,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          min_purchase: data.min_purchase || 0,
          max_uses: data.max_uses ? parseInt(data.max_uses) : null,
          start_date: data.start_date,
          end_date: data.end_date || null,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Cupón actualizado correctamente");
      resetForm();
    },
    onError: () => toast.error("Error al actualizar el cupón"),
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Cupón eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el cupón"),
  });

  const toggleCoupon = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Estado del cupón actualizado");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase: 0,
      max_uses: "",
      start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_date: "",
      is_active: true,
    });
    setEditingCoupon(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase || 0,
      max_uses: coupon.max_uses?.toString() || "",
      start_date: format(new Date(coupon.start_date), "yyyy-MM-dd'T'HH:mm"),
      end_date: coupon.end_date ? format(new Date(coupon.end_date), "yyyy-MM-dd'T'HH:mm") : "",
      is_active: coupon.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("El código es obligatorio");
      return;
    }
    if (formData.discount_value <= 0) {
      toast.error("El descuento debe ser mayor a 0");
      return;
    }

    if (editingCoupon) {
      updateCoupon.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createCoupon.mutate(formData);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado al portapapeles");
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: "Inactivo", variant: "secondary" as const };
    if (coupon.end_date && new Date(coupon.end_date) < new Date()) return { label: "Expirado", variant: "destructive" as const };
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) return { label: "Agotado", variant: "destructive" as const };
    if (new Date(coupon.start_date) > new Date()) return { label: "Programado", variant: "outline" as const };
    return { label: "Activo", variant: "default" as const };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Cargando cupones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Gestión de Cupones
          </h2>
          <p className="text-muted-foreground">Crea y gestiona códigos promocionales</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cupón
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="DESCUENTO20"
                    className="uppercase"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={generateRandomCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descuento especial de verano..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de descuento</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Cantidad fija (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">Valor</Label>
                  <div className="relative">
                    <Input
                      id="discount_value"
                      type="number"
                      min="0"
                      max={formData.discount_type === "percentage" ? 100 : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {formData.discount_type === "percentage" ? "%" : "€"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_purchase">Compra mínima (€)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    min="0"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData((prev) => ({ ...prev, min_purchase: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses">Límite de usos</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData((prev) => ({ ...prev, max_uses: e.target.value }))}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Fecha inicio</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Fecha fin</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Cupón activo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingCoupon ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coupons?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay cupones creados</p>
            <p className="text-sm text-muted-foreground">Crea tu primer cupón promocional</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons?.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <Card key={coupon.id} className={!coupon.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-mono">
                        {coupon.code}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
                      )}
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {coupon.discount_type === "percentage" ? (
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Euro className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold">
                        {coupon.discount_value}
                        {coupon.discount_type === "percentage" ? "%" : "€"}
                      </span>
                    </div>
                    {coupon.min_purchase && coupon.min_purchase > 0 && (
                      <span className="text-muted-foreground">Mín: {coupon.min_purchase}€</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {coupon.current_uses}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ""} usos
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Desde: {format(new Date(coupon.start_date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    </div>
                    {coupon.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Hasta: {format(new Date(coupon.end_date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={(checked) => toggleCoupon.mutate({ id: coupon.id, is_active: checked })}
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteCoupon.mutate(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
